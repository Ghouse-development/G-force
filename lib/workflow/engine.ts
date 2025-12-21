import { getSupabaseClient } from '@/lib/supabase'
import type {
  WorkflowDefinition,
  WorkflowStep,
  WorkflowInstance,
  WorkflowInstanceStatus,
  ApprovalHistory,
  UserRole,
  Json,
} from '@/types/database'

// Get untyped client for tables not in schema
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function getClient(): any {
  return getSupabaseClient()
}

// ワークフローエンジン
export class WorkflowEngine {
  private supabase = getClient()

  // ワークフロー定義を取得
  async getWorkflowDefinition(workflowId: string): Promise<WorkflowDefinition | null> {
    const { data: workflow, error } = await this.supabase
      .from('workflow_definitions')
      .select('*')
      .eq('id', workflowId)
      .single()

    if (error || !workflow) return null

    // ステップを取得
    const { data: steps } = await this.supabase
      .from('workflow_steps')
      .select('*')
      .eq('workflow_id', workflowId)
      .eq('is_active', true)
      .order('sort_order')

    return {
      ...workflow,
      steps: steps || [],
    } as WorkflowDefinition
  }

  // テーブル名からワークフロー定義を取得
  async getWorkflowByTable(tableName: string): Promise<WorkflowDefinition | null> {
    const { data: workflow, error } = await this.supabase
      .from('workflow_definitions')
      .select('*')
      .eq('target_table', tableName)
      .eq('is_active', true)
      .single()

    if (error || !workflow) return null

    return this.getWorkflowDefinition(workflow.id)
  }

  // ワークフローインスタンスを開始
  async startWorkflow(
    workflowId: string,
    recordId: string,
    recordTable: string,
    startedBy: string,
    initialData?: Json
  ): Promise<WorkflowInstance | null> {
    const workflow = await this.getWorkflowDefinition(workflowId)
    if (!workflow || !workflow.steps?.length) return null

    // 最初のステップを取得
    const firstStep = workflow.steps[0]

    const { data: instance, error } = await this.supabase
      .from('workflow_instances')
      .insert({
        workflow_id: workflowId,
        tenant_id: workflow.tenant_id,
        record_id: recordId,
        record_table: recordTable,
        current_step_id: firstStep.id,
        status: 'in_progress',
        started_by: startedBy,
        started_at: new Date().toISOString(),
        data: initialData,
      })
      .select()
      .single()

    if (error) {
      console.error('Failed to start workflow:', error)
      return null
    }

    return instance as WorkflowInstance
  }

  // ワークフローインスタンスを取得
  async getWorkflowInstance(instanceId: string): Promise<WorkflowInstance | null> {
    const { data, error } = await this.supabase
      .from('workflow_instances')
      .select('*')
      .eq('id', instanceId)
      .single()

    if (error) return null
    return data as WorkflowInstance
  }

  // レコードに関連するワークフローインスタンスを取得
  async getInstanceByRecord(
    recordId: string,
    recordTable: string
  ): Promise<WorkflowInstance | null> {
    const { data, error } = await this.supabase
      .from('workflow_instances')
      .select('*')
      .eq('record_id', recordId)
      .eq('record_table', recordTable)
      .order('created_at', { ascending: false })
      .limit(1)
      .single()

    if (error) return null
    return data as WorkflowInstance
  }

  // 現在のステップを取得
  async getCurrentStep(instanceId: string): Promise<WorkflowStep | null> {
    const instance = await this.getWorkflowInstance(instanceId)
    if (!instance?.current_step_id) return null

    const { data, error } = await this.supabase
      .from('workflow_steps')
      .select('*')
      .eq('id', instance.current_step_id)
      .single()

    if (error) return null
    return data as WorkflowStep
  }

  // アクションを実行
  async executeAction(
    instanceId: string,
    action: string,
    actorId: string,
    actorName?: string,
    comment?: string
  ): Promise<{ success: boolean; error?: string; nextStep?: WorkflowStep | null }> {
    const instance = await this.getWorkflowInstance(instanceId)
    if (!instance) {
      return { success: false, error: 'ワークフローインスタンスが見つかりません' }
    }

    if (instance.status !== 'in_progress') {
      return { success: false, error: 'このワークフローはすでに完了または中止されています' }
    }

    const currentStep = await this.getCurrentStep(instanceId)
    if (!currentStep) {
      return { success: false, error: '現在のステップが見つかりません' }
    }

    // アクションが許可されているか確認
    const actionsData = currentStep.actions
    const allowedActions: string[] = typeof actionsData === 'string'
      ? JSON.parse(actionsData)
      : (Array.isArray(actionsData) ? actionsData : [])
    if (!allowedActions.includes(action)) {
      return { success: false, error: `このステップでは ${action} アクションは許可されていません` }
    }

    // 承認履歴を記録
    await this.supabase.from('approval_history').insert({
      workflow_instance_id: instanceId,
      step_id: currentStep.id,
      action,
      actor_id: actorId,
      actor_name: actorName,
      comment,
    })

    // 次のステップを決定
    const nextStepsData = currentStep.next_steps
    const nextSteps: Record<string, string> = typeof nextStepsData === 'string'
      ? JSON.parse(nextStepsData)
      : (nextStepsData && typeof nextStepsData === 'object' ? nextStepsData as Record<string, string> : {})
    const nextStepCode = nextSteps[action]

    if (!nextStepCode) {
      // 次のステップがない場合はワークフロー完了
      await this.supabase
        .from('workflow_instances')
        .update({
          status: action === 'reject' ? 'rejected' : 'completed',
          completed_at: new Date().toISOString(),
          current_step_id: null,
        })
        .eq('id', instanceId)

      return { success: true, nextStep: null }
    }

    // 次のステップを取得
    const workflow = await this.getWorkflowDefinition(instance.workflow_id)
    const nextStep = workflow?.steps?.find(s => s.code === nextStepCode)

    if (!nextStep) {
      return { success: false, error: `次のステップ ${nextStepCode} が見つかりません` }
    }

    // ステップを更新
    await this.supabase
      .from('workflow_instances')
      .update({
        current_step_id: nextStep.id,
      })
      .eq('id', instanceId)

    return { success: true, nextStep }
  }

  // 並列承認の状態を確認
  async checkParallelApproval(
    instanceId: string,
    stepId: string
  ): Promise<{ allApproved: boolean; approvers: string[] }> {
    const { data: history } = await this.supabase
      .from('approval_history')
      .select('*')
      .eq('workflow_instance_id', instanceId)
      .eq('step_id', stepId)
      .eq('action', 'approve')

    const approvers: string[] = (history || []).map((h: { actor_id: string }) => h.actor_id)

    // 設計部門長と工事部門長の両方が承認したか確認
    // TODO: ステップ定義から必要な承認者を動的に取得
    const requiredApprovers = ['design_manager', 'construction_manager']
    const allApproved = requiredApprovers.every(role =>
      approvers.some((a: string) => a.includes(role))
    )

    return { allApproved, approvers }
  }

  // ワークフローの承認履歴を取得
  async getApprovalHistory(instanceId: string): Promise<ApprovalHistory[]> {
    const { data, error } = await this.supabase
      .from('approval_history')
      .select('*')
      .eq('workflow_instance_id', instanceId)
      .order('created_at')

    if (error) return []
    return data as ApprovalHistory[]
  }

  // ユーザーが現在のステップでアクションできるか確認
  async canUserActOnStep(
    instanceId: string,
    userRole: UserRole,
    userId: string
  ): Promise<{ canAct: boolean; availableActions: string[] }> {
    const currentStep = await this.getCurrentStep(instanceId)
    if (!currentStep) {
      return { canAct: false, availableActions: [] }
    }

    // 担当者タイプに基づいてチェック
    let canAct = false
    switch (currentStep.assignee_type) {
      case 'role':
        canAct = currentStep.assignee_value === userRole
        break
      case 'user':
        canAct = currentStep.assignee_value === userId
        break
      case 'creator':
        // インスタンスの作成者を確認
        const instance = await this.getWorkflowInstance(instanceId)
        canAct = instance?.started_by === userId
        break
    }

    // 並列承認の場合は複数のロールをチェック
    if (currentStep.step_type === 'parallel_approval') {
      const rolesData = currentStep.assignee_roles
      const roles: string[] = Array.isArray(rolesData) ? rolesData : []
      canAct = roles.includes(userRole)

      // すでに承認済みかチェック
      const { approvers } = await this.checkParallelApproval(instanceId, currentStep.id)
      if (approvers.includes(userId)) {
        canAct = false // すでに承認済み
      }
    }

    const actionsForUser = currentStep.actions
    const availableActions: string[] = canAct
      ? (typeof actionsForUser === 'string'
          ? JSON.parse(actionsForUser)
          : (Array.isArray(actionsForUser) ? actionsForUser : []))
      : []

    return { canAct, availableActions }
  }
}

// シングルトンインスタンス
export const workflowEngine = new WorkflowEngine()

// 契約依頼の承認フローを開始
export async function startContractRequestWorkflow(
  contractRequestId: string,
  startedBy: string
): Promise<WorkflowInstance | null> {
  // 契約依頼承認ワークフローのIDを取得
  const { data: workflow } = await getClient()
    .from('workflow_definitions')
    .select('id')
    .eq('code', 'contract_request_approval')
    .single()

  if (!workflow) {
    console.error('Contract request workflow not found')
    return null
  }

  return workflowEngine.startWorkflow(
    workflow.id,
    contractRequestId,
    'contract_requests',
    startedBy
  )
}

// 契約依頼のステータスを更新
export async function updateContractRequestStatus(
  contractRequestId: string,
  status: string
): Promise<boolean> {
  const { error } = await getClient()
    .from('contract_requests')
    .update({ status })
    .eq('id', contractRequestId)

  return !error
}
