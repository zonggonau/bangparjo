'use client';

import { useState, useEffect } from 'react';
import styles from './LiveSales.module.css';
import Image from 'next/image';

const RECENT_SALES = [
  { name: 'Michael from New York', product: 'Wireless Earbuds', time: '2 minutes ago', icon: '🎧' },
  { name: 'Sarah from London', product: 'Premium Skincare Set', time: '5 minutes ago', icon: '💄' },
  { name: 'Ahmad from Dubai', product: 'Smart Watch Series 7', time: '1 minute ago', icon: '⌚' },
  { name: 'Elena from Madrid', product: 'Boho Summer Dress', time: '8 minutes ago', icon: '👗' },
  { name: 'Yuki from Tokyo', product: 'Mechanical Keyboard', time: '3 minutes ago', icon: '⌨️' },
  { name: 'David from Sydney', product: 'Ergonomic Desk Chair', time: '12 minutes ago', icon: '🪑' },
];

export default function LiveSales() {
  const [currentSale, setCurrentSale] = useState<typeof RECENT_SALES[0] | null>(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const showRandomSale = () => {
      const randomIdx = Math.floor(Math.random() * RECENT_SALES.length);
      setCurrentSale(RECENT_SALES[randomIdx]);
      setIsVisible(true);

      // Hide after 5 seconds
      setTimeout(() => {
        setIsVisible(false);
      }, 5000);
    };

    // Initial delay
    const initialTimer = setTimeout(showRandomSale, 10000);

    // Show every 20-30 seconds
    const interval = setInterval(() => {
      showRandomSale();
    }, Math.random() * 10000 + 20000);

    return () => {
      clearTimeout(initialTimer);
      clearInterval(interval);
    };
  }, []);

  if (!currentSale) return null;

  return (
    <div className={`${styles.container} ${isVisible ? styles.visible : styles.hidden}`}>
      <div className={styles.notification}>
        <div className={styles.iconWrapper}>
          <span className={styles.icon}>{currentSale.icon}</span>
        </div>
        <div className={styles.content}>
          <p className={styles.text}>
            <span className={styles.name}>{currentSale.name}</span> recently purchased
          </p>
          <p className={styles.product}>{currentSale.product}</p>
          <p className={styles.time}>{currentSale.time}</p>
        </div>
        <button className={styles.close} onClick={() => setIsVisible(false)}>✕</button>
      </div>
    </div>
  );
}
