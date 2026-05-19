'use client';

import { useCart } from '@/context/CartContext';

export default function CartCounter() {
  const { totalItems } = useCart();
  
  if (totalItems === 0) return null;

  return (
    <span className="absolute -top-1.5 -right-1.5 min-w-[18px] h-[18px] flex items-center justify-center rounded-full bg-red-500 text-white text-[10px] font-bold leading-none px-1 shadow-sm">
      {totalItems > 99 ? '99+' : totalItems}
    </span>
  );
}

