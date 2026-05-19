import { NextResponse } from 'next/server';
import { getCategoryTree } from '@/lib/categories';

export async function GET() {
  try {
    const tree = await getCategoryTree();
    // Ambil level 1, 2, dan 3 untuk mega menu yang detail
    const menuData = tree.map(l1 => ({
      id: l1.id,
      name: l1.name,
      slug: l1.slug,
      children: l1.children.map(l2 => ({
        id: l2.id,
        name: l2.name,
        slug: l2.slug,
        children: l2.children.map(l3 => ({
          id: l3.id,
          name: l3.name,
          slug: l3.slug,
        }))
      }))
    }));

    return NextResponse.json({ success: true, data: menuData });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message });
  }
}
