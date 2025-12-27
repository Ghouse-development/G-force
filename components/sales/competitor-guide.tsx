'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible'
import {
  Target,
  Shield,
  Award,
  ChevronDown,
  ChevronRight,
  MessageSquare,
  Copy,
  Check,
  Search,
  Building2,
  Home,
  DollarSign,
  ThumbsUp,
} from 'lucide-react'
import { toast } from 'sonner'

// 競合他社データ
interface Competitor {
  id: string
  name: string
  category: 'major' | 'local' | 'lowcost'
  strengths: string[]
  weaknesses: string[]
  commonObjections: ObjectionRebuttal[]
}

// 反論スクリプト
interface ObjectionRebuttal {
  objection: string
  rebuttal: string
  keyPoints: string[]
}

// 自社の強み
interface OurStrength {
  id: string
  category: 'structure' | 'spec' | 'service' | 'price'
  title: string
  description: string
  talkScript: string
  whenToUse: string[]
}

// 競合他社データ
const competitors: Competitor[] = [
  {
    id: 'sekisui',
    name: '積水ハウス',
    category: 'major',
    strengths: ['ブランド力', '大規模施工実績', 'アフターサービス網'],
    weaknesses: ['価格が高い', '規格化されたプラン', '担当者の異動が多い'],
    commonObjections: [
      {
        objection: '積水さんの方が安心感がある',
        rebuttal: '確かに大手の安心感はありますね。ただ、当社はパナソニックテクノストラクチャー工法を採用しており、構造計算書付きで耐震等級3を保証しています。大手さんと同等以上の品質を、より柔軟な設計とお求めやすい価格でご提供できます。',
        keyPoints: ['構造計算書付き', '耐震等級3保証', '柔軟な設計対応'],
      },
      {
        objection: '積水さんは保証がしっかりしている',
        rebuttal: '当社も長期保証制度を完備しています。定期点検も実施しており、地域密着だからこそ迅速な対応が可能です。実際に、オーナー様からは「何かあってもすぐ来てくれる」と喜ばれています。',
        keyPoints: ['長期保証制度', '定期点検実施', '迅速な対応'],
      },
    ],
  },
  {
    id: 'daiwa',
    name: 'ダイワハウス',
    category: 'major',
    strengths: ['xevoシリーズのブランド', '断熱性能', '大型施設実績'],
    weaknesses: ['坪単価が高い', '標準仕様が限定的', '商談が長期化しやすい'],
    commonObjections: [
      {
        objection: 'ダイワさんは断熱性能が良い',
        rebuttal: '当社の標準仕様も高断熱仕様です。UA値で〇〇を確保しており、ダイワさんと同等以上の性能があります。しかも追加費用なしの標準仕様ですので、コストパフォーマンスでは当社が上回ります。',
        keyPoints: ['高断熱標準仕様', '追加費用なし', 'コスパ優位'],
      },
    ],
  },
  {
    id: 'lowcost',
    name: 'ローコスト住宅',
    category: 'lowcost',
    strengths: ['価格の安さ', 'シンプルなプラン', '短工期'],
    weaknesses: ['標準仕様が最低限', '追加費用が多い', 'アフターが弱い'],
    commonObjections: [
      {
        objection: '〇〇ホームの方が安い',
        rebuttal: 'お見積りの内容を詳しく見ていただきたいのですが、当社は標準仕様に多くの設備が含まれています。ローコストメーカーさんは追加オプションが多く、最終的な金額は当社と同程度になることが多いです。さらに当社は構造計算書付きで耐震性能を保証しています。',
        keyPoints: ['標準仕様の充実', 'オプション不要', '構造計算書付き'],
      },
      {
        objection: '予算がどうしても厳しい',
        rebuttal: '資金計画を一緒に見直しませんか？建物価格だけでなく、光熱費や将来のメンテナンス費用も含めた生涯コストで考えると、高断熱・高耐久の家の方がお得になることが多いです。',
        keyPoints: ['生涯コスト', '光熱費削減', 'メンテナンス費用'],
      },
    ],
  },
]

// 自社の強み
const ourStrengths: OurStrength[] = [
  {
    id: 'techno',
    category: 'structure',
    title: 'テクノストラクチャー工法',
    description: 'パナソニック開発の鉄と木のハイブリッド工法。全棟構造計算で安心の耐震性能。',
    talkScript: '当社はパナソニックのテクノストラクチャー工法を採用しています。これは木造住宅の弱点である梁を鉄で補強するハイブリッド工法で、全棟で388項目の構造計算を実施しています。耐震等級3を標準でお約束できるのは、この工法だからこそです。',
    whenToUse: ['耐震性を気にしている', '大手と比較している', '工法について質問された'],
  },
  {
    id: 'standard',
    category: 'spec',
    title: '充実の標準仕様',
    description: '食洗機、浴室乾燥機、玄関スマートキーなど、通常オプションが標準装備。',
    talkScript: '当社の標準仕様には、食洗機、浴室乾燥機、玄関スマートキー、宅配ボックスなど、他社さんではオプションになるものが含まれています。後から「やっぱり欲しい」となって追加費用がかかる心配がありません。',
    whenToUse: ['価格を気にしている', 'オプションについて質問された', '他社見積りと比較している'],
  },
  {
    id: 'local',
    category: 'service',
    title: '地域密着サービス',
    description: '地元企業だからこそできる迅速対応。お引渡し後も安心のサポート体制。',
    talkScript: '大手さんと違い、私たちは地元に根ざした会社です。何かあったときに「すぐ来てくれる」「顔の見える関係」を大切にしています。実際にオーナー様からのご紹介が多いのは、お引渡し後のお付き合いを大切にしているからです。',
    whenToUse: ['アフターサービスを気にしている', '大手の安心感と比較された', 'オーナー紹介の話になった'],
  },
  {
    id: 'design',
    category: 'spec',
    title: '自由設計',
    description: '規格にとらわれない、お客様だけの間取りをご提案。',
    talkScript: 'ハウスメーカーさんでは規格化されたプランから選ぶことが多いですが、当社は完全自由設計です。お客様のライフスタイルに合わせた、世界に一つだけの間取りをご一緒に作り上げていきます。',
    whenToUse: ['間取りにこだわりがある', '規格住宅と比較している', '特殊な要望がある'],
  },
]

// カテゴリの設定
const categoryConfig = {
  major: { label: '大手ハウスメーカー', color: 'bg-blue-100 text-blue-700' },
  local: { label: '地場工務店', color: 'bg-green-100 text-green-700' },
  lowcost: { label: 'ローコスト住宅', color: 'bg-amber-100 text-amber-700' },
}

const strengthCategoryConfig = {
  structure: { label: '構造', icon: <Shield className="w-4 h-4" />, color: 'text-blue-600' },
  spec: { label: '仕様', icon: <Home className="w-4 h-4" />, color: 'text-purple-600' },
  service: { label: 'サービス', icon: <ThumbsUp className="w-4 h-4" />, color: 'text-green-600' },
  price: { label: '価格', icon: <DollarSign className="w-4 h-4" />, color: 'text-amber-600' },
}

export function CompetitorGuide() {
  const [searchTerm, setSearchTerm] = useState('')
  const [openCompetitors, setOpenCompetitors] = useState<string[]>([])
  const [openStrengths, setOpenStrengths] = useState<string[]>(['techno'])
  const [copiedId, setCopiedId] = useState<string | null>(null)

  const filteredCompetitors = competitors.filter(c =>
    c.name.includes(searchTerm) ||
    c.commonObjections.some(o => o.objection.includes(searchTerm) || o.rebuttal.includes(searchTerm))
  )

  const toggleCompetitor = (id: string) => {
    setOpenCompetitors(prev =>
      prev.includes(id) ? prev.filter(c => c !== id) : [...prev, id]
    )
  }

  const toggleStrength = (id: string) => {
    setOpenStrengths(prev =>
      prev.includes(id) ? prev.filter(s => s !== id) : [...prev, id]
    )
  }

  const copyToClipboard = async (text: string, id: string) => {
    try {
      await navigator.clipboard.writeText(text)
      setCopiedId(id)
      toast.success('コピーしました')
      setTimeout(() => setCopiedId(null), 2000)
    } catch {
      toast.error('コピーに失敗しました')
    }
  }

  return (
    <div className="space-y-6">
      {/* 検索 */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
        <Input
          placeholder="競合名やキーワードで検索..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-10"
        />
      </div>

      {/* 自社の強み */}
      <Card className="border-0 shadow-lg">
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2 text-lg">
            <Award className="w-5 h-5 text-orange-500" />
            当社の強み・トークスクリプト
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {ourStrengths.map((strength) => {
            const config = strengthCategoryConfig[strength.category]
            const isOpen = openStrengths.includes(strength.id)

            return (
              <Collapsible
                key={strength.id}
                open={isOpen}
                onOpenChange={() => toggleStrength(strength.id)}
              >
                <CollapsibleTrigger className="w-full">
                  <div className="flex items-center justify-between p-3 bg-orange-50 rounded-lg hover:bg-orange-100 transition-colors">
                    <div className="flex items-center gap-3">
                      <div className={config.color}>{config.icon}</div>
                      <div className="text-left">
                        <p className="font-medium text-gray-900">{strength.title}</p>
                        <p className="text-xs text-gray-500">{strength.description}</p>
                      </div>
                    </div>
                    {isOpen ? (
                      <ChevronDown className="w-4 h-4 text-gray-400" />
                    ) : (
                      <ChevronRight className="w-4 h-4 text-gray-400" />
                    )}
                  </div>
                </CollapsibleTrigger>
                <CollapsibleContent>
                  <div className="p-4 bg-gray-50 rounded-b-lg -mt-1 space-y-3">
                    {/* トークスクリプト */}
                    <div className="bg-white p-3 rounded-lg border border-orange-200">
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1">
                          <p className="text-xs text-gray-500 mb-1 flex items-center gap-1">
                            <MessageSquare className="w-3 h-3" />
                            トークスクリプト
                          </p>
                          <p className="text-sm text-gray-700 leading-relaxed">
                            {strength.talkScript}
                          </p>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="shrink-0"
                          onClick={() => copyToClipboard(strength.talkScript, strength.id)}
                        >
                          {copiedId === strength.id ? (
                            <Check className="w-4 h-4 text-green-500" />
                          ) : (
                            <Copy className="w-4 h-4" />
                          )}
                        </Button>
                      </div>
                    </div>

                    {/* 使うタイミング */}
                    <div>
                      <p className="text-xs text-gray-500 mb-1.5">こんな時に使う</p>
                      <div className="flex flex-wrap gap-1">
                        {strength.whenToUse.map((when, i) => (
                          <Badge key={i} variant="secondary" className="text-xs">
                            {when}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  </div>
                </CollapsibleContent>
              </Collapsible>
            )
          })}
        </CardContent>
      </Card>

      {/* 競合対策 */}
      <Card className="border-0 shadow-lg">
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2 text-lg">
            <Target className="w-5 h-5 text-red-500" />
            競合対策ガイド
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {filteredCompetitors.length === 0 ? (
            <p className="text-sm text-gray-400 text-center py-4">
              該当する競合が見つかりません
            </p>
          ) : (
            filteredCompetitors.map((competitor) => {
              const config = categoryConfig[competitor.category]
              const isOpen = openCompetitors.includes(competitor.id)

              return (
                <Collapsible
                  key={competitor.id}
                  open={isOpen}
                  onOpenChange={() => toggleCompetitor(competitor.id)}
                >
                  <CollapsibleTrigger className="w-full">
                    <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                      <div className="flex items-center gap-3">
                        <Building2 className="w-5 h-5 text-gray-400" />
                        <div className="text-left">
                          <p className="font-medium text-gray-900">{competitor.name}</p>
                          <Badge className={`${config.color} text-[10px]`}>
                            {config.label}
                          </Badge>
                        </div>
                      </div>
                      {isOpen ? (
                        <ChevronDown className="w-4 h-4 text-gray-400" />
                      ) : (
                        <ChevronRight className="w-4 h-4 text-gray-400" />
                      )}
                    </div>
                  </CollapsibleTrigger>
                  <CollapsibleContent>
                    <div className="p-4 bg-gray-50 rounded-b-lg -mt-1 space-y-4">
                      {/* 強み・弱み */}
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <p className="text-xs text-gray-500 mb-1.5">競合の強み</p>
                          <ul className="space-y-1">
                            {competitor.strengths.map((s, i) => (
                              <li key={i} className="text-xs text-gray-600 flex items-center gap-1">
                                <span className="text-amber-500">+</span> {s}
                              </li>
                            ))}
                          </ul>
                        </div>
                        <div>
                          <p className="text-xs text-gray-500 mb-1.5">競合の弱み</p>
                          <ul className="space-y-1">
                            {competitor.weaknesses.map((w, i) => (
                              <li key={i} className="text-xs text-gray-600 flex items-center gap-1">
                                <span className="text-red-500">-</span> {w}
                              </li>
                            ))}
                          </ul>
                        </div>
                      </div>

                      {/* 反論スクリプト */}
                      <div className="space-y-3">
                        <p className="text-xs text-gray-500 font-medium">よくある反論への対応</p>
                        {competitor.commonObjections.map((objection, i) => (
                          <div key={i} className="bg-white p-3 rounded-lg border">
                            {/* 反論 */}
                            <div className="flex items-start gap-2 mb-2">
                              <Badge variant="destructive" className="shrink-0 text-[10px]">
                                お客様
                              </Badge>
                              <p className="text-sm text-gray-700">「{objection.objection}」</p>
                            </div>
                            {/* 切り返し */}
                            <div className="flex items-start gap-2">
                              <Badge className="shrink-0 text-[10px] bg-green-100 text-green-700">
                                切り返し
                              </Badge>
                              <div className="flex-1">
                                <p className="text-sm text-gray-700 leading-relaxed">
                                  {objection.rebuttal}
                                </p>
                                <div className="flex flex-wrap gap-1 mt-2">
                                  {objection.keyPoints.map((point, j) => (
                                    <Badge key={j} variant="outline" className="text-[10px]">
                                      {point}
                                    </Badge>
                                  ))}
                                </div>
                              </div>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="shrink-0"
                                onClick={() => copyToClipboard(objection.rebuttal, `${competitor.id}-${i}`)}
                              >
                                {copiedId === `${competitor.id}-${i}` ? (
                                  <Check className="w-4 h-4 text-green-500" />
                                ) : (
                                  <Copy className="w-4 h-4" />
                                )}
                              </Button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </CollapsibleContent>
                </Collapsible>
              )
            })
          )}
        </CardContent>
      </Card>
    </div>
  )
}
