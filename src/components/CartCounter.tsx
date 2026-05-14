'use client';

import { useCart } from '@/context/CartContext';

export default function CartCounter() {
  const { totalItems } = useCart();
  
  if (totalItems === 0) return null;

  return (
    <span className="absolute -top-2 -right-2 w-5 h-5 bg-red-500 text-white text-[10px] font-black flex items-center justify-center rounded-full shadow-lg shadow-red-500/20 animate-in zoom-in duration-300">
      {totalItems}
    </span>
  );
}

