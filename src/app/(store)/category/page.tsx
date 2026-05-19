import { getCategoryTree } from '@/lib/categories';
import Link from 'next/link';

export const metadata = {
  title: 'All Categories | bangparjo.shop',
  description: 'Browse all product categories on bangparjo.shop',
};

// Map kategori ke icon
const categoryIcons: Record<string, string> = {
  'Automobiles & Motorcycles': 'fa-car',
  'Bags & Shoes': 'fa-shopping-bag',
  'Computer & Office': 'fa-desktop',
  'Consumer Electronics': 'fa-laptop',
  'Health, Beauty & Hair': 'fa-sparkles',
  'Home Improvement': 'fa-tools',
  'Home, Garden & Furniture': 'fa-home',
  'Jewelry & Watches': 'fa-gem',
  "Men's Clothing": 'fa-mars',
  'Pet Supplies': 'fa-paw',
  'Phones & Accessories': 'fa-mobile-alt',
  'Sports & Outdoors': 'fa-running',
  'Toys, Kids & Babies': 'fa-gamepad',
  "Women's Clothing": 'fa-venus',
};

function getIcon(name: string): string {
  return categoryIcons[name] || 'fa-th-large';
}

export default async function AllCategoriesPage() {
  const tree = await getCategoryTree();

  return (
    <div className="py-16 sm:py-20">
      <div className="max-w-[1400px] mx-auto px-5">
        {/* Header */}
        <header className="mb-12 sm:mb-16">
          <div className="flex items-center gap-2 mb-4 sm:mb-6">
            <i className="fas fa-th-large text-[#FF6B00] text-sm"></i>
            <span className="text-[11px] sm:text-[12px] font-extrabold text-[#FF6B00] uppercase tracking-[0.1em]">Explore Everything</span>
          </div>
          <h1 className="text-[32px] sm:text-[40px] lg:text-[48px] font-black text-[#1A1A1A] leading-[1.1] mb-4">
            Browse All<br />
            <span className="text-[#FF6B00] italic">Categories</span>
          </h1>
          <p className="text-[#666666] max-w-[600px] text-[14px] sm:text-[16px] leading-relaxed">
            From fashion to electronics, find exactly what you're looking for across our curated global catalog.
          </p>
        </header>

        {/* Category Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 sm:gap-6 lg:gap-8">
          {tree.map((cat) => (
            <div 
              key={cat.id} 
              className="bg-white border border-[#E5E5E5] rounded-[16px] sm:rounded-[24px] p-6 sm:p-8 transition-all duration-300 hover:border-[#FF6B00] hover:shadow-[0_8px_25px_rgba(255,107,0,0.1)] hover:-translate-y-1"
            >
              {/* Category Header */}
              <div className="flex items-center justify-between mb-5 sm:mb-6">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-[10px] sm:rounded-[12px] bg-[#FFF3E8] flex items-center justify-center text-[#FF6B00] text-lg sm:text-xl">
                    <i className={`fas ${getIcon(cat.name)}`}></i>
                  </div>
                  <h2 className="text-[17px] sm:text-[20px] font-extrabold text-[#1A1A1A] m-0">
                    <Link href={`/category/${cat.slug}`} className="text-inherit no-underline hover:text-[#FF6B00] transition-colors duration-200">
                      {cat.name}
                    </Link>
                  </h2>
                </div>
                <i className="fas fa-chevron-right text-[12px] text-[#CCCCCC] transition-all duration-200 group-hover:text-[#FF6B00]"></i>
              </div>

              {/* Subcategories */}
              {cat.children && cat.children.length > 0 && (
                <div className="flex flex-col gap-2.5 sm:gap-3">
                  {cat.children.map((sub) => (
                    <Link 
                      key={sub.id} 
                      href={`/category/${sub.slug}`}
                      className="flex items-center gap-3 text-[13px] sm:text-[14px] font-semibold text-[#666666] no-underline transition-all duration-200 hover:text-[#FF6B00] hover:pl-1"
                    >
                      <span className="w-[5px] h-[5px] rounded-full bg-[#FF6B00] opacity-40 shrink-0"></span>
                      {sub.name}
                    </Link>
                  ))}
                </div>
              )}

              {/* View All Link */}
              <div className="mt-5 sm:mt-6 pt-4 sm:pt-5 border-t border-[#F0F0F0]">
                <Link 
                  href={`/category/${cat.slug}`}
                  className="inline-flex items-center gap-2 text-[12px] sm:text-[13px] font-bold text-[#FF6B00] no-underline transition-all duration-200 hover:gap-3"
                >
                  View All <i className="fas fa-arrow-right text-[11px]"></i>
                </Link>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

