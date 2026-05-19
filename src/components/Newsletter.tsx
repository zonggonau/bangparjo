'use client';

import { useState } from 'react';

export default function Newsletter() {
  const [email, setEmail] = useState('');
  const [subscribed, setSubscribed] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (email) {
      setSubscribed(true);
      setEmail('');
    }
  };

  return (
    <section className="bg-[#1A1A1A] py-20 text-center">
      <div className="max-w-[1400px] mx-auto px-5">
        {subscribed ? (
          <div className="text-white">
            <h2 className="text-4xl font-bold mb-3">Thank You!</h2>
            <p className="text-[#888888] text-base">You have successfully subscribed to our newsletter.</p>
          </div>
        ) : (
          <>
            <h2 className="text-4xl font-bold text-white mb-3">Get Exclusive Dropshipping Deals</h2>
            <p className="text-[#888888] text-base mb-8 max-w-[500px] mx-auto">Subscribe to our newsletter and get 20% off your first order plus exclusive supplier access!</p>
            <form className="flex max-w-[500px] mx-auto rounded-[50px] overflow-hidden border-2 border-[#FF6B00]" onSubmit={handleSubmit}>
              <input 
                type="email" 
                placeholder="Enter your email..." 
                required 
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="flex-1 px-6 py-4 bg-white text-[15px] text-[#1A1A1A] placeholder:text-[#888888] outline-none border-none"
              />
              <button type="submit" className="px-8 py-4 bg-[#FF6B00] text-white font-semibold text-[15px] cursor-pointer transition-all duration-300 border-none hover:bg-[#E06000]">Subscribe</button>
            </form>
          </>
        )}
      </div>
    </section>
  );
}
