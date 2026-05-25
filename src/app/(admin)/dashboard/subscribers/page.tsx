import { prisma } from '@/lib/db';
import SubscriberList from './SubscriberList';

export default async function SubscribersPage() {
  const subscribers = await prisma.subscriber.findMany({
    orderBy: { createdAt: 'desc' }
  });

  const customers = await prisma.user.findMany({
    where: { role: 'USER' },
    orderBy: { createdAt: 'desc' },
    select: {
      id: true,
      name: true,
      email: true,
      createdAt: true,
    }
  });

  const totalSubscribers = subscribers.length;
  const activeSubscribers = subscribers.filter(s => s.isActive).length;
  const totalCustomers = customers.length;

  return (
    <div>
      <div className="mb-10">
        <h2 className="text-[28px] font-black mb-2 text-[#1E293B]">Audience Manager</h2>
        <p className="text-[#64748B] font-semibold">Manage your store subscribers and customer marketing list.</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-5 mb-8">
        <div className="bg-white rounded-[16px] p-6 border border-[#E2E8F0] shadow-sm">
          <div className="flex items-center gap-4 mb-4">
            <div className="w-12 h-12 rounded-[12px] bg-blue-100 text-blue-600 flex items-center justify-center text-lg">
              <i className="fas fa-users"></i>
            </div>
          </div>
          <p className="text-sm text-[#64748B] mb-1">Total Customers</p>
          <h3 className="text-[28px] font-black text-[#1E293B]">{totalCustomers}</h3>
        </div>
        <div className="bg-white rounded-[16px] p-6 border border-[#E2E8F0] shadow-sm">
          <div className="flex items-center gap-4 mb-4">
            <div className="w-12 h-12 rounded-[12px] bg-green-100 text-green-600 flex items-center justify-center text-lg">
              <i className="fas fa-user-check"></i>
            </div>
          </div>
          <p className="text-sm text-[#64748B] mb-1">Newsletter Subscribers</p>
          <h3 className="text-[28px] font-black text-[#1E293B]">{totalSubscribers}</h3>
        </div>
        <div className="bg-white rounded-[16px] p-6 border border-[#E2E8F0] shadow-sm">
          <div className="flex items-center gap-4 mb-4">
            <div className="w-12 h-12 rounded-[12px] bg-purple-100 text-purple-600 flex items-center justify-center text-lg">
              <i className="fas fa-envelope-open-text"></i>
            </div>
          </div>
          <p className="text-sm text-[#64748B] mb-1">Active Subscribers</p>
          <h3 className="text-[28px] font-black text-[#1E293B]">{activeSubscribers}</h3>
        </div>
      </div>

      <SubscriberList 
        initialSubscribers={JSON.parse(JSON.stringify(subscribers))} 
        initialCustomers={JSON.parse(JSON.stringify(customers))} 
      />
    </div>
  );
}
