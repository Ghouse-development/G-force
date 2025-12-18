import { NextResponse } from 'next/server'
import { checkKintoneConnection, isKintoneEnabled } from '@/lib/kintone'

export async function GET() {
  if (!isKintoneEnabled()) {
    return NextResponse.json({
      enabled: false,
      connected: false,
      message:
        'kintone連携が設定されていません。環境変数を確認してください。',
    })
  }

  const result = await checkKintoneConnection()

  return NextResponse.json({
    enabled: true,
    ...result,
  })
}
