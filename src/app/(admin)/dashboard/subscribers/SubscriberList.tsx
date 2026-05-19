'use client';

import { useState } from 'react';

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
  const [customers] = useState(initialCustomers);
  const [tab, setTab] = useState<'customers' | 'subscribers'>('customers');
  const [deleting, setDeleting] = useState<string | null>(null);
  const [toast, setToast] = useState<{ show: boolean, message: string, type: 'success' | 'error' }>({ show: false, message: '', type: 'success' });

  const showToast = (message: string, type: 'success' | 'error' = 'success') => {
    setToast({ show: true, message, type });
    setTimeout(() => setToast(t => ({ ...t, show: false })), 3000);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Permanently remove this subscriber from your list?')) return;
    
    setDeleting(id);
    try {
      const res = await fetch(`/api/admin/subscribers?id=${id}`, { method: 'DELETE' });
      if (res.ok) {
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
    <div className="bg-white rounded-[16px] border border-gray-200 overflow-hidden">
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
        <button className="px-3 py-2 rounded-[8px] text-sm font-semibold border border-gray-200 text-gray-600 hover:bg-gray-50 transition-all duration-200" onClick={handleExport}>
          <i className="fas fa-file-export"></i> Export CSV
        </button>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full border-collapse">
          <thead>
            <tr className="bg-gray-50">
              <th className="text-left px-5 py-3.5 text-xs font-semibold text-gray-500 uppercase">Customer Information</th>
              <th className="text-left px-5 py-3.5 text-xs font-semibold text-gray-500 uppercase">Date Joined</th>
              <th className="text-left px-5 py-3.5 text-xs font-semibold text-gray-500 uppercase">Current Status</th>
              {tab === 'subscribers' && <th className="text-right px-5 py-3.5 text-xs font-semibold text-gray-500 uppercase">Actions</th>}
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
                  <td className="text-right px-5 py-3.5">
                     <button 
                       className="px-2 py-1 rounded text-sm text-red-500 hover:bg-red-50 transition-all duration-200"
                       onClick={() => handleDelete(sub.id)}
                       disabled={deleting === sub.id}
                       title="Remove Subscriber"
                     >
                       <i className={`fas ${deleting === sub.id ? 'fa-spinner fa-spin' : 'fa-trash-alt'}`}></i>
                     </button>
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
    </div>
  );
}
