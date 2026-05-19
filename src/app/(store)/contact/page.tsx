'use client';

import { useState } from 'react';

export default function ContactPage() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    subject: 'Order Issue',
    message: ''
  });
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState<{ type: 'success' | 'error', msg: string } | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setStatus(null);

    try {
      const res = await fetch('/api/support/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });

      if (res.ok) {
        setStatus({ type: 'success', msg: 'Your message has been sent! We will get back to you shortly.' });
        setFormData({ name: '', email: '', subject: 'Order Issue', message: '' });
      } else {
        setStatus({ type: 'error', msg: 'Failed to send message. Please try again.' });
      }
    } catch (err) {
      setStatus({ type: 'error', msg: 'A system error occurred. Please try again.' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-[1400px] mx-auto px-5 py-16">
      <div className="text-center mb-12">
        <h1 className="text-[36px] font-black text-[#1A1A1A] mb-3">Contact Us</h1>
        <p className="text-gray-500 text-lg">Have a question? We're here to help.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-[1000px] mx-auto">
        <div className="bg-gray-50 rounded-[10px] p-8">
          <h2 className="font-bold text-lg mb-6"><i className="fas fa-info-circle text-[#FF6B00]"></i> &nbsp;Contact Information</h2>
          <p className="text-gray-500 leading-relaxed mb-8">If you have any questions about orders, returns, or products, please reach out to us through the form or channels below:</p>
          
          <div className="flex items-center gap-4 mb-6">
            <div className="flex items-center justify-center w-12 h-12 rounded-[12px] bg-white shadow-sm text-xl text-[#FF6B00]">
              <i className="fas fa-envelope"></i>
            </div>
            <div>
              <strong className="block text-xs font-bold uppercase text-gray-500">Email</strong>
              <p className="m-0 font-bold text-[#1A1A1A]">support@bangparjo.shop</p>
            </div>
          </div>

          <div className="flex items-center gap-4 mb-6">
            <div className="flex items-center justify-center w-12 h-12 rounded-[12px] bg-white shadow-sm text-xl text-[#25D366]">
              <i className="fab fa-whatsapp"></i>
            </div>
            <div>
              <strong className="block text-xs font-bold uppercase text-gray-500">WhatsApp</strong>
              <a 
                href={`https://wa.me/${process.env.NEXT_PUBLIC_WHATSAPP || '628219105980'}`} 
                target="_blank" 
                rel="noopener noreferrer"
                className="m-0 font-bold text-[#25D366] no-underline"
              >
                {(() => { const wa = process.env.NEXT_PUBLIC_WHATSAPP || '628219105980'; return `${wa.slice(2, 6)}-${wa.slice(6, 10)}-${wa.slice(10)}`; })()}
              </a>
            </div>
          </div>

          <div className="flex items-center gap-4 mb-6">
            <div className="flex items-center justify-center w-12 h-12 rounded-[12px] bg-white shadow-sm text-xl text-[#FF6B00]">
              <i className="fas fa-clock"></i>
            </div>
            <div>
              <strong className="block text-xs font-bold uppercase text-gray-500">Business Hours</strong>
              <p className="m-0 font-bold text-[#1A1A1A]">Mon - Fri: 09:00 - 18:00 WIB</p>
            </div>
          </div>
        </div>

        <form className="bg-gray-50 rounded-[10px] p-8" onSubmit={handleSubmit}>
          <h2 className="font-bold text-lg mb-6"><i className="fas fa-paper-plane text-[#FF6B00]"></i> &nbsp;Send a Message</h2>
          <div className="mb-5">
            <label className="block text-sm font-bold text-gray-700 mb-2">Full Name</label>
            <input 
              type="text" 
              placeholder="John Doe"
              value={formData.name}
              onChange={e => setFormData({...formData, name: e.target.value})}
              required 
              className="w-full px-4 py-3 rounded-[8px] border border-gray-200 outline-none text-sm focus:border-[#FF6B00]"
            />
          </div>
          <div className="mb-5">
            <label className="block text-sm font-bold text-gray-700 mb-2">Email Address</label>
            <input 
              type="email" 
              placeholder="john@example.com"
              value={formData.email}
              onChange={e => setFormData({...formData, email: e.target.value})}
              required 
              className="w-full px-4 py-3 rounded-[8px] border border-gray-200 outline-none text-sm focus:border-[#FF6B00]"
            />
          </div>
          <div className="mb-5">
            <label className="block text-sm font-bold text-gray-700 mb-2">Subject</label>
            <select 
              value={formData.subject}
              onChange={e => setFormData({...formData, subject: e.target.value})}
              className="w-full px-4 py-3 rounded-[8px] border border-gray-200 outline-none text-sm bg-white focus:border-[#FF6B00]"
            >
              <option>Order Issue</option>
              <option>Payment Question</option>
              <option>Product Inquiry</option>
              <option>Shipping Delay</option>
              <option>Other</option>
            </select>
          </div>
          <div className="mb-5">
            <label className="block text-sm font-bold text-gray-700 mb-2">Message</label>
            <textarea 
              rows={5} 
              placeholder="How can we help you?"
              value={formData.message}
              onChange={e => setFormData({...formData, message: e.target.value})}
              required 
              className="w-full px-4 py-3 rounded-[8px] border border-gray-200 outline-none text-sm focus:border-[#FF6B00]"
            ></textarea>
          </div>
          <button type="submit" disabled={loading} className="w-full px-6 py-4 rounded-md font-semibold bg-[#FF6B00] text-white hover:bg-[#E06000] transition-all duration-200 disabled:opacity-50">
            {loading ? <><i className="fas fa-spinner fa-spin"></i> Sending...</> : 'Send Message'}
          </button>

          {status && (
            <div className={`mt-6 flex items-center gap-3 p-4 rounded-[10px] text-sm font-semibold ${
              status.type === 'success' 
                ? 'bg-green-50 text-green-700 border border-green-200' 
                : 'bg-red-50 text-red-700 border border-red-200'
            }`}>
              <i className={`fas fa-${status.type === 'success' ? 'check-circle' : 'exclamation-circle'}`}></i>
              <span>{status.msg}</span>
            </div>
          )}
        </form>
      </div>
    </div>
  );
}
