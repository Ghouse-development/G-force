'use client'

import { useState, useMemo } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Calculator,
  Home,
  Banknote,
  BarChart3,
  RefreshCw,
} from 'lucide-react'

// 数値フォーマット
const formatCurrency = (value: number) => {
  return new Intl.NumberFormat('ja-JP').format(Math.round(value))
}

export function SalesCalculator() {
  return (
    <div className="space-y-6">
      <Tabs defaultValue="loan" className="w-full">
        <TabsList className="w-full justify-start mb-4">
          <TabsTrigger value="loan" className="flex items-center gap-1">
            <Banknote className="w-4 h-4" />
            ローン計算
          </TabsTrigger>
          <TabsTrigger value="tsubo" className="flex items-center gap-1">
            <Home className="w-4 h-4" />
            坪単価計算
          </TabsTrigger>
          <TabsTrigger value="compare" className="flex items-center gap-1">
            <BarChart3 className="w-4 h-4" />
            比較シミュレーション
          </TabsTrigger>
        </TabsList>

        <TabsContent value="loan">
          <LoanCalculator />
        </TabsContent>

        <TabsContent value="tsubo">
          <TsuboCalculator />
        </TabsContent>

        <TabsContent value="compare">
          <CompareSimulator />
        </TabsContent>
      </Tabs>
    </div>
  )
}

// ローン計算機
function LoanCalculator() {
  const [principal, setPrincipal] = useState('3500')
  const [interestRate, setInterestRate] = useState('0.5')
  const [years, setYears] = useState('35')
  const [bonus, setBonus] = useState('0')

  const result = useMemo(() => {
    const p = parseFloat(principal) * 10000 // 万円→円
    const r = parseFloat(interestRate) / 100 / 12 // 年利→月利
    const n = parseInt(years) * 12 // 年→月
    const b = parseFloat(bonus) * 10000 // ボーナス払い

    if (isNaN(p) || isNaN(r) || isNaN(n) || p <= 0 || n <= 0) {
      return null
    }

    // 月々の元金（ボーナス分を除く）
    const principalMonthly = p - (b * (n / 6))

    // 月々の返済額（元利均等）
    let monthlyPayment = 0
    if (r > 0) {
      monthlyPayment = principalMonthly * r * Math.pow(1 + r, n) / (Math.pow(1 + r, n) - 1)
    } else {
      monthlyPayment = principalMonthly / n
    }

    // ボーナス月の加算額
    const bonusPayment = b > 0 ? (b * r * Math.pow(1 + r, n / 6)) / (Math.pow(1 + r, n / 6) - 1) : 0

    // 総返済額
    const totalPayment = monthlyPayment * n + bonusPayment * (n / 6)

    // 総利息
    const totalInterest = totalPayment - p

    return {
      monthlyPayment: Math.round(monthlyPayment),
      bonusPayment: Math.round(bonusPayment),
      totalPayment: Math.round(totalPayment),
      totalInterest: Math.round(totalInterest),
    }
  }, [principal, interestRate, years, bonus])

  const reset = () => {
    setPrincipal('3500')
    setInterestRate('0.5')
    setYears('35')
    setBonus('0')
  }

  return (
    <Card className="border-0 shadow-lg">
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center justify-between text-lg">
          <div className="flex items-center gap-2">
            <Calculator className="w-5 h-5 text-blue-600" />
            住宅ローン返済額計算
          </div>
          <Button variant="ghost" size="sm" onClick={reset}>
            <RefreshCw className="w-4 h-4 mr-1" />
            リセット
          </Button>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label>借入金額（万円）</Label>
            <Input
              type="number"
              value={principal}
              onChange={(e) => setPrincipal(e.target.value)}
              placeholder="3500"
            />
          </div>
          <div className="space-y-2">
            <Label>金利（年利 %）</Label>
            <Input
              type="number"
              step="0.01"
              value={interestRate}
              onChange={(e) => setInterestRate(e.target.value)}
              placeholder="0.5"
            />
          </div>
          <div className="space-y-2">
            <Label>返済期間（年）</Label>
            <Select value={years} onValueChange={setYears}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {[20, 25, 30, 35, 40].map(y => (
                  <SelectItem key={y} value={y.toString()}>{y}年</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>ボーナス払い（万円/回）</Label>
            <Input
              type="number"
              value={bonus}
              onChange={(e) => setBonus(e.target.value)}
              placeholder="0"
            />
          </div>
        </div>

        {result && (
          <div className="bg-blue-50 rounded-lg p-4 space-y-3">
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-white p-3 rounded-lg text-center">
                <p className="text-xs text-gray-500">月々の返済額</p>
                <p className="text-2xl font-bold text-blue-600">
                  {formatCurrency(result.monthlyPayment)}
                  <span className="text-sm font-normal text-gray-500">円</span>
                </p>
              </div>
              {result.bonusPayment > 0 && (
                <div className="bg-white p-3 rounded-lg text-center">
                  <p className="text-xs text-gray-500">ボーナス月加算</p>
                  <p className="text-2xl font-bold text-blue-600">
                    +{formatCurrency(result.bonusPayment)}
                    <span className="text-sm font-normal text-gray-500">円</span>
                  </p>
                </div>
              )}
            </div>
            <div className="grid grid-cols-2 gap-4 pt-2 border-t">
              <div className="text-center">
                <p className="text-xs text-gray-500">総返済額</p>
                <p className="text-lg font-semibold text-gray-700">
                  {formatCurrency(result.totalPayment / 10000)}万円
                </p>
              </div>
              <div className="text-center">
                <p className="text-xs text-gray-500">総利息額</p>
                <p className="text-lg font-semibold text-amber-600">
                  {formatCurrency(result.totalInterest / 10000)}万円
                </p>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

// 坪単価計算機
function TsuboCalculator() {
  const [buildingPrice, setBuildingPrice] = useState('2800')
  const [floorArea, setFloorArea] = useState('35')
  const [areaUnit, setAreaUnit] = useState<'tsubo' | 'm2'>('tsubo')

  const result = useMemo(() => {
    const price = parseFloat(buildingPrice) * 10000 // 万円→円
    const area = parseFloat(floorArea)

    if (isNaN(price) || isNaN(area) || price <= 0 || area <= 0) {
      return null
    }

    // m2の場合は坪に変換
    const tsubo = areaUnit === 'm2' ? area / 3.30579 : area
    const m2 = areaUnit === 'tsubo' ? area * 3.30579 : area

    const pricePerTsubo = price / tsubo
    const pricePerM2 = price / m2

    return {
      tsubo: tsubo,
      m2: m2,
      pricePerTsubo: Math.round(pricePerTsubo / 10000), // 万円
      pricePerM2: Math.round(pricePerM2 / 10000 * 10) / 10, // 万円（小数1桁）
    }
  }, [buildingPrice, floorArea, areaUnit])

  return (
    <Card className="border-0 shadow-lg">
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-2 text-lg">
          <Home className="w-5 h-5 text-green-600" />
          坪単価計算
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label>建物価格（万円）</Label>
            <Input
              type="number"
              value={buildingPrice}
              onChange={(e) => setBuildingPrice(e.target.value)}
              placeholder="2800"
            />
          </div>
          <div className="space-y-2">
            <Label>延床面積</Label>
            <div className="flex gap-2">
              <Input
                type="number"
                value={floorArea}
                onChange={(e) => setFloorArea(e.target.value)}
                placeholder="35"
                className="flex-1"
              />
              <Select value={areaUnit} onValueChange={(v) => setAreaUnit(v as 'tsubo' | 'm2')}>
                <SelectTrigger className="w-20">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="tsubo">坪</SelectItem>
                  <SelectItem value="m2">m2</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>

        {result && (
          <div className="bg-green-50 rounded-lg p-4 space-y-3">
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-white p-3 rounded-lg text-center">
                <p className="text-xs text-gray-500">坪単価</p>
                <p className="text-2xl font-bold text-green-600">
                  {result.pricePerTsubo}
                  <span className="text-sm font-normal text-gray-500">万円/坪</span>
                </p>
              </div>
              <div className="bg-white p-3 rounded-lg text-center">
                <p className="text-xs text-gray-500">m2単価</p>
                <p className="text-2xl font-bold text-green-600">
                  {result.pricePerM2}
                  <span className="text-sm font-normal text-gray-500">万円/m2</span>
                </p>
              </div>
            </div>
            <div className="text-center text-sm text-gray-500 pt-2 border-t">
              延床面積: {result.tsubo.toFixed(1)}坪 = {result.m2.toFixed(1)}m2
            </div>
          </div>
        )}

        <div className="bg-gray-50 rounded-lg p-3">
          <p className="text-xs text-gray-500">
            ※ 坪単価は建物本体価格のみで計算しています。諸費用や外構費は含まれていません。
          </p>
        </div>
      </CardContent>
    </Card>
  )
}

// 比較シミュレーション
function CompareSimulator() {
  const [ourPrice, setOurPrice] = useState('3000')
  const [otherPrice, setOtherPrice] = useState('2800')
  const [electricitySaving, setElectricitySaving] = useState('1.5')
  const [years, setYears] = useState('30')

  const result = useMemo(() => {
    const our = parseFloat(ourPrice) * 10000
    const other = parseFloat(otherPrice) * 10000
    const saving = parseFloat(electricitySaving) * 10000 * 12 // 年間
    const y = parseInt(years)

    if (isNaN(our) || isNaN(other) || isNaN(saving) || isNaN(y)) {
      return null
    }

    const priceDiff = our - other
    const totalSaving = saving * y
    const netDiff = priceDiff - totalSaving

    return {
      priceDiff: priceDiff / 10000,
      totalSaving: totalSaving / 10000,
      netDiff: netDiff / 10000,
      breakEvenYears: priceDiff > 0 ? Math.ceil(priceDiff / saving) : 0,
    }
  }, [ourPrice, otherPrice, electricitySaving, years])

  return (
    <Card className="border-0 shadow-lg">
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-2 text-lg">
          <BarChart3 className="w-5 h-5 text-purple-600" />
          生涯コスト比較
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label>当社建物価格（万円）</Label>
            <Input
              type="number"
              value={ourPrice}
              onChange={(e) => setOurPrice(e.target.value)}
              placeholder="3000"
            />
          </div>
          <div className="space-y-2">
            <Label>他社建物価格（万円）</Label>
            <Input
              type="number"
              value={otherPrice}
              onChange={(e) => setOtherPrice(e.target.value)}
              placeholder="2800"
            />
          </div>
          <div className="space-y-2">
            <Label>月々の光熱費削減額（万円）</Label>
            <Input
              type="number"
              step="0.1"
              value={electricitySaving}
              onChange={(e) => setElectricitySaving(e.target.value)}
              placeholder="1.5"
            />
          </div>
          <div className="space-y-2">
            <Label>シミュレーション期間（年）</Label>
            <Select value={years} onValueChange={setYears}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {[20, 25, 30, 35, 40, 50].map(y => (
                  <SelectItem key={y} value={y.toString()}>{y}年</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {result && (
          <div className="bg-purple-50 rounded-lg p-4 space-y-4">
            <div className="grid grid-cols-3 gap-3">
              <div className="bg-white p-3 rounded-lg text-center">
                <p className="text-xs text-gray-500">建物価格差</p>
                <p className={`text-xl font-bold ${result.priceDiff > 0 ? 'text-red-500' : 'text-green-500'}`}>
                  {result.priceDiff > 0 ? '+' : ''}{result.priceDiff}万円
                </p>
              </div>
              <div className="bg-white p-3 rounded-lg text-center">
                <p className="text-xs text-gray-500">{years}年間の削減額</p>
                <p className="text-xl font-bold text-green-600">
                  -{result.totalSaving}万円
                </p>
              </div>
              <div className="bg-white p-3 rounded-lg text-center">
                <p className="text-xs text-gray-500">実質差額</p>
                <p className={`text-xl font-bold ${result.netDiff > 0 ? 'text-red-500' : 'text-green-500'}`}>
                  {result.netDiff > 0 ? '+' : ''}{result.netDiff}万円
                </p>
              </div>
            </div>

            {result.breakEvenYears > 0 && (
              <div className="text-center p-3 bg-white rounded-lg">
                <p className="text-sm text-gray-600">
                  <span className="font-bold text-purple-600">{result.breakEvenYears}年</span>
                  で元が取れます
                </p>
              </div>
            )}
          </div>
        )}

        <div className="bg-gray-50 rounded-lg p-3">
          <p className="text-xs text-gray-500">
            ※ 高断熱住宅による光熱費削減効果のシミュレーションです。実際の削減額は立地や生活スタイルにより異なります。
          </p>
        </div>
      </CardContent>
    </Card>
  )
}
