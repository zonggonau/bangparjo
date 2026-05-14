'use client';

import { useState } from 'react';
import styles from './contact.module.css';

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
        setStatus({ type: 'success', msg: 'Pesan Anda telah terkirim! Kami akan menghubungi Anda segera.' });
        setFormData({ name: '', email: '', subject: 'Order Issue', message: '' });
      } else {
        setStatus({ type: 'error', msg: 'Failed to send message. Please try again.' });
      }
    } catch (err) {
      setStatus({ type: 'error', msg: 'Terjadi kesalahan sistem.' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h1>Contact Us</h1>
        <p>Ada pertanyaan? Kami siap membantu Anda.</p>
      </div>

      <div className={styles.content}>
        <div className={styles.info}>
          <h3>Informasi Kontak</h3>
          <p>Jika Anda memiliki pertanyaan tentang pesanan, pengembalian, atau produk, silakan hubungi kami melalui formulir atau saluran berikut:</p>
          
          <div className={styles.infoItem}>
            <span className={styles.icon}>📧</span>
            <div>
              <strong>Email</strong>
              <p>support@bangparjo.shop</p>
            </div>
          </div>

          <div className={styles.infoItem}>
            <span className={styles.icon}>💬</span>
            <div>
              <strong>WhatsApp</strong>
              <p>+62 812-3456-7890</p>
            </div>
          </div>

          <div className={styles.infoItem}>
            <span className={styles.icon}>⏰</span>
            <div>
              <strong>Jam Kerja</strong>
              <p>Senin - Jumat: 09:00 - 18:00 WIB</p>
            </div>
          </div>
        </div>

        <form className={styles.form} onSubmit={handleSubmit}>
          <div className={styles.inputGroup}>
            <label>Nama Lengkap</label>
            <input 
              type="text" 
              value={formData.name}
              onChange={e => setFormData({...formData, name: e.target.value})}
              required 
            />
          </div>
          <div className={styles.inputGroup}>
            <label>Alamat Email</label>
            <input 
              type="email" 
              value={formData.email}
              onChange={e => setFormData({...formData, email: e.target.value})}
              required 
            />
          </div>
          <div className={styles.inputGroup}>
            <label>Subjek</label>
            <select 
              value={formData.subject}
              onChange={e => setFormData({...formData, subject: e.target.value})}
            >
              <option>Order Issue</option>
              <option>Payment Question</option>
              <option>Product Inquiry</option>
              <option>Shipping Delay</option>
              <option>Other</option>
            </select>
          </div>
          <div className={styles.inputGroup}>
            <label>Pesan</label>
            <textarea 
              rows={5} 
              value={formData.message}
              onChange={e => setFormData({...formData, message: e.target.value})}
              required 
            ></textarea>
          </div>
          <button type="submit" disabled={loading} className={styles.submitBtn}>
            {loading ? 'Mengirim...' : 'Kirim Pesan'}
          </button>

          {status && (
            <div className={`${styles.alert} ${styles[status.type]}`}>
              {status.msg}
            </div>
          )}
        </form>
      </div>
    </div>
  );
}
