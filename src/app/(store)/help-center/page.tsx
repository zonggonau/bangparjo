import React from 'react';
import { Metadata } from 'next';
import Link from 'next/link';
import { 
  Search, 
  Truck, 
  RefreshCcw, 
  CreditCard, 
  HelpCircle, 
  ChevronRight, 
  MessageCircle, 
  ShieldCheck,
  ArrowRight,
  Plus,
  Mail,
  Zap
} from 'lucide-react';

export const metadata: Metadata = {
  title: 'Help Center — bangparjo.shop',
  description: 'Find answers, track your order, and contact our support team.',
};

export default function HelpCenter() {
  return (
    <div className="min-h-screen bg-[#07070e] text-[#f0f0f6] selection:bg-primary selection:text-white">
      {/* Hero Section */}
      <section className="relative pt-32 pb-24 md:pt-48 md:pb-40 overflow-hidden">
        {/* Background Gradients */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-full bg-gradient-to-b from-primary/5 to-transparent pointer-events-none" />
        <div className="absolute -top-24 left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-primary/10 blur-[120px] rounded-full pointer-events-none" />
        
        <div className="container mx-auto px-6 relative z-10 text-center space-y-8 animate-in fade-in slide-in-from-top-10 duration-1000">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-primary/10 border border-primary/20 rounded-full text-[10px] font-black text-primary uppercase tracking-[0.3em]">
             <ShieldCheck size={12} /> Knowledge Terminal
          </div>
          <h1 className="text-5xl md:text-8xl font-black text-white uppercase italic tracking-tighter leading-none">
            How can we <span className="text-glow">Help?</span>
          </h1>
          <p className="text-sm md:text-base font-bold text-white/30 uppercase tracking-[0.3em] max-w-2xl mx-auto">
            Search our intelligence database or browse operational protocols.
          </p>
          
          <div className="max-w-2xl mx-auto mt-12 relative group">
            <div className="absolute inset-0 bg-primary/10 blur-xl opacity-0 group-focus-within:opacity-100 transition-opacity" />
            <div className="relative flex items-center bg-white/5 border border-white/5 rounded-3xl p-2 backdrop-blur-2xl group-focus-within:border-primary/30 transition-all">
              <div className="pl-6 pr-4 text-white/20">
                <Search size={24} />
              </div>
              <input 
                type="text" 
                placeholder="Search for tracking, returns, payments..." 
                className="flex-1 bg-transparent border-none py-4 text-sm font-bold text-white placeholder:text-white/10 focus:outline-none"
              />
              <button className="px-8 py-4 bg-primary text-black rounded-2xl font-black text-[10px] uppercase tracking-widest hover:scale-105 active:scale-95 transition-all">
                Search
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Quick Links Grid */}
      <section className="pb-32 relative z-10">
        <div className="container mx-auto px-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <HelpCard 
              icon={Truck} 
              title="Logistics" 
              desc="Track global orders and view shipping policies." 
              link="/track"
              linkText="Track Order"
            />
            <HelpCard 
              icon={RefreshCcw} 
              title="Resolutions" 
              desc="Learn about our 30-day money-back guarantee." 
              link="/refund"
              linkText="Read Policy"
            />
            <HelpCard 
              icon={CreditCard} 
              title="Financials" 
              desc="Accepted payment methods and currency protocols." 
              link="/terms"
              linkText="View Details"
            />
            <HelpCard 
              icon={HelpCircle} 
              title="FAQs" 
              desc="Answers to common questions about our terminal." 
              link="#faqs"
              linkText="Browse FAQs"
            />
          </div>
        </div>
      </section>

      {/* FAQs Section */}
      <section className="py-32 bg-white/[0.02] border-y border-white/5" id="faqs">
        <div className="container mx-auto px-6">
          <div className="max-w-4xl mx-auto">
            <div className="text-center mb-20 space-y-4">
              <h2 className="text-3xl md:text-5xl font-black text-white uppercase italic tracking-tighter">Frequently Asked <span className="text-primary">Questions</span></h2>
              <p className="text-[10px] font-bold text-white/20 uppercase tracking-[0.4em]">Operational baseline and general protocols.</p>
            </div>
            
            <div className="space-y-4">
              <FaqItem 
                question="How long does shipping take?"
                answer="Since we source products globally, shipping times vary depending on your location and the supplier's location. Typically, deliveries take between 7 to 15 business days. You can track your order using your tracking number."
              />
              <FaqItem 
                question="Do you ship internationally?"
                answer="Yes! We offer worldwide shipping to most countries. Shipping fees and delivery times will be calculated at checkout based on your delivery address."
              />
              <FaqItem 
                question="What is your return policy?"
                answer="We offer a 30-day return policy for most items. If you are not satisfied with your purchase, please contact our support team within 30 days of receiving the item to initiate a return or exchange."
              />
              <FaqItem 
                question="How can I contact customer support?"
                answer="You can reach out to us via the AI Chat on the bottom right corner of the screen, or email us at support@bangparjo.shop. We aim to respond to all inquiries within 24 hours."
              />
            </div>
          </div>
        </div>
      </section>

      {/* Contact Banner */}
      <section className="py-40 overflow-hidden relative">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-full bg-primary/5 blur-[150px] rounded-full pointer-events-none" />
        
        <div className="container mx-auto px-6 relative z-10">
          <div className="max-w-5xl mx-auto bg-white/5 border border-white/10 rounded-[4rem] p-12 md:p-24 text-center backdrop-blur-3xl relative overflow-hidden group">
            <div className="absolute top-0 right-0 p-12 opacity-5">
              <Zap size={200} className="text-primary" />
            </div>
            
            <h2 className="text-4xl md:text-6xl font-black text-white uppercase italic tracking-tighter mb-8 leading-none">
              Still need <span className="text-primary text-glow">Assistance?</span>
            </h2>
            <p className="text-sm md:text-lg text-white/40 font-bold uppercase tracking-widest max-w-2xl mx-auto mb-12 leading-relaxed">
              Our support nodes are always active and ready to assist you with any questions or concerns.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-6">
              <Link href="/contact" className="w-full sm:w-auto px-12 py-6 bg-primary text-black rounded-[2rem] font-black text-xs uppercase tracking-[0.3em] shadow-lg shadow-primary/20 hover:scale-105 active:scale-95 transition-all flex items-center justify-center gap-3">
                 Secure Transmission <ArrowRight size={18} />
              </Link>
              <a href="mailto:support@bangparjo.shop" className="w-full sm:w-auto px-12 py-6 bg-white/5 border border-white/5 text-white rounded-[2rem] font-black text-xs uppercase tracking-[0.3em] hover:bg-white/10 transition-all flex items-center justify-center gap-3">
                <Mail size={18} /> support@bangparjo.shop
              </a>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}

function HelpCard({ icon: Icon, title, desc, link, linkText }: any) {
  return (
    <div className="bg-white/5 border border-white/5 rounded-[2.5rem] p-10 space-y-6 hover:border-primary/20 transition-all duration-500 group relative overflow-hidden backdrop-blur-xl">
      <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 blur-3xl rounded-full pointer-events-none group-hover:bg-primary/10 transition-all" />
      <div className="w-16 h-16 bg-primary/10 rounded-2xl flex items-center justify-center text-primary border border-primary/20 group-hover:scale-110 transition-transform">
        <Icon size={32} />
      </div>
      <div className="space-y-4">
        <h3 className="text-2xl font-black text-white uppercase italic tracking-tight">{title}</h3>
        <p className="text-xs font-bold text-white/20 uppercase tracking-widest leading-relaxed">{desc}</p>
      </div>
      <Link href={link} className="inline-flex items-center gap-2 text-[10px] font-black text-primary uppercase tracking-[0.3em] hover:gap-4 transition-all">
        {linkText} <ChevronRight size={14} />
      </Link>
    </div>
  );
}

function FaqItem({ question, answer }: any) {
  return (
    <details className="group bg-white/5 border border-white/5 rounded-3xl overflow-hidden transition-all duration-300 open:border-primary/20 open:bg-white/[0.08]">
      <summary className="list-none px-8 py-8 flex items-center justify-between cursor-pointer focus:outline-none">
        <span className="text-sm md:text-base font-black text-white uppercase italic tracking-tight">{question}</span>
        <div className="w-10 h-10 rounded-xl bg-white/5 border border-white/5 flex items-center justify-center text-white/20 group-open:rotate-45 group-open:text-primary group-open:border-primary/20 transition-all">
          <Plus size={20} />
        </div>
      </summary>
      <div className="px-8 pb-8 pt-2">
        <p className="text-sm text-white/40 leading-relaxed font-medium">
          {answer}
        </p>
      </div>
    </details>
  );
}

}
