import { NextRequest, NextResponse } from 'next/server'
import { customerDb } from '@/lib/db'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status')
    const assignedTo = searchParams.get('assignedTo')

    let customers
    if (status) {
      customers = await customerDb.getByStatus(status as never)
    } else if (assignedTo) {
      customers = await customerDb.getByAssignee(assignedTo)
    } else {
      customers = await customerDb.getAll()
    }

    return NextResponse.json({ data: customers })
  } catch (error) {
    console.error('GET /api/customers error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch customers' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const customer = await customerDb.create(body)
    return NextResponse.json({ data: customer }, { status: 201 })
  } catch (error) {
    console.error('POST /api/customers error:', error)
    return NextResponse.json(
      { error: 'Failed to create customer' },
      { status: 500 }
    )
  }
}
