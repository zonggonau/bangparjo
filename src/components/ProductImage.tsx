'use client';

import { useState } from 'react';
import Image from 'next/image';
import { parseProductImage } from '@/lib/cj';

interface ProductImageProps {
  src: string;
  alt: string;
  className?: string;
  fill?: boolean;
  sizes?: string;
  unoptimized?: boolean;
  priority?: boolean;
  style?: React.CSSProperties;
  fallbackText?: string;
}

const PLACEHOLDER = '/placeholder.png';

export default function ProductImage({
  src,
  alt,
  className,
  fill = false,
  sizes,
  unoptimized = true,
  priority = false,
  style,
  fallbackText,
}: ProductImageProps) {
  const [imgSrc, setImgSrc] = useState<string>(() => {
    const parsed = parseProductImage(src);
    return parsed || PLACEHOLDER;
  });
  const [hasError, setHasError] = useState(false);

  const handleError = () => {
    if (!hasError) {
      setHasError(true);
      setImgSrc(PLACEHOLDER);
    }
  };

  // If we failed to load even the placeholder, show a text fallback
  if (hasError && imgSrc === PLACEHOLDER) {
    return (
      <div
        className={className}
        style={{
          ...style,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: 'var(--gray-100, #f3f4f6)',
          color: 'var(--text-muted, #9ca3af)',
          fontSize: '0.7rem',
          fontWeight: 600,
          textAlign: 'center',
          padding: '0.25rem',
          overflow: 'hidden',
        }}
      >
        {fallbackText || alt?.substring(0, 20) || '📦'}
      </div>
    );
  }

  return (
    <Image
      src={imgSrc}
      alt={alt}
      className={className}
      fill={fill}
      sizes={sizes}
      unoptimized={unoptimized}
      priority={priority}
      style={{
        ...style,
        opacity: hasError ? 0.3 : 1,
        transition: 'opacity 0.2s',
      }}
      onError={handleError}
    />
  );
}
