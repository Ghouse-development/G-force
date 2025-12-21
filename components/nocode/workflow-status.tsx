'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Textarea } from '@/components/ui/textarea'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  CheckCircle2,
  Circle,
  Clock,
  XCircle,
  ArrowRight,
  User,
  MessageSquare,
  AlertCircle,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { toast } from 'sonner'
import { workflowEngine } from '@/lib/workflow/engine'
import type {
  WorkflowDefinition,
  WorkflowInstance,
  WorkflowStep,
  ApprovalHistory,
  UserRole,
} from '@/types/database'
import { useAuthStore } from '@/store'
import { ROLE_CONFIG } from '@/types/database'

interface WorkflowStatusProps {
  workflowId?: string
  instanceId?: string
  recordId?: string
  recordTable?: string
  onWorkflowComplete?: () => void
  onStepChange?: (stepId: string) => void
}

// ステップの状態
type StepState = 'completed' | 'current' | 'pending' | 'rejected'

interface StepWithState extends WorkflowStep {
  state: StepState
  history?: ApprovalHistory[]
}

export function WorkflowStatus({
  workflowId,
  instanceId: propInstanceId,
  recordId,
  recordTable,
  onWorkflowComplete,
  onStepChange,
}: WorkflowStatusProps) {
  const { user } = useAuthStore()
  const [workflow, setWorkflow] = useState<WorkflowDefinition | null>(null)
  const [instance, setInstance] = useState<WorkflowInstance | null>(null)
  const [history, setHistory] = useState<ApprovalHistory[]>([])
  const [stepsWithState, setStepsWithState] = useState<StepWithState[]>([])
  const [canAct, setCanAct] = useState(false)
  const [availableActions, setAvailableActions] = useState<string[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [showActionDialog, setShowActionDialog] = useState(false)
  const [selectedAction, setSelectedAction] = useState<string | null>(null)
  const [comment, setComment] = useState('')

  // データを読み込み
  useEffect(() => {
    async function loadData() {
      // ワークフロー定義を取得
      let wf: WorkflowDefinition | null = null
      if (workflowId) {
        wf = await workflowEngine.getWorkflowDefinition(workflowId)
      } else if (recordTable) {
        wf = await workflowEngine.getWorkflowByTable(recordTable)
      }
      setWorkflow(wf)

      // インスタンスを取得
      let inst: WorkflowInstance | null = null
      if (propInstanceId) {
        inst = await workflowEngine.getWorkflowInstance(propInstanceId)
      } else if (recordId && recordTable) {
        inst = await workflowEngine.getInstanceByRecord(recordId, recordTable)
      }
      setInstance(inst)

      // 履歴を取得
      if (inst) {
        const h = await workflowEngine.getApprovalHistory(inst.id)
        setHistory(h)

        // ユーザーがアクション可能か確認
        if (user) {
          const { canAct: ca, availableActions: aa } = await workflowEngine.canUserActOnStep(
            inst.id,
            user.role as UserRole,
            user.id
          )
          setCanAct(ca)
          setAvailableActions(aa)
        }
      }
    }

    loadData()
  }, [workflowId, propInstanceId, recordId, recordTable, user])

  // ステップの状態を計算
  useEffect(() => {
    if (!workflow?.steps || !instance) return

    const steps: StepWithState[] = workflow.steps.map(step => {
      // このステップの履歴を取得
      const stepHistory = history.filter(h => h.step_id === step.id)

      // 状態を判定
      let state: StepState = 'pending'
      if (instance.status === 'completed') {
        state = 'completed'
      } else if (instance.status === 'rejected') {
        if (stepHistory.some(h => h.action === 'reject')) {
          state = 'rejected'
        } else if (stepHistory.length > 0) {
          state = 'completed'
        }
      } else if (instance.current_step_id === step.id) {
        state = 'current'
      } else if (stepHistory.some(h => h.action === 'approve')) {
        state = 'completed'
      }

      return {
        ...step,
        state,
        history: stepHistory,
      }
    })

    setStepsWithState(steps)
  }, [workflow, instance, history])

  // アクションを実行
  const handleAction = async () => {
    if (!instance || !selectedAction || !user) return

    setIsLoading(true)
    try {
      const result = await workflowEngine.executeAction(
        instance.id,
        selectedAction,
        user.id,
        user.name,
        comment
      )

      if (result.success) {
        toast.success(
          selectedAction === 'approve' ? '承認しました' :
          selectedAction === 'reject' ? '差戻ししました' :
          'アクションを実行しました'
        )

        // データを再読み込み
        const inst = await workflowEngine.getWorkflowInstance(instance.id)
        setInstance(inst)
        const h = await workflowEngine.getApprovalHistory(instance.id)
        setHistory(h)

        if (!result.nextStep) {
          onWorkflowComplete?.()
        } else {
          onStepChange?.(result.nextStep.id)
        }
      } else {
        toast.error(result.error || 'エラーが発生しました')
      }
    } catch (error) {
      console.error('Action failed:', error)
      toast.error('エラーが発生しました')
    } finally {
      setIsLoading(false)
      setShowActionDialog(false)
      setSelectedAction(null)
      setComment('')
    }
  }

  if (!workflow || !instance) {
    return null
  }

  const getStateIcon = (state: StepState) => {
    switch (state) {
      case 'completed':
        return <CheckCircle2 className="h-5 w-5 text-green-500" />
      case 'current':
        return <Clock className="h-5 w-5 text-orange-500" />
      case 'rejected':
        return <XCircle className="h-5 w-5 text-red-500" />
      default:
        return <Circle className="h-5 w-5 text-gray-300" />
    }
  }

  const getStateBadge = (state: StepState) => {
    switch (state) {
      case 'completed':
        return <Badge className="bg-green-100 text-green-700">完了</Badge>
      case 'current':
        return <Badge className="bg-orange-100 text-orange-700">進行中</Badge>
      case 'rejected':
        return <Badge className="bg-red-100 text-red-700">差戻し</Badge>
      default:
        return <Badge variant="outline">待機中</Badge>
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg flex items-center gap-2">
          <AlertCircle className="h-5 w-5" />
          承認フロー
          {instance.status === 'completed' && (
            <Badge className="bg-green-100 text-green-700 ml-auto">承認完了</Badge>
          )}
          {instance.status === 'rejected' && (
            <Badge className="bg-red-100 text-red-700 ml-auto">却下</Badge>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* ステップ一覧 */}
        <div className="space-y-3">
          {stepsWithState.map((step, index) => (
            <div key={step.id} className="flex items-start gap-3">
              <div className="flex flex-col items-center">
                {getStateIcon(step.state)}
                {index < stepsWithState.length - 1 && (
                  <div className="w-0.5 h-8 bg-gray-200 mt-1" />
                )}
              </div>
              <div className="flex-1 pb-4">
                <div className="flex items-center gap-2">
                  <span className="font-medium">{step.name}</span>
                  {getStateBadge(step.state)}
                </div>

                {/* 担当者情報 */}
                <div className="text-sm text-muted-foreground mt-1">
                  {step.assignee_type === 'role' && step.assignee_value && (
                    <span className="flex items-center gap-1">
                      <User className="h-3 w-3" />
                      {ROLE_CONFIG[step.assignee_value as UserRole]?.label || step.assignee_value}
                    </span>
                  )}
                  {step.step_type === 'parallel_approval' && step.assignee_roles && (
                    <span className="flex items-center gap-1">
                      <User className="h-3 w-3" />
                      {step.assignee_roles.map(r => ROLE_CONFIG[r]?.label || r).join(' + ')}
                    </span>
                  )}
                </div>

                {/* 承認履歴 */}
                {step.history && step.history.length > 0 && (
                  <div className="mt-2 space-y-1">
                    {step.history.map(h => (
                      <div
                        key={h.id}
                        className="text-sm flex items-start gap-2 bg-muted/50 rounded p-2"
                      >
                        <MessageSquare className="h-3 w-3 mt-0.5 text-muted-foreground" />
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-medium">{h.actor_name}</span>
                            <Badge variant="outline" className="text-xs">
                              {h.action === 'approve' ? '承認' : h.action === 'reject' ? '差戻し' : h.action}
                            </Badge>
                            <span className="text-xs text-muted-foreground">
                              {new Date(h.created_at).toLocaleString('ja-JP')}
                            </span>
                          </div>
                          {h.comment && (
                            <p className="text-muted-foreground mt-1">{h.comment}</p>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* アクションボタン */}
        {canAct && instance.status === 'in_progress' && (
          <div className="flex gap-2 pt-4 border-t">
            {availableActions.includes('approve') && (
              <Button
                onClick={() => {
                  setSelectedAction('approve')
                  setShowActionDialog(true)
                }}
                className="bg-green-600 hover:bg-green-700"
              >
                <CheckCircle2 className="h-4 w-4 mr-2" />
                承認
              </Button>
            )}
            {availableActions.includes('reject') && (
              <Button
                variant="destructive"
                onClick={() => {
                  setSelectedAction('reject')
                  setShowActionDialog(true)
                }}
              >
                <XCircle className="h-4 w-4 mr-2" />
                差戻し
              </Button>
            )}
            {availableActions.includes('submit') && (
              <Button
                onClick={() => {
                  setSelectedAction('submit')
                  setShowActionDialog(true)
                }}
              >
                <ArrowRight className="h-4 w-4 mr-2" />
                再申請
              </Button>
            )}
          </div>
        )}
      </CardContent>

      {/* アクション確認ダイアログ */}
      <Dialog open={showActionDialog} onOpenChange={setShowActionDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {selectedAction === 'approve' && '承認の確認'}
              {selectedAction === 'reject' && '差戻しの確認'}
              {selectedAction === 'submit' && '再申請の確認'}
            </DialogTitle>
            <DialogDescription>
              {selectedAction === 'approve' && 'この内容で承認してよろしいですか？'}
              {selectedAction === 'reject' && '差戻し理由を入力してください。'}
              {selectedAction === 'submit' && '修正内容を確認の上、再申請してください。'}
            </DialogDescription>
          </DialogHeader>

          <div className="py-4">
            <Textarea
              placeholder="コメント（任意）"
              value={comment}
              onChange={e => setComment(e.target.value)}
              rows={3}
            />
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setShowActionDialog(false)
                setSelectedAction(null)
                setComment('')
              }}
            >
              キャンセル
            </Button>
            <Button
              onClick={handleAction}
              disabled={isLoading}
              className={cn(
                selectedAction === 'approve' && 'bg-green-600 hover:bg-green-700',
                selectedAction === 'reject' && 'bg-red-600 hover:bg-red-700'
              )}
            >
              {isLoading ? '処理中...' : '確定'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  )
}
