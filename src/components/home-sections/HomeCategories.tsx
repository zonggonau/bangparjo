import { prisma } from '@/lib/db';
import Link from 'next/link';

// Map kategori ke icon yang sesuai
const categoryIcons: Record<string, string> = {
  'Automobiles & Motorcycles': '🚗',
  'Bags & Shoes': '👟',
  'Computer & Office': '💻',
  'Consumer Electronics': '📱',
  'Health, Beauty & Hair': '💄',
  'Home Improvement': '🔧',
  'Home, Garden & Furniture': '🏠',
  'Jewelry & Watches': '💎',
  "Men's Clothing": '👔',
  'Pet Supplies': '🐾',
  'Phones & Accessories': '📞',
  'Sports & Outdoors': '⚽',
  'Toys, Kids & Babies': '🧸',
  "Women's Clothing": '👗',
};

// Fallback icon jika tidak ada mapping
function getIcon(name: string): string {
  return categoryIcons[name] || '📦';
}

async function getCategories() {
  const categories = await prisma.category.findMany({
    where: { parentId: null },
    orderBy: { name: 'asc' },
  });

  return categories;
}

export default async function HomeCategories() {
  const categories = await getCategories();

  if (categories.length === 0) return null;

  return (
    <section className="py-20">
      <div className="max-w-[1400px] mx-auto px-5">
        <h2 className="text-[24px] sm:text-[28px] lg:text-[32px] font-bold text-center mb-3 text-[#1A1A1A]">Product Categories</h2>
        <p className="text-center text-[#888888] text-sm sm:text-base mb-8 sm:mb-12">Find trending products for your dropshipping store</p>
        
        {/* Responsive grid - auto fills based on screen width */}
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-7 gap-2 sm:gap-3">
          {categories.map((cat) => (
            <Link
              key={cat.id}
              href={`/category/${cat.slug}`}
              className="flex flex-col items-center justify-center gap-1.5 bg-white border border-[#E5E5E5] rounded-[8px] sm:rounded-[10px] p-2 sm:p-4 text-center no-underline transition-all duration-300 cursor-pointer hover:border-[#FF6B00] hover:shadow-[0_1px_3px_rgba(0,0,0,0.08)] hover:-translate-y-0.5"
            >
              <span className="text-[22px] sm:text-[28px] leading-none">{getIcon(cat.name)}</span>
              <span className="text-[10px] sm:text-[12px] font-medium text-[#555555] leading-[1.2] break-words">{cat.name}</span>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
