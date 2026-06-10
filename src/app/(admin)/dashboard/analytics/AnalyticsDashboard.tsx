'use client';

import { useState, useMemo } from 'react';

interface VisitorLog {
  id: string;
  ip: string;
  path: string;
  country: string;
  countryCode: string;
  userAgent: string | null;
  createdAt: string;
}

interface TopCountry {
  country: string;
  countryCode: string;
  count: number;
}

interface TopPath {
  path: string;
  count: number;
}

interface AnalyticsDashboardProps {
  stats: {
    totalViews: number;
    uniqueVisitors: number;
    views24h: number;
  };
  topCountries: TopCountry[];
  topPaths: TopPath[];
  initialLogs: VisitorLog[];
}

// Helper to convert country code to flag emoji
function getFlagEmoji(countryCode: string) {
  if (!countryCode || countryCode.length !== 2 || countryCode === 'XX') {
    return '🏳️';
  }
  if (countryCode === 'LOC') {
    return '💻';
  }
  const codePoints = countryCode
    .toUpperCase()
    .split('')
    .map(char => 127397 + char.charCodeAt(0));
  try {
    return String.fromCodePoint(...codePoints);
  } catch {
    return '🏳️';
  }
}

export default function AnalyticsDashboard({
  stats,
  topCountries,
  topPaths,
  initialLogs,
}: AnalyticsDashboardProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCountry, setSelectedCountry] = useState('All');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 15;

  // Filter logs based on search query and country
  const filteredLogs = useMemo(() => {
    return initialLogs.filter((log) => {
      const matchesSearch = 
        log.ip.toLowerCase().includes(searchTerm.toLowerCase()) ||
        log.path.toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchesCountry = 
        selectedCountry === 'All' || 
        log.country === selectedCountry;

      return matchesSearch && matchesCountry;
    });
  }, [initialLogs, searchTerm, selectedCountry]);

  // Pagination logic
  const totalPages = Math.ceil(filteredLogs.length / itemsPerPage);
  const safeCurrentPage = Math.min(currentPage, Math.max(1, totalPages));
  const paginatedLogs = useMemo(() => {
    const startIndex = (safeCurrentPage - 1) * itemsPerPage;
    return filteredLogs.slice(startIndex, startIndex + itemsPerPage);
  }, [filteredLogs, safeCurrentPage]);

  // Unique country list for filtering
  const countriesList = useMemo(() => {
    const countries = new Set(initialLogs.map((log) => log.country));
    return Array.from(countries).filter(c => c !== 'Unknown').sort();
  }, [initialLogs]);

  // Max values for relative charts scaling
  const maxPathCount = useMemo(() => Math.max(...topPaths.map((p) => p.count), 1), [topPaths]);
  const maxCountryCount = useMemo(() => Math.max(...topCountries.map((c) => c.count), 1), [topCountries]);

  // Handle CSV export of filtered logs
  const handleExport = () => {
    const csvContent = [
      ['Date/Time', 'IP Address', 'Page Path', 'Country', 'Country Code', 'User Agent'],
      ...filteredLogs.map((log) => [
        new Date(log.createdAt).toLocaleString('en-US'),
        log.ip,
        log.path,
        log.country,
        log.countryCode,
        log.userAgent || '',
      ]),
    ]
      .map((row) => row.map((cell) => `"${cell.replace(/"/g, '""')}"`).join(','))
      .join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `visitor-logs-${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="flex flex-col gap-8">
      {/* ── STATS CARDS ── */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
        {/* Total Page Views */}
        <div className="bg-white rounded-[16px] p-6 border border-[#E2E8F0] shadow-sm relative overflow-hidden before:absolute before:top-0 before:left-0 before:w-1 before:h-full before:bg-[#FF6B00]">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 rounded-[12px] bg-orange-50 text-[#FF6B00] flex items-center justify-center text-lg">
              <i className="fas fa-eye"></i>
            </div>
            <span className="text-[11px] font-extrabold text-[#64748B] bg-slate-50 px-2.5 py-1 rounded-[6px]">LIFETIME</span>
          </div>
          <p className="text-sm text-[#64748B] font-semibold mb-1">Total Page Views</p>
          <h3 className="text-[32px] font-black text-[#1E293B] tracking-tight">{stats.totalViews.toLocaleString()}</h3>
        </div>

        {/* Unique Visitors */}
        <div className="bg-white rounded-[16px] p-6 border border-[#E2E8F0] shadow-sm relative overflow-hidden before:absolute before:top-0 before:left-0 before:w-1 before:h-full before:bg-[#10B981]">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 rounded-[12px] bg-emerald-50 text-[#10B981] flex items-center justify-center text-lg">
              <i className="fas fa-users"></i>
            </div>
            <span className="text-[11px] font-extrabold text-[#64748B] bg-slate-50 px-2.5 py-1 rounded-[6px]">UNIQUE IPs</span>
          </div>
          <p className="text-sm text-[#64748B] font-semibold mb-1">Unique Visitors</p>
          <h3 className="text-[32px] font-black text-[#1E293B] tracking-tight">{stats.uniqueVisitors.toLocaleString()}</h3>
        </div>

        {/* 24h Traffic */}
        <div className="bg-white rounded-[16px] p-6 border border-[#E2E8F0] shadow-sm relative overflow-hidden before:absolute before:top-0 before:left-0 before:w-1 before:h-full before:bg-[#38BDF8]">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 rounded-[12px] bg-sky-50 text-[#38BDF8] flex items-center justify-center text-lg">
              <i className="fas fa-bolt"></i>
            </div>
            <span className="text-[11px] font-extrabold text-sky-600 bg-sky-50 px-2.5 py-1 rounded-[6px]">ACTIVE</span>
          </div>
          <p className="text-sm text-[#64748B] font-semibold mb-1">Last 24 Hours</p>
          <h3 className="text-[32px] font-black text-[#1E293B] tracking-tight">{stats.views24h.toLocaleString()}</h3>
        </div>
      </div>

      {/* ── CHARTS ROW ── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Top Visited Pages */}
        <div className="bg-white rounded-[16px] border border-[#E2E8F0] p-6 shadow-sm">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-lg font-black text-[#1E293B] flex items-center gap-2">
              <i className="fas fa-file-alt text-[#FF6B00]"></i> Top Visited Pages
            </h3>
            <span className="text-xs text-[#64748B] font-bold">Top 10 Routes</span>
          </div>
          <div className="flex flex-col gap-4">
            {topPaths.length > 0 ? (
              topPaths.map((item, index) => {
                const widthPct = (item.count / maxPathCount) * 100;
                return (
                  <div key={item.path} className="flex flex-col gap-1.5">
                    <div className="flex justify-between items-center text-xs">
                      <span className="font-semibold text-[#1E293B] truncate max-w-[80%] flex items-center gap-2">
                        <span className="text-[#94A3B8] font-bold w-4">{index + 1}.</span>
                        <code className="text-[#64748B] bg-slate-50 px-1.5 py-0.5 rounded text-[11px]">{item.path}</code>
                      </span>
                      <span className="font-black text-[#FF6B00] bg-orange-50 px-2 py-0.5 rounded-[4px]">{item.count} views</span>
                    </div>
                    <div className="w-full bg-slate-50 h-2 rounded-full overflow-hidden">
                      <div
                        className="bg-gradient-to-r from-orange-400 to-[#FF6B00] h-full rounded-full transition-all duration-500"
                        style={{ width: `${widthPct}%` }}
                      ></div>
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="text-center py-12 text-[#94A3B8] font-semibold">No visits logged yet.</div>
            )}
          </div>
        </div>

        {/* Top Countries */}
        <div className="bg-white rounded-[16px] border border-[#E2E8F0] p-6 shadow-sm">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-lg font-black text-[#1E293B] flex items-center gap-2">
              <i className="fas fa-globe-americas text-[#10B981]"></i> Visitor Demographics
            </h3>
            <span className="text-xs text-[#64748B] font-bold">Top 10 Countries</span>
          </div>
          <div className="flex flex-col gap-4">
            {topCountries.length > 0 ? (
              topCountries.map((item, index) => {
                const widthPct = (item.count / maxCountryCount) * 100;
                return (
                  <div key={item.country} className="flex flex-col gap-1.5">
                    <div className="flex justify-between items-center text-xs">
                      <span className="font-semibold text-[#1E293B] flex items-center gap-2.5">
                        <span className="text-[#94A3B8] font-bold w-4">{index + 1}.</span>
                        <span className="text-base leading-none">{getFlagEmoji(item.countryCode)}</span>
                        <span className="font-bold text-[#475569]">{item.country}</span>
                      </span>
                      <span className="font-black text-[#10B981] bg-emerald-50 px-2 py-0.5 rounded-[4px]">{item.count} visits</span>
                    </div>
                    <div className="w-full bg-slate-50 h-2 rounded-full overflow-hidden">
                      <div
                        className="bg-gradient-to-r from-emerald-400 to-[#10B981] h-full rounded-full transition-all duration-500"
                        style={{ width: `${widthPct}%` }}
                      ></div>
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="text-center py-12 text-[#94A3B8] font-semibold">No visits logged yet.</div>
            )}
          </div>
        </div>
      </div>

      {/* ── VISITOR LOGS TABLE ── */}
      <div className="bg-white rounded-[16px] border border-[#E2E8F0] overflow-hidden shadow-sm">
        {/* Table Filters & Actions */}
        <div className="p-5 border-b border-slate-100 bg-slate-50/50 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center flex-1">
            {/* Search Input */}
            <div className="relative flex-1 max-w-md">
              <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-[#94A3B8]">
                <i className="fas fa-search"></i>
              </span>
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => {
                  setSearchTerm(e.target.value);
                  setCurrentPage(1);
                }}
                placeholder="Search IP address or path..."
                className="w-full pl-10 pr-4 py-2.5 rounded-[12px] border border-gray-200 text-sm outline-none focus:border-[#FF6B00] transition-all bg-white"
              />
            </div>

            {/* Country Filter */}
            <div className="relative">
              <select
                value={selectedCountry}
                onChange={(e) => {
                  setSelectedCountry(e.target.value);
                  setCurrentPage(1);
                }}
                className="px-4 py-2.5 rounded-[12px] border border-gray-200 text-sm outline-none focus:border-[#FF6B00] transition-all bg-white pr-8 appearance-none font-semibold text-[#475569] cursor-pointer"
                style={{ backgroundImage: `url("data:image/svg+xml;charset=UTF-8,%3csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='%2364748b' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3e%3cpolyline points='6 9 12 15 18 9'%3e%3c/polyline%3e%3c/svg%3e")`, backgroundPosition: 'right 12px center', backgroundSize: '16px', backgroundRepeat: 'no-repeat' }}
              >
                <option value="All">All Countries</option>
                {countriesList.map((country) => (
                  <option key={country} value={country}>
                    {country}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <button
              onClick={handleExport}
              disabled={filteredLogs.length === 0}
              className="w-full sm:w-auto px-4 py-2.5 rounded-[12px] text-sm font-bold border border-gray-200 text-gray-600 hover:bg-gray-50 transition-all flex items-center justify-center gap-2 cursor-pointer bg-white disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <i className="fas fa-file-export"></i> Export CSV ({filteredLogs.length})
            </button>
          </div>
        </div>

        {/* Logs Table */}
        <div className="overflow-x-auto">
          <table className="w-full border-collapse">
            <thead>
              <tr className="bg-slate-50/70">
                <th className="text-left px-6 py-4 text-xs font-extrabold text-slate-500 uppercase tracking-wider">Visitor Info</th>
                <th className="text-left px-6 py-4 text-xs font-extrabold text-slate-500 uppercase tracking-wider">Page Accessed</th>
                <th className="text-left px-6 py-4 text-xs font-extrabold text-slate-500 uppercase tracking-wider">Referrer / Device</th>
                <th className="text-left px-6 py-4 text-xs font-extrabold text-slate-500 uppercase tracking-wider">Date & Time</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {paginatedLogs.length > 0 ? (
                paginatedLogs.map((log) => (
                  <tr key={log.id} className="hover:bg-slate-50/40 transition-colors">
                    {/* Visitor Info */}
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-[10px] bg-slate-100 text-slate-600 flex items-center justify-center text-sm font-bold">
                          {getFlagEmoji(log.countryCode)}
                        </div>
                        <div className="flex flex-col">
                          <span className="font-extrabold text-slate-800">{log.ip}</span>
                          <span className="text-[10px] font-bold text-slate-400 uppercase">
                            {log.country || 'Unknown'} ({log.countryCode})
                          </span>
                        </div>
                      </div>
                    </td>

                    {/* Page Accessed */}
                    <td className="px-6 py-4">
                      <div className="flex flex-col max-w-xs sm:max-w-md md:max-w-lg">
                        <span className="font-bold text-slate-700 truncate">{log.path}</span>
                        <a
                          href={log.path}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-[10px] font-extrabold text-[#FF6B00] hover:underline flex items-center gap-1 mt-0.5"
                        >
                          View page <i className="fas fa-external-link-alt text-[8px]"></i>
                        </a>
                      </div>
                    </td>

                    {/* Device / User Agent */}
                    <td className="px-6 py-4">
                      <div className="text-xs text-slate-500 truncate max-w-xs" title={log.userAgent || 'Unknown Device'}>
                        {log.userAgent ? (
                          <span className="font-medium text-slate-500">
                            {log.userAgent.includes('Mobile') ? (
                              <><i className="fas fa-mobile-alt mr-1 text-slate-400"></i> Mobile</>
                            ) : (
                              <><i className="fas fa-desktop mr-1 text-slate-400"></i> Desktop / Tablet</>
                            )}
                            <span className="text-[10px] text-slate-400 block truncate mt-0.5">{log.userAgent}</span>
                          </span>
                        ) : (
                          <span className="text-slate-400 italic">Direct / Unknown</span>
                        )}
                      </div>
                    </td>

                    {/* Date & Time */}
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex flex-col text-right sm:text-left">
                        <span className="text-[13px] font-bold text-slate-600">
                          {new Date(log.createdAt).toLocaleDateString('en-US', {
                            month: 'short',
                            day: 'numeric',
                            year: 'numeric',
                          })}
                        </span>
                        <span className="text-[10px] font-bold text-slate-400 uppercase mt-0.5">
                          {new Date(log.createdAt).toLocaleTimeString('en-US', {
                            hour: '2-digit',
                            minute: '2-digit',
                            second: '2-digit',
                          })}
                        </span>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={4} className="text-center py-20 text-slate-400">
                    <div className="text-[48px] opacity-10 mb-4">
                      <i className="fas fa-search-minus"></i>
                    </div>
                    <p className="font-black text-sm">NO LOGS FOUND FOR YOUR FILTER</p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Controls */}
        {totalPages > 1 && (
          <div className="px-6 py-4 border-t border-slate-100 flex items-center justify-between bg-slate-50/30">
            <span className="text-xs font-bold text-slate-500">
              Showing Page <strong className="text-slate-800">{safeCurrentPage}</strong> of{' '}
              <strong className="text-slate-800">{totalPages}</strong> ({filteredLogs.length} total logs)
            </span>
            <div className="flex gap-2">
              <button
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                disabled={safeCurrentPage === 1}
                className="px-3.5 py-1.5 rounded-[8px] text-xs font-bold border border-slate-200 text-slate-600 hover:bg-slate-50 transition-all disabled:opacity-50 disabled:cursor-not-allowed bg-white cursor-pointer"
              >
                Previous
              </button>
              <button
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                disabled={safeCurrentPage === totalPages}
                className="px-3.5 py-1.5 rounded-[8px] text-xs font-bold border border-slate-200 text-slate-600 hover:bg-slate-50 transition-all disabled:opacity-50 disabled:cursor-not-allowed bg-white cursor-pointer"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
