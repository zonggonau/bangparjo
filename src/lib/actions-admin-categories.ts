'use server';

import { prisma } from './db';
import { revalidatePath } from 'next/cache';
import { startCategoryImport } from './sync-logic';
import { auth } from '@/auth';

async function checkAdmin() {
  const session = await auth();
  if (session?.user?.role !== 'ADMIN') {
    throw new Error('Unauthorized: Admin access required');
  }
  return session;
}

export async function getCategoriesAction() {
  try {
    await checkAdmin();
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
    await checkAdmin();
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
    await checkAdmin();
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
    await checkAdmin();
    await prisma.category.delete({ where: { id } });
    revalidatePath('/dashboard/categories');
    return { success: true };
  } catch (error: any) {
    console.error('deleteCategoryAction error:', error);
    return { success: false, error: error.message };
  }
}

export async function startImportCategoryAction(cjId: string) {
  if (!cjId) return { success: false, error: 'Category CJ ID is required.' };
  
  try {
    await checkAdmin();
    await startCategoryImport(cjId);
    return { success: true };
  } catch (error: any) {
    console.error('startImportCategoryAction error:', error);
    return { success: false, error: error.message };
  }
}

export async function getImportProgressAction() {
  try {
    await checkAdmin();
    const state = await prisma.autoImportState.findUnique({
      where: { id: "default" }
    });
    return { success: true, data: state };
  } catch (error: any) {
    console.error('getImportProgressAction error:', error);
    return { success: false, error: error.message };
  }
}
