import { NextResponse } from 'next/server';
import { cjFetch } from '@/lib/cj';

export async function PATCH(req: Request) {
  try {
    const body = await req.json();

    const updateData = await cjFetch('/v1/setting/account/set', {
      method: 'PATCH',
      body: JSON.stringify(body)
    });

    return NextResponse.json(updateData);
  } catch (error) {
    console.error('CJ Settings Update Error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
