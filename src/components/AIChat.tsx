'use client';

import { useState, useRef, useEffect } from 'react';
import { getTrackingInfo } from '@/lib/cj-api';
import styles from './AIChat.module.css';

export default function AIChat() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Array<{ role: 'user' | 'ai', content: string }>>([
    { role: 'ai', content: 'Hello! I am Parjo AI, your personal assistant. I can help you with product questions or track your orders in real-time. How can I help you today? 🧡' }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || loading) return;

    const userMsg = input.trim();
    setMessages(prev => [...prev, { role: 'user', content: userMsg }]);
    setInput('');
    setLoading(true);

    try {
      const response = await fetch('/api/ai/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: [...messages, { role: 'user', content: userMsg }]
        }),
      });

      const data = await response.json();
      let aiResponse = data.text || "I'm sorry, I encountered an error.";

      // Special check for tracking in the AI response
      if (userMsg.toLowerCase().includes('track') || userMsg.toLowerCase().includes('resi')) {
        const orderIdMatch = userMsg.match(/[0-9a-zA-Z-]{10,}/);
        if (orderIdMatch) {
          const res = await getTrackingInfo(orderIdMatch[0]);
          if (res.success) {
            // Cast to any — getTrackingInfo returns unknown data type
            const d = res.data as any;
            aiResponse = `Real-time Tracking Update: Order status is "${d.orderStatus}". Courier: ${d.logisticName}. Tracking number: ${d.trackNumber || 'Pending'}.\n\nGemini Assistant adds: ${aiResponse}`;
          }
        }
      }

      setMessages(prev => [...prev, { role: 'ai', content: aiResponse }]);
    } catch (e) {
      setMessages(prev => [...prev, { role: 'ai', content: "I'm offline right now. Please try again later." }]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <button className={styles.chatButton} onClick={() => setIsOpen(!isOpen)}>
        {isOpen ? '✕' : '🤖 Parjo Assistant'}
      </button>

      {isOpen && (
        <div className={styles.chatWindow}>
          <div className={styles.chatHeader}>
            <h4>Parjo Assistant</h4>
            <span>Online 24/7</span>
          </div>
          <div className={styles.chatMessages} ref={scrollRef}>
            {messages.map((m, i) => (
              <div key={i} className={`${styles.message} ${styles[m.role]}`}>
                <div className={styles.bubble}>{m.content}</div>
              </div>
            ))}
            {loading && <div className={styles.loading}>AI is thinking...</div>}
          </div>
          <form className={styles.chatInput} onSubmit={handleSend}>
            <input
              type="text"
              placeholder="Ask anything..."
              value={input}
              onChange={e => setInput(e.target.value)}
            />
            <button type="submit">Send</button>
          </form>
        </div>
      )}
    </>
  );
}
