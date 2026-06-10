import { prisma } from '@/lib/db';
import AnalyticsDashboard from './AnalyticsDashboard';

export const revalidate = 0; // Ensure data is fetched fresh

export default async function AnalyticsPage() {
  // Query total page views
  const totalViews = await prisma.visitorLog.count();

  // Query unique visitors (distinct IPs)
  const uniqueVisitorsRaw = await prisma.visitorLog.groupBy({
    by: ['ip'],
  });
  const uniqueVisitors = uniqueVisitorsRaw.length;

  // Query page views in the last 24 hours
  const oneDayAgo = new Date();
  oneDayAgo.setHours(oneDayAgo.getHours() - 24);
  const views24h = await prisma.visitorLog.count({
    where: {
      createdAt: {
        gte: oneDayAgo,
      },
    },
  });

  // Query top 10 countries
  const topCountriesRaw = await prisma.visitorLog.groupBy({
    by: ['country', 'countryCode'],
    _count: {
      id: true,
    },
    orderBy: {
      _count: {
        id: 'desc',
      },
    },
    take: 10,
  });

  const topCountries = topCountriesRaw.map((item) => ({
    country: item.country,
    countryCode: item.countryCode,
    count: item._count.id,
  }));

  // Query top 10 accessed pages/paths
  const topPathsRaw = await prisma.visitorLog.groupBy({
    by: ['path'],
    _count: {
      id: true,
    },
    orderBy: {
      _count: {
        id: 'desc',
      },
    },
    take: 10,
  });

  const topPaths = topPathsRaw.map((item) => ({
    path: item.path,
    count: item._count.id,
  }));

  // Query the 500 latest visitor logs
  const logs = await prisma.visitorLog.findMany({
    orderBy: {
      createdAt: 'desc',
    },
    take: 500,
  });

  return (
    <div className="animate-fade-in">
      <div className="mb-10">
        <h2 className="text-[28px] font-black mb-2 text-[#1E293B]">Visitor Analytics & Logs</h2>
        <p className="text-[#64748B] font-semibold">Monitor real-time website traffic, page views, and visitor demographics.</p>
      </div>

      <AnalyticsDashboard
        stats={{
          totalViews,
          uniqueVisitors,
          views24h,
        }}
        topCountries={topCountries}
        topPaths={topPaths}
        initialLogs={JSON.parse(JSON.stringify(logs))}
      />
    </div>
  );
}
