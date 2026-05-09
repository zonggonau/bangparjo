import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { DEFAULT_SETTINGS, StoreSettings } from '@/lib/pricing';

export async function GET() {
  console.log('[API] GET /api/settings - Starting fetch');
  try {
    console.log('[API] Querying Prisma for settings...');
    const dbSettings = await prisma.storeSetting.findMany();
    const dbTiers = await prisma.marginTier.findMany({
      orderBy: { min: 'asc' }
    });

    // Merge settings
    const settings: any = { ...DEFAULT_SETTINGS };
    dbSettings.forEach(s => {
      try {
        settings[s.key] = JSON.parse(s.value);
      } catch {
        settings[s.key] = s.value;
      }
    });

    if (dbSettings.length > 0) {
      settings.marginTiers = dbTiers.map(t => ({
        min: t.min,
        max: t.max,
        pct: t.pct
      }));
    } else if (dbTiers.length > 0) {
      settings.marginTiers = dbTiers.map(t => ({
        min: t.min,
        max: t.max,
        pct: t.pct
      }));
    }

    return NextResponse.json(settings);
  } catch (error: any) {
    console.error('Fetch settings error:', error);
    return NextResponse.json({
      ...DEFAULT_SETTINGS,
      error: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const data: StoreSettings = await req.json();

    // Update settings table
    const keys = Object.keys(data).filter(k => k !== 'marginTiers');
    for (const key of keys) {
      const val = (data as any)[key];
      await prisma.storeSetting.upsert({
        where: { key },
        update: { value: JSON.stringify(val) },
        create: { key, value: JSON.stringify(val) },
      });
    }

    // Update tiers table
    if (data.marginTiers) {
      // Delete old tiers
      await prisma.marginTier.deleteMany();
      // Insert new tiers
      await prisma.marginTier.createMany({
        data: data.marginTiers.map(t => ({
          min: t.min,
          max: t.max,
          pct: t.pct
        }))
      });
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Update settings error:', error);
    return NextResponse.json({ 
      success: false, 
      error: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined 
    }, { status: 500 });
  }
}
