import type { StoredContract } from '@/store'

// PDF生成オプション
interface PDFOptions {
  filename?: string
  orientation?: 'portrait' | 'landscape'
  format?: 'a4' | 'a3'
}

// HTMLエレメントからPDFを生成
export async function generateContractPDFFromElement(
  element: HTMLElement,
  options: PDFOptions = {}
): Promise<void> {
  const {
    filename = '請負契約書.pdf',
    orientation = 'portrait',
    format = 'a4',
  } = options

  try {
    const [{ default: html2canvas }, { default: jsPDF }] = await Promise.all([
      import('html2canvas'),
      import('jspdf'),
    ])

    const canvas = await html2canvas(element, {
      useCORS: true,
      logging: false,
      scale: 2,
    } as Parameters<typeof html2canvas>[1])

    const pdf = new jsPDF({
      orientation,
      unit: 'mm',
      format,
    })

    const pageWidth = pdf.internal.pageSize.getWidth()
    const pageHeight = pdf.internal.pageSize.getHeight()

    const imgWidth = pageWidth - 20
    const imgHeight = (canvas.height * imgWidth) / canvas.width

    let heightLeft = imgHeight
    let position = 10

    const imgData = canvas.toDataURL('image/jpeg', 0.95)

    pdf.addImage(imgData, 'JPEG', 10, position, imgWidth, imgHeight)
    heightLeft -= pageHeight - 20

    while (heightLeft >= 0) {
      position = heightLeft - imgHeight + 10
      pdf.addPage()
      pdf.addImage(imgData, 'JPEG', 10, position, imgWidth, imgHeight)
      heightLeft -= pageHeight - 20
    }

    pdf.save(filename)
  } catch (error) {
    console.error('PDF生成エラー:', error)
    throw error
  }
}

// 契約書データからPDFを生成（印刷用HTML経由）
export async function generateContractPDF(
  contract: StoredContract,
  options: PDFOptions = {}
): Promise<void> {
  const {
    filename = `請負契約書_${contract.tei_name || '未設定'}.pdf`,
  } = options

  try {
    const [{ default: html2canvas }, { default: jsPDF }] = await Promise.all([
      import('html2canvas'),
      import('jspdf'),
    ])

    // 一時的なコンテナを作成
    const container = document.createElement('div')
    container.style.position = 'absolute'
    container.style.left = '-9999px'
    container.style.top = '0'
    container.style.width = '210mm'
    container.style.background = 'white'
    container.innerHTML = createContractPrintHTML(contract)
    document.body.appendChild(container)

    // キャプチャ
    const canvas = await html2canvas(container, {
      useCORS: true,
      logging: false,
      scale: 2,
      width: container.scrollWidth,
      height: container.scrollHeight,
    } as Parameters<typeof html2canvas>[1])

    // 一時コンテナを削除
    document.body.removeChild(container)

    const pdf = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4',
    })

    const pageWidth = pdf.internal.pageSize.getWidth()
    const pageHeight = pdf.internal.pageSize.getHeight()

    const imgWidth = pageWidth - 20
    const imgHeight = (canvas.height * imgWidth) / canvas.width

    let heightLeft = imgHeight
    let position = 10

    const imgData = canvas.toDataURL('image/jpeg', 0.95)

    pdf.addImage(imgData, 'JPEG', 10, position, imgWidth, imgHeight)
    heightLeft -= pageHeight - 20

    while (heightLeft >= 0) {
      position = heightLeft - imgHeight + 10
      pdf.addPage()
      pdf.addImage(imgData, 'JPEG', 10, position, imgWidth, imgHeight)
      heightLeft -= pageHeight - 20
    }

    pdf.save(filename)
  } catch (error) {
    console.error('PDF生成エラー:', error)
    throw error
  }
}

// 金額フォーマット
function formatCurrency(amount: number | null | undefined): string {
  if (amount == null) return '-'
  return `¥${amount.toLocaleString()}`
}

// 日付フォーマット
function formatDate(dateStr: string | null | undefined): string {
  if (!dateStr) return '-'
  return new Date(dateStr).toLocaleDateString('ja-JP')
}

// 印刷用HTML生成
export function createContractPrintHTML(contract: StoredContract): string {
  const statusLabel = contract.status === '契約完了' ? '契約締結済' : contract.status

  return `
    <div style="
      font-family: 'Noto Sans JP', 'Hiragino Kaku Gothic Pro', 'メイリオ', sans-serif;
      font-size: 11px;
      line-height: 1.5;
      color: #333;
      padding: 15mm;
      background: white;
    ">
      <!-- ヘッダー -->
      <div style="text-align: center; margin-bottom: 20px;">
        <h1 style="font-size: 24px; margin: 0; letter-spacing: 8px;">請負契約書</h1>
        <p style="font-size: 16px; margin-top: 10px; color: #666;">${contract.tei_name || '○○様邸'}</p>
        ${contract.contract_number ? `<p style="font-size: 12px; color: #999;">契約番号: ${contract.contract_number}</p>` : ''}
      </div>

      <!-- ステータス -->
      <div style="text-align: right; margin-bottom: 20px;">
        <span style="
          background: ${contract.status === '契約完了' ? '#22c55e' : '#f97316'};
          color: white;
          padding: 4px 12px;
          border-radius: 4px;
          font-size: 12px;
        ">${statusLabel}</span>
      </div>

      <!-- 契約者情報 -->
      <div style="margin-bottom: 20px;">
        <h2 style="font-size: 14px; border-bottom: 2px solid #f97316; padding-bottom: 4px; margin-bottom: 10px;">
          契約者情報
        </h2>
        <table style="width: 100%; border-collapse: collapse;">
          <tr>
            <td style="width: 30%; padding: 6px; background: #f9fafb; border: 1px solid #e5e7eb;">契約者名</td>
            <td style="padding: 6px; border: 1px solid #e5e7eb;">${contract.customer_name || '-'}</td>
            <td style="width: 20%; padding: 6px; background: #f9fafb; border: 1px solid #e5e7eb;">共有者名</td>
            <td style="padding: 6px; border: 1px solid #e5e7eb;">${contract.partner_name || '-'}</td>
          </tr>
          <tr>
            <td style="padding: 6px; background: #f9fafb; border: 1px solid #e5e7eb;">名義</td>
            <td colspan="3" style="padding: 6px; border: 1px solid #e5e7eb;">${contract.ownership_type || '-'}</td>
          </tr>
        </table>
      </div>

      <!-- 担当者情報 -->
      <div style="margin-bottom: 20px;">
        <h2 style="font-size: 14px; border-bottom: 2px solid #f97316; padding-bottom: 4px; margin-bottom: 10px;">
          担当者情報
        </h2>
        <table style="width: 100%; border-collapse: collapse;">
          <tr>
            <td style="width: 25%; padding: 6px; background: #f9fafb; border: 1px solid #e5e7eb;">営業担当</td>
            <td style="width: 25%; padding: 6px; border: 1px solid #e5e7eb;">${contract.sales_person || '-'}</td>
            <td style="width: 25%; padding: 6px; background: #f9fafb; border: 1px solid #e5e7eb;">設計担当</td>
            <td style="width: 25%; padding: 6px; border: 1px solid #e5e7eb;">${contract.design_person || '-'}</td>
          </tr>
          <tr>
            <td style="padding: 6px; background: #f9fafb; border: 1px solid #e5e7eb;">工事担当</td>
            <td style="padding: 6px; border: 1px solid #e5e7eb;">${contract.construction_person || '-'}</td>
            <td style="padding: 6px; background: #f9fafb; border: 1px solid #e5e7eb;">IC担当</td>
            <td style="padding: 6px; border: 1px solid #e5e7eb;">${contract.ic_person || '-'}</td>
          </tr>
        </table>
      </div>

      <!-- 物件情報 -->
      <div style="margin-bottom: 20px;">
        <h2 style="font-size: 14px; border-bottom: 2px solid #f97316; padding-bottom: 4px; margin-bottom: 10px;">
          物件情報
        </h2>
        <table style="width: 100%; border-collapse: collapse;">
          <tr>
            <td style="width: 20%; padding: 6px; background: #f9fafb; border: 1px solid #e5e7eb;">建築地住所</td>
            <td colspan="3" style="padding: 6px; border: 1px solid #e5e7eb;">${contract.land_address || '-'}</td>
          </tr>
          <tr>
            <td style="padding: 6px; background: #f9fafb; border: 1px solid #e5e7eb;">土地面積</td>
            <td style="padding: 6px; border: 1px solid #e5e7eb;">${contract.land_area ? `${contract.land_area}坪` : '-'}</td>
            <td style="padding: 6px; background: #f9fafb; border: 1px solid #e5e7eb;">建物面積</td>
            <td style="padding: 6px; border: 1px solid #e5e7eb;">${contract.building_area ? `${contract.building_area}坪` : '-'}</td>
          </tr>
          <tr>
            <td style="padding: 6px; background: #f9fafb; border: 1px solid #e5e7eb;">商品名</td>
            <td colspan="3" style="padding: 6px; border: 1px solid #e5e7eb;">${contract.product_name || '-'}</td>
          </tr>
        </table>
      </div>

      <!-- 金額情報 -->
      <div style="margin-bottom: 20px;">
        <h2 style="font-size: 14px; border-bottom: 2px solid #f97316; padding-bottom: 4px; margin-bottom: 10px;">
          金額情報
        </h2>
        <table style="width: 100%; border-collapse: collapse;">
          <tr>
            <td style="width: 30%; padding: 6px; background: #f9fafb; border: 1px solid #e5e7eb;">建物本体価格</td>
            <td style="padding: 6px; border: 1px solid #e5e7eb; text-align: right;">${formatCurrency(contract.building_price)}</td>
            <td style="width: 30%; padding: 6px; background: #f9fafb; border: 1px solid #e5e7eb;">オプション価格</td>
            <td style="padding: 6px; border: 1px solid #e5e7eb; text-align: right;">${formatCurrency(contract.option_price)}</td>
          </tr>
          <tr>
            <td style="padding: 6px; background: #f9fafb; border: 1px solid #e5e7eb;">外構価格</td>
            <td style="padding: 6px; border: 1px solid #e5e7eb; text-align: right;">${formatCurrency(contract.exterior_price)}</td>
            <td style="padding: 6px; background: #f9fafb; border: 1px solid #e5e7eb;">その他費用</td>
            <td style="padding: 6px; border: 1px solid #e5e7eb; text-align: right;">${formatCurrency(contract.other_price)}</td>
          </tr>
          <tr>
            <td style="padding: 6px; background: #fee2e2; border: 1px solid #e5e7eb;">値引額</td>
            <td style="padding: 6px; border: 1px solid #e5e7eb; text-align: right; color: #dc2626;">-${formatCurrency(contract.discount_amount)}</td>
            <td style="padding: 6px; background: #f9fafb; border: 1px solid #e5e7eb;">消費税</td>
            <td style="padding: 6px; border: 1px solid #e5e7eb; text-align: right;">${formatCurrency(contract.tax_amount)}</td>
          </tr>
          <tr>
            <td colspan="3" style="padding: 10px; background: #fed7aa; border: 1px solid #e5e7eb; font-size: 14px; font-weight: bold;">
              合計金額（税込）
            </td>
            <td style="padding: 10px; border: 1px solid #e5e7eb; text-align: right; font-size: 18px; font-weight: bold; color: #ea580c;">
              ${formatCurrency(contract.total_amount)}
            </td>
          </tr>
        </table>
      </div>

      <!-- 支払条件 -->
      <div style="margin-bottom: 20px;">
        <h2 style="font-size: 14px; border-bottom: 2px solid #f97316; padding-bottom: 4px; margin-bottom: 10px;">
          支払条件
        </h2>
        <table style="width: 100%; border-collapse: collapse; text-align: center;">
          <tr>
            <td style="width: 25%; padding: 10px; background: #dbeafe; border: 1px solid #e5e7eb;">
              <div style="font-size: 10px; color: #666;">契約時</div>
              <div style="font-size: 14px; font-weight: bold; color: #1d4ed8;">${formatCurrency(contract.payment_at_contract)}</div>
            </td>
            <td style="width: 25%; padding: 10px; background: #f3e8ff; border: 1px solid #e5e7eb;">
              <div style="font-size: 10px; color: #666;">着工時</div>
              <div style="font-size: 14px; font-weight: bold; color: #7c3aed;">${formatCurrency(contract.payment_at_start)}</div>
            </td>
            <td style="width: 25%; padding: 10px; background: #ffedd5; border: 1px solid #e5e7eb;">
              <div style="font-size: 10px; color: #666;">上棟時</div>
              <div style="font-size: 14px; font-weight: bold; color: #ea580c;">${formatCurrency(contract.payment_at_frame)}</div>
            </td>
            <td style="width: 25%; padding: 10px; background: #dcfce7; border: 1px solid #e5e7eb;">
              <div style="font-size: 10px; color: #666;">完了時</div>
              <div style="font-size: 14px; font-weight: bold; color: #16a34a;">${formatCurrency(contract.payment_at_completion)}</div>
            </td>
          </tr>
        </table>
      </div>

      <!-- 住宅ローン -->
      ${contract.loan_type ? `
      <div style="margin-bottom: 20px;">
        <h2 style="font-size: 14px; border-bottom: 2px solid #f97316; padding-bottom: 4px; margin-bottom: 10px;">
          住宅ローン
        </h2>
        <table style="width: 100%; border-collapse: collapse;">
          <tr>
            <td style="width: 25%; padding: 6px; background: #f9fafb; border: 1px solid #e5e7eb;">ローン種類</td>
            <td style="padding: 6px; border: 1px solid #e5e7eb;">${contract.loan_type || '-'}</td>
            <td style="width: 25%; padding: 6px; background: #f9fafb; border: 1px solid #e5e7eb;">金融機関</td>
            <td style="padding: 6px; border: 1px solid #e5e7eb;">${contract.loan_bank || '-'}</td>
          </tr>
          <tr>
            <td style="padding: 6px; background: #f9fafb; border: 1px solid #e5e7eb;">借入額</td>
            <td style="padding: 6px; border: 1px solid #e5e7eb; font-weight: bold;">${formatCurrency(contract.loan_amount)}</td>
            <td style="padding: 6px; background: #f9fafb; border: 1px solid #e5e7eb;">承認状況</td>
            <td style="padding: 6px; border: 1px solid #e5e7eb;">
              <span style="
                background: ${contract.loan_approved ? '#22c55e' : '#eab308'};
                color: white;
                padding: 2px 8px;
                border-radius: 4px;
                font-size: 10px;
              ">${contract.loan_approved ? '承認済' : '申請中'}</span>
            </td>
          </tr>
        </table>
      </div>
      ` : ''}

      <!-- 承認情報 -->
      ${contract.status === '契約完了' ? `
      <div style="margin-bottom: 20px;">
        <h2 style="font-size: 14px; border-bottom: 2px solid #22c55e; padding-bottom: 4px; margin-bottom: 10px;">
          承認情報
        </h2>
        <table style="width: 100%; border-collapse: collapse;">
          <tr>
            <td style="width: 25%; padding: 6px; background: #f9fafb; border: 1px solid #e5e7eb;">作成者</td>
            <td style="padding: 6px; border: 1px solid #e5e7eb;">${contract.created_by_name || '-'}</td>
            <td style="width: 25%; padding: 6px; background: #f9fafb; border: 1px solid #e5e7eb;">作成日</td>
            <td style="padding: 6px; border: 1px solid #e5e7eb;">${formatDate(contract.created_at)}</td>
          </tr>
          <tr>
            <td style="padding: 6px; background: #f9fafb; border: 1px solid #e5e7eb;">確認者</td>
            <td style="padding: 6px; border: 1px solid #e5e7eb;">${contract.checked_by_name || '-'}</td>
            <td style="padding: 6px; background: #f9fafb; border: 1px solid #e5e7eb;">確認日</td>
            <td style="padding: 6px; border: 1px solid #e5e7eb;">${formatDate(contract.checked_at)}</td>
          </tr>
          <tr>
            <td style="padding: 6px; background: #dcfce7; border: 1px solid #e5e7eb;">承認者</td>
            <td style="padding: 6px; border: 1px solid #e5e7eb; font-weight: bold;">${contract.approved_by_name || '-'}</td>
            <td style="padding: 6px; background: #dcfce7; border: 1px solid #e5e7eb;">承認日</td>
            <td style="padding: 6px; border: 1px solid #e5e7eb; font-weight: bold;">${formatDate(contract.approved_at)}</td>
          </tr>
        </table>
      </div>
      ` : ''}

      <!-- 備考 -->
      ${contract.notes ? `
      <div style="margin-bottom: 20px;">
        <h2 style="font-size: 14px; border-bottom: 2px solid #f97316; padding-bottom: 4px; margin-bottom: 10px;">
          備考・特記事項
        </h2>
        <div style="padding: 10px; background: #f9fafb; border: 1px solid #e5e7eb; border-radius: 4px; white-space: pre-wrap;">
          ${contract.notes}
        </div>
      </div>
      ` : ''}

      <!-- フッター -->
      <div style="margin-top: 30px; padding-top: 15px; border-top: 1px solid #e5e7eb; text-align: center; color: #666; font-size: 10px;">
        <p>株式会社Gハウス</p>
        <p>出力日時: ${new Date().toLocaleString('ja-JP')}</p>
      </div>
    </div>
  `
}
