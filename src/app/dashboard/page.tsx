'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useSettings } from '@/context/SettingsContext';

function ShadcnCard({ label, value, sub, icon }: { label: string; value: string; sub?: string; icon: string }) {
  return (
    <div style={{
      background: 'white',
      border: '1px solid #e4e4e7',
      borderRadius: '8px',
      padding: '1.5rem',
      display: 'flex',
      flexDirection: 'column',
      gap: '0.25rem'
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.25rem' }}>
        <p style={{ margin: 0, fontSize: '0.85rem', color: '#09090b', fontWeight: 500 }}>{label}</p>
        <span style={{ fontSize: '1rem', opacity: 0.6 }}>{icon}</span>
      </div>
      <p style={{ margin: 0, fontSize: '1.5rem', fontWeight: 700, color: '#09090b', letterSpacing: '-0.02em' }}>{value}</p>
      {sub && <p style={{ margin: 0, fontSize: '0.75rem', color: '#71717a' }}>{sub}</p>}
    </div>
  );
}

export default function DashboardPage() {
  const { settings, loading } = useSettings();
  const [localOrders, setLocalOrders] = useState<any[]>([]);

  useEffect(() => {
    fetch('/api/admin/orders')
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data)) setLocalOrders(data);
      })
      .catch(console.error);
  }, []);

  const totalSales = localOrders.reduce((acc, o) => acc + (o.totalAmount || 0), 0);
  const pendingOrders = localOrders.filter(o => o.status === 'UNPAID').length;

  if (loading) return <p style={{ color: '#71717a' }}>Loading dashboard...</p>;

  return (
    <div>
      <div style={{ marginBottom: '2rem' }}>
        <h1 style={{ fontSize: '1.875rem', fontWeight: 700, margin: 0, letterSpacing: '-0.02em' }}>Overview</h1>
        <p style={{ color: '#71717a', marginTop: '0.25rem', fontSize: '0.9rem' }}>Real-time statistics for your dropshipping store.</p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '1rem', marginBottom: '2rem' }}>
        <ShadcnCard 
          label="Total Revenue" 
          value={`$${totalSales.toLocaleString()}`} 
          sub="+20.1% from last month" 
          icon="💳"
        />
        <ShadcnCard 
          label="Pending Orders" 
          value={`+${pendingOrders}`} 
          sub="Requires fulfillment" 
          icon="📦"
        />
        <Link href="/dashboard/webhooks" style={{ textDecoration: 'none' }}>
          <ShadcnCard 
            label="System Health" 
            value="Active" 
            sub="View Webhook Logs" 
            icon="📡"
          />
        </Link>
        <ShadcnCard 
          label="Profit Margin" 
          value="70%" 
          sub="Average across tiers" 
          icon="📈"
        />
        <ShadcnCard 
          label="Active Rules" 
          value={String(settings.marginTiers?.length || 0)} 
          sub="Pricing automation rules" 
          icon="⚙️"
        />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '1rem' }}>
        <div style={{ border: '1px solid #e4e4e7', borderRadius: '8px', padding: '2rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <h3 style={{ margin: '0 0 0.5rem 0', fontSize: '1.1rem', fontWeight: 600 }}>System Management</h3>
            <p style={{ margin: 0, fontSize: '0.85rem', color: '#71717a' }}>Sync inventory levels and manage order fulfillment.</p>
          </div>
          <div style={{ display: 'flex', gap: '0.75rem' }}>
            <button 
              onClick={async () => {
                if (confirm('Sync all inventory from CJ Dropshipping?')) {
                  const res = await fetch('/api/cron/inventory');
                  const data = await res.json();
                  alert(data.success ? `Successfully synced ${data.updated} variants.` : 'Sync failed: ' + data.error);
                }
              }}
              style={{
                padding: '0.6rem 1.25rem',
                background: 'white',
                color: '#18181b',
                border: '1px solid #e4e4e7',
                borderRadius: '6px',
                fontWeight: 500,
                fontSize: '0.875rem',
                cursor: 'pointer'
              }}
            >
              Sync Inventory
            </button>
            <button 
              onClick={() => window.location.href = '/dashboard/orders'}
              style={{
                padding: '0.6rem 1.25rem',
                background: '#18181b',
                color: 'white',
                border: 'none',
                borderRadius: '6px',
                fontWeight: 500,
                fontSize: '0.875rem',
                cursor: 'pointer'
              }}
            >
              Manage Orders
            </button>
          </div>
        </div>
      </div>
      
      <div style={{ marginTop: '2rem', border: '1px solid #fee2e2', borderRadius: '8px', padding: '1.5rem', background: '#fef2f2' }}>
        <h3 style={{ margin: '0 0 0.5rem 0', fontSize: '1.1rem', fontWeight: 600, color: '#991b1b' }}>Developer Tools (Debug)</h3>
        <p style={{ margin: '0 0 1rem 0', fontSize: '0.85rem', color: '#b91c1c' }}>Simulate incoming CJ webhooks to test database synchronization.</p>
        <div style={{ display: 'flex', gap: '0.75rem' }}>
          <button 
            onClick={async () => {
              const res = await fetch('/api/admin/test-webhook', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ type: 'STOCK', variantId: 'test-vid', stock: 55 })
              });
              alert('Stock Mock Sent! Check Webhook Logs.');
            }}
            style={{ padding: '0.5rem 1rem', background: 'white', border: '1px solid #fca5a5', borderRadius: '6px', cursor: 'pointer', fontSize: '0.8rem' }}
          >
            Mock Stock Update
          </button>
          <button 
             onClick={async () => {
              const orderNum = prompt('Enter local order number (e.g. ORD-12345):');
              if (!orderNum) return;
              const res = await fetch('/api/admin/test-webhook', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ type: 'ORDER', orderNum })
              });
              alert('Order Mock Sent!');
            }}
            style={{ padding: '0.5rem 1rem', background: 'white', border: '1px solid #fca5a5', borderRadius: '6px', cursor: 'pointer', fontSize: '0.8rem' }}
          >
            Mock Ship Order
          </button>
        </div>
      </div>
    </div>
  );
}
