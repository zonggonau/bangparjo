import { NextResponse } from 'next/server';
import { getProductDetails } from '@/lib/cj-api';

export async function GET() {
  const res = await getProductDetails('2052267537719091202');
  return NextResponse.json(res);
}
