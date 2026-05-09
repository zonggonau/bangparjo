'use client';

import { useState, useEffect, useRef } from 'react';

export default function ChatbotWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<{ role: 'user' | 'bot', text: string }[]>([
    { role: 'bot', text: 'Hello! How can we help you today? 👋' }
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
    if (!input.trim()) return;

    const userMsg = input.trim();
    setMessages(prev => [...prev, { role: 'user', text: userMsg }]);
    setInput('');
    setLoading(true);

    // Simulated Automatic Responses (Can be connected to OpenAI later)
    setTimeout(() => {
      let botResponse = "Sorry, our assistants are currently busy. Please leave a message on the Contact Us page so our team can get back to you.";
      
      if (userMsg.toLowerCase().includes('bayar') || userMsg.toLowerCase().includes('payment')) {
        botResponse = "We accept payments via Midtrans (QRIS, VA Bank) for Indonesia and PayPal for international customers.";
      } else if (userMsg.toLowerCase().includes('kirim') || userMsg.toLowerCase().includes('shipping') || userMsg.toLowerCase().includes('ongkir')) {
        botResponse = "We ship worldwide! Shipping costs will be automatically calculated when you enter your address on the Checkout page.";
      } else if (userMsg.toLowerCase().includes('track') || userMsg.toLowerCase().includes('resi')) {
        botResponse = "You can track your order on the 'Track My Order' page using your order number.";
      }

      setMessages(prev => [...prev, { role: 'bot', text: botResponse }]);
      setLoading(false);
    }, 1000);
  };

  return (
    <div style={{ position: 'fixed', bottom: '2rem', right: '2rem', zIndex: 9999, fontFamily: 'Inter, sans-serif' }}>
      {/* Chat Window */}
      {isOpen && (
        <div style={{
          width: '350px', height: '500px', background: 'white', borderRadius: '16px',
          boxShadow: '0 10px 25px rgba(0,0,0,0.15)', display: 'flex', flexDirection: 'column',
          overflow: 'hidden', border: '1px solid #e4e4e7', marginBottom: '1rem'
        }}>
          {/* Header */}
          <div style={{ background: '#18181b', color: 'white', padding: '1rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <div style={{ width: '10px', height: '10px', background: '#22c55e', borderRadius: '50%' }}></div>
              <span style={{ fontWeight: 600, fontSize: '0.9rem' }}>Customer Assistant</span>
            </div>
            <button onClick={() => setIsOpen(false)} style={{ background: 'transparent', border: 'none', color: 'white', cursor: 'pointer', fontSize: '1.2rem' }}>×</button>
          </div>

          {/* Messages Container */}
          <div ref={scrollRef} style={{ flex: 1, padding: '1rem', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            {messages.map((m, i) => (
              <div key={i} style={{
                maxWidth: '80%', padding: '0.75rem', borderRadius: '12px', fontSize: '0.85rem', lineHeight: '1.4',
                alignSelf: m.role === 'user' ? 'flex-end' : 'flex-start',
                background: m.role === 'user' ? '#18181b' : '#f4f4f5',
                color: m.role === 'user' ? 'white' : '#09090b',
              }}>
                {m.text}
              </div>
            ))}
            {loading && <div style={{ fontSize: '0.75rem', color: '#71717a' }}>Assistant is typing...</div>}
          </div>

          {/* Input Area */}
          <form onSubmit={handleSend} style={{ padding: '1rem', borderTop: '1px solid #e4e4e7', display: 'flex', gap: '0.5rem' }}>
            <input 
              type="text" 
              placeholder="Type a message..." 
              value={input}
              onChange={(e) => setInput(e.target.value)}
              style={{ flex: 1, padding: '0.5rem', border: '1px solid #e4e4e7', borderRadius: '6px', outline: 'none', fontSize: '0.85rem' }}
            />
            <button type="submit" style={{ background: '#18181b', color: 'white', border: 'none', padding: '0.5rem 1rem', borderRadius: '6px', cursor: 'pointer' }}>
              ➤
            </button>
          </form>
        </div>
      )}

      {/* Floating Toggle Button */}
      <button 
        onClick={() => setIsOpen(!isOpen)}
        style={{
          width: '60px', height: '60px', borderRadius: '50%', background: '#18181b', color: 'white',
          border: 'none', cursor: 'pointer', fontSize: '1.5rem', boxShadow: '0 4px 12px rgba(0,0,0,0.2)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'transform 0.2s'
        }}
        onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.1)'}
        onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}
      >
        {isOpen ? '↓' : '💬'}
      </button>
    </div>
  );
}
