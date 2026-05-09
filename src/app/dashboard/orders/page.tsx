'use client';

import { useState, useEffect } from 'react';

export default function OrdersPage() {
  const [orders, setOrders] = useState<any[]>([]);
  const [localOrders, setLocalOrders] = useState<any[]>([]);
  const [loadingOrders, setLoadingOrders] = useState(false);
  const [orderSource, setOrderSource] = useState<'LOCAL' | 'CJ'>('LOCAL');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [fulfilling, setFulfilling] = useState<string | null>(null);

  const fetchOrders = () => {
    setLoadingOrders(true);
    if (orderSource === 'CJ') {
      fetch(`/api/cj-orders?pageNum=1&pageSize=50`)
        .then(res => res.json())
        .then(data => {
          if (data.data && data.data.list) setOrders(data.data.list);
        })
        .catch(err => console.error(err))
        .finally(() => setLoadingOrders(false));
    } else {
      fetch(`/api/admin/orders`)
        .then(res => res.json())
        .then(data => {
          if (Array.isArray(data)) setLocalOrders(data);
        })
        .catch(err => console.error(err))
        .finally(() => setLoadingOrders(false));
    }
  };

  useEffect(() => {
    fetchOrders();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [orderSource]);

  const handleFulfill = async (orderNum: string) => {
    if (!confirm(`Fulfill order ${orderNum} to CJ Dropshipping?`)) return;
    setFulfilling(orderNum);
    try {
      const res = await fetch('/api/admin/orders/fulfill', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orderNum })
      });
      const data = await res.json();
      if (data.success) {
        alert('Fulfillment Successful!');
        fetchOrders();
      } else {
        alert('Fulfillment Failed: ' + data.error);
      }
    } catch (err: any) {
      alert('Error: ' + err.message);
    } finally {
      setFulfilling(null);
    }
  };

  const handleSyncStatus = async (orderNum: string) => {
    setFulfilling(orderNum);
    try {
      const res = await fetch(`/api/admin/orders/sync?orderNum=${orderNum}`);
      const data = await res.json();
      if (data.success) {
        alert('Status Synced: ' + data.status);
        fetchOrders();
      } else {
        alert('Sync Failed: ' + data.error);
      }
    } catch (err: any) {
      alert('Error: ' + err.message);
    } finally {
      setFulfilling(null);
    }
  };

  return (
    <div>
      <header style={{ marginBottom: '2rem' }}>
        <h1 style={{ fontSize: '1.875rem', fontWeight: 700, margin: 0, letterSpacing: '-0.02em' }}>Orders</h1>
        <p style={{ color: '#71717a', marginTop: '0.25rem', fontSize: '0.9rem' }}>Track and manage orders from your store and CJ Dropshipping.</p>
      </header>

      {/* Tabs - Shadcn style */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div style={{ display: 'inline-flex', background: '#f4f4f5', padding: '0.2rem', borderRadius: '8px' }}>
          <button 
            onClick={() => setOrderSource('LOCAL')}
            style={{ ...tabBtn, background: orderSource === 'LOCAL' ? 'white' : 'transparent', color: orderSource === 'LOCAL' ? '#09090b' : '#71717a', boxShadow: orderSource === 'LOCAL' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none' }}
          >Store Orders</button>
          <button 
            onClick={() => setOrderSource('CJ')}
            style={{ ...tabBtn, background: orderSource === 'CJ' ? 'white' : 'transparent', color: orderSource === 'CJ' ? '#09090b' : '#71717a', boxShadow: orderSource === 'CJ' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none' }}
          >Synced CJ</button>
        </div>

        <div style={{ display: 'flex', gap: '0.4rem' }}>
          {['ALL', 'PAID', 'SHIPPED'].map(s => (
            <button key={s} onClick={() => setStatusFilter(s)} style={{
              padding: '0.4rem 0.75rem', borderRadius: '6px', fontSize: '0.75rem', fontWeight: 500, cursor: 'pointer',
              border: '1px solid #e4e4e7',
              background: statusFilter === s ? '#18181b' : 'white',
              color: statusFilter === s ? 'white' : '#09090b',
            }}>{s}</button>
          ))}
        </div>
      </div>

      {/* Table - Shadcn style */}
      <div style={{ border: '1px solid #e4e4e7', borderRadius: '8px', overflow: 'hidden' }}>
        {loadingOrders ? (
          <div style={{ padding: '5rem', textAlign: 'center', color: '#71717a', fontSize: '0.875rem' }}>Loading order data...</div>
        ) : (orderSource === 'CJ' ? orders : localOrders.filter(o => statusFilter === 'ALL' || o.status === statusFilter)).length > 0 ? (
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.875rem' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid #e4e4e7', background: '#fafafa' }}>
                <th style={thStyle}>ORDER ID</th>
                <th style={thStyle}>CUSTOMER</th>
                <th style={thStyle}>TOTAL</th>
                <th style={thStyle}>STATUS</th>
                <th style={{ ...thStyle, textAlign: 'right' }}>ACTIONS</th>
              </tr>
            </thead>
            <tbody>
              {(orderSource === 'CJ' ? orders : localOrders.filter(o => statusFilter === 'ALL' || o.status === statusFilter)).map((o: any) => (
                <tr key={o.id || o.orderId || o.orderNum} style={{ borderBottom: '1px solid #e4e4e7' }}>
                  <td style={{ ...tdStyle, fontFamily: 'monospace', fontSize: '0.8rem' }}>{o.orderNum || o.orderId}</td>
                  <td style={tdStyle}>
                    <div style={{ fontWeight: 600 }}>{o.customerName || o.shippingCustomerName}</div>
                    <div style={{ fontSize: '0.75rem', color: '#71717a' }}>{o.customerEmail || 'No Email'}</div>
                  </td>
                  <td style={{ ...tdStyle, fontWeight: 600 }}>
                    ${Number(o.totalAmount || o.orderAmount || 0).toFixed(2)}
                  </td>
                  <td style={tdStyle}>
                    <span style={{
                      background: getStatusColor(o.status || o.orderStatus).bg,
                      color: getStatusColor(o.status || o.orderStatus).text,
                      padding: '2px 8px', borderRadius: '100px', fontSize: '0.7rem', fontWeight: 600, border: `1px solid ${getStatusColor(o.status || o.orderStatus).border}`
                    }}>{o.status || o.orderStatus || 'PENDING'}</span>
                  </td>
                  <td style={{ ...tdStyle, textAlign: 'right' }}>
                    {orderSource === 'LOCAL' && o.status === 'PAID' && !o.cjOrderId && (
                      <button 
                        disabled={fulfilling === (o.orderNum || o.id)}
                        onClick={() => handleFulfill(o.orderNum)}
                        style={{ 
                          padding: '0.4rem 0.75rem', 
                          background: '#16a34a', 
                          color: 'white', 
                          border: 'none', borderRadius: '6px', fontWeight: 600, fontSize: '0.8rem',
                          cursor: 'pointer', marginRight: '0.5rem'
                        }}
                      >
                        {fulfilling === o.orderNum ? '...' : 'Fulfill'}
                      </button>
                    )}
                    {o.cjOrderId && (
                      <button 
                        disabled={fulfilling === (o.orderNum || o.id)}
                        onClick={() => handleSyncStatus(o.orderNum)}
                        style={{ 
                          padding: '0.4rem 0.75rem', 
                          background: '#18181b', 
                          color: 'white', 
                          border: '1px solid #e4e4e7', borderRadius: '6px', fontWeight: 500, fontSize: '0.8rem',
                          cursor: 'pointer'
                        }}
                      >
                        {fulfilling === o.orderNum ? '...' : 'Sync Status'}
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <div style={{ padding: '5rem', textAlign: 'center', color: '#71717a' }}>No orders found for this selection.</div>
        )}
      </div>
    </div>
  );
}

const tabBtn = { padding: '0.4rem 1rem', borderRadius: '6px', border: 'none', cursor: 'pointer', fontWeight: 600, fontSize: '0.8rem', transition: '0.1s' };
const thStyle = { padding: '0.75rem 1rem', textAlign: 'left', fontSize: '0.75rem', fontWeight: 600, color: '#71717a' };
const tdStyle = { padding: '1rem', color: '#09090b' };

function getStatusColor(status: string) {
  switch (status) {
    case 'PAID': case 'FULFILLED': return { bg: '#f0fdf4', text: '#16a34a', border: '#bbf7d0' };
    case 'SHIPPED': return { bg: '#eff6ff', text: '#2563eb', border: '#bfdbfe' };
    case 'UNPAID': return { bg: '#fef2f2', text: '#dc2626', border: '#fecaca' };
    default: return { bg: '#f4f4f5', text: '#71717a', border: '#e4e4e7' };
  }
}
