'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import type { FundPlanData } from '@/types/fund-plan'
import { AlertTriangle, Info, Building2, Phone } from 'lucide-react'
import { standardSpecifications, specificationNotes, defaultRemarks, companyInfo } from '@/lib/fund-plan/master-data'

interface RemarksSectionProps {
  data: FundPlanData
  onChange: (data: Partial<FundPlanData>) => void
}

export function RemarksSection({ data, onChange }: RemarksSectionProps) {
  return (
    <div className="space-y-4">
      {/* 標準仕様 */}
      <Card>
        <CardHeader className="py-3 px-4">
          <CardTitle className="text-base flex items-center gap-2">
            <Building2 className="w-5 h-5 text-orange-500" />
            標準仕様
          </CardTitle>
        </CardHeader>
        <CardContent className="px-4 pb-4">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {/* 高性能 */}
            <div className="space-y-2">
              <h4 className="text-sm font-semibold text-orange-600 border-b pb-1">高性能</h4>
              <ul className="text-xs text-gray-600 space-y-1">
                {standardSpecifications.highPerformance.map((item, i) => (
                  <li key={i} className="flex items-start gap-1">
                    <span className="text-orange-500 mt-0.5">●</span>
                    {item}
                  </li>
                ))}
              </ul>
            </div>

            {/* 断熱・気密 */}
            <div className="space-y-2">
              <h4 className="text-sm font-semibold text-blue-600 border-b pb-1">断熱・気密</h4>
              <ul className="text-xs text-gray-600 space-y-1">
                {standardSpecifications.insulationAirtight.map((item, i) => (
                  <li key={i} className="flex items-start gap-1">
                    <span className="text-blue-500 mt-0.5">●</span>
                    {item}
                  </li>
                ))}
              </ul>
            </div>

            {/* 耐久性 */}
            <div className="space-y-2">
              <h4 className="text-sm font-semibold text-green-600 border-b pb-1">耐久性</h4>
              <ul className="text-xs text-gray-600 space-y-1">
                {standardSpecifications.durability.map((item, i) => (
                  <li key={i} className="flex items-start gap-1">
                    <span className="text-green-500 mt-0.5">●</span>
                    {item}
                  </li>
                ))}
              </ul>
            </div>

            {/* 技術 */}
            <div className="space-y-2">
              <h4 className="text-sm font-semibold text-purple-600 border-b pb-1">技術</h4>
              <ul className="text-xs text-gray-600 space-y-1">
                {standardSpecifications.technology.map((item, i) => (
                  <li key={i} className="flex items-start gap-1">
                    <span className="text-purple-500 mt-0.5">●</span>
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* 注釈 */}
          <div className="mt-4 pt-4 border-t">
            <div className="text-[10px] text-gray-500 space-y-1">
              {specificationNotes.map((note, i) => (
                <p key={i}>{note}</p>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 注意事項 */}
      <Card className="border-amber-200 bg-amber-50/50">
        <CardHeader className="py-3 px-4">
          <CardTitle className="text-base flex items-center gap-2 text-amber-700">
            <AlertTriangle className="w-5 h-5" />
            重要な注意事項
          </CardTitle>
        </CardHeader>
        <CardContent className="px-4 pb-4">
          <ul className="text-sm text-amber-800 space-y-2">
            {defaultRemarks.map((remark, i) => (
              <li key={i} className="flex items-start gap-2">
                <span className="shrink-0 mt-0.5">•</span>
                {remark}
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>

      {/* 追加備考 */}
      <Card>
        <CardHeader className="py-3 px-4">
          <CardTitle className="text-base flex items-center gap-2">
            <Info className="w-5 h-5 text-gray-500" />
            追加備考
          </CardTitle>
        </CardHeader>
        <CardContent className="px-4 pb-4">
          <div className="space-y-2">
            <Label className="text-xs text-gray-600">
              お客様への備考・特記事項（PDF出力時に表示されます）
            </Label>
            <Textarea
              value={data.remarks}
              onChange={(e) => onChange({ remarks: e.target.value })}
              placeholder="追加でお伝えする事項があれば記載してください..."
              className="min-h-[100px] resize-none"
            />
          </div>
        </CardContent>
      </Card>

      {/* 会社情報 */}
      <Card>
        <CardHeader className="py-3 px-4">
          <CardTitle className="text-base flex items-center gap-2">
            <Phone className="w-5 h-5 text-gray-500" />
            担当者情報
          </CardTitle>
        </CardHeader>
        <CardContent className="px-4 pb-4">
          <div className="grid grid-cols-2 gap-6">
            <div className="space-y-2">
              <h4 className="text-sm font-bold text-gray-900">{companyInfo.name}</h4>
              <p className="text-xs text-gray-600">
                〒{companyInfo.postalCode}<br />
                {companyInfo.address}
              </p>
            </div>
            <div className="space-y-2">
              <div className="flex items-center gap-4 text-sm">
                <span className="text-gray-500">担当者:</span>
                <span className="font-medium">{data.salesRep || '未設定'}</span>
              </div>
              <div className="flex items-center gap-4 text-sm">
                <span className="text-gray-500">連絡先:</span>
                <span className="font-medium">{data.salesRepPhone || '未設定'}</span>
              </div>
              <div className="flex items-center gap-4 text-sm">
                <span className="text-gray-500">所属長:</span>
                <span className="font-medium">{data.managerName || '未設定'}</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
