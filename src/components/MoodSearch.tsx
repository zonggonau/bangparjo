'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

const MOODS = [
  { label: 'Trending', icon: '🔥', query: 'trending top seller' },
  { label: 'Summer Vibe', icon: '🏖️', query: 'summer beach casual' },
  { label: 'Gamer Setup', icon: '🎮', query: 'rgb gaming tech' },
  { label: 'Classy Elegant', icon: '👗', query: 'elegant luxury jewelry' },
  { label: 'Cozy Home', icon: '🏠', query: 'minimalist home decor' },
];

export default function MoodSearch() {
  const router = useRouter();
  const [customMood, setCustomMood] = useState('');

  const handleMoodClick = (query: string) => {
    router.push(`/?q=${encodeURIComponent(query)}`);
  };

  const handleCustomMood = (e: React.FormEvent) => {
    e.preventDefault();
    if (customMood.trim()) {
      let keywords = customMood.trim();
      if (keywords.includes('party')) keywords += ' dress outfit sparkle';
      if (keywords.includes('office')) keywords += ' formal stationery professional';
      
      router.push(`/?q=${encodeURIComponent(keywords)}`);
    }
  };

  return (
    <div className="container" style={{ marginTop: '2rem' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '1rem' }}>
        <i className="fas fa-magic" style={{ color: 'var(--primary)', fontSize: '12px' }}></i>
        <p style={{ fontSize: '12px', fontWeight: '800', color: 'var(--gray-500)', textTransform: 'uppercase', letterSpacing: '0.1em' }}>Curated Moods</p>
      </div>

      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px', marginBottom: '1.5rem' }}>
        {MOODS.map((m) => (
          <button 
            key={m.label} 
            className="btn btn-outline btn-sm"
            style={{ borderRadius: '50px', padding: '8px 20px', border: '1px solid var(--gray-200)', color: 'var(--black)' }}
            onClick={() => handleMoodClick(m.query)}
          >
            <span style={{ marginRight: '8px' }}>{m.icon}</span>
            <span>{m.label}</span>
          </button>
        ))}
      </div>

      <form 
        onSubmit={handleCustomMood}
        style={{ 
          display: 'flex', 
          background: 'var(--gray-50)', 
          border: '1px solid var(--gray-200)', 
          borderRadius: 'var(--radius-md)', 
          padding: '8px',
          alignItems: 'center',
          gap: '12px'
        }}
      >
        <i className="fas fa-bolt" style={{ color: 'var(--gray-300)', marginLeft: '12px' }}></i>
        <input 
          type="text" 
          placeholder="Describe your vibe (e.g. 'retro aesthetic tech')..." 
          style={{ flex: 1, background: 'transparent', border: 'none', padding: '10px 0', fontSize: '14px' }}
          value={customMood}
          onChange={e => setCustomMood(e.target.value)}
        />
        <button 
          type="submit"
          className="btn btn-primary"
          style={{ padding: '10px 24px', borderRadius: 'var(--radius-sm)' }}
        >
          <i className="fas fa-sparkles"></i> Discover
        </button>
      </form>
    </div>
  );
}

