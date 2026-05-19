/**
 * Admin About Page CRUD API
 *
 * GET    /api/admin/about          → Get about page
 * POST   /api/admin/about          → Create about page
 * PUT    /api/admin/about          → Update about page
 * DELETE /api/admin/about?id=xxx   → Delete about page
 */

import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export async function GET() {
  try {
    const about = await prisma.aboutPage.findFirst({
      orderBy: { createdAt: 'desc' },
    });
    return NextResponse.json({ success: true, data: about });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { title, content, image, mission, vision, published } = body;

    if (!content) {
      return NextResponse.json(
        { success: false, error: 'content is required' },
        { status: 400 }
      );
    }

    // Check if about page already exists
    const existing = await prisma.aboutPage.findFirst();
    if (existing) {
      return NextResponse.json(
        { success: false, error: 'About page already exists. Use PUT to update.' },
        { status: 409 }
      );
    }

    const about = await prisma.aboutPage.create({
      data: {
        title: title || 'About Us',
        content,
        image: image || null,
        mission: mission || null,
        vision: vision || null,
        published: published ?? true,
      },
    });

    return NextResponse.json({ success: true, data: about }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function PUT(req: Request) {
  try {
    const body = await req.json();
    const { id, title, content, image, mission, vision, published } = body;

    if (!id) {
      return NextResponse.json({ success: false, error: 'id is required' }, { status: 400 });
    }

    const existing = await prisma.aboutPage.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ success: false, error: 'About page not found' }, { status: 404 });
    }

    const about = await prisma.aboutPage.update({
      where: { id },
      data: {
        ...(title !== undefined && { title }),
        ...(content !== undefined && { content }),
        ...(image !== undefined && { image }),
        ...(mission !== undefined && { mission }),
        ...(vision !== undefined && { vision }),
        ...(published !== undefined && { published }),
      },
    });

    return NextResponse.json({ success: true, data: about });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ success: false, error: 'id is required' }, { status: 400 });
    }

    await prisma.aboutPage.delete({ where: { id } });
    return NextResponse.json({ success: true, message: 'About page deleted' });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
