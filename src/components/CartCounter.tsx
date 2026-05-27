'use client';

import { useCart } from '@/context/CartContext';
import { useSettings } from '@/context/SettingsContext';

export default function CartCounter() {
  const { items } = useCart();
  const { activeCoupons } = useSettings();

  const filteredItems = items;
  
  const filteredTotalItems = filteredItems.reduce((acc, item) => acc + item.quantity, 0);
  
  if (filteredTotalItems === 0) return null;

  return (
    <span className="absolute -top-1.5 -right-1.5 min-w-[18px] h-[18px] flex items-center justify-center rounded-full bg-red-500 text-white text-[10px] font-bold leading-none px-1 shadow-sm">
      {filteredTotalItems > 99 ? '99+' : filteredTotalItems}
    </span>
  );
}
