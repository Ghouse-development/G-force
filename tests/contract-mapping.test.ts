import { describe, it, expect } from 'vitest'
import {
  createDefaultContractData,
  createContractDataFromFundPlan,
  calculateConstructionPriceFromFundPlan,
} from '@/types/contract'
import { createDefaultFundPlanData } from '@/types/fund-plan'

describe('contract-mapping', () => {
  describe('createDefaultContractData', () => {
    it('creates default contract data', () => {
      const data = createDefaultContractData()

      expect(data.constructionName).toBe('')
      expect(data.customerName).toBe('')
      expect(data.ownershipType).toBe('単独')
      expect(data.structure).toBe('木造軸組工法')
      expect(data.floorCount).toBe(2)
      expect(data.productType).toBe('LIFE')
    })

    it('sets current date for contract date', () => {
      const data = createDefaultContractData()
      const today = new Date()

      expect(data.contractYear).toBe(today.getFullYear())
      expect(data.contractMonth).toBe(today.getMonth() + 1)
      expect(data.contractDay).toBe(today.getDate())
    })

    it('sets default payment amounts', () => {
      const data = createDefaultContractData()

      expect(data.payment1Amount).toBe(100000) // 申込金
      expect(data.payment2Amount).toBe(1000000) // 契約金
      expect(data.payment3Amount).toBe(0)
      expect(data.payment4Amount).toBe(0)
    })

    it('initializes solar contract with zeros', () => {
      const data = createDefaultContractData()

      expect(data.solarContract.contractYear).toBe(0)
      expect(data.solarContract.payment1).toBe(0)
      expect(data.solarContract.payment2).toBe(0)
    })

    it('initializes change contract with zeros', () => {
      const data = createDefaultContractData()

      expect(data.changeContract.changeContractYear).toBe(0)
      expect(data.changeContract.constructionPrice).toBe(0)
    })
  })

  describe('calculateConstructionPriceFromFundPlan', () => {
    it('calculates price from fund plan', () => {
      const fundPlan = createDefaultFundPlanData()
      fundPlan.constructionArea = 30 // 30坪
      fundPlan.pricePerTsubo = 500000 // 50万/坪

      const price = calculateConstructionPriceFromFundPlan(fundPlan)

      // 30坪 × 50万 = 1500万 (本体) + 付帯工事
      expect(price).toBeGreaterThanOrEqual(15000000)
    })

    it('includes incidental costs', () => {
      const fundPlan = createDefaultFundPlanData()
      fundPlan.constructionArea = 10
      fundPlan.pricePerTsubo = 100000

      // Reset all incidental costs to 0 first using spread operator
      fundPlan.incidentalCostA = {
        ...fundPlan.incidentalCostA,
        confirmationApplicationFee: 0,
        structuralCalculation: 0,
        structuralDrawingFee: 0,
        belsApplicationFee: 0,
        longTermHousingApplicationFee: 0,
        outdoorElectricWaterDrainageFee: 0,
        defectInsuranceGroundTermiteWarranty: 0,
        designSupervisionFee: 0,
        safetyMeasuresFee: 0,
        temporaryConstructionFee: 0,
      }
      fundPlan.incidentalCostB = {
        ...fundPlan.incidentalCostB,
        solarPanelCount: 0,
        solarPanelKw: 0,
        solarPanelCost: 0,
        storageBatteryType: 'なし',
        storageBatteryCost: 0,
        eaveOverhangArea: 0,
        eaveOverhangCost: 0,
        lowerRoofArea: 0,
        lowerRoofCost: 0,
        balconyVoidArea: 0,
        balconyVoidCost: 0,
        threeStoryTsubo: 0,
        threeStoryDifference: 0,
        roofLengthExtra: 0,
        roofLengthNote: '',
        narrowRoadExtra: 0,
        narrowRoadNote: '',
        areaSizeTsubo: 0,
        areaSizeExtra: 0,
        lightingCost: 0,
        optionCost: 0,
      }
      fundPlan.incidentalCostC = {
        ...fundPlan.incidentalCostC,
        fireProtectionCost: 0,
        demolitionCost: 0,
        applicationManagementFee: 0,
        waterDrainageFee: 0,
        groundImprovementFee: 0,
        soilDisposalFee: 0,
        electricProtectionPipe: 0,
        electricProtectionPipeExists: false,
        narrowRoadCubicExists: false,
        narrowRoadCubicExtra: 0,
        deepFoundationLength: 0,
        deepFoundationExtraHeight: 0,
        deepFoundationExtra: 0,
        elevationExists: false,
        elevationExtra: 0,
        flagLotExists: false,
        flagLotExtra: 0,
        skyFactorSides: 0,
        skyFactorExtra: 0,
        quasiFireproofExists: false,
        quasiFireproofExtra: 0,
        roadTimeRestrictionExists: false,
        roadTimeRestrictionExtra: 0,
      }

      // Add specific incidental costs
      fundPlan.incidentalCostA.confirmationApplicationFee = 100000
      fundPlan.incidentalCostB.solarPanelCost = 200000
      fundPlan.incidentalCostC.fireProtectionCost = 50000

      const price = calculateConstructionPriceFromFundPlan(fundPlan)

      // 10坪 × 10万 = 100万 + 35万 = 135万
      expect(price).toBe(1000000 + 100000 + 200000 + 50000)
    })
  })

  describe('createContractDataFromFundPlan', () => {
    it('maps basic info from fund plan', () => {
      const fundPlan = createDefaultFundPlanData()
      fundPlan.customerName = '山田 太郎'
      fundPlan.constructionAddress = '東京都渋谷区1-1-1'
      fundPlan.constructionName = '山田邸新築工事'

      const contract = createContractDataFromFundPlan(fundPlan)

      expect(contract.customerName).toBe('山田 太郎')
      expect(contract.constructionSite).toBe('東京都渋谷区1-1-1')
      expect(contract.constructionName).toBe('山田邸新築工事')
    })

    it('generates construction name from teiName if not provided', () => {
      const fundPlan = createDefaultFundPlanData()
      fundPlan.teiName = '山田邸'
      fundPlan.constructionName = ''

      const contract = createContractDataFromFundPlan(fundPlan)

      expect(contract.constructionName).toBe('山田邸新築工事')
    })

    it('maps floor areas with tsubo to sqm conversion', () => {
      const fundPlan = createDefaultFundPlanData()
      fundPlan.constructionArea = 30 // 30坪
      fundPlan.floorCount = 2

      const contract = createContractDataFromFundPlan(fundPlan)

      // 30坪 = 約99.17㎡
      const totalSqm = 30 * 3.30579

      // 2階建ての場合、1階は約55%、2階は約45%
      expect(contract.floor1Area).toBeCloseTo(totalSqm * 0.55, 1)
      expect(contract.floor2Area).toBeCloseTo(totalSqm * 0.45, 1)
      expect(contract.floor2Included).toBe(true)
      expect(contract.floor3Included).toBe(false)
    })

    it('maps payment schedule from fund plan', () => {
      const fundPlan = createDefaultFundPlanData()
      fundPlan.paymentPlanConstruction.applicationFee.customerAmount = 50000
      fundPlan.paymentPlanConstruction.contractFee.customerAmount = 500000
      fundPlan.paymentPlanConstruction.interimPayment1.customerAmount = 1000000

      const contract = createContractDataFromFundPlan(fundPlan)

      expect(contract.payment1Amount).toBe(50000)
      expect(contract.payment2Amount).toBe(500000)
      expect(contract.payment3Amount).toBe(1000000)
    })

    it('maps schedule dates', () => {
      const fundPlan = createDefaultFundPlanData()
      fundPlan.schedule.constructionStart = '2024-06-01'
      fundPlan.schedule.completion = '2024-12-31'

      const contract = createContractDataFromFundPlan(fundPlan)

      expect(contract.startDate).toBe('2024-06-01')
      expect(contract.completionDate).toBe('2024-12-31')
    })

    it('sets solar contract when solar panels exist', () => {
      const fundPlan = createDefaultFundPlanData()
      fundPlan.incidentalCostB.solarPanelKw = 5.0
      fundPlan.incidentalCostB.solarPanelCost = 1000000
      fundPlan.schedule.buildingContract = '2024-04-01'

      const contract = createContractDataFromFundPlan(fundPlan)

      expect(contract.solarContract).toBeDefined()
      expect(contract.solarContract?.payment1).toBe(500000) // 50%
      expect(contract.solarContract?.payment2).toBe(500000) // 50%
    })

    it('does not set solar contract when no solar panels', () => {
      const fundPlan = createDefaultFundPlanData()
      fundPlan.incidentalCostB.solarPanelKw = 0

      const contract = createContractDataFromFundPlan(fundPlan)

      expect(contract.solarContract).toBeUndefined()
    })

    it('accepts additional options', () => {
      const fundPlan = createDefaultFundPlanData()

      const contract = createContractDataFromFundPlan(fundPlan, {
        customerAddress: '東京都渋谷区2-2-2',
        ownershipType: '共有',
        customerName2: '山田 花子',
      })

      expect(contract.customerAddress).toBe('東京都渋谷区2-2-2')
      expect(contract.ownershipType).toBe('共有')
      expect(contract.customerName2).toBe('山田 花子')
    })
  })
})
