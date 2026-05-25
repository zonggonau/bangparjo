'use client';

import { useState } from 'react';
import { useSession } from 'next-auth/react';
import { updateProfileAction } from '@/lib/actions-user';

export default function ProfileForm({ initialName, initialEmail }: { initialName: string, initialEmail: string }) {
  const { update } = useSession();
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);
  const [formData, setFormData] = useState({
    name: initialName || '',
    email: initialEmail || '',
  });

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage(null);

    try {
      const data = await updateProfileAction(formData.name);

      if (data.success) {
        await update({ name: formData.name });
        setMessage({ type: 'success', text: 'Profile updated successfully!' });
      } else {
        setMessage({ type: 'error', text: data.error || 'Failed to update profile.' });
      }
    } catch (err) {
      setMessage({ type: 'error', text: 'An unexpected error occurred.' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <form onSubmit={handleUpdateProfile}>
        <div className="mb-5 sm:mb-6">
          <label className="block font-bold text-xs uppercase text-gray-500 mb-2">Display Name</label>
          <input 
            type="text" 
            value={formData.name} 
            onChange={e => setFormData({ ...formData, name: e.target.value })}
            className="w-full px-3 sm:px-4 py-2.5 sm:py-3 rounded-[8px] border border-gray-200 text-sm sm:text-[15px] outline-none focus:border-[#FF6B00] transition-colors"
            placeholder="Enter your full name"
          />
        </div>

        <div className="mb-6 sm:mb-8">
          <label className="block font-bold text-xs uppercase text-gray-500 mb-2">Email Address</label>
          <input 
            type="email" 
            value={formData.email} 
            readOnly
            className="w-full px-3 sm:px-4 py-2.5 sm:py-3 rounded-[8px] border border-gray-200 text-sm sm:text-[15px] bg-gray-50 text-gray-500 cursor-not-allowed outline-none"
          />
          <p className="text-[10px] sm:text-[11px] text-gray-400 mt-1.5 sm:mt-2">Email cannot be changed as it is linked to your login session.</p>
        </div>

        {message && (
          <div className={`mb-5 sm:mb-6 flex items-center gap-2 sm:gap-3 p-2.5 sm:p-3 rounded-[10px] text-xs sm:text-sm font-semibold ${message.type === 'success' ? 'bg-green-50 text-green-600 border border-green-200' : 'bg-red-50 text-red-600 border border-red-200'}`}>
            <i className={`fas ${message.type === 'success' ? 'fa-check-circle' : 'fa-exclamation-circle'}`}></i>
            <span>{message.text}</span>
          </div>
        )}

        <button type="submit" className="w-full sm:w-auto inline-flex items-center justify-center px-6 sm:px-8 py-2.5 sm:py-3 rounded-md text-sm sm:text-base font-bold bg-[#FF6B00] text-white hover:bg-[#E06000] transition-all duration-200 disabled:opacity-50" disabled={loading}>
          {loading ? <i className="fas fa-spinner fa-spin"></i> : 'Save Changes'}
        </button>
      </form>
    </>
  );
}
