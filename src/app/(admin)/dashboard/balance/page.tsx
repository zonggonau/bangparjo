'use client';

import { useState, useEffect } from 'react';

interface CJBalance {
  balance: number;
  balanceStr: string;
  currency: string;
}

interface FulfilledOrder {
  orderNum: string;
  cjOrderId: string | null;
  totalAmount: number | null;
  costAmount: number | null;
  status: string;
  customerName: string | null;
  createdAt: string;
}

export default function CJBalancePage() {
  const [balance, setBalance] = useState<CJBalance | null>(null);
  const [loadingBalance, setLoadingBalance] = useState(true);
  const [orders, setOrders] = useState<FulfilledOrder[]>([]);
  const [loadingOrders, setLoadingOrders] = useState(true);
  const [payOrderNum, setPayOrderNum] = useState('');
  const [paying, setPaying] = useState(false);
  const [toast, setToast] = useState<{ show: boolean; message: string; type: 'success' | 'error' }>({
    show: false, message: '', type: 'success',
  });

  const showToast = (message: string, type: 'success' | 'error' = 'success') => {
    setToast({ show: true, message, type });
    setTimeout(() => setToast(t => ({ ...t, show: false })), 4000);
  };

  const fetchBalance = async () => {
    setLoadingBalance(true);
    try {
      const res = await fetch('/api/cj-balance');
      const data = await res.json();
      if (data.success && data.data) {
        setBalance(data.data);
      } else {
        showToast(data.message || 'Failed to fetch balance', 'error');
      }
    } catch (e: any) {
      showToast('Network error: ' + e.message, 'error');
    } finally {
      setLoadingBalance(false);
    }
  };

  const fetchFulfilledOrders = async () => {
    setLoadingOrders(true);
    try {
      // Get FULFILLED orders that have a CJ order ID (ready to be paid)
      const res = await fetch('/api/cj-orders?pageNum=1&pageSize=20&status=WAITPAY');
      const data = await res.json();
      if (data.success) {
        setOrders(data.data?.list || []);
      }
    } catch (e) {
      console.warn('Could not fetch CJ orders:', e);
    } finally {
      setLoadingOrders(false);
    }
  };

  useEffect(() => {
    fetchBalance();
    fetchFulfilledOrders();
  }, []);

  const handlePayOrder = async () => {
    if (!payOrderNum.trim()) return showToast('Enter a CJ Order Number', 'error');
    setPaying(true);
    try {
      const res = await fetch('/api/cj-balance', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orderNumber: payOrderNum.trim() }),
      });
      const data = await res.json();
      if (data.success) {
        showToast(`✅ Payment successful for ${payOrderNum}!`);
        setPayOrderNum('');
        fetchBalance(); // refresh balance after payment
      } else {
        showToast(data.message || 'Payment failed', 'error');
      }
    } catch (e: any) {
      showToast('Network error: ' + e.message, 'error');
    } finally {
      setPaying(false);
    }
  };

  const currencySymbol = balance?.currency === 'USD' ? '$' : (balance?.currency || '$');

  return (
    <div className="animate-fade-in">
      {/* Toast */}
      {toast.show && (
        <div className={`fixed top-5 right-5 z-50 flex items-center gap-3 px-5 py-3 rounded-[12px] text-sm font-bold shadow-lg transition-all duration-300 ${
          toast.type === 'success'
            ? 'bg-green-50 text-green-700 border border-green-200'
            : 'bg-red-50 text-red-600 border border-red-200'
        }`}>
          <i className={toast.type === 'success' ? 'fas fa-check-circle' : 'fas fa-exclamation-circle'} />
          {toast.message}
        </div>
      )}

      {/* Header */}
      <div className="mb-10 flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4">
        <div>
          <h2 className="text-[28px] font-black mb-2 text-[#1E293B]">CJ Balance & Payment</h2>
          <p className="text-[#64748B] font-semibold">Monitor your CJ Dropshipping balance and pay for orders.</p>
        </div>
        <button
          onClick={() => { fetchBalance(); fetchFulfilledOrders(); }}
          disabled={loadingBalance}
          className="inline-flex items-center gap-2.5 px-6 py-3 rounded-[12px] text-sm font-bold bg-[#FF6B00] text-white hover:bg-[#E65100] shadow-[0_4px_12px_rgba(255,107,0,0.3)] transition-all duration-200"
        >
          <i className={`fas fa-sync ${loadingBalance ? 'fa-spin' : ''}`} />
          Refresh
        </button>
      </div>

      {/* Balance Card */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="md:col-span-1 bg-gradient-to-br from-[#FF6B00] to-[#FF8C42] rounded-[20px] p-8 text-white shadow-[0_8px_32px_rgba(255,107,0,0.3)]">
          <div className="flex items-center gap-3 mb-4 opacity-80">
            <i className="fas fa-wallet text-xl" />
            <span className="text-sm font-bold uppercase tracking-wider">CJ Account Balance</span>
          </div>
          {loadingBalance ? (
            <div className="text-[48px] font-black"><i className="fas fa-circle-notch fa-spin" /></div>
          ) : balance ? (
            <>
              <div className="text-[48px] font-black leading-none">
                {currencySymbol}{balance.balance?.toFixed(2) ?? '0.00'}
              </div>
              <div className="mt-2 opacity-70 text-sm font-semibold">{balance.currency || 'USD'} · CJ Dropshipping</div>
            </>
          ) : (
            <div className="text-[24px] font-bold opacity-70">Not available</div>
          )}
        </div>

        {/* Pay Single Order */}
        <div className="md:col-span-2 bg-white rounded-[20px] border border-[#E2E8F0] p-8 shadow-sm">
          <h3 className="text-[16px] font-black text-[#1E293B] mb-2">Pay CJ Order Manually</h3>
          <p className="text-[#64748B] text-sm mb-6">
            Enter the <strong>CJ Order Number</strong> (from CJ dashboard) to pay using your balance.
            This is needed when <code className="bg-[#F1F5F9] px-1 rounded">payType = 3</code> (manual).
          </p>
          <div className="flex gap-3">
            <input
              type="text"
              id="cj-order-num-input"
              value={payOrderNum}
              onChange={e => setPayOrderNum(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handlePayOrder()}
              placeholder="e.g. CJ2026XXXXXXXXX"
              className="flex-1 px-4 py-3 rounded-[12px] border-2 border-[#E2E8F0] focus:border-[#FF6B00] outline-none text-sm font-semibold text-[#1E293B] placeholder-[#94A3B8] transition-colors"
            />
            <button
              id="pay-cj-order-btn"
              onClick={handlePayOrder}
              disabled={paying || !payOrderNum.trim()}
              className="px-6 py-3 rounded-[12px] text-sm font-bold bg-[#1E293B] text-white hover:bg-[#0F172A] disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 whitespace-nowrap"
            >
              {paying ? <><i className="fas fa-circle-notch fa-spin mr-2" />Paying...</> : <><i className="fas fa-credit-card mr-2" />Pay Now</>}
            </button>
          </div>
        </div>
      </div>

      {/* Info Box */}
      <div className="bg-blue-50 border border-blue-200 rounded-[16px] p-6 mb-8">
        <div className="flex gap-3">
          <i className="fas fa-info-circle text-blue-500 mt-0.5" />
          <div>
            <p className="font-bold text-blue-800 mb-1">Auto-Pay Configuration</p>
            <p className="text-blue-700 text-sm">
              Go to <strong>Settings → CJ Settings</strong> and set <code className="bg-blue-100 px-1 rounded">CJ Pay Type</code> to control payment behavior:
            </p>
            <ul className="mt-2 text-sm text-blue-700 space-y-1">
              <li><strong>payType = 2</strong> — Auto-pay via balance immediately after customer pays</li>
              <li><strong>payType = 3</strong> — Manual pay (admin must pay in CJ dashboard or use this page)</li>
            </ul>
          </div>
        </div>
      </div>

      {/* Pending CJ Orders (WAITPAY status) */}
      <div className="bg-white rounded-[16px] border border-[#E2E8F0] shadow-sm overflow-hidden">
        <div className="px-8 py-5 border-b border-[#F1F5F9] flex items-center justify-between">
          <h3 className="font-black text-[#1E293B]">Pending CJ Orders (Awaiting Payment)</h3>
          <span className="text-xs font-bold text-[#64748B]">From CJ API — status: WAITPAY</span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full border-collapse">
            <thead>
              <tr className="bg-[#F8FAFC]">
                <th className="text-left px-8 py-4 text-[11px] font-extrabold text-[#64748B] uppercase tracking-[0.1em]">CJ Order</th>
                <th className="text-left px-8 py-4 text-[11px] font-extrabold text-[#64748B] uppercase tracking-[0.1em]">Amount</th>
                <th className="text-left px-8 py-4 text-[11px] font-extrabold text-[#64748B] uppercase tracking-[0.1em]">Status</th>
                <th className="text-left px-8 py-4 text-[11px] font-extrabold text-[#64748B] uppercase tracking-[0.1em]">Action</th>
              </tr>
            </thead>
            <tbody>
              {loadingOrders ? (
                <tr><td colSpan={4} className="text-center py-16"><i className="fas fa-circle-notch fa-spin fa-2x text-[#FF6B00]" /></td></tr>
              ) : orders.length === 0 ? (
                <tr>
                  <td colSpan={4} className="text-center py-16 text-[#64748B]">
                    <div className="text-[40px] opacity-10 mb-3"><i className="fas fa-check-circle" /></div>
                    <p className="font-bold">No pending CJ orders</p>
                    <p className="text-sm mt-1">All orders have been paid or are being processed.</p>
                  </td>
                </tr>
              ) : (
                orders.map(o => (
                  <tr key={o.orderNum} className="border-b border-[#F1F5F9] hover:bg-[#FAFBFE] transition-colors">
                    <td className="px-8 py-4">
                      <div className="font-bold text-[#1E293B] text-sm">{o.cjOrderId || o.orderNum}</div>
                      <div className="text-xs text-[#64748B] mt-0.5">{o.customerName}</div>
                    </td>
                    <td className="px-8 py-4">
                      <span className="font-bold text-[#1E293B]">${(o.costAmount || o.totalAmount || 0).toFixed(2)}</span>
                    </td>
                    <td className="px-8 py-4">
                      <span className="inline-flex items-center px-2.5 py-1 rounded-[6px] text-[10px] font-extrabold uppercase tracking-[0.05em] bg-yellow-100 text-yellow-800">
                        {o.status}
                      </span>
                    </td>
                    <td className="px-8 py-4">
                      <button
                        onClick={() => {
                          setPayOrderNum(o.cjOrderId || o.orderNum);
                        }}
                        className="text-xs font-bold text-[#FF6B00] hover:underline"
                      >
                        <i className="fas fa-arrow-up mr-1" />Use Above
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
