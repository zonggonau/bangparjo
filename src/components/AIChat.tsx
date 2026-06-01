'use client';

import { useState, useRef, useEffect } from 'react';
import { getTrackingInfo } from '@/lib/cj';

export default function AIChat() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Array<{ role: 'user' | 'ai', content: string }>>([
    { role: 'ai', content: 'Hello! I am Parjo AI, your personal assistant. I can help you with product questions or track your orders in real-time. How can I help you today? 🧡' }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Listen for openAiChat custom event from product page
  useEffect(() => {
    const handler = (e: Event) => {
      const detail = (e as CustomEvent).detail;
      if (detail?.productName) {
        const productMsg = `[PRODUCT_CARD] ${JSON.stringify(detail)}`;
        setMessages(prev => {
          const lastMsg = prev[prev.length - 1];
          if (lastMsg?.content === productMsg) return prev;
          return [...prev, { role: 'user', content: productMsg }];
        });
        setTimeout(() => {
          setMessages(prev => {
             const alreadyGreeted = prev.some(m => m.content.includes("I see you're interested"));
             if (alreadyGreeted) return prev;
             return [...prev, { role: 'ai', content: `I see you're interested in **${detail.productName}**. What would you like to know about it? 😊` }];
          });
        }, 500);
      }
      setIsOpen(true);
    };
    window.addEventListener('openAiChat', handler);
    return () => window.removeEventListener('openAiChat', handler);
  }, []);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isOpen]);

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
      let aiResponse = data.text || data.reply || "I'm sorry, I encountered an error. Is OpenClaw running?";

      if (userMsg.toLowerCase().includes('track') || userMsg.toLowerCase().includes('resi')) {
        const orderIdMatch = userMsg.match(/[0-9a-zA-Z-]{10,}/);
        if (orderIdMatch) {
          const res = await getTrackingInfo(orderIdMatch[0]);
          if (res.success) {
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
    <div className="fixed bottom-8 right-4 z-[1000] flex flex-col items-end">
      {/* Chat Window */}
      {isOpen && (
        <div className="w-[min(380px,calc(100vw-32px))] h-[min(550px,calc(100vh-180px))] mb-4 flex flex-col overflow-hidden shadow-[0_8px_30px_rgba(0,0,0,0.12)] rounded-[24px] bg-white">
          {/* Header */}
          <div className="p-5 bg-[#FF6B00] text-black">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-[8px] bg-white flex items-center justify-center">
                  <i className="fas fa-robot text-[#FF6B00]"></i>
                </div>
                <div>
                  <h4 className="m-0 text-[14px] font-black uppercase tracking-[1px]">Parjo AI</h4>
                  <div className="flex items-center gap-1">
                    <span className="w-2 h-2 rounded-full bg-[#22C55E] inline-block"></span>
                    <span className="text-[10px] font-bold opacity-70">Online</span>
                  </div>
                </div>
              </div>
              <button 
                onClick={() => setIsOpen(false)}
                className="bg-none border-none cursor-pointer opacity-50 text-black"
              >
                <i className="fas fa-times"></i>
              </button>
            </div>
            <a
              href={`https://wa.me/${process.env.NEXT_PUBLIC_WHATSAPP || '628219105980'}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center gap-2 bg-[rgba(255,255,255,0.2)] text-black px-4 py-2 rounded-[12px] text-[12px] font-bold no-underline backdrop-blur-[4px]"
            >
              <i className="fab fa-whatsapp text-base"></i>
              Chat via WhatsApp (24/7)
            </a>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-5 bg-[#fcfcfc] flex flex-col gap-4" ref={scrollRef}>
            {messages.map((m, i) => {
              if (m.content.startsWith('[PRODUCT_CARD]')) {
                try {
                  const data = JSON.parse(m.content.replace('[PRODUCT_CARD] ', ''));
                  return (
                    <div key={i} className="flex justify-end">
                      <div className="max-w-[85%] p-3 rounded-[16px] rounded-br-[4px] bg-[#FFF3E8] border border-[#FF6B00]/20 flex items-center gap-3 shadow-sm">
                        <img src={data.productImage} alt="Product" className="w-14 h-14 rounded-[8px] object-cover bg-white" />
                        <div className="flex-1 overflow-hidden">
                          <div className="text-[12px] font-bold text-[#1A1A1A] line-clamp-2 leading-tight mb-1">{data.productName}</div>
                          <div className="text-[13px] font-black text-[#FF6B00]">{data.price}</div>
                        </div>
                      </div>
                    </div>
                  );
                } catch (e) {
                  return null;
                }
              }

              return (
                <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                  <div className="max-w-[85%] px-4 py-3 rounded-[16px] text-[13px] leading-[1.5]" style={{ 
                    background: m.role === 'user' ? '#FF6B00' : '#fff',
                    color: m.role === 'user' ? '#fff' : '#444',
                    boxShadow: m.role === 'user' ? '0 4px 12px rgba(255,107,53,0.2)' : '0 2px 8px rgba(0,0,0,0.05)',
                    border: m.role === 'user' ? 'none' : '1px solid #eee',
                    fontWeight: m.role === 'user' ? '600' : '500',
                    borderBottomRightRadius: m.role === 'user' ? '4px' : '16px',
                    borderBottomLeftRadius: m.role === 'ai' ? '4px' : '16px',
                  }}>
                    {m.content}
                  </div>
                </div>
              );
            })}
            {loading && (
              <div className="flex justify-start">
                <div className="bg-[#eee] px-4 py-2 rounded-[16px] text-[11px] text-[#888]">
                  <i className="fas fa-spinner fa-spin"></i> Parjo is thinking...
                </div>
              </div>
            )}
          </div>

          {/* Input */}
          <div className="p-4 bg-white border-t border-[#eee]">
            <form onSubmit={handleSend} className="flex gap-2">
              <input
                type="text"
                placeholder="Ask anything..."
                className="flex-1 border border-[#eee] rounded-[12px] px-4 py-2.5 text-[13px] outline-none"
                value={input}
                onChange={e => setInput(e.target.value)}
              />
              <button 
                type="submit"
                disabled={loading || !input.trim()}
                className="w-10 h-10 p-0 rounded-[12px] flex items-center justify-center bg-[#FF6B00] text-white font-semibold cursor-pointer transition-all duration-200 active:scale-95 shadow-lg shadow-[rgba(255,107,53,0.2)] border-none disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <i className="fas fa-paper-plane"></i>
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Toggle Button */}
      <button 
        className={`w-16 h-16 rounded-[20px] text-2xl flex items-center justify-center cursor-pointer transition-all duration-200 active:scale-95 border-none ${
          isOpen 
            ? 'bg-transparent border-2 border-[#FF6B00] text-[#FF6B00]' 
            : 'bg-[#FF6B00] text-white shadow-[0_8px_32px_rgba(255,107,53,0.3)]'
        }`}
        onClick={() => setIsOpen(!isOpen)}
      >
        {isOpen ? <i className="fas fa-times"></i> : <i className="fas fa-comment-dots"></i>}
      </button>
    </div>
  );
}
