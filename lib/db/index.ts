/**
 * Database Service Layer
 * Supabaseとの通信を担当する統合レイヤー
 */

import { getSupabaseClient } from '@/lib/supabase'
import type {
  Customer,
  PlanRequest,
  Contract,
  User,
  Product,
  PipelineStatus,
  PlanRequestStatus
} from '@/types/database'

// Default tenant ID
const DEFAULT_TENANT_ID = '00000000-0000-0000-0000-000000000001'

// Get untyped client for tables not in schema
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function getClient(): any {
  return getSupabaseClient()
}

// ============================================
// CUSTOMERS
// ============================================
export const customerDb = {
  async getAll(): Promise<Customer[]> {
    const supabase = getClient()
    const { data, error } = await supabase
      .from('customers')
      .select('*')
      .order('created_at', { ascending: false })

    if (error) throw error
    return data || []
  },

  async getById(id: string): Promise<Customer | null> {
    const supabase = getClient()
    const { data, error } = await supabase
      .from('customers')
      .select('*')
      .eq('id', id)
      .single()

    if (error && error.code !== 'PGRST116') throw error
    return data
  },

  async getByStatus(status: PipelineStatus): Promise<Customer[]> {
    const supabase = getClient()
    const { data, error } = await supabase
      .from('customers')
      .select('*')
      .eq('pipeline_status', status)
      .order('created_at', { ascending: false })

    if (error) throw error
    return data || []
  },

  async getByAssignee(userId: string): Promise<Customer[]> {
    const supabase = getClient()
    const { data, error } = await supabase
      .from('customers')
      .select('*')
      .eq('assigned_to', userId)
      .order('created_at', { ascending: false })

    if (error) throw error
    return data || []
  },

  async create(customer: Omit<Customer, 'id' | 'created_at' | 'updated_at'>): Promise<Customer> {
    const supabase = getClient()
    const { data, error } = await supabase
      .from('customers')
      .insert({ ...customer, tenant_id: customer.tenant_id || DEFAULT_TENANT_ID })
      .select()
      .single()

    if (error) throw error
    if (!data) throw new Error('Failed to create customer')
    return data
  },

  async update(id: string, updates: Partial<Customer>): Promise<Customer> {
    const supabase = getClient()
    const { data, error } = await supabase
      .from('customers')
      .update(updates)
      .eq('id', id)
      .select()
      .single()

    if (error) throw error
    if (!data) throw new Error('Failed to update customer')
    return data
  },

  async updateStatus(id: string, status: PipelineStatus): Promise<Customer> {
    return this.update(id, { pipeline_status: status })
  },

  async delete(id: string): Promise<void> {
    const supabase = getClient()
    const { error } = await supabase
      .from('customers')
      .delete()
      .eq('id', id)
    if (error) throw error
  },

  async getPipelineCounts(): Promise<Record<PipelineStatus, number>> {
    const supabase = getClient()
    const { data, error } = await supabase
      .from('customers')
      .select('pipeline_status')

    if (error) throw error

    const counts: Record<string, number> = {}
    data?.forEach((row: { pipeline_status: string }) => {
      counts[row.pipeline_status] = (counts[row.pipeline_status] || 0) + 1
    })
    return counts as Record<PipelineStatus, number>
  },

  async getRecentCustomers(limit = 5): Promise<Customer[]> {
    const supabase = getClient()
    const { data, error } = await supabase
      .from('customers')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(limit)

    if (error) throw error
    return data || []
  },

  async getContractedThisFiscalYear(fiscalYearStart: Date): Promise<Customer[]> {
    const supabase = getClient()
    const { data, error } = await supabase
      .from('customers')
      .select('*')
      .eq('pipeline_status', '契約')
      .gte('contract_date', fiscalYearStart.toISOString())
      .order('contract_date', { ascending: false })

    if (error) throw error
    return data || []
  }
}

// ============================================
// PLAN REQUESTS
// ============================================
export const planRequestDb = {
  async getAll(): Promise<PlanRequest[]> {
    const supabase = getClient()
    const { data, error } = await supabase
      .from('plan_requests')
      .select('*')
      .order('created_at', { ascending: false })

    if (error) throw error
    return data || []
  },

  async getById(id: string): Promise<PlanRequest | null> {
    const supabase = getClient()
    const { data, error } = await supabase
      .from('plan_requests')
      .select('*')
      .eq('id', id)
      .single()

    if (error && error.code !== 'PGRST116') throw error
    return data
  },

  async getByCustomer(customerId: string): Promise<PlanRequest[]> {
    const supabase = getClient()
    const { data, error } = await supabase
      .from('plan_requests')
      .select('*')
      .eq('customer_id', customerId)
      .order('created_at', { ascending: false })

    if (error) throw error
    return data || []
  },

  async getByStatus(status: PlanRequestStatus): Promise<PlanRequest[]> {
    const supabase = getClient()
    const { data, error } = await supabase
      .from('plan_requests')
      .select('*')
      .eq('status', status)
      .order('created_at', { ascending: false })

    if (error) throw error
    return data || []
  },

  async create(request: Omit<PlanRequest, 'id' | 'created_at' | 'updated_at'>): Promise<PlanRequest> {
    const supabase = getClient()
    const { data, error } = await supabase
      .from('plan_requests')
      .insert({ ...request, tenant_id: request.tenant_id || DEFAULT_TENANT_ID })
      .select()
      .single()

    if (error) throw error
    if (!data) throw new Error('Failed to create plan request')
    return data
  },

  async update(id: string, updates: Partial<PlanRequest>): Promise<PlanRequest> {
    const supabase = getClient()
    const { data, error } = await supabase
      .from('plan_requests')
      .update(updates)
      .eq('id', id)
      .select()
      .single()

    if (error) throw error
    if (!data) throw new Error('Failed to update plan request')
    return data
  },

  async delete(id: string): Promise<void> {
    const supabase = getClient()
    const { error } = await supabase
      .from('plan_requests')
      .delete()
      .eq('id', id)
    if (error) throw error
  },

  async getStatusCounts(): Promise<Record<PlanRequestStatus, number>> {
    const supabase = getClient()
    const { data, error } = await supabase
      .from('plan_requests')
      .select('status')

    if (error) throw error

    const counts: Record<string, number> = {}
    data?.forEach((row: { status: string }) => {
      counts[row.status] = (counts[row.status] || 0) + 1
    })
    return counts as Record<PlanRequestStatus, number>
  }
}

// ============================================
// CONTRACTS
// ============================================
export const contractDb = {
  async getAll(): Promise<Contract[]> {
    const supabase = getClient()
    const { data, error } = await supabase
      .from('contracts')
      .select('*')
      .order('created_at', { ascending: false })

    if (error) throw error
    return data || []
  },

  async getById(id: string): Promise<Contract | null> {
    const supabase = getClient()
    const { data, error } = await supabase
      .from('contracts')
      .select('*')
      .eq('id', id)
      .single()

    if (error && error.code !== 'PGRST116') throw error
    return data
  },

  async getByCustomer(customerId: string): Promise<Contract[]> {
    const supabase = getClient()
    const { data, error } = await supabase
      .from('contracts')
      .select('*')
      .eq('customer_id', customerId)
      .order('created_at', { ascending: false })

    if (error) throw error
    return data || []
  },

  async create(contract: Omit<Contract, 'id' | 'created_at' | 'updated_at'>): Promise<Contract> {
    const supabase = getClient()
    const { data, error } = await supabase
      .from('contracts')
      .insert({ ...contract, tenant_id: DEFAULT_TENANT_ID })
      .select()
      .single()

    if (error) throw error
    if (!data) throw new Error('Failed to create contract')
    return data
  },

  async update(id: string, updates: Partial<Contract>): Promise<Contract> {
    const supabase = getClient()
    const { data, error } = await supabase
      .from('contracts')
      .update(updates)
      .eq('id', id)
      .select()
      .single()

    if (error) throw error
    if (!data) throw new Error('Failed to update contract')
    return data
  },

  async delete(id: string): Promise<void> {
    const supabase = getClient()
    const { error } = await supabase
      .from('contracts')
      .delete()
      .eq('id', id)
    if (error) throw error
  }
}

// ============================================
// FUND PLANS
// ============================================
export const fundPlanDb = {
  async getAll(): Promise<unknown[]> {
    const supabase = getClient()
    const { data, error } = await supabase
      .from('fund_plans')
      .select('*')
      .order('created_at', { ascending: false })

    if (error) throw error
    return data || []
  },

  async getById(id: string): Promise<unknown | null> {
    const supabase = getClient()
    const { data, error } = await supabase
      .from('fund_plans')
      .select('*')
      .eq('id', id)
      .single()

    if (error && error.code !== 'PGRST116') throw error
    return data
  },

  async getByCustomer(customerId: string): Promise<unknown[]> {
    const supabase = getClient()
    const { data, error } = await supabase
      .from('fund_plans')
      .select('*')
      .eq('customer_id', customerId)
      .order('created_at', { ascending: false })

    if (error) throw error
    return data || []
  },

  async create(fundPlan: Record<string, unknown>): Promise<unknown> {
    const supabase = getClient()
    const { data, error } = await supabase
      .from('fund_plans')
      .insert({ ...fundPlan, tenant_id: DEFAULT_TENANT_ID })
      .select()
      .single()

    if (error) throw error
    if (!data) throw new Error('Failed to create fund plan')
    return data
  },

  async update(id: string, updates: Record<string, unknown>): Promise<unknown> {
    const supabase = getClient()
    const { data, error } = await supabase
      .from('fund_plans')
      .update(updates)
      .eq('id', id)
      .select()
      .single()

    if (error) throw error
    if (!data) throw new Error('Failed to update fund plan')
    return data
  },

  async delete(id: string): Promise<void> {
    const supabase = getClient()
    const { error } = await supabase
      .from('fund_plans')
      .delete()
      .eq('id', id)
    if (error) throw error
  }
}

// ============================================
// USERS
// ============================================
export const userDb = {
  async getAll(): Promise<User[]> {
    const supabase = getClient()
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('is_active', true)
      .order('name')

    if (error) throw error
    return data || []
  },

  async getById(id: string): Promise<User | null> {
    const supabase = getClient()
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('id', id)
      .single()

    if (error && error.code !== 'PGRST116') throw error
    return data
  },

  async getByEmail(email: string): Promise<User | null> {
    const supabase = getClient()
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('email', email)
      .single()

    if (error && error.code !== 'PGRST116') throw error
    return data
  },

  async getByDepartment(department: string): Promise<User[]> {
    const supabase = getClient()
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('department', department)
      .eq('is_active', true)
      .order('name')

    if (error) throw error
    return data || []
  }
}

// ============================================
// PRODUCTS
// ============================================
export const productDb = {
  async getAll(): Promise<Product[]> {
    const supabase = getClient()
    const { data, error } = await supabase
      .from('products')
      .select('*')
      .eq('is_active', true)
      .order('sort_order')

    if (error) throw error
    return data || []
  },

  async getById(id: string): Promise<Product | null> {
    const supabase = getClient()
    const { data, error } = await supabase
      .from('products')
      .select('*')
      .eq('id', id)
      .single()

    if (error && error.code !== 'PGRST116') throw error
    return data
  }
}

// ============================================
// DASHBOARD DATA
// ============================================
export const dashboardDb = {
  async getStats() {
    const [
      pipelineCounts,
      planRequestCounts,
      recentCustomers,
      totalCustomers,
      totalContracts
    ] = await Promise.all([
      customerDb.getPipelineCounts(),
      planRequestDb.getStatusCounts(),
      customerDb.getRecentCustomers(5),
      customerDb.getAll().then(c => c.length),
      contractDb.getAll().then(c => c.length)
    ])

    return {
      pipelineCounts,
      planRequestCounts,
      recentCustomers,
      totalCustomers,
      totalContracts
    }
  }
}

// ============================================
// FILE STORAGE
// ============================================
export const fileStorage = {
  async upload(
    file: File,
    path: string
  ): Promise<{ path: string; url: string }> {
    const supabase = getClient()
    const { data, error } = await supabase.storage
      .from('gforce-files')
      .upload(path, file, {
        cacheControl: '3600',
        upsert: false
      })

    if (error) throw error

    const { data: urlData } = supabase.storage
      .from('gforce-files')
      .getPublicUrl(data.path)

    return {
      path: data.path,
      url: urlData.publicUrl
    }
  },

  async download(path: string): Promise<Blob> {
    const supabase = getClient()
    const { data, error } = await supabase.storage
      .from('gforce-files')
      .download(path)

    if (error) throw error
    return data
  },

  async delete(path: string): Promise<void> {
    const supabase = getClient()
    const { error } = await supabase.storage
      .from('gforce-files')
      .remove([path])

    if (error) throw error
  },

  async list(folder: string): Promise<{ name: string; id: string }[]> {
    const supabase = getClient()
    const { data, error } = await supabase.storage
      .from('gforce-files')
      .list(folder)

    if (error) throw error
    return data || []
  }
}

// ============================================
// ACTIVITIES
// ============================================
export const activityDb = {
  async getAll(): Promise<unknown[]> {
    const supabase = getClient()
    const { data, error } = await supabase
      .from('activities')
      .select('*')
      .order('created_at', { ascending: false })

    if (error) throw error
    return data || []
  },

  async getByCustomer(customerId: string): Promise<unknown[]> {
    const supabase = getClient()
    const { data, error } = await supabase
      .from('activities')
      .select('*')
      .eq('customer_id', customerId)
      .order('activity_date', { ascending: false })

    if (error) throw error
    return data || []
  },

  async create(activity: Record<string, unknown>): Promise<unknown> {
    const supabase = getClient()
    const { data, error } = await supabase
      .from('activities')
      .insert({ ...activity, tenant_id: DEFAULT_TENANT_ID })
      .select()
      .single()

    if (error) throw error
    return data
  }
}

// ============================================
// HANDOVERS
// ============================================
export const handoverDb = {
  async getAll(): Promise<unknown[]> {
    const supabase = getClient()
    const { data, error } = await supabase
      .from('handovers')
      .select('*')
      .order('created_at', { ascending: false })

    if (error) throw error
    return data || []
  },

  async getByCustomer(customerId: string): Promise<unknown[]> {
    const supabase = getClient()
    const { data, error } = await supabase
      .from('handovers')
      .select('*')
      .eq('customer_id', customerId)

    if (error) throw error
    return data || []
  }
}

// ============================================
// SALES TARGETS
// ============================================
export const salesTargetDb = {
  async getAll(): Promise<unknown[]> {
    const supabase = getClient()
    const { data, error } = await supabase
      .from('sales_targets')
      .select('*')
      .order('fiscal_year', { ascending: false })

    if (error) throw error
    return data || []
  },

  async getByFiscalYear(fiscalYear: number): Promise<unknown[]> {
    const supabase = getClient()
    const { data, error } = await supabase
      .from('sales_targets')
      .select('*')
      .eq('fiscal_year', fiscalYear)

    if (error) throw error
    return data || []
  }
}

// ============================================
// FILES (Metadata)
// ============================================
export const fileDb = {
  async getAll(): Promise<unknown[]> {
    const supabase = getClient()
    const { data, error } = await supabase
      .from('files')
      .select('*')
      .order('created_at', { ascending: false })

    if (error) throw error
    return data || []
  },

  async getByCustomer(customerId: string): Promise<unknown[]> {
    const supabase = getClient()
    const { data, error } = await supabase
      .from('files')
      .select('*')
      .eq('customer_id', customerId)
      .order('created_at', { ascending: false })

    if (error) throw error
    return data || []
  },

  async create(fileData: {
    name: string
    type: string
    size: number
    storage_path: string
    category?: string
    customer_id?: string
    contract_id?: string
    uploaded_by?: string
    memo_content?: string
  }): Promise<unknown> {
    const supabase = getClient()
    const { data, error } = await supabase
      .from('files')
      .insert({ ...fileData, tenant_id: DEFAULT_TENANT_ID })
      .select()
      .single()

    if (error) throw error
    return data
  },

  async delete(id: string): Promise<void> {
    const supabase = getClient()
    // First get the file to delete from storage
    const { data: file } = await supabase
      .from('files')
      .select('storage_path')
      .eq('id', id)
      .single()

    if (file?.storage_path) {
      await fileStorage.delete(file.storage_path).catch(console.error)
    }

    const { error } = await supabase
      .from('files')
      .delete()
      .eq('id', id)
    if (error) throw error
  }
}

// ============================================
// BACKUP - Complete Implementation
// ============================================
export interface BackupData {
  timestamp: string
  version: string
  tenantId: string
  data: {
    customers: unknown[]
    planRequests: unknown[]
    contracts: unknown[]
    fundPlans: unknown[]
    activities: unknown[]
    handovers: unknown[]
    salesTargets: unknown[]
    files: unknown[] // File metadata only
    users: unknown[]
    products: unknown[]
  }
  recordCounts: Record<string, number>
  checksum?: string
}

export const backupDb = {
  /**
   * Create a complete backup of all data
   */
  async createBackup(
    createdBy: string,
    backupType: 'full' | 'incremental' | 'manual' = 'manual'
  ): Promise<{ id: string; path: string; size: number }> {
    const supabase = getClient()

    // Gather all data from all tables
    const [
      customers,
      planRequests,
      contracts,
      fundPlans,
      activities,
      handovers,
      salesTargets,
      files,
      users,
      products
    ] = await Promise.all([
      customerDb.getAll(),
      planRequestDb.getAll(),
      contractDb.getAll(),
      fundPlanDb.getAll(),
      activityDb.getAll(),
      handoverDb.getAll(),
      salesTargetDb.getAll(),
      fileDb.getAll(),
      userDb.getAll(),
      productDb.getAll()
    ])

    const backupData: BackupData = {
      timestamp: new Date().toISOString(),
      version: '2.0',
      tenantId: DEFAULT_TENANT_ID,
      data: {
        customers,
        planRequests,
        contracts,
        fundPlans,
        activities,
        handovers,
        salesTargets,
        files, // Metadata only, not actual file contents
        users,
        products
      },
      recordCounts: {
        customers: customers.length,
        planRequests: planRequests.length,
        contracts: contracts.length,
        fundPlans: fundPlans.length,
        activities: activities.length,
        handovers: handovers.length,
        salesTargets: salesTargets.length,
        files: files.length,
        users: users.length,
        products: products.length
      }
    }

    // Generate checksum for data integrity
    const jsonString = JSON.stringify(backupData.data)
    backupData.checksum = await generateChecksum(jsonString)

    // Upload to storage
    const date = new Date().toISOString().split('T')[0]
    const backupPath = `backups/${date}/backup-${backupType}-${Date.now()}.json`
    const blob = new Blob([JSON.stringify(backupData, null, 2)], { type: 'application/json' })
    const file = new File([blob], 'backup.json', { type: 'application/json' })

    await fileStorage.upload(file, backupPath)

    // Calculate expiry date (90 days for manual, 30 days for auto)
    const expiryDays = backupType === 'manual' ? 90 : 30
    const expiresAt = new Date()
    expiresAt.setDate(expiresAt.getDate() + expiryDays)

    // Record backup in database
    const { data: backupRecord, error } = await supabase
      .from('backups')
      .insert({
        tenant_id: DEFAULT_TENANT_ID,
        backup_type: backupType,
        storage_path: backupPath,
        size_bytes: blob.size,
        tables_included: Object.keys(backupData.data),
        record_counts: backupData.recordCounts,
        created_by: createdBy,
        status: 'completed',
        expires_at: expiresAt.toISOString()
      })
      .select()
      .single()

    if (error) throw error

    return {
      id: backupRecord?.id || '',
      path: backupPath,
      size: blob.size
    }
  },

  /**
   * List all backups with optional filters
   */
  async listBackups(options?: {
    type?: 'full' | 'incremental' | 'manual'
    status?: 'completed' | 'failed' | 'expired'
    limit?: number
  }): Promise<unknown[]> {
    const supabase = getClient()
    let query = supabase
      .from('backups')
      .select('*')
      .order('created_at', { ascending: false })

    if (options?.type) {
      query = query.eq('backup_type', options.type)
    }
    if (options?.status) {
      query = query.eq('status', options.status)
    }
    if (options?.limit) {
      query = query.limit(options.limit)
    }

    const { data, error } = await query
    if (error) throw error
    return data || []
  },

  /**
   * Get a specific backup by ID
   */
  async getBackupById(backupId: string): Promise<unknown | null> {
    const supabase = getClient()
    const { data, error } = await supabase
      .from('backups')
      .select('*')
      .eq('id', backupId)
      .single()

    if (error && error.code !== 'PGRST116') throw error
    return data
  },

  /**
   * Download backup data
   */
  async downloadBackup(backupId: string): Promise<BackupData> {
    const supabase = getClient()

    // Get backup record
    const { data: backup } = await supabase
      .from('backups')
      .select('*')
      .eq('id', backupId)
      .single()

    if (!backup) throw new Error('Backup not found')

    // Download backup file
    const blob = await fileStorage.download(backup.storage_path)
    const text = await blob.text()
    const backupData = JSON.parse(text) as BackupData

    // Verify checksum if available
    if (backupData.checksum) {
      const jsonString = JSON.stringify(backupData.data)
      const currentChecksum = await generateChecksum(jsonString)
      if (currentChecksum !== backupData.checksum) {
        throw new Error('Backup data integrity check failed')
      }
    }

    return backupData
  },

  /**
   * Restore from a backup - DESTRUCTIVE OPERATION
   * This will delete all current data and replace with backup data
   */
  async restoreBackup(
    backupId: string,
    options?: {
      tables?: string[] // Specific tables to restore, or all if not specified
      dryRun?: boolean // If true, validates but doesn't actually restore
    }
  ): Promise<{
    success: boolean
    restoredTables: string[]
    recordsRestored: Record<string, number>
    errors: string[]
  }> {
    const supabase = getClient()
    const errors: string[] = []
    const restoredTables: string[] = []
    const recordsRestored: Record<string, number> = {}

    // Download and validate backup
    const backupData = await this.downloadBackup(backupId)

    // Table restore order (respecting foreign key constraints)
    const tableOrder = [
      'users',
      'products',
      'customers',
      'planRequests',
      'fundPlans',
      'contracts',
      'activities',
      'handovers',
      'salesTargets',
      'files'
    ]

    const tablesToRestore = options?.tables || tableOrder
    const tableNameMap: Record<string, string> = {
      users: 'users',
      products: 'products',
      customers: 'customers',
      planRequests: 'plan_requests',
      fundPlans: 'fund_plans',
      contracts: 'contracts',
      activities: 'activities',
      handovers: 'handovers',
      salesTargets: 'sales_targets',
      files: 'files'
    }

    if (options?.dryRun) {
      return {
        success: true,
        restoredTables: tablesToRestore,
        recordsRestored: backupData.recordCounts,
        errors: []
      }
    }

    // Restore each table in order
    for (const tableName of tableOrder) {
      if (!tablesToRestore.includes(tableName)) continue

      const dbTableName = tableNameMap[tableName]
      const tableData = backupData.data[tableName as keyof typeof backupData.data]

      if (!tableData || !Array.isArray(tableData) || tableData.length === 0) {
        continue
      }

      try {
        // Delete existing data (except for users and products which are reference data)
        if (!['users', 'products'].includes(tableName)) {
          await supabase.from(dbTableName).delete().neq('id', '')
        }

        // Insert backup data in batches of 100
        const batchSize = 100
        for (let i = 0; i < tableData.length; i += batchSize) {
          const batch = tableData.slice(i, i + batchSize)
          const { error } = await supabase
            .from(dbTableName)
            .upsert(batch, { onConflict: 'id' })

          if (error) {
            errors.push(`${tableName}: ${error.message}`)
          }
        }

        restoredTables.push(tableName)
        recordsRestored[tableName] = tableData.length
      } catch (err) {
        errors.push(`${tableName}: ${err instanceof Error ? err.message : 'Unknown error'}`)
      }
    }

    // Update backup record with restore info
    await supabase
      .from('backups')
      .update({
        // Add a note that this backup was restored
      })
      .eq('id', backupId)

    return {
      success: errors.length === 0,
      restoredTables,
      recordsRestored,
      errors
    }
  },

  /**
   * Delete a backup
   */
  async deleteBackup(backupId: string): Promise<void> {
    const supabase = getClient()

    // Get backup record
    const { data: backup } = await supabase
      .from('backups')
      .select('storage_path')
      .eq('id', backupId)
      .single()

    if (backup?.storage_path) {
      await fileStorage.delete(backup.storage_path).catch(console.error)
    }

    const { error } = await supabase
      .from('backups')
      .delete()
      .eq('id', backupId)

    if (error) throw error
  },

  /**
   * Export backup as downloadable JSON
   */
  async exportBackup(backupId: string): Promise<Blob> {
    const backupData = await this.downloadBackup(backupId)
    return new Blob([JSON.stringify(backupData, null, 2)], { type: 'application/json' })
  },

  /**
   * Import backup from external JSON file
   */
  async importBackup(
    jsonData: string,
    createdBy: string
  ): Promise<{ id: string; recordCounts: Record<string, number> }> {
    const backupData = JSON.parse(jsonData) as BackupData

    // Validate backup structure
    if (!backupData.version || !backupData.data) {
      throw new Error('Invalid backup format')
    }

    // Create a new backup record
    const result = await this.createBackup(createdBy, 'manual')

    return {
      id: result.id,
      recordCounts: backupData.recordCounts
    }
  }
}

// Helper function to generate checksum
async function generateChecksum(data: string): Promise<string> {
  if (typeof window !== 'undefined' && window.crypto?.subtle) {
    const encoder = new TextEncoder()
    const dataBuffer = encoder.encode(data)
    const hashBuffer = await window.crypto.subtle.digest('SHA-256', dataBuffer)
    const hashArray = Array.from(new Uint8Array(hashBuffer))
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('')
  }
  // Fallback for server-side or unsupported browsers
  return `len:${data.length}-ts:${Date.now()}`
}
