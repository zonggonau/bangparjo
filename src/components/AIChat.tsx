'use client';

import { useState, useRef, useEffect } from 'react';
import { getTrackingInfo } from '@/lib/cj-api';
import { Bot, Send, X, Sparkles, User, MessageCircle, Loader2 } from 'lucide-react';

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
      let aiResponse = data.text || "I'm sorry, I encountered an error.";

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
    <div className="fixed bottom-8 right-8 z-[100] flex flex-col items-end">
      {/* Chat Window */}
      {isOpen && (
        <div className="mb-6 w-[380px] h-[550px] bg-black/80 backdrop-blur-2xl border border-white/10 rounded-[2.5rem] shadow-2xl flex flex-col overflow-hidden animate-in fade-in slide-in-from-bottom-10 duration-500">
          {/* Header */}
          <div className="p-6 bg-primary/10 border-b border-white/5 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-primary rounded-2xl flex items-center justify-center text-black shadow-lg shadow-primary/20">
                <Bot size={20} />
              </div>
              <div>
                <h4 className="text-sm font-black text-white uppercase tracking-widest">Parjo Assistant</h4>
                <div className="flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
                  <span className="text-[10px] font-bold text-gray-500 uppercase">Online & Ready</span>
                </div>
              </div>
            </div>
            <button 
              onClick={() => setIsOpen(false)}
              className="p-2 text-gray-500 hover:text-white transition-colors"
            >
              <X size={20} />
            </button>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-6 space-y-6 scroll-smooth" ref={scrollRef}>
            {messages.map((m, i) => (
              <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className={`flex gap-3 max-w-[85%] ${m.role === 'user' ? 'flex-row-reverse' : ''}`}>
                  <div className={`w-8 h-8 rounded-xl shrink-0 flex items-center justify-center ${m.role === 'user' ? 'bg-white/10 text-white' : 'bg-primary/20 text-primary border border-primary/20'}`}>
                    {m.role === 'user' ? <User size={14} /> : <Sparkles size={14} />}
                  </div>
                  <div className={`p-4 rounded-[1.5rem] text-sm leading-relaxed ${m.role === 'user' ? 'bg-white text-black font-medium rounded-tr-none' : 'bg-white/5 border border-white/10 text-gray-300 rounded-tl-none'}`}>
                    {m.content}
                  </div>
                </div>
              </div>
            ))}
            {loading && (
              <div className="flex justify-start">
                <div className="flex gap-3 max-w-[85%]">
                  <div className="w-8 h-8 rounded-xl bg-primary/20 text-primary border border-primary/20 flex items-center justify-center">
                    <Loader2 size={14} className="animate-spin" />
                  </div>
                  <div className="p-4 rounded-[1.5rem] rounded-tl-none bg-white/5 border border-white/10 text-gray-500 text-sm flex items-center gap-2 italic">
                    AI is processing...
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Input */}
          <form className="p-6 bg-white/5 border-t border-white/10 flex items-center gap-3" onSubmit={handleSend}>
            <input
              type="text"
              placeholder="Ask me anything..."
              className="flex-1 bg-black/50 border border-white/10 rounded-2xl px-4 py-3 text-sm text-white focus:border-primary outline-none transition-all"
              value={input}
              onChange={e => setInput(e.target.value)}
            />
            <button 
              type="submit"
              disabled={loading || !input.trim()}
              className="w-12 h-12 bg-primary text-black rounded-2xl flex items-center justify-center disabled:opacity-50 disabled:grayscale transition-all active:scale-90"
            >
              <Send size={18} />
            </button>
          </form>
        </div>
      )}

      {/* Toggle Button */}
      <button 
        className={`w-16 h-16 rounded-[1.5rem] shadow-2xl flex items-center justify-center transition-all duration-500 active:scale-90 group ${isOpen ? 'bg-white text-black rotate-90 scale-90' : 'bg-primary text-black shadow-primary/20'}`}
        onClick={() => setIsOpen(!isOpen)}
      >
        {isOpen ? <X size={24} /> : <MessageCircle size={24} className="group-hover:scale-110 transition-transform" />}
        {!isOpen && (
          <span className="absolute right-full mr-4 px-4 py-2 bg-white text-black text-[10px] font-black uppercase tracking-[0.2em] rounded-full whitespace-nowrap opacity-0 group-hover:opacity-100 translate-x-4 group-hover:translate-x-0 transition-all shadow-xl pointer-events-none">
            Need Help?
          </span>
        )}
      </button>
    </div>
  );
}

