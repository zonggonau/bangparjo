'use client';

import Link from 'next/link';
import { useCart } from '@/context/CartContext';
import { useSettings } from '@/context/SettingsContext';

export default function CartFloating() {
  const { items } = useCart();
  const { activeCoupons } = useSettings();

  const filteredItems = items;
  
  const filteredTotalItems = filteredItems.reduce((acc, item) => acc + item.quantity, 0);

  if (filteredTotalItems === 0) return null;

  return (
    <Link
      href="/cart"
      style={{
        position: 'fixed',
        bottom: '32px',
        right: '32px',
        width: '60px',
        height: '60px',
        borderRadius: '50%',
        background: 'var(--primary)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontSize: '22px',
        color: 'var(--white)',
        boxShadow: 'var(--shadow-lg)',
        zIndex: 999,
        transition: 'var(--transition)',
      }}
      className="cart-float-btn"
    >
      <i className="fas fa-shopping-bag"></i>
      {filteredTotalItems > 0 && (
        <span style={{
          position: 'absolute', 
          top: '-2px', 
          right: '-2px',
          background: 'var(--black)', 
          color: 'white',
          borderRadius: '50%', 
          width: '24px', 
          height: '24px',
          fontSize: '11px', 
          fontWeight: 700,
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'center',
          border: '2px solid var(--white)',
        }}>
          {filteredTotalItems}
        </span>
      )}
      <style>{`
        .cart-float-btn:hover { 
          transform: translateY(-5px); 
          box-shadow: 0 10px 25px rgba(255, 107, 0, 0.4);
          background: var(--primary-dark);
        }
      `}</style>
    </Link>
  );
}
