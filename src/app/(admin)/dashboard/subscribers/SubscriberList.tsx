'use client';

import { useState } from 'react';
import { deleteAdminSubscriberAction, deleteAdminCustomerAction, sendBroadcastEmailAction } from '@/lib/actions-admin-content';

interface Subscriber {
  id: string;
  email: string;
  isActive: boolean;
  createdAt: Date | string;
}

interface Customer {
  id: string;
  name: string | null;
  email: string;
  createdAt: Date | string;
}

export default function SubscriberList({ 
  initialSubscribers, 
  initialCustomers 
}: { 
  initialSubscribers: Subscriber[];
  initialCustomers: Customer[];
}) {
  const [subscribers, setSubscribers] = useState(initialSubscribers);
  const [customers, setCustomers] = useState(initialCustomers);
  const [tab, setTab] = useState<'customers' | 'subscribers'>('customers');
  const [deleting, setDeleting] = useState<string | null>(null);
  
  // Broadcast Modal State
  const [showModal, setShowModal] = useState(false);
  const [subject, setSubject] = useState('');
  const [content, setContent] = useState('');
  const [sendingEmail, setSendingEmail] = useState(false);

  const [toast, setToast] = useState<{ show: boolean, message: string, type: 'success' | 'error' }>({ show: false, message: '', type: 'success' });

  const showToast = (message: string, type: 'success' | 'error' = 'success') => {
    setToast({ show: true, message, type });
    setTimeout(() => setToast(t => ({ ...t, show: false })), 4000);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Permanently remove this subscriber from your list?')) return;
    
    setDeleting(id);
    try {
      const json = await deleteAdminSubscriberAction(id);
      if (json.success) {
        setSubscribers(subscribers.filter(s => s.id !== id));
        showToast('Subscriber removed');
      } else {
        showToast('Failed to delete', 'error');
      }
    } catch (err) {
      showToast('Connection error', 'error');
    } finally {
      setDeleting(null);
    }
  };

  const handleDeleteCustomer = async (id: string) => {
    if (!confirm('Permanently remove this customer?')) return;
    
    setDeleting(id);
    try {
      const json = await deleteAdminCustomerAction(id);
      if (json.success) {
        setCustomers(customers.filter(c => c.id !== id));
        showToast('Customer removed');
      } else {
        showToast(json.error || 'Failed to delete', 'error');
      }
    } catch (err) {
      showToast('Connection error', 'error');
    } finally {
      setDeleting(null);
    }
  };

  const handleSendBroadcast = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!subject || !content) {
      showToast('Subject and content are required', 'error');
      return;
    }

    setSendingEmail(true);
    try {
      const res = await sendBroadcastEmailAction(subject, content);
      if (res.success) {
        showToast(res.message || 'Broadcast email sent successfully!');
        setShowModal(false);
        setSubject('');
        setContent('');
      } else {
        showToast(res.error || 'Failed to send broadcast.', 'error');
      }
    } catch (err) {
      showToast('An unexpected error occurred.', 'error');
    } finally {
      setSendingEmail(false);
    }
  };

  const handleExport = () => {
    const data = tab === 'customers' ? customers : subscribers;
    const csv = [
      ['Email', 'Name', 'Joined Date', 'Status'],
      ...data.map((item: any) => [
        item.email, 
        item.name || '', 
        new Date(item.createdAt).toISOString(), 
        'isActive' in item ? (item.isActive ? 'Active' : 'Inactive') : 'Customer'
      ])
    ].map(e => e.join(',')).join('\n');

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${tab}-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    showToast('Exporting to CSV...');
  };

  return (
    <div className="bg-white rounded-[16px] border border-gray-200 overflow-hidden relative">
      {toast.show && (
        <div className={`fixed top-5 right-5 z-50 flex items-center gap-3 px-5 py-3 rounded-[12px] text-sm font-bold shadow-lg transition-all duration-300 ${toast.type === 'success' ? 'bg-green-50 text-green-700 border border-green-200' : 'bg-red-50 text-red-600 border border-red-200'}`}>
          <i className={toast.type === 'success' ? 'fas fa-check-circle' : 'fas fa-exclamation-circle'}></i>
          {toast.message}
        </div>
      )}

      <div className="flex items-center justify-between p-5 border-b border-gray-100">
        <div className="flex gap-1 bg-gray-100 rounded-[10px] p-1">
          <button 
            className={`px-4 py-2 rounded-[8px] text-xs font-extrabold transition-all duration-200 ${tab === 'customers' ? 'bg-[#FF6B00] text-white' : 'bg-transparent text-gray-500'}`}
            onClick={() => setTab('customers')}
          >
            <i className="fas fa-user"></i> Customers ({customers.length})
          </button>
          <button 
            className={`px-4 py-2 rounded-[8px] text-xs font-extrabold transition-all duration-200 ${tab === 'subscribers' ? 'bg-[#FF6B00] text-white' : 'bg-transparent text-gray-500'}`}
            onClick={() => setTab('subscribers')}
          >
            <i className="fas fa-envelope"></i> Subscribers ({subscribers.length})
          </button>
        </div>
        
        <div className="flex gap-2">
          <button 
            className="px-3 py-2 rounded-[8px] text-sm font-semibold border border-blue-200 bg-blue-50 text-blue-600 hover:bg-blue-100 transition-all duration-200 flex items-center gap-2 cursor-pointer"
            onClick={() => setShowModal(true)}
          >
            <i className="fas fa-envelope-open-text"></i> Broadcast Email
          </button>
          
          <button className="px-3 py-2 rounded-[8px] text-sm font-semibold border border-gray-200 text-gray-600 hover:bg-gray-50 transition-all duration-200 flex items-center gap-2 cursor-pointer bg-white" onClick={handleExport}>
            <i className="fas fa-file-export"></i> Export CSV
          </button>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full border-collapse">
          <thead>
            <tr className="bg-gray-50">
              <th className="text-left px-5 py-3.5 text-xs font-semibold text-gray-500 uppercase">Customer Information</th>
              <th className="text-left px-5 py-3.5 text-xs font-semibold text-gray-500 uppercase">Date Joined</th>
              <th className="text-left px-5 py-3.5 text-xs font-semibold text-gray-500 uppercase">Current Status</th>
              <th className="text-right px-5 py-3.5 text-xs font-semibold text-gray-500 uppercase">Actions</th>
            </tr>
          </thead>
          <tbody>
            {tab === 'customers' ? (
              customers.map((customer) => (
                <tr key={customer.id} className="border-b border-gray-100">
                  <td className="px-5 py-3.5">
                    <div className="flex gap-3 items-center">
                      <div className="w-9 h-9 rounded-[10px] bg-[#FF6B00] text-white flex items-center justify-center text-xs font-bold">
                        {(customer.name || customer.email)[0].toUpperCase()}
                      </div>
                      <div className="flex flex-col">
                         <span className="font-extrabold text-gray-800">{customer.name || customer.email}</span>
                         <span className="text-[10px] font-bold text-gray-400 uppercase">
                           {customer.email} {customer.name ? '• Registered Customer' : ''}
                         </span>
                      </div>
                    </div>
                  </td>
                  <td className="px-5 py-3.5">
                     <span className="text-[13px] font-bold text-gray-500">
                       {new Date(customer.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                     </span>
                  </td>
                  <td className="px-5 py-3.5">
                     <span className="inline-block px-2.5 py-1 rounded-[6px] text-xs font-bold bg-green-100 text-green-700">
                       CUSTOMER
                     </span>
                  </td>
                  <td className="px-5 py-3.5 text-right">
                    <div className="flex justify-end gap-2">
                       <button 
                         className="w-8 h-8 rounded-[8px] flex items-center justify-center text-sm text-blue-600 bg-blue-50 hover:bg-blue-100 transition-all duration-200 border-none cursor-pointer"
                         onClick={() => setShowModal(true)}
                         title="Send Email Broadcast"
                       >
                         <i className="fas fa-envelope"></i>
                       </button>
                       <button 
                         className="w-8 h-8 rounded-[8px] flex items-center justify-center text-sm text-red-500 bg-red-50 hover:bg-red-100 transition-all duration-200 border-none cursor-pointer"
                         onClick={() => handleDeleteCustomer(customer.id)}
                         disabled={deleting === customer.id}
                         title="Remove Customer"
                       >
                         <i className={`fas ${deleting === customer.id ? 'fa-spinner fa-spin' : 'fa-trash-alt'}`}></i>
                       </button>
                    </div>
                  </td>
                </tr>
              ))
            ) : (
              subscribers.map((sub) => (
                <tr key={sub.id} className="border-b border-gray-100">
                  <td className="px-5 py-3.5">
                    <div className="flex gap-3 items-center">
                      <div className="w-9 h-9 rounded-[10px] bg-[#FF6B00] text-white flex items-center justify-center text-xs font-bold">
                        {sub.email[0].toUpperCase()}
                      </div>
                      <div className="flex flex-col">
                         <span className="font-extrabold text-gray-800">{sub.email}</span>
                         <span className="text-[10px] font-bold text-gray-400 uppercase">Newsletter Member</span>
                      </div>
                    </div>
                  </td>
                  <td className="px-5 py-3.5">
                     <span className="text-[13px] font-bold text-gray-500">
                       {new Date(sub.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                     </span>
                  </td>
                  <td className="px-5 py-3.5">
                     <span className={`inline-block px-2.5 py-1 rounded-[6px] text-xs font-bold ${sub.isActive ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'}`}>
                       {sub.isActive ? 'ACTIVE' : 'INACTIVE'}
                     </span>
                  </td>
                  <td className="px-5 py-3.5 text-right">
                    <div className="flex justify-end gap-2">
                       <button 
                         className="w-8 h-8 rounded-[8px] flex items-center justify-center text-sm text-blue-600 bg-blue-50 hover:bg-blue-100 transition-all duration-200 border-none cursor-pointer"
                         onClick={() => setShowModal(true)}
                         title="Send Email Broadcast"
                       >
                         <i className="fas fa-envelope"></i>
                       </button>
                       <button 
                         className="w-8 h-8 rounded-[8px] flex items-center justify-center text-sm text-red-500 bg-red-50 hover:bg-red-100 transition-all duration-200 border-none cursor-pointer"
                         onClick={() => handleDelete(sub.id)}
                         disabled={deleting === sub.id}
                         title="Remove Subscriber"
                       >
                         <i className={`fas ${deleting === sub.id ? 'fa-spinner fa-spin' : 'fa-trash-alt'}`}></i>
                       </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
            {((tab === 'customers' && customers.length === 0) || (tab === 'subscribers' && subscribers.length === 0)) && (
              <tr>
                <td colSpan={4} className="text-center py-[100px] text-gray-400">
                  <div className="text-[48px] opacity-10 mb-4">
                    <i className={`fas ${tab === 'customers' ? 'fa-users-slash' : 'fa-envelope-open'}`}></i>
                  </div>
                  <p className="font-bold">
                    {tab === 'customers' ? 'NO CUSTOMERS FOUND' : 'NO SUBSCRIBERS FOUND'}
                  </p>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Broadcast Email Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-white rounded-[24px] max-w-[500px] w-full p-8 shadow-[0_20px_50px_rgba(0,0,0,0.15)] transform transition-all duration-300 scale-100">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-black text-gray-800 flex items-center gap-3">
                <i className="fas fa-envelope-open-text text-[#FF6B00]"></i>
                Send Email Broadcast
              </h3>
              <button 
                onClick={() => setShowModal(false)}
                className="w-8 h-8 rounded-full bg-gray-100 text-gray-500 hover:bg-gray-200 flex items-center justify-center transition-all duration-200 border-none cursor-pointer"
              >
                <i className="fas fa-times"></i>
              </button>
            </div>
            
            <p className="text-xs font-semibold text-gray-500 mb-6 leading-relaxed">
              This message will be broadcasted to <strong className="text-gray-800">{customers.length} registered customers</strong> and <strong className="text-gray-800">{subscribers.filter(s => s.isActive).length} active newsletter subscribers</strong>.
            </p>

            <form onSubmit={handleSendBroadcast} className="flex flex-col gap-5">
              <div>
                <label className="block font-black text-xs uppercase text-gray-500 tracking-[0.05em] mb-2">Subject</label>
                <input 
                  type="text" 
                  required
                  placeholder="e.g. Exclusive Weekend Sale!"
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  className="w-full px-4 py-3 rounded-[12px] border border-gray-200 text-sm outline-none focus:border-[#FF6B00] transition-all duration-200"
                  disabled={sendingEmail}
                />
              </div>

              <div>
                <label className="block font-black text-xs uppercase text-gray-500 tracking-[0.05em] mb-2">Message Content (HTML Allowed)</label>
                <textarea 
                  required
                  rows={6}
                  placeholder="Type your message here... HTML tags are supported."
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  className="w-full px-4 py-3 rounded-[12px] border border-gray-200 text-sm outline-none focus:border-[#FF6B00] transition-all duration-200 resize-none font-sans"
                  disabled={sendingEmail}
                ></textarea>
              </div>

              <div className="flex gap-3 justify-end mt-4">
                <button 
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-5 py-3 rounded-[12px] text-sm font-bold border border-gray-200 text-gray-600 hover:bg-gray-50 transition-all duration-200 cursor-pointer bg-white"
                  disabled={sendingEmail}
                >
                  Cancel
                </button>
                <button 
                  type="submit"
                  className="px-6 py-3 rounded-[12px] text-sm font-black bg-[#FF6B00] text-white hover:bg-[#E06000] transition-all duration-200 flex items-center gap-2 disabled:opacity-50 border-none cursor-pointer"
                  disabled={sendingEmail || !subject || !content}
                >
                  {sendingEmail ? (
                    <>
                      <i className="fas fa-spinner fa-spin"></i>
                      Sending...
                    </>
                  ) : (
                    <>
                      <i className="fas fa-paper-plane"></i>
                      Send Broadcast
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
