import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

// Supabase client for storage
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

const supabase = createClient(supabaseUrl, supabaseServiceKey)

// 書類カテゴリの定義（型定義として使用）
type DocumentCategory =
  | 'land_registry'      // 土地謄本
  | 'cadastral_map'      // 公図
  | 'land_survey'        // 地積測量図
  | 'land_explanation'   // 土地重説
  | 'land_contract'      // 土地契約書
  | 'road_designation'   // 位置指定道路
  | 'drivers_license'    // 運転免許証
  | 'health_insurance'   // 健康保険証
  | 'loan_preapproval'   // ローン事前審査
  | 'site_photos'        // 建築地写真
  | 'housing_map'        // 住宅地図
  | 'meeting_records'    // 議事録
  | 'other'              // その他

interface DocumentRecord {
  id: string
  customer_id: string
  category: DocumentCategory
  file_name: string
  file_type: string
  file_size: number
  storage_path: string
  uploaded_by: string | null
  uploaded_at: string
}

// GET: 顧客の書類一覧を取得
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const customerId = searchParams.get('customerId')

    if (!customerId) {
      return NextResponse.json({ error: 'customerId is required' }, { status: 400 })
    }

    // customer_documentsテーブルから取得
    const { data, error } = await supabase
      .from('customer_documents')
      .select('*')
      .eq('customer_id', customerId)
      .order('uploaded_at', { ascending: false })

    if (error) {
      console.error('Error fetching documents:', error)
      // テーブルがない場合は空配列を返す
      return NextResponse.json({ documents: [] })
    }

    // 各ドキュメントの署名付きURLを生成
    const documentsWithUrls = await Promise.all(
      (data || []).map(async (doc: DocumentRecord) => {
        const { data: signedUrl } = await supabase.storage
          .from('customer-documents')
          .createSignedUrl(doc.storage_path, 3600) // 1時間有効

        return {
          ...doc,
          url: signedUrl?.signedUrl || null,
        }
      })
    )

    return NextResponse.json({ documents: documentsWithUrls })
  } catch (error) {
    console.error('Error in GET /api/documents:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// POST: 書類をアップロード
export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const file = formData.get('file') as File
    const customerId = formData.get('customerId') as string
    const category = formData.get('category') as DocumentCategory
    const uploadedBy = formData.get('uploadedBy') as string | null

    if (!file || !customerId || !category) {
      return NextResponse.json(
        { error: 'file, customerId, and category are required' },
        { status: 400 }
      )
    }

    // ファイル名の生成（重複回避）
    const timestamp = Date.now()
    const ext = file.name.split('.').pop()
    const storagePath = `${customerId}/${category}/${timestamp}.${ext}`

    // Supabase Storageにアップロード
    const arrayBuffer = await file.arrayBuffer()
    const { error: uploadError } = await supabase.storage
      .from('customer-documents')
      .upload(storagePath, arrayBuffer, {
        contentType: file.type,
        upsert: false,
      })

    if (uploadError) {
      console.error('Storage upload error:', uploadError)
      return NextResponse.json({ error: 'Failed to upload file' }, { status: 500 })
    }

    // データベースに記録
    const { data: docRecord, error: dbError } = await supabase
      .from('customer_documents')
      .insert({
        customer_id: customerId,
        category,
        file_name: file.name,
        file_type: file.type,
        file_size: file.size,
        storage_path: storagePath,
        uploaded_by: uploadedBy,
      })
      .select()
      .single()

    if (dbError) {
      // DBエラーの場合、アップロードしたファイルを削除
      await supabase.storage.from('customer-documents').remove([storagePath])
      console.error('Database insert error:', dbError)
      return NextResponse.json({ error: 'Failed to save document record' }, { status: 500 })
    }

    // 署名付きURLを生成
    const { data: signedUrl } = await supabase.storage
      .from('customer-documents')
      .createSignedUrl(storagePath, 3600)

    return NextResponse.json({
      success: true,
      document: {
        ...docRecord,
        url: signedUrl?.signedUrl || null,
      },
    })
  } catch (error) {
    console.error('Error in POST /api/documents:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// DELETE: 書類を削除
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const documentId = searchParams.get('id')

    if (!documentId) {
      return NextResponse.json({ error: 'document id is required' }, { status: 400 })
    }

    // まずドキュメントレコードを取得
    const { data: doc, error: fetchError } = await supabase
      .from('customer_documents')
      .select('storage_path')
      .eq('id', documentId)
      .single()

    if (fetchError || !doc) {
      return NextResponse.json({ error: 'Document not found' }, { status: 404 })
    }

    // Storageから削除
    const { error: storageError } = await supabase.storage
      .from('customer-documents')
      .remove([doc.storage_path])

    if (storageError) {
      console.error('Storage delete error:', storageError)
    }

    // データベースから削除
    const { error: dbError } = await supabase
      .from('customer_documents')
      .delete()
      .eq('id', documentId)

    if (dbError) {
      console.error('Database delete error:', dbError)
      return NextResponse.json({ error: 'Failed to delete document' }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error in DELETE /api/documents:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
