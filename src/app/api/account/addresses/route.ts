import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

// --- UserAddress model doesn't exist yet in schema, so we use a JSON-based approach ---

// GET /api/account/addresses?email=xxx
export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const email = searchParams.get('email');
    if (!email) return NextResponse.json({ success: false, error: 'Email is required' }, { status: 400 });

    // Stored as JSON in StoreSetting
    const setting = await prisma.storeSetting.findUnique({
      where: { key: `USER_ADDRESSES_${email}` }
    });

    const addresses = setting ? JSON.parse(setting.value) : [];
    return NextResponse.json({ success: true, data: addresses });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

// POST /api/account/addresses
export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { email, label, name, phone, line1, line2, city, state, zip, country, isDefault } = body;

    if (!email || !name || !line1 || !city || !state || !zip) {
      return NextResponse.json({ success: false, error: 'Missing required fields' }, { status: 400 });
    }

    const setting = await prisma.storeSetting.findUnique({
      where: { key: `USER_ADDRESSES_${email}` }
    });

    let addresses = setting ? JSON.parse(setting.value) : [];
    
    const newAddress = {
      id: `addr_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
      label: label || 'Home',
      name,
      phone: phone || '',
      line1,
      line2: line2 || '',
      city,
      state,
      zip,
      country: country || 'US',
      isDefault: isDefault || addresses.length === 0,
    };

    // If this is set as default, unset others
    if (newAddress.isDefault) {
      addresses = addresses.map((a: any) => ({ ...a, isDefault: false }));
    }

    addresses.push(newAddress);

    await prisma.storeSetting.upsert({
      where: { key: `USER_ADDRESSES_${email}` },
      update: { value: JSON.stringify(addresses) },
      create: { key: `USER_ADDRESSES_${email}`, value: JSON.stringify(addresses) },
    });

    return NextResponse.json({ success: true, data: newAddress });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

// PUT /api/account/addresses
export async function PUT(req: Request) {
  try {
    const body = await req.json();
    const { id, email, setDefault, ...fields } = body;

    if (!email || !id) return NextResponse.json({ success: false, error: 'Missing required fields' }, { status: 400 });

    const setting = await prisma.storeSetting.findUnique({
      where: { key: `USER_ADDRESSES_${email}` }
    });
    if (!setting) return NextResponse.json({ success: false, error: 'No addresses found' }, { status: 404 });

    let addresses = JSON.parse(setting.value);
    
    if (setDefault) {
      addresses = addresses.map((a: any) => ({ ...a, isDefault: a.id === id }));
    } else {
      addresses = addresses.map((a: any) => a.id === id ? { ...a, ...fields } : a);
    }

    await prisma.storeSetting.update({
      where: { key: `USER_ADDRESSES_${email}` },
      data: { value: JSON.stringify(addresses) },
    });

    return NextResponse.json({ success: true, data: addresses.find((a: any) => a.id === id) });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

// DELETE /api/account/addresses
export async function DELETE(req: Request) {
  try {
    const { id, email } = await req.json();
    if (!email || !id) return NextResponse.json({ success: false, error: 'Missing required fields' }, { status: 400 });

    const setting = await prisma.storeSetting.findUnique({
      where: { key: `USER_ADDRESSES_${email}` }
    });
    if (!setting) return NextResponse.json({ success: false, error: 'No addresses found' }, { status: 404 });

    let addresses = JSON.parse(setting.value);
    addresses = addresses.filter((a: any) => a.id !== id);

    // If the deleted address was default and others exist, set first as default
    if (addresses.length > 0 && !addresses.some((a: any) => a.isDefault)) {
      addresses[0].isDefault = true;
    }

    await prisma.storeSetting.update({
      where: { key: `USER_ADDRESSES_${email}` },
      data: { value: JSON.stringify(addresses) },
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
