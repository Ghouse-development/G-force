'use client'

import { CardSelect, QuickSelect, type CardSelectOption } from '@/components/ui/card-select'
import {
  DESIGN_OFFICES,
  IMPORTANT_MATTER_EXPLAINERS,
  SALES_REPS,
  CONSTRUCTION_MANAGERS,
  DEFECT_INSURANCE_COMPANIES,
} from '@/lib/document-flow'
import { Building2, User, Phone, Shield, HardHat } from 'lucide-react'

/**
 * DesignOfficeSelector - 設計事務所選択
 */
interface DesignOfficeSelectorProps {
  value: string
  onChange: (value: string) => void
  compact?: boolean
}

export function DesignOfficeSelector({
  value,
  onChange,
  compact = false,
}: DesignOfficeSelectorProps) {
  const options: CardSelectOption<string>[] = DESIGN_OFFICES.map((office) => ({
    value: office.id,
    label: office.name,
    icon: <Building2 className="w-4 h-4" />,
    recommended: office.id === 'larry-k', // 一番利用頻度が高い設計事務所
  }))

  if (compact) {
    return (
      <QuickSelect
        options={options}
        value={value}
        onChange={onChange}
        label="設計事務所"
      />
    )
  }

  return (
    <CardSelect
      options={options}
      value={value}
      onChange={onChange}
      label="設計事務所"
      description="プラン作成を依頼する設計事務所を選択"
      columns={3}
      compact
    />
  )
}

/**
 * ImportantMatterExplainerSelector - 重要事項説明者選択
 */
interface ImportantMatterExplainerSelectorProps {
  value: string
  onChange: (value: string, details: typeof IMPORTANT_MATTER_EXPLAINERS[number]) => void
}

export function ImportantMatterExplainerSelector({
  value,
  onChange,
}: ImportantMatterExplainerSelectorProps) {
  const options: CardSelectOption<string>[] = IMPORTANT_MATTER_EXPLAINERS.map((person) => ({
    value: person.name,
    label: person.name,
    description: `${person.architectType}建築士 ${person.registrationNumber}`,
    icon: <User className="w-4 h-4" />,
  }))

  const handleChange = (name: string) => {
    const person = IMPORTANT_MATTER_EXPLAINERS.find((p) => p.name === name)
    if (person) {
      onChange(name, person)
    }
  }

  return (
    <CardSelect
      options={options}
      value={value}
      onChange={handleChange}
      label="重要事項説明者"
      description="契約時の重要事項説明者を選択"
      searchable
      searchPlaceholder="名前で検索..."
      initialDisplayCount={6}
      columns={3}
      compact
    />
  )
}

/**
 * SalesRepSelector - 営業担当者選択
 */
interface SalesRepSelectorProps {
  value: string
  onChange: (value: string, phone: string) => void
}

export function SalesRepSelector({
  value,
  onChange,
}: SalesRepSelectorProps) {
  const options: CardSelectOption<string>[] = SALES_REPS.map((rep) => ({
    value: rep.name,
    label: rep.name,
    description: rep.phone,
    icon: <Phone className="w-4 h-4" />,
  }))

  const handleChange = (name: string) => {
    const rep = SALES_REPS.find((r) => r.name === name)
    if (rep) {
      onChange(name, rep.phone)
    }
  }

  return (
    <CardSelect
      options={options}
      value={value}
      onChange={handleChange}
      label="営業担当者"
      columns={3}
      compact
    />
  )
}

/**
 * ConstructionManagerSelector - 工事担当者選択
 */
interface ConstructionManagerSelectorProps {
  value: string
  onChange: (value: string, phone: string) => void
}

export function ConstructionManagerSelector({
  value,
  onChange,
}: ConstructionManagerSelectorProps) {
  const options: CardSelectOption<string>[] = CONSTRUCTION_MANAGERS.map((manager) => ({
    value: manager.name,
    label: manager.name,
    description: manager.phone,
    icon: <HardHat className="w-4 h-4" />,
  }))

  const handleChange = (name: string) => {
    const manager = CONSTRUCTION_MANAGERS.find((m) => m.name === name)
    if (manager) {
      onChange(name, manager.phone)
    }
  }

  return (
    <CardSelect
      options={options}
      value={value}
      onChange={handleChange}
      label="工事担当者"
      columns={3}
      compact
    />
  )
}

/**
 * DefectInsuranceSelector - 瑕疵保険会社選択
 */
interface DefectInsuranceSelectorProps {
  value: string
  onChange: (value: string) => void
}

export function DefectInsuranceSelector({
  value,
  onChange,
}: DefectInsuranceSelectorProps) {
  const options: CardSelectOption<string>[] = DEFECT_INSURANCE_COMPANIES.map((company) => ({
    value: company,
    label: company,
    icon: <Shield className="w-4 h-4" />,
    recommended: company === '株式会社　日本住宅保証検査機構',
  }))

  return (
    <CardSelect
      options={options}
      value={value}
      onChange={onChange}
      label="瑕疵担保責任保険"
      columns={3}
    />
  )
}

/**
 * FireProtectionZoneSelector - 防火地域選択
 */
interface FireProtectionZoneSelectorProps {
  value: '防火地域' | '準防火地域' | '法22条地域' | 'なし'
  onChange: (value: '防火地域' | '準防火地域' | '法22条地域' | 'なし') => void
}

export function FireProtectionZoneSelector({
  value,
  onChange,
}: FireProtectionZoneSelectorProps) {
  const options: CardSelectOption<typeof value>[] = [
    { value: '準防火地域', label: '準防火地域', recommended: true },
    { value: '法22条地域', label: '法22条地域' },
    { value: '防火地域', label: '防火地域' },
    { value: 'なし', label: 'なし' },
  ]

  return (
    <QuickSelect
      options={options}
      value={value}
      onChange={onChange}
      label="防火地域区分"
    />
  )
}

/**
 * FloorCountSelector - 階数選択
 */
interface FloorCountSelectorProps {
  value: 1 | 2 | 3
  onChange: (value: 1 | 2 | 3) => void
}

export function FloorCountSelector({
  value,
  onChange,
}: FloorCountSelectorProps) {
  const options: CardSelectOption<1 | 2 | 3>[] = [
    { value: 2, label: '2階建て', recommended: true },
    { value: 1, label: '平屋' },
    { value: 3, label: '3階建て' },
  ]

  return (
    <QuickSelect
      options={options}
      value={value}
      onChange={onChange}
      label="階数"
    />
  )
}

/**
 * StorageBatteryTypeSelector - 蓄電池タイプ選択
 */
interface StorageBatteryTypeSelectorProps {
  value: 'なし' | '蓄電池' | 'V2H/V2X'
  onChange: (value: 'なし' | '蓄電池' | 'V2H/V2X') => void
}

export function StorageBatteryTypeSelector({
  value,
  onChange,
}: StorageBatteryTypeSelectorProps) {
  const options: CardSelectOption<typeof value>[] = [
    { value: 'なし', label: 'なし' },
    { value: '蓄電池', label: '蓄電池', recommended: true },
    { value: 'V2H/V2X', label: 'V2H/V2X', description: '電気自動車連携' },
  ]

  return (
    <QuickSelect
      options={options}
      value={value}
      onChange={onChange}
      label="蓄電池"
    />
  )
}

/**
 * OwnershipTypeSelector - 所有権タイプ選択
 */
interface OwnershipTypeSelectorProps {
  value: '単独' | '共有' | ''
  onChange: (value: '単独' | '共有') => void
}

export function OwnershipTypeSelector({
  value,
  onChange,
}: OwnershipTypeSelectorProps) {
  const options: CardSelectOption<'単独' | '共有'>[] = [
    { value: '単独', label: '単独', description: '1名での所有' },
    { value: '共有', label: '共有', description: '複数名での共有' },
  ]

  return (
    <QuickSelect
      options={options}
      value={value as '単独' | '共有'}
      onChange={onChange}
      label="所有形態"
    />
  )
}
