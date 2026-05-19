import { prisma } from '@/lib/db';
import { slugify } from './cj-api';

export interface CategoryNode {
  id: string;
  name: string;
  slug: string;
  level: number;
  parentId?: string;
  children: CategoryNode[];
}

export async function getCategoryTree(): Promise<CategoryNode[]> {
  // Ambil semua kategori dari database
  const allCats = await prisma.category.findMany({
    orderBy: { name: 'asc' },
  });

  // Kelompokkan berdasarkan parentId
  const catMap = new Map<string, any[]>();
  const rootCats: any[] = [];

  for (const cat of allCats) {
    if (!cat.parentId) {
      rootCats.push(cat);
    } else {
      const existing = catMap.get(cat.parentId) || [];
      existing.push(cat);
      catMap.set(cat.parentId, existing);
    }
  }

  // Bangun tree secara rekursif
  function buildTree(parents: any[], level: number): CategoryNode[] {
    return parents.map((cat) => {
      const children = catMap.get(cat.id) || [];
      return {
        id: cat.cjId || cat.id,
        name: cat.name,
        slug: cat.slug,
        level,
        parentId: cat.parentId || undefined,
        children: children.length > 0 ? buildTree(children, level + 1) : [],
      };
    });
  }

  return buildTree(rootCats, 1);
}

export async function getAllCategories() {
  const tree = await getCategoryTree();
  const flat: any[] = [];

  function flatten(nodes: CategoryNode[], l1Name = '', l2Name = '') {
    for (const node of nodes) {
      if (node.level === 3) {
        flat.push({
          cjId: node.id,
          name: node.name,
          categoryL1: l1Name,
          categoryL2: l2Name,
          slug: node.slug
        });
      }
      if (node.children.length > 0) {
        flatten(
          node.children, 
          node.level === 1 ? node.name : l1Name,
          node.level === 2 ? node.name : l2Name
        );
      }
    }
  }

  flatten(tree);
  return flat;
}

export async function getCategoryBySlug(slug: string): Promise<CategoryNode | null> {
  const tree = await getCategoryTree();
  
  // Try exact match first
  let found: CategoryNode | null = null;
  
  function find(nodes: CategoryNode[]) {
    for (const node of nodes) {
      if (node.slug === slug || slug.includes(node.id)) {
        found = node;
        return;
      }
      if (node.children.length > 0) find(node.children);
      if (found) return;
    }
  }

  find(tree);
  return found;
}

export async function getCategoryById(id: string): Promise<CategoryNode | null> {
  const tree = await getCategoryTree();
  let found: CategoryNode | null = null;
  
  function find(nodes: CategoryNode[]) {
    for (const node of nodes) {
      if (node.id === id) {
        found = node;
        return;
      }
      if (node.children.length > 0) find(node.children);
      if (found) return;
    }
  }

  find(tree);
  return found;
}

export async function getCategoryHierarchy(id: string) {
  const tree = await getCategoryTree();
  let hierarchy: CategoryNode[] = [];

  function find(nodes: CategoryNode[], path: CategoryNode[]): boolean {
    for (const node of nodes) {
      const currentPath = [...path, node];
      if (node.id === id) {
        hierarchy = currentPath;
        return true;
      }
      if (node.children.length > 0) {
        if (find(node.children, currentPath)) return true;
      }
    }
    return false;
  }

  find(tree, []);
  return hierarchy;
}
