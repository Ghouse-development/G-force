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
  BookOpen,
  ChevronDown,
  ChevronRight,
  Copy,
  Check,
  Search,
  Phone,
  Users,
  Handshake,
  AlertCircle,
  Star,
} from 'lucide-react'
import { toast } from 'sonner'

// スクリプトカテゴリ
type ScriptCategory = 'initial' | 'hearing' | 'proposal' | 'objection' | 'closing'

interface TalkScript {
  id: string
  category: ScriptCategory
  situation: string
  script: string
  tips: string[]
  tags: string[]
}

// スクリプトカテゴリ設定
const categoryConfig: Record<ScriptCategory, {
  label: string
  icon: React.ReactNode
  color: string
  bgColor: string
}> = {
  initial: {
    label: '初回アプローチ',
    icon: <Phone className="w-4 h-4" />,
    color: 'text-blue-600',
    bgColor: 'bg-blue-50',
  },
  hearing: {
    label: 'ヒアリング',
    icon: <Users className="w-4 h-4" />,
    color: 'text-purple-600',
    bgColor: 'bg-purple-50',
  },
  proposal: {
    label: '提案',
    icon: <Star className="w-4 h-4" />,
    color: 'text-amber-600',
    bgColor: 'bg-amber-50',
  },
  objection: {
    label: '反論対応',
    icon: <AlertCircle className="w-4 h-4" />,
    color: 'text-red-600',
    bgColor: 'bg-red-50',
  },
  closing: {
    label: 'クロージング',
    icon: <Handshake className="w-4 h-4" />,
    color: 'text-green-600',
    bgColor: 'bg-green-50',
  },
}

// サンプルスクリプトデータ
const scripts: TalkScript[] = [
  // 初回アプローチ
  {
    id: 'initial-1',
    category: 'initial',
    situation: '資料請求後の初回電話',
    script: `お忙しいところ恐れ入ります。〇〇ホームの△△と申します。
先日は資料をご請求いただきありがとうございました。お手元に届きましたでしょうか？

ご覧いただけましたか？何かご不明な点はございませんでしたか？

よろしければ、お住まいづくりのイメージをお聞かせいただければと思うのですが、今週末の土曜日か日曜日、お時間いただけますでしょうか？`,
    tips: [
      '最初の30秒で要件を伝える',
      '相手の反応を確認しながら話す',
      '具体的な日時を提案する',
    ],
    tags: ['資料請求', '電話フォロー', 'アポ取り'],
  },
  {
    id: 'initial-2',
    category: 'initial',
    situation: '見学会後のお礼電話',
    script: `〇〇ホームの△△です。先日はモデルハウス見学会にお越しいただきありがとうございました。

ご覧になっていかがでしたか？特に気になった点やご質問などございましたでしょうか？

実は今度、△△エリアで完成見学会を予定しておりまして、実際にお住まいになる方の間取りをご覧いただけます。ぜひご案内させていただきたいのですが、いかがでしょうか？`,
    tips: [
      '見学会の感想を聞く',
      '次のステップへつなげる',
      '具体的な提案をする',
    ],
    tags: ['見学会', 'フォロー', '次回アポ'],
  },
  // ヒアリング
  {
    id: 'hearing-1',
    category: 'hearing',
    situation: '建築動機のヒアリング',
    script: `差し支えなければ教えていただきたいのですが、なぜ今、お住まいを建てようとお考えになったのでしょうか？

（お子さまのこと、通勤のこと、老後のことなど回答に応じて）

なるほど、〇〇なのですね。ご家族皆さまにとって大切なお住まいですから、その点はしっかり考えていきたいですね。`,
    tips: [
      '「なぜ」を深掘りする',
      '共感を示す',
      'メモを取りながら聞く',
    ],
    tags: ['動機', '初回面談', '深掘り'],
  },
  {
    id: 'hearing-2',
    category: 'hearing',
    situation: '予算感のヒアリング',
    script: `お住まいのご予算について、大まかなイメージはお持ちでしょうか？

（回答に応じて）

ありがとうございます。建物だけでなく、土地、諸費用、外構なども含めてトータルでお考えになる必要がありますので、一度資金計画を一緒に作成させていただければと思います。

住宅ローンの事前審査も無料でお手伝いできますので、ご安心ください。`,
    tips: [
      'いきなり金額を聞かない',
      'トータルコストを説明',
      '資金計画提案につなげる',
    ],
    tags: ['予算', '資金計画', 'ローン'],
  },
  // 提案
  {
    id: 'proposal-1',
    category: 'proposal',
    situation: 'テクノストラクチャーの説明',
    script: `当社の家づくりの特徴をご説明させてください。

当社はパナソニックの「テクノストラクチャー」という工法を採用しています。これは木造住宅の梁を鉄で補強するハイブリッド工法です。

一般的な木造住宅では、構造計算をしない場合が多いのですが、テクノストラクチャーでは全棟で388項目の構造計算を実施しています。

だからこそ、耐震等級3を標準でお約束できるんです。大きな地震が来ても、ご家族の命と暮らしを守れる家をお届けしたいと考えています。`,
    tips: [
      '専門用語を噛み砕いて説明',
      '数字で具体的に',
      '安心感を与える',
    ],
    tags: ['テクノ', '構造', '耐震'],
  },
  {
    id: 'proposal-2',
    category: 'proposal',
    situation: '標準仕様の説明',
    script: `当社の標準仕様をご紹介させてください。

他社さんではオプションになることが多い設備も、当社では標準でご用意しています。例えば、食洗機、浴室乾燥機、玄関スマートキー、さらに宅配ボックスも標準です。

後から「やっぱり欲しい」となって追加費用がかかる心配がありません。最初から安心してお選びいただけます。`,
    tips: [
      '具体的な設備を列挙',
      '他社との差別化',
      'コスパの良さをアピール',
    ],
    tags: ['標準仕様', '設備', 'コスパ'],
  },
  // 反論対応
  {
    id: 'objection-1',
    category: 'objection',
    situation: '「高い」と言われた時',
    script: `ご予算のことを心配されるのは当然のことですね。

ただ、当社の価格には他社さんでオプションになる設備が標準で含まれています。一度、同じ条件で比較していただければと思います。

また、高断熱仕様なので光熱費が抑えられますし、長期優良住宅なので税制優遇も受けられます。建てた後の生涯コストで考えると、実はお得になることが多いんです。`,
    tips: [
      '否定しない',
      '標準仕様の価値を説明',
      '生涯コストで考える',
    ],
    tags: ['価格', '反論', 'コスト'],
  },
  {
    id: 'objection-2',
    category: 'objection',
    situation: '「他社と比較したい」と言われた時',
    script: `もちろんです。一生に一度の大きなお買い物ですから、じっくり比較検討されるのが当然ですよね。

よろしければ、比較される際のポイントをお伝えしてもよろしいでしょうか？

まず構造計算の有無、次に標準仕様の内容、そしてアフターサービスの体制。この3点を確認されることをおすすめします。

何かご不明な点があれば、いつでもご連絡ください。`,
    tips: [
      '比較を歓迎する',
      '比較ポイントを提示',
      '自社の強みを意識させる',
    ],
    tags: ['競合', '比較', 'アドバイス'],
  },
  // クロージング
  {
    id: 'closing-1',
    category: 'closing',
    situation: '契約への誘導',
    script: `これまでお打ち合わせを重ねてきましたが、〇〇様のご要望をしっかり反映したプランになっていると思います。

いかがでしょうか、このプランで進めさせていただいてよろしいでしょうか？

（前向きな反応の場合）
ありがとうございます。では、ご契約のお手続きに進ませていただきますね。いつ頃がご都合よろしいでしょうか？`,
    tips: [
      '直接的に聞く',
      '具体的な日程を提案',
      '迷いを見せない',
    ],
    tags: ['契約', 'クロージング', '決断'],
  },
  {
    id: 'closing-2',
    category: 'closing',
    situation: '決断を迷っている時',
    script: `〇〇様、何かまだ気になる点やご不安なことはございますか？

（回答に応じて対応）

ご決断されるのに必要な情報は、すべてお伝えできたでしょうか？

実は、今月中にご契約いただければ、〇〇の特典をご用意できます。これは今だけの限定です。

ぜひこの機会にご決断いただければと思いますが、いかがでしょうか？`,
    tips: [
      '不安要素を確認',
      '期限を設ける',
      '背中を押す',
    ],
    tags: ['迷い', '期限', '特典'],
  },
]

export function TalkScripts() {
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedCategory, setSelectedCategory] = useState<ScriptCategory | 'all'>('all')
  const [openScripts, setOpenScripts] = useState<string[]>(['initial-1'])
  const [copiedId, setCopiedId] = useState<string | null>(null)

  const filteredScripts = scripts.filter(s => {
    const matchesSearch = searchTerm === '' ||
      s.situation.includes(searchTerm) ||
      s.script.includes(searchTerm) ||
      s.tags.some(t => t.includes(searchTerm))
    const matchesCategory = selectedCategory === 'all' || s.category === selectedCategory
    return matchesSearch && matchesCategory
  })

  const toggleScript = (id: string) => {
    setOpenScripts(prev =>
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
      {/* 検索・フィルタ */}
      <div className="space-y-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <Input
            placeholder="キーワードで検索..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>

        <div className="flex gap-2 flex-wrap">
          <Button
            variant={selectedCategory === 'all' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setSelectedCategory('all')}
          >
            すべて
          </Button>
          {(Object.keys(categoryConfig) as ScriptCategory[]).map((cat) => {
            const config = categoryConfig[cat]
            return (
              <Button
                key={cat}
                variant={selectedCategory === cat ? 'default' : 'outline'}
                size="sm"
                onClick={() => setSelectedCategory(cat)}
                className="gap-1"
              >
                {config.icon}
                {config.label}
              </Button>
            )
          })}
        </div>
      </div>

      {/* スクリプト一覧 */}
      <Card className="border-0 shadow-lg">
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2 text-lg">
            <BookOpen className="w-5 h-5 text-blue-600" />
            トークスクリプト集
            <Badge variant="secondary">{filteredScripts.length}件</Badge>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {filteredScripts.length === 0 ? (
            <p className="text-sm text-gray-400 text-center py-8">
              該当するスクリプトがありません
            </p>
          ) : (
            filteredScripts.map((script) => {
              const config = categoryConfig[script.category]
              const isOpen = openScripts.includes(script.id)

              return (
                <Collapsible
                  key={script.id}
                  open={isOpen}
                  onOpenChange={() => toggleScript(script.id)}
                >
                  <CollapsibleTrigger className="w-full">
                    <div className={`flex items-center justify-between p-3 rounded-lg ${config.bgColor} hover:shadow-md transition-all`}>
                      <div className="flex items-center gap-3">
                        <div className={config.color}>{config.icon}</div>
                        <div className="text-left">
                          <p className="font-medium text-gray-900">{script.situation}</p>
                          <div className="flex items-center gap-1 mt-1">
                            <Badge className={`${config.bgColor} ${config.color} border-0 text-[10px]`}>
                              {config.label}
                            </Badge>
                            {script.tags.slice(0, 2).map((tag, i) => (
                              <Badge key={i} variant="outline" className="text-[10px]">
                                {tag}
                              </Badge>
                            ))}
                          </div>
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
                    <div className="p-4 bg-white rounded-b-lg border border-t-0 border-gray-100 space-y-4">
                      {/* スクリプト本文 */}
                      <div className="relative">
                        <pre className="text-sm text-gray-700 whitespace-pre-wrap leading-relaxed bg-gray-50 p-4 rounded-lg font-sans">
                          {script.script}
                        </pre>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="absolute top-2 right-2"
                          onClick={() => copyToClipboard(script.script, script.id)}
                        >
                          {copiedId === script.id ? (
                            <Check className="w-4 h-4 text-green-500" />
                          ) : (
                            <Copy className="w-4 h-4" />
                          )}
                        </Button>
                      </div>

                      {/* ポイント */}
                      <div>
                        <p className="text-xs text-gray-500 mb-2 font-medium">ポイント</p>
                        <ul className="space-y-1">
                          {script.tips.map((tip, i) => (
                            <li key={i} className="text-sm text-gray-600 flex items-start gap-2">
                              <span className="text-amber-500 mt-1">•</span>
                              {tip}
                            </li>
                          ))}
                        </ul>
                      </div>

                      {/* タグ */}
                      <div className="flex flex-wrap gap-1">
                        {script.tags.map((tag, i) => (
                          <Badge
                            key={i}
                            variant="secondary"
                            className="text-xs cursor-pointer hover:bg-gray-200"
                            onClick={() => setSearchTerm(tag)}
                          >
                            #{tag}
                          </Badge>
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
