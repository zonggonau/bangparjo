import { NextResponse } from 'next/server';
import { getWarehouseDetail, getGlobalWarehouseList } from '@/lib/cj';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const id = searchParams.get('id');

  try {
    if (id) {
      // Get specific warehouse detail
      const data = await getWarehouseDetail(id);
      return NextResponse.json(data);
    } else {
      // Get global warehouse list
      const data = await getGlobalWarehouseList();
      return NextResponse.json(data);
    }
  } catch (error) {
    console.error('CJ Warehouse API Error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
