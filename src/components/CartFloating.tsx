'use client';

import Link from 'next/link';
import { useCart } from '@/context/CartContext';

export default function CartFloating() {
  const { totalItems } = useCart();

  return (
    <Link
      href="/cart"
      style={{
        position: 'fixed',
        bottom: 24,
        right: 24,
        width: 54,
        height: 54,
        borderRadius: '50%',
        background: 'linear-gradient(135deg, #3b82f6, #6366f1)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontSize: '1.4rem',
        boxShadow: '0 4px 20px rgba(59,130,246,0.4)',
        textDecoration: 'none',
        zIndex: 999,
        transition: 'transform 0.15s',
      }}
      className="cart-float-btn"
    >
      <span style={{ filter: 'brightness(10)' }}>🛒</span>
      {totalItems > 0 && (
        <span style={{
          position: 'absolute', top: -4, right: -4,
          background: '#ef4444', color: 'white',
          borderRadius: '50%', width: 22, height: 22,
          fontSize: '0.7rem', fontWeight: 700,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          border: '2px solid white',
        }}>
          {totalItems}
        </span>
      )}
      <style>{`
        .cart-float-btn:hover { transform: scale(1.1) !important; }
      `}</style>
    </Link>
  );
}
