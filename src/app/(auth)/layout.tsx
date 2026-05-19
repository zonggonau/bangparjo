import '../globals.css';

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="auth-layout" style={{ 
      minHeight: '100vh', 
      background: 'var(--gray-50)',
      display: 'flex',
      flexDirection: 'column'
    }}>
      {children}
    </div>
  );
}
