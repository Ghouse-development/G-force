'use client'

import { Layout } from '@/components/layout/layout'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  Target,
  Lightbulb,
  Calculator,
  BookOpen,
} from 'lucide-react'
import { CompetitorGuide } from '@/components/sales/competitor-guide'
import { TalkScripts } from '@/components/sales/talk-scripts'
import { SalesCalculator } from '@/components/sales/sales-calculator'
import { SalesTips } from '@/components/sales/sales-tips'

export default function SalesToolsPage() {
  return (
    <Layout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">営業ツール</h1>
          <p className="text-gray-500 mt-1">
            競合対策・トークスクリプト・営業支援ツール
          </p>
        </div>

        <Tabs defaultValue="competitor" className="w-full">
          <TabsList className="mb-4 w-full justify-start overflow-x-auto scrollbar-none">
            <TabsTrigger value="competitor" className="flex items-center gap-1 px-3">
              <Target className="w-4 h-4" />
              <span className="hidden sm:inline">競合対策</span>
            </TabsTrigger>
            <TabsTrigger value="scripts" className="flex items-center gap-1 px-3">
              <BookOpen className="w-4 h-4" />
              <span className="hidden sm:inline">スクリプト</span>
            </TabsTrigger>
            <TabsTrigger value="calculator" className="flex items-center gap-1 px-3">
              <Calculator className="w-4 h-4" />
              <span className="hidden sm:inline">計算ツール</span>
            </TabsTrigger>
            <TabsTrigger value="tips" className="flex items-center gap-1 px-3">
              <Lightbulb className="w-4 h-4" />
              <span className="hidden sm:inline">営業Tips</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="competitor">
            <CompetitorGuide />
          </TabsContent>

          <TabsContent value="scripts">
            <TalkScripts />
          </TabsContent>

          <TabsContent value="calculator">
            <SalesCalculator />
          </TabsContent>

          <TabsContent value="tips">
            <SalesTips />
          </TabsContent>
        </Tabs>
      </div>
    </Layout>
  )
}
