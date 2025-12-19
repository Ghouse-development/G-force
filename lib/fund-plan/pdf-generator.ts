import jsPDF from 'jspdf'
import html2canvas from 'html2canvas'
import type { FundPlanData, FundPlanCalculation } from '@/types/fund-plan'
import { formatCurrency } from './calculations'
import { companyInfo, standardSpecifications, defaultRemarks } from './master-data'

// PDF生成オプション
interface PDFOptions {
  filename?: string
  orientation?: 'portrait' | 'landscape'
  format?: 'a4' | 'a3'
}

// HTMLエレメントからPDFを生成
export async function generatePDFFromElement(
  element: HTMLElement,
  options: PDFOptions = {}
): Promise<void> {
  const {
    filename = '資金計画書.pdf',
    orientation = 'portrait',
    format = 'a4',
  } = options

  try {
    // html2canvasでキャプチャ
    const canvas = await html2canvas(element, {
      useCORS: true,
      logging: false,
      backgroundColor: '#ffffff',
      windowWidth: element.scrollWidth * 2,
      windowHeight: element.scrollHeight * 2,
    } as Parameters<typeof html2canvas>[1])

    // PDF設定
    const pdf = new jsPDF({
      orientation,
      unit: 'mm',
      format,
    })

    // ページサイズ
    const pageWidth = pdf.internal.pageSize.getWidth()
    const pageHeight = pdf.internal.pageSize.getHeight()

    // 画像サイズ計算
    const imgWidth = pageWidth - 20 // 10mmマージン
    const imgHeight = (canvas.height * imgWidth) / canvas.width

    // 複数ページ対応
    let heightLeft = imgHeight
    let position = 10 // 上部マージン

    const imgData = canvas.toDataURL('image/jpeg', 0.95)

    // 最初のページ
    pdf.addImage(imgData, 'JPEG', 10, position, imgWidth, imgHeight)
    heightLeft -= pageHeight - 20

    // 追加ページ
    while (heightLeft >= 0) {
      position = heightLeft - imgHeight + 10
      pdf.addPage()
      pdf.addImage(imgData, 'JPEG', 10, position, imgWidth, imgHeight)
      heightLeft -= pageHeight - 20
    }

    // ダウンロード
    pdf.save(filename)
  } catch (error) {
    console.error('PDF生成エラー:', error)
    throw error
  }
}

// 資金計画書データからPDFを直接生成（簡易版）
export function generateSimplePDF(
  data: FundPlanData,
  calculation: FundPlanCalculation,
  options: PDFOptions = {}
): void {
  const {
    filename = `資金計画書_${data.teiName || '未設定'}.pdf`,
    orientation = 'portrait',
    format = 'a4',
  } = options

  const pdf = new jsPDF({
    orientation,
    unit: 'mm',
    format,
  })

  // 日本語フォント対応のため、PDFはテキストベースではなく
  // 実際の運用ではhtml2canvasを使用することを推奨

  let y = 20
  const margin = 15
  const lineHeight = 7
  const pageWidth = pdf.internal.pageSize.getWidth()

  // タイトル
  pdf.setFontSize(18)
  pdf.text('資金計画書', pageWidth / 2, y, { align: 'center' })
  y += 15

  // 邸名
  pdf.setFontSize(14)
  pdf.text(`${data.teiName || '○○様邸'}`, pageWidth / 2, y, { align: 'center' })
  y += 10

  // 区切り線
  pdf.setLineWidth(0.5)
  pdf.line(margin, y, pageWidth - margin, y)
  y += 10

  // 基本情報
  pdf.setFontSize(10)
  const basicInfo = [
    [`工事名称: ${data.constructionName || '-'}`, `建築場所: ${data.constructionAddress || '-'}`],
    [`商品: ${data.productType}`, `施工面積: ${data.constructionArea}坪`],
    [`防火区分: ${data.fireProtectionZone}`, `階数: ${data.floorCount}階`],
  ]

  basicInfo.forEach((row) => {
    pdf.text(row[0], margin, y)
    pdf.text(row[1], pageWidth / 2, y)
    y += lineHeight
  })

  y += 5
  pdf.line(margin, y, pageWidth - margin, y)
  y += 10

  // 費用サマリー
  pdf.setFontSize(12)
  pdf.text('費用サマリー', margin, y)
  y += 10

  pdf.setFontSize(10)
  const costSummary = [
    ['建物本体工事', formatCurrency(calculation.subtotalBuildingMain) + '円'],
    ['付帯工事費用A', formatCurrency(calculation.subtotalIncidentalA) + '円'],
    ['付帯工事費用B', formatCurrency(calculation.subtotalIncidentalB) + '円'],
    ['付帯工事費用C', formatCurrency(calculation.subtotalIncidentalC) + '円'],
    ['消費税', formatCurrency(calculation.consumptionTax) + '円'],
    ['最終建物工事費用（税込）', formatCurrency(calculation.totalBuildingConstructionWithTax) + '円'],
    ['諸費用', formatCurrency(calculation.subtotalMiscellaneous) + '円'],
    ['土地費用', formatCurrency(calculation.subtotalLand) + '円'],
  ]

  costSummary.forEach((row) => {
    pdf.text(row[0], margin, y)
    pdf.text(row[1], pageWidth - margin, y, { align: 'right' })
    y += lineHeight
  })

  y += 5
  pdf.setLineWidth(1)
  pdf.line(margin, y, pageWidth - margin, y)
  y += 8

  // 総合計
  pdf.setFontSize(14)
  pdf.text('最終合計（税込）', margin, y)
  pdf.text(formatCurrency(calculation.grandTotal) + '円', pageWidth - margin, y, { align: 'right' })
  y += 15

  // 月々返済
  pdf.setFontSize(12)
  pdf.text('借入計画', margin, y)
  y += 10

  pdf.setFontSize(10)
  pdf.text('月々返済額:', margin, y)
  pdf.text(formatCurrency(calculation.totalMonthlyPayment) + '円', pageWidth - margin, y, { align: 'right' })
  y += lineHeight

  if (calculation.totalBonusPayment > 0) {
    pdf.text('ボーナス時返済額:', margin, y)
    pdf.text(formatCurrency(calculation.totalBonusPayment) + '円', pageWidth - margin, y, { align: 'right' })
    y += lineHeight
  }

  // 新しいページ
  if (y > pdf.internal.pageSize.getHeight() - 50) {
    pdf.addPage()
    y = 20
  }

  y += 10

  // 会社情報
  pdf.setFontSize(10)
  pdf.text(companyInfo.name, margin, y)
  y += lineHeight
  pdf.text(`〒${companyInfo.postalCode} ${companyInfo.address}`, margin, y)
  y += lineHeight
  pdf.text(`担当: ${data.salesRep || '-'} TEL: ${data.salesRepPhone || '-'}`, margin, y)
  y += lineHeight * 2

  // 見積情報
  pdf.text(`見積作成日: ${data.estimateDate}`, margin, y)
  pdf.text(`見積有効期限: ${data.estimateValidDate}`, pageWidth / 2, y)

  // ダウンロード
  pdf.save(filename)
}

// プリント用のHTMLを生成
export function createPrintableHTML(
  data: FundPlanData,
  calculation: FundPlanCalculation
): string {
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <title>資金計画書 - ${data.teiName || '○○様邸'}</title>
      <style>
        @media print {
          body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
        }
        body {
          font-family: 'Noto Sans JP', 'Hiragino Kaku Gothic Pro', 'メイリオ', sans-serif;
          font-size: 10px;
          line-height: 1.4;
          color: #333;
          max-width: 210mm;
          margin: 0 auto;
          padding: 10mm;
        }
        h1 { font-size: 18px; text-align: center; margin-bottom: 5px; }
        h2 { font-size: 14px; border-bottom: 2px solid #f97316; padding-bottom: 4px; margin: 15px 0 10px; }
        h3 { font-size: 12px; margin: 10px 0 5px; }
        table { width: 100%; border-collapse: collapse; margin: 10px 0; }
        th, td { border: 1px solid #ddd; padding: 4px 8px; text-align: left; }
        th { background-color: #f3f4f6; font-weight: bold; }
        .text-right { text-align: right; }
        .total-row { background-color: #fff7ed; font-weight: bold; }
        .grand-total { background-color: #f97316; color: white; font-size: 14px; }
        .company-info { margin-top: 20px; padding-top: 10px; border-top: 1px solid #ddd; }
        .grid-2 { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; }
        .section { margin-bottom: 15px; }
      </style>
    </head>
    <body>
      <h1>資金計画書</h1>
      <p style="text-align: center; font-size: 14px;">${data.teiName || '○○様邸'}</p>

      <div class="section">
        <h2>基本情報</h2>
        <div class="grid-2">
          <div>工事名称: ${data.constructionName || '-'}</div>
          <div>建築場所: ${data.constructionAddress || '-'}</div>
          <div>商品: ${data.productType}</div>
          <div>施工面積: ${data.constructionArea}坪</div>
          <div>防火区分: ${data.fireProtectionZone}</div>
          <div>階数: ${data.floorCount}階</div>
        </div>
      </div>

      <div class="section">
        <h2>費用詳細</h2>
        <table>
          <tr>
            <th>項目</th>
            <th class="text-right">金額</th>
          </tr>
          <tr>
            <td>❶建物本体工事</td>
            <td class="text-right">${formatCurrency(calculation.subtotalBuildingMain)}円</td>
          </tr>
          <tr>
            <td>❷付帯工事費用A</td>
            <td class="text-right">${formatCurrency(calculation.subtotalIncidentalA)}円</td>
          </tr>
          <tr>
            <td>❸付帯工事費用B</td>
            <td class="text-right">${formatCurrency(calculation.subtotalIncidentalB)}円</td>
          </tr>
          <tr>
            <td>❹付帯工事費用C</td>
            <td class="text-right">${formatCurrency(calculation.subtotalIncidentalC)}円</td>
          </tr>
          <tr class="total-row">
            <td>最終建物工事費用（税抜）</td>
            <td class="text-right">${formatCurrency(calculation.totalBuildingConstruction)}円</td>
          </tr>
          <tr>
            <td>消費税（10%）</td>
            <td class="text-right">${formatCurrency(calculation.consumptionTax)}円</td>
          </tr>
          <tr class="total-row">
            <td>最終建物工事費用（税込）</td>
            <td class="text-right">${formatCurrency(calculation.totalBuildingConstructionWithTax)}円</td>
          </tr>
          <tr>
            <td>❺諸費用</td>
            <td class="text-right">${formatCurrency(calculation.subtotalMiscellaneous)}円</td>
          </tr>
          <tr>
            <td>❻土地費用</td>
            <td class="text-right">${formatCurrency(calculation.subtotalLand)}円</td>
          </tr>
          <tr class="grand-total">
            <td>最終合計（税込）</td>
            <td class="text-right">${formatCurrency(calculation.grandTotal)}円</td>
          </tr>
        </table>
      </div>

      <div class="section">
        <h2>借入計画</h2>
        <table>
          <tr>
            <th>銀行</th>
            <th class="text-right">借入額</th>
            <th class="text-right">金利</th>
            <th class="text-right">年数</th>
            <th class="text-right">月々返済</th>
          </tr>
          ${data.loanPlan.bankA.amount > 0 ? `
          <tr>
            <td>${data.loanPlan.bankA.bankName}</td>
            <td class="text-right">${formatCurrency(data.loanPlan.bankA.amount)}円</td>
            <td class="text-right">${(data.loanPlan.bankA.interestRate * 100).toFixed(2)}%</td>
            <td class="text-right">${data.loanPlan.bankA.loanYears}年</td>
            <td class="text-right">${formatCurrency(calculation.monthlyPaymentA)}円</td>
          </tr>
          ` : ''}
          ${data.loanPlan.bankB.amount > 0 ? `
          <tr>
            <td>${data.loanPlan.bankB.bankName}</td>
            <td class="text-right">${formatCurrency(data.loanPlan.bankB.amount)}円</td>
            <td class="text-right">${(data.loanPlan.bankB.interestRate * 100).toFixed(2)}%</td>
            <td class="text-right">${data.loanPlan.bankB.loanYears}年</td>
            <td class="text-right">${formatCurrency(calculation.monthlyPaymentB)}円</td>
          </tr>
          ` : ''}
          <tr class="total-row">
            <td colspan="4">月々返済額合計</td>
            <td class="text-right">${formatCurrency(calculation.totalMonthlyPayment)}円</td>
          </tr>
        </table>
      </div>

      <div class="company-info">
        <strong>${companyInfo.name}</strong><br>
        〒${companyInfo.postalCode} ${companyInfo.address}<br>
        担当: ${data.salesRep || '-'} TEL: ${data.salesRepPhone || '-'}
        <div style="margin-top: 10px; font-size: 9px; color: #666;">
          見積作成日: ${data.estimateDate} / 見積有効期限: ${data.estimateValidDate}
        </div>
      </div>
    </body>
    </html>
  `
}
