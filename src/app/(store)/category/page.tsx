import { getCategoryTree } from '@/lib/categories';
import Link from 'next/link';

export const metadata = {
  title: 'All Categories | bangparjo.shop',
  description: 'Browse all product categories on bangparjo.shop',
};

// Map kategori ke icon spesifik (Exact Match)
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

// Keyword mapping untuk auto-detect kategori yang tidak ada di exact match
function getIcon(name: string): string {
  if (categoryIcons[name]) return categoryIcons[name];

  const lowerName = name.toLowerCase();
  
  if (lowerName.includes('auto') || lowerName.includes('car') || lowerName.includes('vehicle')) return 'fa-car';
  if (lowerName.includes('bag') || lowerName.includes('luggage') || lowerName.includes('shoe')) return 'fa-shopping-bag';
  if (lowerName.includes('computer') || lowerName.includes('office') || lowerName.includes('laptop')) return 'fa-laptop';
  if (lowerName.includes('electronic') || lowerName.includes('tech') || lowerName.includes('gadget')) return 'fa-microchip';
  if (lowerName.includes('health') || lowerName.includes('beauty') || lowerName.includes('makeup') || lowerName.includes('hair')) return 'fa-sparkles';
  if (lowerName.includes('tool') || lowerName.includes('improvement') || lowerName.includes('hardware')) return 'fa-tools';
  if (lowerName.includes('home') || lowerName.includes('garden') || lowerName.includes('furniture') || lowerName.includes('decor')) return 'fa-couch';
  if (lowerName.includes('jewel') || lowerName.includes('watch') || lowerName.includes('ring')) return 'fa-gem';
  if (lowerName.includes('men') && lowerName.includes('cloth')) return 'fa-user-tie';
  if (lowerName.includes('pet') || lowerName.includes('dog') || lowerName.includes('cat')) return 'fa-paw';
  if (lowerName.includes('phone') || lowerName.includes('mobile') || lowerName.includes('accessory')) return 'fa-mobile-alt';
  if (lowerName.includes('sport') || lowerName.includes('outdoor') || lowerName.includes('fitness')) return 'fa-dumbbell';
  if (lowerName.includes('toy') || lowerName.includes('kid') || lowerName.includes('baby')) return 'fa-baby-carriage';
  if (lowerName.includes('women') && lowerName.includes('cloth')) return 'fa-female';
  if (lowerName.includes('apparel') || lowerName.includes('cloth') || lowerName.includes('fashion')) return 'fa-tshirt';
  if (lowerName.includes('camera') || lowerName.includes('photo')) return 'fa-camera';
  if (lowerName.includes('music') || lowerName.includes('instrument') || lowerName.includes('audio')) return 'fa-music';
  if (lowerName.includes('book') || lowerName.includes('magazine')) return 'fa-book';
  if (lowerName.includes('art') || lowerName.includes('craft')) return 'fa-palette';
  if (lowerName.includes('kitchen') || lowerName.includes('dining')) return 'fa-utensils';
  if (lowerName.includes('gift') || lowerName.includes('party')) return 'fa-gift';
  if (lowerName.includes('food') || lowerName.includes('grocery')) return 'fa-shopping-basket';
  
  return 'fa-box-open'; // Ikon default yang lebih bagus dari fa-th-large
}

export default async function AllCategoriesPage() {
  const tree = await getCategoryTree();

  return (
    <div className="relative min-h-screen bg-[#FDFDFD] overflow-hidden">
      {/* Dynamic Background Blobs */}
      <div className="absolute top-0 left-0 w-full h-[500px] bg-gradient-to-br from-[#FFF3E8] to-transparent opacity-60 pointer-events-none -z-10"></div>
      <div className="absolute -top-[200px] -right-[200px] w-[600px] h-[600px] bg-[#FF6B00] rounded-full blur-[120px] opacity-10 pointer-events-none -z-10 animate-pulse" style={{ animationDuration: '8s' }}></div>
      <div className="absolute top-[300px] -left-[150px] w-[400px] h-[400px] bg-[#FFB800] rounded-full blur-[100px] opacity-10 pointer-events-none -z-10 animate-pulse" style={{ animationDuration: '10s' }}></div>

      <div className="py-16 sm:py-24 max-w-[1400px] mx-auto px-5 relative z-10">
        
        {/* Header Section */}
        <header className="mb-16 sm:mb-20 text-center flex flex-col items-center">
          <div className="inline-flex items-center gap-2 mb-6 px-4 py-2 rounded-full bg-[#FFF3E8] border border-[#FFE4CC] shadow-sm">
            <i className="fas fa-compass text-[#FF6B00] text-sm animate-spin-slow"></i>
            <span className="text-[12px] font-extrabold text-[#FF6B00] uppercase tracking-[0.15em]">Explore The Catalog</span>
          </div>
          <h1 className="text-[40px] sm:text-[56px] lg:text-[72px] font-black text-[#1A1A1A] leading-[1.1] mb-6 tracking-tight">
            Discover <br className="sm:hidden" />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#FF6B00] to-[#FF3300] italic pr-2">Every Category</span>
          </h1>
          <p className="text-[#666666] max-w-[650px] text-[16px] sm:text-[18px] leading-relaxed">
            Navigate through our curated global collections. From cutting-edge electronics to the latest fashion trends, everything you need is right here.
          </p>
        </header>

        {/* Category Grid (Bento Box Style) */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 sm:gap-8">
          {tree.map((cat, index) => {
            // Memberikan sedikit variasi grid untuk estetika
            const isFeatured = index === 0 || index === 5;
            
            return (
              <div 
                key={cat.id} 
                className={`group relative flex flex-col bg-white/70 backdrop-blur-md border border-[#E5E5E5]/60 rounded-[24px] p-6 sm:p-8 transition-all duration-500 hover:border-[#FF6B00]/40 hover:bg-white hover:shadow-[0_20px_40px_-15px_rgba(255,107,0,0.15)] hover:-translate-y-2 ${isFeatured ? 'md:col-span-2 lg:col-span-2 xl:col-span-2' : ''}`}
              >
                {/* Glow effect on hover */}
                <div className="absolute inset-0 rounded-[24px] bg-gradient-to-br from-[#FF6B00]/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"></div>
                
                {/* Category Header */}
                <div className="relative z-10 flex items-start justify-between mb-6">
                  <div className="flex items-center gap-4">
                    <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-[16px] bg-gradient-to-br from-[#FFF3E8] to-[#FFE4CC] flex items-center justify-center text-[#FF6B00] text-2xl shadow-inner transition-transform duration-500 group-hover:scale-110 group-hover:rotate-3">
                      <i className={`fas ${getIcon(cat.name)}`}></i>
                    </div>
                    <div>
                      <h2 className="text-[20px] sm:text-[22px] font-extrabold text-[#1A1A1A] m-0 leading-tight">
                        <Link href={`/category/${cat.slug}`} className="text-inherit no-underline before:absolute before:inset-0">
                          {cat.name}
                        </Link>
                      </h2>
                      <span className="text-[13px] font-medium text-gray-500 mt-1 block">
                        {cat.children?.length || 0} Subcategories
                      </span>
                    </div>
                  </div>
                  <div className="w-8 h-8 rounded-full bg-gray-50 flex items-center justify-center border border-gray-100 text-gray-400 transition-all duration-300 group-hover:bg-[#FF6B00] group-hover:text-white group-hover:border-[#FF6B00] group-hover:shadow-md">
                    <i className="fas fa-arrow-right text-[12px] -rotate-45 group-hover:rotate-0 transition-transform duration-300"></i>
                  </div>
                </div>

                {/* Subcategories (Pills) */}
                <div className="relative z-10 mt-auto pt-2">
                  {cat.children && cat.children.length > 0 ? (
                    <div className="flex flex-wrap gap-2">
                      {cat.children.slice(0, isFeatured ? 8 : 4).map((sub) => (
                        <Link 
                          key={sub.id} 
                          href={`/category/${sub.slug}`}
                          className="relative z-20 inline-flex items-center px-3 py-1.5 rounded-full bg-gray-50 border border-gray-100 text-[12px] sm:text-[13px] font-semibold text-[#555] no-underline transition-all duration-300 hover:bg-[#FFF3E8] hover:text-[#FF6B00] hover:border-[#FFE4CC]"
                        >
                          {sub.name}
                        </Link>
                      ))}
                      {cat.children.length > (isFeatured ? 8 : 4) && (
                        <Link 
                          href={`/category/${cat.slug}`}
                          className="relative z-20 inline-flex items-center px-3 py-1.5 rounded-full bg-gray-100/50 text-[12px] sm:text-[13px] font-bold text-gray-500 no-underline hover:text-[#1A1A1A] transition-colors duration-200"
                        >
                          +{cat.children.length - (isFeatured ? 8 : 4)} more
                        </Link>
                      )}
                    </div>
                  ) : (
                    <p className="text-[13px] text-gray-400 italic m-0">No subcategories available</p>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
