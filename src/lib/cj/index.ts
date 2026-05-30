export * from './client';
export * from './product';
export * from './shopping';
export * from './logistics';
export * from './dispute';

// Re-export string utility helpers for backward compatibility
export { slugify, parseProductName, parseProductImage } from '@/lib/utils';
