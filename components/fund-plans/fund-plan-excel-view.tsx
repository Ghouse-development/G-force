'use client'

import { useState, useEffect, useMemo, useRef, useCallback } from 'react'
import dynamic from 'next/dynamic'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Save, Download, Lock, FileSpreadsheet, ZoomIn, ZoomOut, Navigation } from 'lucide-react'
import { toast } from 'sonner'
import type { FundPlanData } from '@/types/fund-plan'
import { createDefaultFundPlanData } from '@/types/fund-plan'
import {
  getVerifiedMappings,
  getNestedValue,
  type CellMapping,
} from '@/lib/fund-plan/cell-mapping'
import { exportFundPlanWithExcelJS } from '@/lib/excel-export-exceljs'

// Handsontable動的インポート（SSR無効化）
const HotTable = dynamic(
  () => import('@handsontable/react').then((mod) => mod.HotTable),
  { ssr: false }
)

// Handsontable設定
import 'handsontable/dist/handsontable.full.min.css'
import { registerAllModules } from 'handsontable/registry'

registerAllModules()

// セクション定義（ナビゲーション用）
const EXCEL_SECTIONS = [
  { id: 'header', label: 'ヘッダー', row: 0, col: 0, description: '邸名・商品・施工面積' },
  { id: 'incidentalA', label: '付帯A', row: 32, col: 14, description: '確認申請・構造計算等' },
  { id: 'incidentalB', label: '付帯B', row: 45, col: 6, description: '太陽光・オプション' },
  { id: 'incidentalC', label: '付帯C', row: 68, col: 14, description: '残土処理等' },
  { id: 'misc', label: '諸費用', row: 81, col: 14, description: '登記・保険等' },
  { id: 'land', label: '土地', row: 81, col: 34, description: '土地売買代金等' },
  { id: 'loan', label: '借入', row: 32, col: 52, description: 'A/B/C銀行' },
  { id: 'schedule', label: '工程', row: 7, col: 104, description: '契約・着工・竣工' },
  { id: 'payment', label: '支払', row: 17, col: 58, description: '契約金・中間金' },
]


interface FundPlanExcelViewProps {
  initialData?: FundPlanData
  version?: number
  isLocked?: boolean
  lockType?: 'contract' | 'change_contract' | null
  onSave?: (data: FundPlanData) => void
}

// Excel列名を生成（A, B, ... Z, AA, AB, ... AZ, BA, ... DA）
function getExcelColumnName(index: number): string {
  let name = ''
  let n = index
  while (n >= 0) {
    name = String.fromCharCode((n % 26) + 65) + name
    n = Math.floor(n / 26) - 1
  }
  return name
}

// 列名からインデックスを取得（A=0, B=1, ... Z=25, AA=26, AB=27, ...）
function getColumnIndex(colName: string): number {
  let index = 0
  for (let i = 0; i < colName.length; i++) {
    index = index * 26 + (colName.charCodeAt(i) - 64)
  }
  return index - 1
}

// セルアドレスを解析（例: 'AH1' → { col: 33, row: 0 }）
function parseCellAddress(address: string): { col: number; row: number } | null {
  const match = address.match(/^([A-Z]+)(\d+)$/)
  if (!match) return null
  const col = getColumnIndex(match[1])
  const row = parseInt(match[2], 10) - 1
  return { col, row }
}

export function FundPlanExcelView({
  initialData,
  version = 1,
  isLocked = false,
  lockType = null,
  onSave,
}: FundPlanExcelViewProps) {
  const [data, setData] = useState<FundPlanData>(initialData || createDefaultFundPlanData())
  const [zoom, setZoom] = useState(100)
  const [currentCell, setCurrentCell] = useState<string>('A1')
  const [activeSection, setActiveSection] = useState<string>('header')
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const hotRef = useRef<any>(null)

  // セクションにジャンプ
  const scrollToSection = useCallback((sectionId: string) => {
    const section = EXCEL_SECTIONS.find(s => s.id === sectionId)
    if (!section || !hotRef.current?.hotInstance) return

    const hot = hotRef.current.hotInstance
    hot.scrollViewportTo(section.row, section.col)
    hot.selectCell(section.row, section.col)
    setActiveSection(sectionId)
  }, [])

  // 列数・行数（Excelテンプレートに合わせる: A～DA列 = 105列, 1～100行）
  const COLS = 105 // A to DA
  const ROWS = 100

  // 検証済みマッピング
  const verifiedMappings = useMemo(() => getVerifiedMappings(), [])

  // マッピングからセル位置→データパスのマップを作成
  const cellToDataPath = useMemo(() => {
    const map = new Map<string, CellMapping>()
    for (const mapping of verifiedMappings) {
      map.set(mapping.address, mapping)
    }
    return map
  }, [verifiedMappings])

  // ネストされたオブジェクトに値をセット
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const setNestedValue = useCallback((obj: any, path: string, value: unknown) => {
    const keys = path.split('.')
    let current = obj
    for (let i = 0; i < keys.length - 1; i++) {
      if (!(keys[i] in current)) {
        current[keys[i]] = {}
      }
      current = current[keys[i]]
    }
    current[keys[keys.length - 1]] = value
  }, [])

  // 初期グリッドデータを生成
  const gridData = useMemo(() => {
    const grid: (string | number | null)[][] = []

    // 空のグリッドを作成
    for (let row = 0; row < ROWS; row++) {
      const rowData: (string | number | null)[] = []
      for (let col = 0; col < COLS; col++) {
        rowData.push(null)
      }
      grid.push(rowData)
    }

    // マッピングからデータをセット
    for (const mapping of verifiedMappings) {
      const pos = parseCellAddress(mapping.address)
      if (!pos || pos.row >= ROWS || pos.col >= COLS) continue

      const value = getNestedValue(data as unknown as Record<string, unknown>, mapping.dataPath)
      if (value !== undefined && value !== null) {
        if (mapping.type === 'number') {
          grid[pos.row][pos.col] = typeof value === 'number' ? value : parseFloat(String(value)) || 0
        } else {
          grid[pos.row][pos.col] = String(value)
        }
      }
    }

    // 固定ラベルをセット（Excelテンプレートの構造に合わせる）
    // Row 1: ヘッダー
    const ah1Pos = parseCellAddress('AH1')
    if (ah1Pos) grid[ah1Pos.row][ah1Pos.col] = data.teiName || '○○様邸'

    const n1Pos = parseCellAddress('N1')
    if (n1Pos) grid[n1Pos.row][n1Pos.col] = data.productType || 'LIFE'

    const ca1Pos = parseCellAddress('CA1')
    if (ca1Pos) grid[ca1Pos.row][ca1Pos.col] = data.constructionArea || 35

    // セクションラベル
    grid[0][0] = '資金計画書'
    grid[5][0] = '高性能'
    grid[5][10] = '断熱・気密・快適性能'
    grid[5][20] = '耐久性能'
    grid[5][30] = 'テクノロジー'
    grid[5][45] = '支払計画'

    // 建築費用セクション
    grid[27][0] = '➊建物本体工事'
    grid[32][0] = '➋付帯工事費用A'
    grid[45][0] = '➌付帯工事費用B'
    grid[58][0] = '➍付帯工事費用C'
    grid[81][0] = '➎諸費用'
    grid[81][20] = '➏土地費用'

    // 借入計画ラベル
    grid[31][43] = '借入計画'
    grid[32][43] = 'A銀行'
    grid[34][43] = 'B銀行'
    grid[36][43] = 'C銀行'

    // 工程スケジュールラベル
    grid[6][97] = '工程'
    grid[7][97] = '土地契約'
    grid[9][97] = '建物契約'
    grid[17][97] = '仕様最終打合せ'
    grid[19][97] = '変更契約'
    grid[21][97] = '着工'
    grid[23][97] = '上棟'
    grid[25][97] = '竣工'

    return grid
  }, [data, verifiedMappings])

  // 列ヘッダー（A, B, C, ... DA）
  const colHeaders = useMemo(() => {
    const headers: string[] = []
    for (let i = 0; i < COLS; i++) {
      headers.push(getExcelColumnName(i))
    }
    return headers
  }, [])

  // 編集可能なセルを特定
  const editableCells = useMemo(() => {
    const cells = new Set<string>()
    for (const mapping of verifiedMappings) {
      cells.add(mapping.address)
    }
    return cells
  }, [verifiedMappings])

  // セルメタデータ
  const cellMeta = useCallback((row: number, col: number) => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const meta: any = {}
    const address = `${getExcelColumnName(col)}${row + 1}`

    if (editableCells.has(address)) {
      meta.readOnly = isLocked
      meta.className = 'htEditable'
    } else {
      meta.readOnly = true
      meta.className = 'htReadOnly'
    }

    return meta
  }, [editableCells, isLocked])

  // セル変更時のハンドラ
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const handleAfterChange = useCallback((changes: any, source: string) => {
    if (source === 'loadData' || !changes) return

    const newData = { ...data }

    for (const [row, col, oldValue, newValue] of changes) {
      if (oldValue === newValue) continue

      const address = `${getExcelColumnName(col)}${row + 1}`
      const mapping = cellToDataPath.get(address)

      if (mapping) {
        let parsedValue: unknown = newValue

        if (mapping.type === 'number') {
          parsedValue = parseFloat(String(newValue)) || 0
        } else if (mapping.type === 'date') {
          parsedValue = newValue
        }

        setNestedValue(newData, mapping.dataPath, parsedValue)
      }
    }

    setData(newData)
  }, [data, cellToDataPath, setNestedValue])

  // 保存
  const handleSave = useCallback(() => {
    if (isLocked) {
      toast.error('このバージョンはロックされているため編集できません')
      return
    }
    if (onSave) {
      onSave(data)
      toast.success('保存しました')
    }
  }, [data, isLocked, onSave])

  // Excel出力
  const handleExportExcel = useCallback(async () => {
    try {
      await exportFundPlanWithExcelJS(data, `${data.teiName || '資金計画書'}_v${version}.xlsx`)
      toast.success('Excelファイルを出力しました')
    } catch (error) {
      console.error('Excel export error:', error)
      toast.error('Excel出力に失敗しました')
    }
  }, [data, version])

  // ズーム
  const handleZoomIn = () => setZoom((z) => Math.min(z + 10, 150))
  const handleZoomOut = () => setZoom((z) => Math.max(z - 10, 50))

  // セル結合設定
  const mergeCells = useMemo(() => {
    return [
      // タイトル行
      { row: 0, col: 0, rowspan: 1, colspan: 10 },
      // セクションヘッダー
      { row: 5, col: 0, rowspan: 1, colspan: 10 },
      { row: 5, col: 10, rowspan: 1, colspan: 10 },
      { row: 5, col: 20, rowspan: 1, colspan: 10 },
      { row: 5, col: 30, rowspan: 1, colspan: 15 },
      { row: 5, col: 45, rowspan: 1, colspan: 15 },
      // 建築費用セクション
      { row: 27, col: 0, rowspan: 2, colspan: 10 },
      { row: 32, col: 0, rowspan: 2, colspan: 10 },
      { row: 45, col: 0, rowspan: 2, colspan: 10 },
      { row: 58, col: 0, rowspan: 2, colspan: 10 },
      { row: 81, col: 0, rowspan: 2, colspan: 10 },
      { row: 81, col: 20, rowspan: 2, colspan: 10 },
    ]
  }, [])

  // カスタムスタイル
  useEffect(() => {
    const style = document.createElement('style')
    style.textContent = `
      .fund-plan-excel .htEditable {
        background-color: #fffbeb !important;
      }
      .fund-plan-excel .htReadOnly {
        background-color: #f9fafb !important;
        color: #6b7280;
      }
      .fund-plan-excel .handsontable td.htEditable:hover {
        background-color: #fef3c7 !important;
      }
      .fund-plan-excel .handsontable thead th {
        background-color: #f3f4f6 !important;
        font-weight: 600;
        font-size: 10px;
      }
      .fund-plan-excel .handsontable tbody th {
        background-color: #f3f4f6 !important;
        font-weight: 600;
        font-size: 10px;
      }
    `
    document.head.appendChild(style)
    return () => {
      document.head.removeChild(style)
    }
  }, [])

  return (
    <div className="space-y-4 fund-plan-excel">
      {/* ツールバー */}
      <div className="flex items-center justify-between bg-white border rounded-lg p-3 shadow-sm">
        <div className="flex items-center gap-3">
          <FileSpreadsheet className="w-5 h-5 text-orange-500" />
          <span className="font-medium">{data.teiName || '新規'} 資金計画書</span>
          <Badge variant="outline">v{version}</Badge>
          {isLocked && (
            <Badge className="bg-red-100 text-red-700">
              <Lock className="w-3 h-3 mr-1" />
              {lockType === 'contract' ? '請負契約時' : lockType === 'change_contract' ? '変更契約時' : 'ロック中'}
            </Badge>
          )}
        </div>
        <div className="flex items-center gap-2">
          {/* ズーム */}
          <div className="flex items-center gap-1 mr-2">
            <Button variant="ghost" size="sm" onClick={handleZoomOut} className="h-8 w-8 p-0">
              <ZoomOut className="w-4 h-4" />
            </Button>
            <span className="text-sm text-gray-500 w-12 text-center">{zoom}%</span>
            <Button variant="ghost" size="sm" onClick={handleZoomIn} className="h-8 w-8 p-0">
              <ZoomIn className="w-4 h-4" />
            </Button>
          </div>
          <Button variant="outline" size="sm" onClick={handleExportExcel}>
            <Download className="w-4 h-4 mr-2" />
            Excel出力
          </Button>
          <Button
            size="sm"
            onClick={handleSave}
            disabled={isLocked}
            className="bg-gradient-to-r from-orange-500 to-yellow-500"
          >
            <Save className="w-4 h-4 mr-2" />
            保存
          </Button>
        </div>
      </div>

      {/* セクションナビゲーション */}
      <div className="bg-white border rounded-lg p-2 shadow-sm">
        <div className="flex items-center gap-1 overflow-x-auto">
          <Navigation className="w-4 h-4 text-gray-400 mr-1 shrink-0" />
          {EXCEL_SECTIONS.map((section) => (
            <Button
              key={section.id}
              variant={activeSection === section.id ? 'default' : 'ghost'}
              size="sm"
              onClick={() => scrollToSection(section.id)}
              className={`h-8 shrink-0 ${
                activeSection === section.id
                  ? 'bg-orange-500 hover:bg-orange-600 text-white'
                  : 'hover:bg-orange-50'
              }`}
            >
              {section.label}
            </Button>
          ))}
          <div className="ml-auto flex items-center gap-2 shrink-0">
            <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-200">
              現在: {currentCell}
            </Badge>
            <span className="text-xs text-gray-400">
              編集可能: {verifiedMappings.length}セル
            </span>
          </div>
        </div>
      </div>

      {/* Handsontableグリッド */}
      <div
        className="border rounded-lg overflow-hidden bg-white shadow-lg"
        style={{
          transform: `scale(${zoom / 100})`,
          transformOrigin: 'top left',
          height: `calc(100vh - 280px)`,
        }}
      >
        <HotTable
          ref={hotRef}
          data={gridData}
          colHeaders={colHeaders}
          rowHeaders={true}
          width="100%"
          height="100%"
          licenseKey="non-commercial-and-evaluation"
          stretchH="all"
          manualColumnResize={true}
          manualRowResize={true}
          mergeCells={mergeCells}
          afterChange={handleAfterChange}
          afterSelection={(row, col) => {
            const address = `${getExcelColumnName(col)}${row + 1}`
            setCurrentCell(address)
            // 選択セルに応じてアクティブセクションを更新
            const section = EXCEL_SECTIONS.find(s =>
              row >= s.row && row < s.row + 20 && col >= s.col && col < s.col + 20
            )
            if (section) setActiveSection(section.id)
          }}
          cells={(row, col) => cellMeta(row, col)}
          contextMenu={false}
          comments={false}
          columnSorting={false}
          fixedRowsTop={1}
          fixedColumnsStart={1}
          viewportColumnRenderingOffset={20}
          viewportRowRenderingOffset={50}
        />
      </div>

      {/* フッター情報 */}
      <div className="flex items-center justify-between text-xs text-gray-500">
        <div>
          セルマッピング: {verifiedMappings.length}セル検証済み |
          列: A〜{getExcelColumnName(COLS - 1)} ({COLS}列) |
          行: 1〜{ROWS} ({ROWS}行)
        </div>
        <div>
          黄色のセルをクリックして編集 | Tab/Enterで移動
        </div>
      </div>
    </div>
  )
}
