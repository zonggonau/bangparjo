import { NextResponse } from 'next/server';

export async function GET() {
  const start = Date.now();
  const checks: Record<string, any> = {};

  // 1. Database check
  try {
    const { prisma } = await import('@/lib/db');
    await prisma.$queryRaw`SELECT 1`;
    checks.database = { status: 'healthy', latency: `${Date.now() - start}ms` };
  } catch (e: any) {
    checks.database = { status: 'unhealthy', error: e.message };
  }

  // 2. Redis — disabled
  checks.redis = { status: 'disabled' };

  // 3. Environment check
  checks.env = {
    appVersion: process.env.npm_package_version || '0.1.0',
    nodeEnv: process.env.NODE_ENV,
    hasCjApiKey: !!process.env.CJ_API_KEY,
    hasMidtransKey: !!process.env.MIDTRANS_SERVER_KEY,
    hasAuthSecret: !!process.env.AUTH_SECRET,
  };

  const uptime = process.uptime();
  const memory = process.memoryUsage();

  const isHealthy = checks.database.status === 'healthy';

  return NextResponse.json(
    {
      status: isHealthy ? 'ok' : 'degraded',
      timestamp: new Date().toISOString(),
      uptime: Math.floor(uptime),
      checks,
      memory: {
        heapUsed: `${Math.round(memory.heapUsed / 1024 / 1024)}MB`,
        heapTotal: `${Math.round(memory.heapTotal / 1024 / 1024)}MB`,
        rss: `${Math.round(memory.rss / 1024 / 1024)}MB`,
      },
      latency: `${Date.now() - start}ms`,
    },
    { status: isHealthy ? 200 : 503 }
  );
}
