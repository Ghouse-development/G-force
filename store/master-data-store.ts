import { create } from 'zustand'
import { persist } from 'zustand/middleware'

// マスターデータのタイプ
export type MasterDataType =
  | 'banks'           // 銀行
  | 'loanTypes'       // ローン種別
  | 'leadSources'     // 来店経路
  | 'customerStatuses'// 顧客ステータス
  | 'buildingTypes'   // 建物タイプ
  | 'prefectures'     // 都道府県
  | 'paymentMethods'  // 支払方法

// マスターデータ項目
export interface MasterDataItem {
  id: string
  code: string      // 内部コード（変更不可）
  label: string     // 表示名
  description?: string
  sortOrder: number
  isActive: boolean
  isDefault?: boolean
  metadata?: Record<string, unknown>
  createdAt: string
  updatedAt: string
}

// マスターデータ定義
export interface MasterDataDefinition {
  type: MasterDataType
  name: string        // 日本語名
  description: string
  icon: string        // lucide icon name
  allowAdd: boolean   // 追加可能か
  allowEdit: boolean  // 編集可能か
  allowDelete: boolean// 削除可能か
  items: MasterDataItem[]
}

interface MasterDataState {
  masterData: Record<MasterDataType, MasterDataDefinition>
  addItem: (type: MasterDataType, item: Omit<MasterDataItem, 'id' | 'createdAt' | 'updatedAt' | 'sortOrder'>) => void
  updateItem: (type: MasterDataType, id: string, updates: Partial<MasterDataItem>) => void
  deleteItem: (type: MasterDataType, id: string) => void
  reorderItems: (type: MasterDataType, itemIds: string[]) => void
  getActiveItems: (type: MasterDataType) => MasterDataItem[]
  resetToDefaults: (type: MasterDataType) => void
}

// デフォルトのマスターデータ
const defaultMasterData: Record<MasterDataType, MasterDataDefinition> = {
  banks: {
    type: 'banks',
    name: '金融機関',
    description: '住宅ローンを取り扱う金融機関',
    icon: 'Landmark',
    allowAdd: true,
    allowEdit: true,
    allowDelete: true,
    items: [
      { id: 'bank-1', code: 'jfc', label: '住宅金融支援機構（フラット35）', sortOrder: 1, isActive: true, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
      { id: 'bank-2', code: 'mufg', label: '三菱UFJ銀行', sortOrder: 2, isActive: true, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
      { id: 'bank-3', code: 'smbc', label: '三井住友銀行', sortOrder: 3, isActive: true, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
      { id: 'bank-4', code: 'mizuho', label: 'みずほ銀行', sortOrder: 4, isActive: true, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
      { id: 'bank-5', code: 'resona', label: 'りそな銀行', sortOrder: 5, isActive: true, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
      { id: 'bank-6', code: 'sbi', label: '住信SBIネット銀行', sortOrder: 6, isActive: true, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
      { id: 'bank-7', code: 'aeon', label: 'イオン銀行', sortOrder: 7, isActive: true, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
      { id: 'bank-8', code: 'rakuten', label: '楽天銀行', sortOrder: 8, isActive: true, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
      { id: 'bank-9', code: 'local', label: '地方銀行', sortOrder: 9, isActive: true, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
      { id: 'bank-10', code: 'ja', label: 'JA（農協）', sortOrder: 10, isActive: true, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
      { id: 'bank-11', code: 'shinkin', label: '信用金庫', sortOrder: 11, isActive: true, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
      { id: 'bank-12', code: 'other', label: 'その他', sortOrder: 99, isActive: true, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
    ],
  },
  loanTypes: {
    type: 'loanTypes',
    name: 'ローン種別',
    description: '住宅ローンの種類',
    icon: 'CreditCard',
    allowAdd: true,
    allowEdit: true,
    allowDelete: true,
    items: [
      { id: 'lt-1', code: 'variable', label: '変動金利型', description: '金利が半年ごとに見直される', sortOrder: 1, isActive: true, isDefault: true, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
      { id: 'lt-2', code: 'fixed10', label: '固定金利10年', description: '10年間金利固定', sortOrder: 2, isActive: true, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
      { id: 'lt-3', code: 'fixed35', label: 'フラット35', description: '35年間全期間固定', sortOrder: 3, isActive: true, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
      { id: 'lt-4', code: 'flat35s', label: 'フラット35S', description: '省エネ住宅向け優遇金利', sortOrder: 4, isActive: true, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
      { id: 'lt-5', code: 'mix', label: 'ミックス型', description: '変動と固定の組み合わせ', sortOrder: 5, isActive: true, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
    ],
  },
  leadSources: {
    type: 'leadSources',
    name: '来店経路',
    description: '顧客の来店経路・獲得チャネル',
    icon: 'Route',
    allowAdd: true,
    allowEdit: true,
    allowDelete: true,
    items: [
      { id: 'ls-1', code: 'web', label: 'ホームページ', sortOrder: 1, isActive: true, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
      { id: 'ls-2', code: 'suumo', label: 'SUUMO', sortOrder: 2, isActive: true, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
      { id: 'ls-3', code: 'homes', label: "HOME'S", sortOrder: 3, isActive: true, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
      { id: 'ls-4', code: 'athome', label: 'at home', sortOrder: 4, isActive: true, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
      { id: 'ls-5', code: 'referral', label: '紹介', sortOrder: 5, isActive: true, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
      { id: 'ls-6', code: 'walkin', label: '通りがかり', sortOrder: 6, isActive: true, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
      { id: 'ls-7', code: 'event', label: 'イベント・見学会', sortOrder: 7, isActive: true, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
      { id: 'ls-8', code: 'sns', label: 'SNS', sortOrder: 8, isActive: true, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
      { id: 'ls-9', code: 'dm', label: 'チラシ・DM', sortOrder: 9, isActive: true, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
      { id: 'ls-10', code: 'other', label: 'その他', sortOrder: 99, isActive: true, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
    ],
  },
  customerStatuses: {
    type: 'customerStatuses',
    name: '顧客ステータス',
    description: '顧客の進捗状況',
    icon: 'UserCheck',
    allowAdd: false,
    allowEdit: true,
    allowDelete: false,
    items: [
      { id: 'cs-1', code: 'new', label: '新規来店', sortOrder: 1, isActive: true, metadata: { color: 'gray' }, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
      { id: 'cs-2', code: 'in_progress', label: '商談中', sortOrder: 2, isActive: true, metadata: { color: 'blue' }, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
      { id: 'cs-3', code: 'application', label: '申込済', sortOrder: 3, isActive: true, metadata: { color: 'yellow' }, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
      { id: 'cs-4', code: 'contracted', label: '契約済', sortOrder: 4, isActive: true, metadata: { color: 'green' }, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
      { id: 'cs-5', code: 'construction', label: '着工中', sortOrder: 5, isActive: true, metadata: { color: 'purple' }, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
      { id: 'cs-6', code: 'delivered', label: '引渡済', sortOrder: 6, isActive: true, metadata: { color: 'emerald' }, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
      { id: 'cs-7', code: 'lost', label: '失注', sortOrder: 7, isActive: true, metadata: { color: 'red' }, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
      { id: 'cs-8', code: 'dormant', label: '休眠', sortOrder: 8, isActive: true, metadata: { color: 'slate' }, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
    ],
  },
  buildingTypes: {
    type: 'buildingTypes',
    name: '建物タイプ',
    description: '住宅の建物タイプ',
    icon: 'Home',
    allowAdd: true,
    allowEdit: true,
    allowDelete: true,
    items: [
      { id: 'bt-1', code: 'two_story', label: '2階建て', sortOrder: 1, isActive: true, isDefault: true, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
      { id: 'bt-2', code: 'hiraya', label: '平屋', sortOrder: 2, isActive: true, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
      { id: 'bt-3', code: 'three_story', label: '3階建て', sortOrder: 3, isActive: true, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
      { id: 'bt-4', code: 'nisetai', label: '二世帯住宅', sortOrder: 4, isActive: true, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
      { id: 'bt-5', code: 'apartment', label: '賃貸併用住宅', sortOrder: 5, isActive: true, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
    ],
  },
  prefectures: {
    type: 'prefectures',
    name: '対応エリア',
    description: '営業対応エリア（都道府県）',
    icon: 'MapPin',
    allowAdd: false,
    allowEdit: true,
    allowDelete: false,
    items: [
      { id: 'pref-1', code: 'aichi', label: '愛知県', sortOrder: 1, isActive: true, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
      { id: 'pref-2', code: 'gifu', label: '岐阜県', sortOrder: 2, isActive: true, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
      { id: 'pref-3', code: 'mie', label: '三重県', sortOrder: 3, isActive: true, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
      { id: 'pref-4', code: 'shizuoka', label: '静岡県', sortOrder: 4, isActive: false, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
    ],
  },
  paymentMethods: {
    type: 'paymentMethods',
    name: '支払方法',
    description: '資金計画の支払方法',
    icon: 'Wallet',
    allowAdd: true,
    allowEdit: true,
    allowDelete: true,
    items: [
      { id: 'pm-1', code: 'loan', label: '住宅ローン', sortOrder: 1, isActive: true, isDefault: true, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
      { id: 'pm-2', code: 'cash', label: '自己資金', sortOrder: 2, isActive: true, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
      { id: 'pm-3', code: 'parents', label: '親からの援助', sortOrder: 3, isActive: true, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
      { id: 'pm-4', code: 'sale', label: '不動産売却', sortOrder: 4, isActive: true, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
    ],
  },
}

export const useMasterDataStore = create<MasterDataState>()(
  persist(
    (set, get) => ({
      masterData: defaultMasterData,

      addItem: (type, item) => {
        const id = `${type}-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`
        const now = new Date().toISOString()
        const currentItems = get().masterData[type].items
        const maxSortOrder = Math.max(...currentItems.map(i => i.sortOrder), 0)

        const newItem: MasterDataItem = {
          ...item,
          id,
          sortOrder: maxSortOrder + 1,
          createdAt: now,
          updatedAt: now,
        }

        set((state) => ({
          masterData: {
            ...state.masterData,
            [type]: {
              ...state.masterData[type],
              items: [...state.masterData[type].items, newItem],
            },
          },
        }))
      },

      updateItem: (type, id, updates) => {
        set((state) => ({
          masterData: {
            ...state.masterData,
            [type]: {
              ...state.masterData[type],
              items: state.masterData[type].items.map((item) =>
                item.id === id
                  ? { ...item, ...updates, updatedAt: new Date().toISOString() }
                  : item
              ),
            },
          },
        }))
      },

      deleteItem: (type, id) => {
        set((state) => ({
          masterData: {
            ...state.masterData,
            [type]: {
              ...state.masterData[type],
              items: state.masterData[type].items.filter((item) => item.id !== id),
            },
          },
        }))
      },

      reorderItems: (type, itemIds) => {
        set((state) => ({
          masterData: {
            ...state.masterData,
            [type]: {
              ...state.masterData[type],
              items: state.masterData[type].items.map((item) => ({
                ...item,
                sortOrder: itemIds.indexOf(item.id) + 1,
                updatedAt: new Date().toISOString(),
              })),
            },
          },
        }))
      },

      getActiveItems: (type) => {
        return get()
          .masterData[type].items.filter((item) => item.isActive)
          .sort((a, b) => a.sortOrder - b.sortOrder)
      },

      resetToDefaults: (type) => {
        set((state) => ({
          masterData: {
            ...state.masterData,
            [type]: defaultMasterData[type],
          },
        }))
      },
    }),
    {
      name: 'ghouse-master-data',
    }
  )
)
