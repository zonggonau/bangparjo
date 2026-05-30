'use client';

import { useCart } from '@/context/CartContext';
import { useSettings } from '@/context/SettingsContext';
import { parseProductName, parseProductImage } from '@/lib/utils';
import { calculateFinalPrice } from '@/lib/pricing';
import Link from 'next/link';

function formatUSD(price: number) {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(price);
}

export default function CartPage() {
  const { items, removeFromCart, updateQuantity, totalItems, isLoaded } = useCart();
  const { settings } = useSettings();

  const subtotal = items.reduce((acc, item) => {
    const rawCjPrice = Number(item.sellPrice);
    const price = isNaN(rawCjPrice) ? 0 : calculateFinalPrice(rawCjPrice, settings);
    return acc + price * item.quantity;
  }, 0);

  const taxAmount = (subtotal * (settings.taxPct || 0)) / 100;
  const grandTotal = subtotal + taxAmount;

  if (!isLoaded) return (
    <div className="text-center py-24">
      <i className="fas fa-spinner fa-spin fa-2x text-[#FF6B00]"></i>
    </div>
  );

  if (totalItems === 0) {
    return (
      <div className="text-center py-24">
        <div className="max-w-[1400px] mx-auto px-5">
          <div className="text-6xl mb-4 opacity-30">🛒</div>
          <h1 className="text-[28px] font-bold mb-3 text-[#1A1A1A]">Your cart is empty</h1>
          <p className="text-gray-500 mb-8">Looks like you haven't added anything yet.</p>
          <Link href="/" className="inline-flex items-center justify-center px-6 py-2.5 rounded-md font-semibold bg-[#FF6B00] text-white hover:bg-[#E06000] transition-all duration-200">Browse Products</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-gray-50 min-h-screen pb-16">
      <div className="max-w-[1400px] mx-auto px-5">
        <div className="flex items-center gap-2 text-sm text-gray-500 py-4">
          <Link href="/" className="hover:text-[#FF6B00]">Home</Link>
          <span>/</span>
          <span className="text-[#1A1A1A] font-semibold">Shopping Cart</span>
        </div>
      </div>

      <section className="max-w-[1400px] mx-auto px-5">
        <h1 className="text-[32px] font-bold text-[#1A1A1A] mb-8">
          Shopping Cart <span className="text-base font-normal text-gray-500">({totalItems} items)</span>
        </h1>

        <div className="grid grid-cols-1 lg:grid-cols-[1fr_380px] gap-8">
          <div className="space-y-4">
            {items.map((item) => {
              const name = parseProductName(item.productNameEn || item.productName);
              const img = parseProductImage(item.bigImage || item.productImage);
              const rawCjPrice = Number(item.sellPrice);
              const price = isNaN(rawCjPrice) ? 0 : calculateFinalPrice(rawCjPrice, settings);

              return (
                <div key={`${item.pid}-${item.selectedVid || 'no-vid'}`} className="bg-white rounded-[10px] p-5 flex gap-5 border border-gray-200">
                  <div className="w-24 h-24 shrink-0 rounded-md overflow-hidden bg-gray-50">
                    <img src={img} alt={name} className="w-full h-full object-cover" />
                  </div>
                  <div className="flex-1 min-w-0 overflow-hidden">
                    <p className="text-xs text-gray-500 uppercase font-semibold mb-1">{item.categoryName || 'Imported'}</p>
                    <h3 className="font-semibold text-[#1A1A1A] truncate max-w-[320px]">
                      <Link href={`/product/${item.pid}`} className="hover:text-[#FF6B00]">{name}</Link>
                    </h3>
                    {item.selectedVariantName && (
                      <p className="text-[13px] text-gray-500 truncate max-w-[320px]">{item.selectedVariantName}</p>
                    )}
                    <div className="text-[#FF6B00] font-bold mt-1">{formatUSD(price)}</div>
                  </div>
                  <div className="flex flex-col items-end gap-3 shrink-0">
                    <button className="text-sm text-gray-400 hover:text-red-500 transition-colors" onClick={() => removeFromCart(item.pid, item.selectedVid)}>
                      <i className="far fa-trash-alt"></i> Remove
                    </button>
                    <div className="flex items-center border border-gray-200 rounded-md overflow-hidden">
                      <button className="w-8 h-8 flex items-center justify-center text-gray-500 hover:bg-gray-100 transition-colors" onClick={() => updateQuantity(item.pid, item.quantity - 1, item.selectedVid)}>−</button>
                      <input type="number" value={item.quantity} readOnly className="w-10 h-8 text-center text-sm font-semibold border-x border-gray-200 outline-none" />
                      <button className="w-8 h-8 flex items-center justify-center text-gray-500 hover:bg-gray-100 transition-colors" onClick={() => updateQuantity(item.pid, item.quantity + 1, item.selectedVid)}>+</button>
                    </div>
                    <div className="font-bold text-[#1A1A1A]">{formatUSD(price * item.quantity)}</div>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="bg-white rounded-[10px] p-6 border border-gray-200 h-fit sticky top-24">
            <h3 className="text-lg font-bold text-[#1A1A1A] mb-5">Order Summary</h3>
            <div className="space-y-3">
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Subtotal</span>
                <span className="font-semibold">{formatUSD(subtotal)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Tax ({settings.taxPct || 0}%)</span>
                <span className="font-semibold">{formatUSD(taxAmount)}</span>
              </div>
              <div className="border-t border-gray-200 pt-3 flex justify-between">
                <span className="font-bold text-[#1A1A1A]">Total</span>
                <span className="font-bold text-lg text-[#FF6B00]">{formatUSD(grandTotal)}</span>
              </div>
            </div>
            <Link
              href="/checkout"
              className="block text-center mt-5 px-6 py-3 bg-[#FF6B00] text-white rounded-md font-semibold hover:bg-[#E06000] transition-all duration-200"
            >
              Proceed to Checkout
            </Link>
            <Link href="/#products" className="block text-center mt-3 text-sm text-gray-500 hover:text-[#FF6B00] transition-colors">
              Continue Shopping
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
