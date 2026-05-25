import { redirect } from 'next/navigation';
import { auth } from '@/auth';
import AdminSidebar from '@/components/admin/AdminSidebar';
import AdminTopbar from '@/components/admin/AdminTopbar';
import '../globals.css';
import './admin.css';

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();

  if (!session) {
    redirect('/login');
  }

  return (
    <div className="admin-layout">
      {/* Sidebar (Client Component) */}
      <AdminSidebar />

      {/* Main Content */}
      <div className="main-content">
        {/* Topbar (Client Component) */}
        <AdminTopbar session={session} />

        {/* Server Components children */}
        <main className="content">
          {children}
        </main>
      </div>
    </div>
  );
}
