'use client';

import { useCart } from '@/context/CartContext';
import { useSettings } from '@/context/SettingsContext';

export default function CartCounter() {
  const { items } = useCart();
  const { activeCoupons } = useSettings();

  // Filter out products that have active coupons in the database
  const filteredItems = items.filter(item => {
    // 1. If it was flagged on addition
    if ((item as any).isCouponProduct) return false;

    // 2. Or if we can find a SPECIFIC active coupon for it
    const hasSpecificCoupon = activeCoupons && activeCoupons.some(c => {
      const now = new Date();
      const isExpired = c.expiresAt ? new Date(c.expiresAt) <= now : false;
      const isExhausted = c.maxUses !== null ? c.usedCount >= c.maxUses : false;
      const isValid = c.isActive && !isExpired && !isExhausted;
      if (!isValid) return false;
      return c.products && c.products.some((pr: any) => pr.productCjId === item.pid);
    });
    return !hasSpecificCoupon;
  });
  
  const filteredTotalItems = filteredItems.reduce((acc, item) => acc + item.quantity, 0);
  
  if (filteredTotalItems === 0) return null;

  return (
    <span className="absolute -top-1.5 -right-1.5 min-w-[18px] h-[18px] flex items-center justify-center rounded-full bg-red-500 text-white text-[10px] font-bold leading-none px-1 shadow-sm">
      {filteredTotalItems > 99 ? '99+' : filteredTotalItems}
    </span>
  );
}
