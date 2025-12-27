'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible'
import {
  Lightbulb,
  ChevronDown,
  ChevronRight,
  Search,
  Target,
  Brain,
  Clock,
  Heart,
  Sparkles,
  AlertTriangle,
} from 'lucide-react'

// Tips カテゴリ
type TipsCategory = 'mindset' | 'technique' | 'timing' | 'relationship' | 'caution'

interface SalesTip {
  id: string
  category: TipsCategory
  title: string
  content: string
  example?: string
  tags: string[]
}

// カテゴリ設定
const categoryConfig: Record<TipsCategory, {
  label: string
  icon: React.ReactNode
  color: string
  bgColor: string
}> = {
  mindset: {
    label: 'マインドセット',
    icon: <Brain className="w-4 h-4" />,
    color: 'text-purple-600',
    bgColor: 'bg-purple-50',
  },
  technique: {
    label: 'テクニック',
    icon: <Target className="w-4 h-4" />,
    color: 'text-blue-600',
    bgColor: 'bg-blue-50',
  },
  timing: {
    label: 'タイミング',
    icon: <Clock className="w-4 h-4" />,
    color: 'text-green-600',
    bgColor: 'bg-green-50',
  },
  relationship: {
    label: '信頼関係',
    icon: <Heart className="w-4 h-4" />,
    color: 'text-red-600',
    bgColor: 'bg-red-50',
  },
  caution: {
    label: '注意点',
    icon: <AlertTriangle className="w-4 h-4" />,
    color: 'text-amber-600',
    bgColor: 'bg-amber-50',
  },
}

// サンプルTipsデータ
const tips: SalesTip[] = [
  // マインドセット
  {
    id: 'mindset-1',
    category: 'mindset',
    title: '「売る」ではなく「お役に立つ」',
    content: '住宅営業は「売る」仕事ではなく、お客様の理想の暮らしを実現するお手伝いです。売り込みを意識すると、お客様は防衛本能が働きます。「この人は私のことを考えてくれている」と感じてもらうことが大切です。',
    example: '「今日は何かお売りしようと思って来たわけではありません。まずはお話を聞かせてください」',
    tags: ['初回面談', '心構え'],
  },
  {
    id: 'mindset-2',
    category: 'mindset',
    title: '断られてからが始まり',
    content: '「検討します」「他社も見ています」は断りではありません。むしろ、本当に家を建てたいと思っている証拠です。諦めずに価値を伝え続けましょう。',
    example: 'トップセールスは平均5回以上のフォローを行っています。1〜2回で諦めないこと。',
    tags: ['フォロー', 'モチベーション'],
  },
  {
    id: 'mindset-3',
    category: 'mindset',
    title: '競合は敵ではない',
    content: '競合他社の悪口を言うのはNGです。お客様は比較検討をしたいだけ。他社の良い点を認めつつ、自社の強みを伝えましょう。',
    example: '「〇〇さんも素晴らしい会社ですね。その上で、当社の強みをお伝えさせてください」',
    tags: ['競合', '差別化'],
  },
  // テクニック
  {
    id: 'technique-1',
    category: 'technique',
    title: '質問の順番を意識する',
    content: 'ヒアリングは「Why → What → How」の順番で。まず動機（なぜ建てたいか）、次に要望（何が欲しいか）、最後に条件（どうやって実現するか）を聞きます。',
    example: '「なぜ今、家を建てようと思われたのですか？」からスタート',
    tags: ['ヒアリング', '質問'],
  },
  {
    id: 'technique-2',
    category: 'technique',
    title: 'オウム返しで共感を示す',
    content: 'お客様の言葉をそのまま繰り返すことで、「聞いてもらえている」という安心感を与えられます。',
    example: 'お客様「子供部屋は2つ欲しいんです」→「お子様のお部屋を2つですね。それは大切ですよね」',
    tags: ['ヒアリング', '共感'],
  },
  {
    id: 'technique-3',
    category: 'technique',
    title: '数字は具体的に',
    content: '「安い」「お得」より、具体的な数字で伝えた方が説得力があります。',
    example: '「月々8.5万円で夢のマイホームが持てます」「光熱費が年間18万円お得になります」',
    tags: ['提案', '説得'],
  },
  {
    id: 'technique-4',
    category: 'technique',
    title: 'クロージングは選択肢を与える',
    content: '「契約しますか？」とYes/Noを迫るより、「AとBどちらがいいですか？」と選択肢を与える方が決断しやすくなります。',
    example: '「土曜日と日曜日、どちらのご来店がよろしいですか？」',
    tags: ['クロージング', '決断'],
  },
  // タイミング
  {
    id: 'timing-1',
    category: 'timing',
    title: '電話のゴールデンタイム',
    content: '電話が繋がりやすい時間帯を意識しましょう。平日は12:00〜13:00（昼休み）と18:00〜20:00、土日は10:00〜12:00がおすすめです。',
    tags: ['電話', 'フォロー'],
  },
  {
    id: 'timing-2',
    category: 'timing',
    title: 'フォローは72時間以内',
    content: '見学会やイベントの後は、72時間以内にフォローすることが重要。時間が経つほど記憶が薄れ、感動も冷めてしまいます。',
    example: '理想は翌日の電話。「昨日はありがとうございました。いかがでしたか？」',
    tags: ['フォロー', 'スピード'],
  },
  {
    id: 'timing-3',
    category: 'timing',
    title: '契約のベストタイミング',
    content: 'お客様の気持ちが最も高まっているのは、プラン提出直後です。「これが私たちの家なんだ」という感動があるうちにクロージングを。',
    tags: ['クロージング', 'プラン'],
  },
  // 信頼関係
  {
    id: 'relationship-1',
    category: 'relationship',
    title: '名前を呼ぶ',
    content: '会話の中でお客様の名前を呼ぶことで、親近感と信頼感が生まれます。ただし、使いすぎは逆効果。',
    example: '「〇〇様のお子様は、何歳でいらっしゃいますか？」',
    tags: ['面談', 'コミュニケーション'],
  },
  {
    id: 'relationship-2',
    category: 'relationship',
    title: '約束は必ず守る',
    content: '「明日資料を送ります」と言ったら必ず明日送る。小さな約束を守り続けることで、大きな信頼が生まれます。',
    tags: ['信頼', '基本'],
  },
  {
    id: 'relationship-3',
    category: 'relationship',
    title: 'お子様の名前を覚える',
    content: 'ご家族の名前、特にお子様の名前を覚えて次回の会話で使うと、「この人は私たちのことをちゃんと見てくれている」と感じてもらえます。',
    tags: ['信頼', '気配り'],
  },
  // 注意点
  {
    id: 'caution-1',
    category: 'caution',
    title: '専門用語を使わない',
    content: 'UA値、C値、耐震等級...業界では当たり前でも、お客様には伝わりません。噛み砕いた言葉で説明しましょう。',
    example: '「断熱性能が高い」→「冬でもエアコン1台で家中暖かいです」',
    tags: ['説明', '言葉遣い'],
  },
  {
    id: 'caution-2',
    category: 'caution',
    title: '予算オーバーの提案は禁物',
    content: 'お客様の予算を無視した提案は信頼を失います。まず予算内で最大限の価値を提供し、その後オプションを提案しましょう。',
    tags: ['提案', '予算'],
  },
  {
    id: 'caution-3',
    category: 'caution',
    title: '返答に困ったら正直に',
    content: '知らないことを知ったかぶりするのは危険です。「確認してお伝えします」と正直に言いましょう。',
    example: '「申し訳ございません、その点は確認して明日までにご連絡いたします」',
    tags: ['誠実', '対応'],
  },
]

export function SalesTips() {
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedCategory, setSelectedCategory] = useState<TipsCategory | 'all'>('all')
  const [openTips, setOpenTips] = useState<string[]>(['mindset-1'])

  const filteredTips = tips.filter(t => {
    const matchesSearch = searchTerm === '' ||
      t.title.includes(searchTerm) ||
      t.content.includes(searchTerm) ||
      t.tags.some(tag => tag.includes(searchTerm))
    const matchesCategory = selectedCategory === 'all' || t.category === selectedCategory
    return matchesSearch && matchesCategory
  })

  const toggleTip = (id: string) => {
    setOpenTips(prev =>
      prev.includes(id) ? prev.filter(t => t !== id) : [...prev, id]
    )
  }

  return (
    <div className="space-y-6">
      {/* 検索 */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
        <Input
          placeholder="キーワードで検索..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-10"
        />
      </div>

      {/* カテゴリフィルタ */}
      <div className="flex gap-2 flex-wrap">
        <button
          onClick={() => setSelectedCategory('all')}
          className={`px-3 py-1.5 rounded-full text-sm transition-all ${
            selectedCategory === 'all'
              ? 'bg-gray-900 text-white'
              : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
          }`}
        >
          すべて
        </button>
        {(Object.keys(categoryConfig) as TipsCategory[]).map((cat) => {
          const config = categoryConfig[cat]
          return (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`flex items-center gap-1 px-3 py-1.5 rounded-full text-sm transition-all ${
                selectedCategory === cat
                  ? `${config.bgColor} ${config.color} ring-2 ring-offset-1 ring-gray-300`
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              {config.icon}
              {config.label}
            </button>
          )
        })}
      </div>

      {/* Tips一覧 */}
      <Card className="border-0 shadow-lg">
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2 text-lg">
            <Lightbulb className="w-5 h-5 text-amber-500" />
            営業Tips集
            <Badge variant="secondary">{filteredTips.length}件</Badge>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {filteredTips.length === 0 ? (
            <p className="text-sm text-gray-400 text-center py-8">
              該当するTipsがありません
            </p>
          ) : (
            filteredTips.map((tip) => {
              const config = categoryConfig[tip.category]
              const isOpen = openTips.includes(tip.id)

              return (
                <Collapsible
                  key={tip.id}
                  open={isOpen}
                  onOpenChange={() => toggleTip(tip.id)}
                >
                  <CollapsibleTrigger className="w-full">
                    <div className={`flex items-center justify-between p-3 rounded-lg ${config.bgColor} hover:shadow-md transition-all`}>
                      <div className="flex items-center gap-3">
                        <div className={config.color}>{config.icon}</div>
                        <div className="text-left">
                          <p className="font-medium text-gray-900">{tip.title}</p>
                          <Badge className={`${config.bgColor} ${config.color} border-0 text-[10px] mt-1`}>
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
                    <div className="p-4 bg-white rounded-b-lg border border-t-0 border-gray-100 space-y-3">
                      <p className="text-sm text-gray-700 leading-relaxed">
                        {tip.content}
                      </p>

                      {tip.example && (
                        <div className="bg-gray-50 p-3 rounded-lg">
                          <div className="flex items-start gap-2">
                            <Sparkles className="w-4 h-4 text-amber-500 mt-0.5 shrink-0" />
                            <div>
                              <p className="text-xs text-gray-500 mb-1">例</p>
                              <p className="text-sm text-gray-700">{tip.example}</p>
                            </div>
                          </div>
                        </div>
                      )}

                      <div className="flex flex-wrap gap-1">
                        {tip.tags.map((tag, i) => (
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
