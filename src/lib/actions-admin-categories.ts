'use server';

import { prisma } from './db';
import { revalidatePath } from 'next/cache';

export async function getCategoriesAction() {
  try {
    const categories = await prisma.category.findMany({
      orderBy: { createdAt: 'desc' },
      include: {
        _count: {
          select: { products: true }
        }
      }
    });
    return { success: true, data: categories };
  } catch (error: any) {
    console.error('getCategoriesAction error:', error);
    return { success: false, error: error.message };
  }
}

export async function createCategoryAction(data: { name: string, slug: string, cjId?: string }) {
  try {
    const category = await prisma.category.create({
      data: {
        name: data.name,
        slug: data.slug,
        cjId: data.cjId || undefined,
      }
    });
    revalidatePath('/dashboard/categories');
    return { success: true, data: category };
  } catch (error: any) {
    console.error('createCategoryAction error:', error);
    return { success: false, error: error.message };
  }
}

export async function updateCategoryAction(id: string, data: { name: string, slug: string, cjId?: string }) {
  try {
    const category = await prisma.category.update({
      where: { id },
      data: {
        name: data.name,
        slug: data.slug,
        cjId: data.cjId || undefined,
      }
    });
    revalidatePath('/dashboard/categories');
    return { success: true, data: category };
  } catch (error: any) {
    console.error('updateCategoryAction error:', error);
    return { success: false, error: error.message };
  }
}

export async function deleteCategoryAction(id: string) {
  try {
    await prisma.category.delete({ where: { id } });
    revalidatePath('/dashboard/categories');
    return { success: true };
  } catch (error: any) {
    console.error('deleteCategoryAction error:', error);
    return { success: false, error: error.message };
  }
}
