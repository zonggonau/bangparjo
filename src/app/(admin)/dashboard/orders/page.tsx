import { getAdminOrdersAction } from '@/lib/actions-admin-orders';
import { getOrderList } from '@/lib/cj-api';
import OrdersClientView from './OrdersClientView';

// Force dynamic since searchParams dictates the data
export const dynamic = 'force-dynamic';

export default async function OrdersPage({
  searchParams,
}: {
  searchParams: { [key: string]: string | string[] | undefined };
}) {
  const source = (searchParams.source as string) || 'LOCAL';
  const statusFilter = (searchParams.status as string) || 'ALL';
  const searchQuery = ((searchParams.search as string) || '').toLowerCase();

  let orders = [];

  if (source === 'LOCAL') {
    const res = await getAdminOrdersAction();
    let localOrders = res.success ? res.data || [] : [];
    
    if (statusFilter !== 'ALL') {
      localOrders = localOrders.filter((o: any) => o.status === statusFilter);
    }
    
    if (searchQuery) {
      localOrders = localOrders.filter((o: any) => 
        (o.orderNum && o.orderNum.toLowerCase().includes(searchQuery)) ||
        (o.customerName && o.customerName.toLowerCase().includes(searchQuery)) ||
        (o.customerEmail && o.customerEmail.toLowerCase().includes(searchQuery))
      );
    }
    
    orders = localOrders;
  } else {
    // Fetch from CJ
    // Note: status param for CJ API might need mapping, but keeping simple for now
    try {
      const res = await getOrderList({ pageNum: 1, pageSize: 50, status: statusFilter === 'ALL' ? '' : statusFilter });
      if (res.success && res.data && res.data.list) {
        let cjOrders = res.data.list;
        
        if (searchQuery) {
          cjOrders = cjOrders.filter((o: any) => 
            (o.orderId && o.orderId.toLowerCase().includes(searchQuery)) ||
            (o.shippingCustomerName && o.shippingCustomerName.toLowerCase().includes(searchQuery))
          );
        }
        
        orders = cjOrders;
      }
    } catch (e) {
      console.error('Failed to fetch CJ orders:', e);
    }
  }

  return (
    <OrdersClientView 
      orders={orders} 
      currentSource={source} 
      currentStatus={statusFilter} 
      currentSearch={searchQuery}
    />
  );
}
