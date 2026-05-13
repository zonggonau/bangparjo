'use client';

import { createContext, useContext, useState, useEffect } from 'react';
import { CJProduct } from '@/lib/cj-helpers';

export interface CartItem extends CJProduct {
  quantity: number;
  selectedVid?: string;   // CJ variant ID — required by createOrderV2
  selectedSku?: string;   // CJ variant SKU — fallback for createOrderV2
  selectedVariantName?: string; // Descriptive name (e.g. Size: XL, Color: Blue)
}

interface CartContextType {
  items: CartItem[];
  isLoaded: boolean;
  addToCart: (product: CJProduct, variant?: { vid: string; sku: string; name?: string }) => void;
  removeFromCart: (pid: string, vid?: string) => void;
  updateQuantity: (pid: string, quantity: number, vid?: string) => void;
  clearCart: () => void;
  totalItems: number;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    const savedCart = localStorage.getItem('cart');
    if (savedCart) {
      try {
        setItems(JSON.parse(savedCart));
      } catch (e) {
        console.error('Failed to parse cart:', e);
      }
    }
    setIsLoaded(true);
  }, []);

  useEffect(() => {
    if (isLoaded) {
      localStorage.setItem('cart', JSON.stringify(items));
    }
  }, [items, isLoaded]);

  const addToCart = (product: CJProduct, variant?: { vid: string; sku: string; name?: string }) => {
    setIsLoaded(true); // Ensure we don't overwrite if adding before first load (rare)
    setItems(prev => {
      // Find item with same PID AND same Variant ID (if applicable)
      const existing = prev.find(i => i.pid === product.pid && i.selectedVid === variant?.vid);
      if (existing) {
        return prev.map(i =>
          (i.pid === product.pid && i.selectedVid === variant?.vid)
            ? {
                ...i,
                quantity: i.quantity + 1,
              }
            : i
        );
      }
      return [
        ...prev,
        {
          ...product,
          quantity: 1,
          selectedVid: variant?.vid,
          selectedSku: variant?.sku,
          selectedVariantName: variant?.name,
        },
      ];
    });
  };

  const removeFromCart = (pid: string, vid?: string) => {
    setItems(prev => prev.filter(i => !(i.pid === pid && i.selectedVid === vid)));
  };

  const updateQuantity = (pid: string, quantity: number, vid?: string) => {
    if (quantity < 1) {
      removeFromCart(pid, vid);
      return;
    }
    setItems(prev => prev.map(i => (i.pid === pid && i.selectedVid === vid) ? { ...i, quantity } : i));
  };

  const clearCart = () => setItems([]);

  const totalItems = items.reduce((acc, item) => item.quantity + acc, 0);

  return (
    <CartContext.Provider value={{ items, isLoaded, addToCart, removeFromCart, updateQuantity, clearCart, totalItems }}>
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const context = useContext(CartContext);
  if (!context) throw new Error('useCart must be used within a CartProvider');
  return context;
}
