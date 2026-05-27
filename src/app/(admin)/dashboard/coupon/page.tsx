import { redirect } from 'next/navigation';

export const dynamic = 'force-dynamic';

export default function CouponManagementPage() {
  // Coupon system has been removed
  redirect('/dashboard');
}
