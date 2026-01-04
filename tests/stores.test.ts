import { describe, it, expect, beforeEach } from 'vitest'
import { useCustomerStore } from '@/store/stores/customer'
import { useContractStore } from '@/store/stores/contract'
import { useHandoverStore } from '@/store/stores/handover'

describe('stores', () => {
  describe('customerStore', () => {
    beforeEach(() => {
      useCustomerStore.setState({ customers: [] })
    })

    it('adds a customer', () => {
      const id = useCustomerStore.getState().addCustomer({
        name: '山田 太郎',
        tenant_id: 'test-tenant',
        pipeline_status: '面談',
      })

      // Re-get state after mutation
      const state = useCustomerStore.getState()

      expect(id).toBeDefined()
      expect(state.customers).toHaveLength(1)
      expect(state.customers[0].name).toBe('山田 太郎')
    })

    it('updates a customer', () => {
      const id = useCustomerStore.getState().addCustomer({
        name: '山田 太郎',
        tenant_id: 'test-tenant',
        pipeline_status: '面談',
      })

      useCustomerStore.getState().updateCustomer(id, { name: '山田 花子' })

      const state = useCustomerStore.getState()
      expect(state.customers[0].name).toBe('山田 花子')
    })

    it('deletes a customer', () => {
      const id = useCustomerStore.getState().addCustomer({
        name: '山田 太郎',
        tenant_id: 'test-tenant',
        pipeline_status: '面談',
      })

      useCustomerStore.getState().deleteCustomer(id)

      const state = useCustomerStore.getState()
      expect(state.customers).toHaveLength(0)
    })

    it('gets a customer by id', () => {
      const id = useCustomerStore.getState().addCustomer({
        name: '山田 太郎',
        tenant_id: 'test-tenant',
        pipeline_status: '面談',
      })

      const customer = useCustomerStore.getState().getCustomer(id)

      expect(customer).toBeDefined()
      expect(customer?.name).toBe('山田 太郎')
    })
  })

  describe('contractStore', () => {
    beforeEach(() => {
      useContractStore.setState({ contracts: [] })
    })

    it('adds a contract', () => {
      const id = useContractStore.getState().addContract({
        customer_id: 'customer-1',
        fund_plan_id: null,
        status: '作成中',
        contract_number: null,
        contract_date: null,
        tei_name: '山田邸',
        customer_name: '山田 太郎',
        partner_name: null,
        ownership_type: '単独',
        sales_person: '営業担当',
        design_person: null,
        construction_person: null,
        ic_person: null,
        land_address: '東京都渋谷区1-1-1',
        land_area: null,
        building_area: 30,
        product_name: 'LIFE',
        building_price: null,
        option_price: null,
        exterior_price: null,
        other_price: null,
        discount_amount: null,
        tax_amount: null,
        total_amount: 20000000,
        payment_at_contract: 1000000,
        payment_at_start: 5000000,
        payment_at_frame: 7000000,
        payment_at_completion: 7000000,
        identity_verified: false,
        identity_doc_type: null,
        identity_verified_date: null,
        identity_verified_by: null,
        loan_type: null,
        loan_bank: null,
        loan_amount: null,
        loan_approved: false,
        loan_approved_date: null,
        important_notes: null,
        important_notes_date: null,
        attachments: null,
        created_by: 'user-1',
        created_by_name: '作成者',
        checked_by: null,
        checked_by_name: null,
        checked_at: null,
        check_comment: null,
        approved_by: null,
        approved_by_name: null,
        approved_at: null,
        approval_comment: null,
        returned_by: null,
        returned_by_name: null,
        returned_at: null,
        return_comment: null,
        notes: null,
        designated_checker_id: null,
        designated_checker_name: null,
        designated_approver_id: null,
        designated_approver_name: null,
      })

      const state = useContractStore.getState()

      expect(id).toBeDefined()
      expect(state.contracts).toHaveLength(1)
      expect(state.contracts[0].tei_name).toBe('山田邸')
      expect(state.contracts[0].status).toBe('作成中')
    })

    it('generates contract number', () => {
      const id = useContractStore.getState().addContract({
        customer_id: 'customer-1',
        fund_plan_id: null,
        status: '作成中',
        contract_number: null,
        contract_date: null,
        tei_name: '山田邸',
        customer_name: '山田 太郎',
        partner_name: null,
        ownership_type: '単独',
        sales_person: null,
        design_person: null,
        construction_person: null,
        ic_person: null,
        land_address: null,
        land_area: null,
        building_area: null,
        product_name: null,
        building_price: null,
        option_price: null,
        exterior_price: null,
        other_price: null,
        discount_amount: null,
        tax_amount: null,
        total_amount: null,
        payment_at_contract: null,
        payment_at_start: null,
        payment_at_frame: null,
        payment_at_completion: null,
        identity_verified: false,
        identity_doc_type: null,
        identity_verified_date: null,
        identity_verified_by: null,
        loan_type: null,
        loan_bank: null,
        loan_amount: null,
        loan_approved: false,
        loan_approved_date: null,
        important_notes: null,
        important_notes_date: null,
        attachments: null,
        created_by: null,
        created_by_name: null,
        checked_by: null,
        checked_by_name: null,
        checked_at: null,
        check_comment: null,
        approved_by: null,
        approved_by_name: null,
        approved_at: null,
        approval_comment: null,
        returned_by: null,
        returned_by_name: null,
        returned_at: null,
        return_comment: null,
        notes: null,
        designated_checker_id: null,
        designated_checker_name: null,
        designated_approver_id: null,
        designated_approver_name: null,
      })

      const contract = useContractStore.getState().getContract(id)
      expect(contract?.contract_number).toMatch(/^C-\d{4}-\d{4}$/)
    })

    it('submits contract for approval', () => {
      const id = useContractStore.getState().addContract({
        customer_id: 'customer-1',
        fund_plan_id: null,
        status: '作成中',
        contract_number: null,
        contract_date: null,
        tei_name: '山田邸',
        customer_name: '山田 太郎',
        partner_name: null,
        ownership_type: '単独',
        sales_person: null,
        design_person: null,
        construction_person: null,
        ic_person: null,
        land_address: null,
        land_area: null,
        building_area: null,
        product_name: null,
        building_price: null,
        option_price: null,
        exterior_price: null,
        other_price: null,
        discount_amount: null,
        tax_amount: null,
        total_amount: null,
        payment_at_contract: null,
        payment_at_start: null,
        payment_at_frame: null,
        payment_at_completion: null,
        identity_verified: false,
        identity_doc_type: null,
        identity_verified_date: null,
        identity_verified_by: null,
        loan_type: null,
        loan_bank: null,
        loan_amount: null,
        loan_approved: false,
        loan_approved_date: null,
        important_notes: null,
        important_notes_date: null,
        attachments: null,
        created_by: null,
        created_by_name: null,
        checked_by: null,
        checked_by_name: null,
        checked_at: null,
        check_comment: null,
        approved_by: null,
        approved_by_name: null,
        approved_at: null,
        approval_comment: null,
        returned_by: null,
        returned_by_name: null,
        returned_at: null,
        return_comment: null,
        notes: null,
        designated_checker_id: null,
        designated_checker_name: null,
        designated_approver_id: null,
        designated_approver_name: null,
      })

      const result = useContractStore.getState().submitForApproval(id, 'user-1', '山田 太郎')
      const state = useContractStore.getState()

      expect(result).toBe(true)
      expect(state.contracts[0].status).toBe('書類確認')
      expect(state.contracts[0].history).toHaveLength(2)
    })
  })

  describe('handoverStore', () => {
    beforeEach(() => {
      useHandoverStore.setState({ handovers: [] })
    })

    it('adds a handover', () => {
      const id = useHandoverStore.getState().addHandover({
        customer_id: 'customer-1',
        contract_id: 'contract-1',
        from_user_id: 'user-1',
        from_user_name: '引継元',
        to_user_id: 'user-2',
        to_user_name: '引継先',
        status: 'draft',
        customer_name: '山田 太郎',
        tei_name: '山田邸',
        customer_notes: 'お客様メモ',
        site_notes: '現場メモ',
        schedule_notes: 'スケジュールメモ',
        special_notes: '特記事項',
        checklist: [],
        confirmed_by: null,
        confirmed_by_name: null,
        confirmed_at: null,
      })

      const state = useHandoverStore.getState()

      expect(id).toBeDefined()
      expect(state.handovers).toHaveLength(1)
      expect(state.handovers[0].customer_name).toBe('山田 太郎')
    })

    it('confirms a handover', () => {
      const id = useHandoverStore.getState().addHandover({
        customer_id: 'customer-1',
        contract_id: null,
        from_user_id: null,
        from_user_name: null,
        to_user_id: null,
        to_user_name: null,
        status: 'submitted',
        customer_name: '山田 太郎',
        tei_name: null,
        customer_notes: null,
        site_notes: null,
        schedule_notes: null,
        special_notes: null,
        checklist: [],
        confirmed_by: null,
        confirmed_by_name: null,
        confirmed_at: null,
      })

      useHandoverStore.getState().confirmHandover(id, 'user-1', '確認者')

      const handover = useHandoverStore.getState().getHandover(id)
      expect(handover?.status).toBe('approved')
      expect(handover?.confirmed_by).toBe('user-1')
      expect(handover?.confirmed_by_name).toBe('確認者')
      expect(handover?.confirmed_at).toBeDefined()
    })

    it('gets handovers by customer', () => {
      useHandoverStore.getState().addHandover({
        customer_id: 'customer-1',
        contract_id: null,
        from_user_id: null,
        from_user_name: null,
        to_user_id: null,
        to_user_name: null,
        status: 'draft',
        customer_name: '山田 太郎',
        tei_name: null,
        customer_notes: null,
        site_notes: null,
        schedule_notes: null,
        special_notes: null,
        checklist: [],
        confirmed_by: null,
        confirmed_by_name: null,
        confirmed_at: null,
      })

      useHandoverStore.getState().addHandover({
        customer_id: 'customer-2',
        contract_id: null,
        from_user_id: null,
        from_user_name: null,
        to_user_id: null,
        to_user_name: null,
        status: 'draft',
        customer_name: '田中 次郎',
        tei_name: null,
        customer_notes: null,
        site_notes: null,
        schedule_notes: null,
        special_notes: null,
        checklist: [],
        confirmed_by: null,
        confirmed_by_name: null,
        confirmed_at: null,
      })

      const handovers = useHandoverStore.getState().getHandoversByCustomer('customer-1')

      expect(handovers).toHaveLength(1)
      expect(handovers[0].customer_name).toBe('山田 太郎')
    })
  })
})
