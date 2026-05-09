'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import styles from './MoodSearch.module.css';

const MOODS = [
  { label: '🔥 Trending', query: 'trending top seller' },
  { label: '🏖️ Summer Vibe', query: 'summer beach casual' },
  { label: '🎮 Gamer Setup', query: 'rgb gaming tech' },
  { label: '👗 Classy Elegant', query: 'elegant luxury jewelry' },
  { label: '🏠 Cozy Home', query: 'minimalist home decor' },
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
      // Simulate AI translation of mood to keywords
      let keywords = customMood.trim();
      if (keywords.includes('party')) keywords += ' dress outfit sparkle';
      if (keywords.includes('office')) keywords += ' formal stationery professional';
      
      router.push(`/?q=${encodeURIComponent(keywords)}`);
    }
  };

  return (
    <div className={styles.container}>
      <p className={styles.label}>Or search by AI Mood:</p>
      <div className={styles.moods}>
        {MOODS.map((m) => (
          <button 
            key={m.label} 
            className={styles.moodBtn}
            onClick={() => handleMoodClick(m.query)}
          >
            {m.label}
          </button>
        ))}
      </div>
      <form className={styles.aiInput} onSubmit={handleCustomMood}>
        <input 
          type="text" 
          placeholder="Describe your vibe (e.g. 'retro aesthetic tech')..." 
          value={customMood}
          onChange={e => setCustomMood(e.target.value)}
        />
        <button type="submit">✨ AI Discover</button>
      </form>
    </div>
  );
}
