'use client';

import { useCart } from '@/context/CartContext';
import styles from './CartCounter.module.css';

export default function CartCounter() {
  const { totalItems } = useCart();
  
  if (totalItems === 0) return null;

  return <span className={styles.counter}>{totalItems}</span>;
}
