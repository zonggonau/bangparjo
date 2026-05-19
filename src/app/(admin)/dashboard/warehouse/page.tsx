'use client';

import { useState, useEffect } from 'react';

interface CJGlobalWarehouse {
  areaId: number;
  areaEn: string;
  areaCn: string;
  countryCode: string;
  countryNameEn: string;
  countryNameCn: string;
  isDefault: number;
}

interface CJWarehouseDetail {
  id: string;
  name: string;
  areaId: number;
  areaCountryCode: string;
  address1: string | null;
  address2: string | null;
  contacts: string | null;
  phone: string | null;
  city: string;
  province: string;
  logisticsBrandList: Array<{ id: string; name: string }>;
  isSelfPickup: number | null;
  zipCode: string | null;
}

export default function WarehousePage() {
  const [warehouses, setWarehouses] = useState<CJGlobalWarehouse[]>([]);
  const [selectedWarehouse, setSelectedWarehouse] = useState<CJWarehouseDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [detailLoading, setDetailLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchWarehouses();
  }, []);

  const fetchWarehouses = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/cj-warehouse');
      const data = await res.json();
      if (data.success && Array.isArray(data.data)) {
        setWarehouses(data.data);
      } else {
        setError(data.message || 'Failed to load warehouses');
      }
    } catch (err) {
      setError('Network error loading warehouses');
    } finally {
      setLoading(false);
    }
  };

  const fetchWarehouseDetail = async (id: string) => {
    setDetailLoading(true);
    setSelectedWarehouse(null);
    try {
      const res = await fetch(`/api/cj-warehouse?id=${encodeURIComponent(id)}`);
      const data = await res.json();
      if (data.success && data.data) {
        setSelectedWarehouse(data.data);
      } else {
        setError(data.message || 'Failed to load warehouse detail');
      }
    } catch (err) {
      setError('Network error loading warehouse detail');
    } finally {
      setDetailLoading(false);
    }
  };

  const inputClass = "w-full px-4 py-3 rounded-[10px] border border-[#E2E8F0] bg-gray-50 text-sm font-semibold outline-none focus:border-[#FF6B00] focus:shadow-[0_0_0_4px_#FFF3E0] focus:bg-white transition-all duration-200";
  const labelClass = "block font-extrabold text-xs uppercase tracking-[0.05em] text-[#64748B] mb-2";

  return (
    <div>
      <div className="mb-10">
        <h2 className="text-[28px] font-black mb-2 text-[#1E293B]">CJ Warehouses</h2>
        <p className="text-[#64748B] font-semibold">Browse CJ global warehouses and view detailed storage information.</p>
      </div>

      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-[12px] text-sm font-bold text-red-600 flex items-center gap-3">
          <i className="fas fa-exclamation-circle"></i>
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 xl:grid-cols-[1fr_1.5fr] gap-8">
        {/* Warehouse List */}
        <div className="bg-white rounded-[16px] border border-[#E2E8F0] shadow-sm overflow-hidden">
          <div className="flex items-center justify-between px-8 py-6 border-b border-[#E2E8F0]">
            <h3 className="text-lg font-extrabold text-[#1E293B]">Global Warehouses</h3>
            <button 
              className="inline-flex items-center gap-2 px-4 py-2 rounded-[10px] text-sm font-bold border border-[#E2E8F0] bg-white hover:border-[#FF6B00] hover:bg-[#F8FAFC] transition-all duration-200"
              onClick={fetchWarehouses}
            >
              <i className="fas fa-sync-alt"></i> Refresh
            </button>
          </div>
          <div className="divide-y divide-[#F1F5F9] max-h-[600px] overflow-y-auto">
            {loading ? (
              <div className="text-center py-20">
                <i className="fas fa-spinner fa-spin text-[#FF6B00] text-2xl"></i>
              </div>
            ) : warehouses.length === 0 ? (
              <div className="text-center py-20 text-[#64748B] font-bold">
                <i className="fas fa-warehouse text-4xl mb-4 block text-gray-300"></i>
                No warehouses found.
              </div>
            ) : warehouses.map((w) => (
              <button
                key={w.areaId}
                className="w-full text-left px-8 py-5 hover:bg-[#FAFBFE] transition-all duration-200 flex items-center gap-4"
                onClick={() => fetchWarehouseDetail(String(w.areaId))}
              >
                <div className="w-10 h-10 rounded-[10px] bg-[#FFF3E0] text-[#FF6B00] flex items-center justify-center flex-shrink-0">
                  <i className="fas fa-warehouse"></i>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-extrabold text-sm text-[#1E293B] truncate">{w.areaEn}</p>
                  <p className="text-[11px] font-bold text-[#64748B] mt-0.5">
                    {w.countryNameEn} ({w.countryCode})
                    {w.isDefault === 1 && <span className="ml-2 text-[#10B981]">★ Default</span>}
                  </p>
                </div>
                <i className="fas fa-chevron-right text-gray-300 text-sm"></i>
              </button>
            ))}
          </div>
        </div>

        {/* Warehouse Detail */}
        <div className="bg-white rounded-[16px] border border-[#E2E8F0] shadow-sm overflow-hidden">
          <div className="px-8 py-6 border-b border-[#E2E8F0]">
            <h3 className="text-lg font-extrabold text-[#1E293B]">Warehouse Details</h3>
          </div>
          <div className="p-8">
            {detailLoading ? (
              <div className="text-center py-20">
                <i className="fas fa-spinner fa-spin text-[#FF6B00] text-2xl"></i>
                <p className="mt-4 text-sm font-bold text-[#64748B]">Loading details...</p>
              </div>
            ) : !selectedWarehouse ? (
              <div className="text-center py-20 text-[#64748B]">
                <i className="fas fa-hand-pointer text-4xl mb-4 block text-gray-300"></i>
                <p className="font-bold">Select a warehouse from the list</p>
                <p className="text-xs mt-2">to view its detailed information</p>
              </div>
            ) : (
              <div className="grid gap-6">
                <div className="flex items-center gap-4 pb-6 border-b border-[#E2E8F0]">
                  <div className="w-14 h-14 rounded-[14px] bg-[#FFF3E0] text-[#FF6B00] flex items-center justify-center text-2xl">
                    <i className="fas fa-warehouse"></i>
                  </div>
                  <div>
                    <h4 className="text-xl font-black text-[#1E293B]">{selectedWarehouse.name}</h4>
                    <p className="text-sm font-bold text-[#64748B]">
                      {selectedWarehouse.city}, {selectedWarehouse.province} · {selectedWarehouse.areaCountryCode}
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className={labelClass}>Warehouse ID</label>
                    <input type="text" className={inputClass} value={selectedWarehouse.id} readOnly />
                  </div>
                  <div>
                    <label className={labelClass}>Area ID</label>
                    <input type="text" className={inputClass} value={selectedWarehouse.areaId} readOnly />
                  </div>
                  <div>
                    <label className={labelClass}>Country Code</label>
                    <input type="text" className={inputClass} value={selectedWarehouse.areaCountryCode} readOnly />
                  </div>
                  <div>
                    <label className={labelClass}>Zip Code</label>
                    <input type="text" className={inputClass} value={selectedWarehouse.zipCode || '-'} readOnly />
                  </div>
                </div>

                <div>
                  <label className={labelClass}>Address</label>
                  <input type="text" className={inputClass} value={[selectedWarehouse.address1, selectedWarehouse.address2].filter(Boolean).join(', ') || '-'} readOnly />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className={labelClass}>Phone</label>
                    <input type="text" className={inputClass} value={selectedWarehouse.phone || '-'} readOnly />
                  </div>
                  <div>
                    <label className={labelClass}>Contacts</label>
                    <input type="text" className={inputClass} value={selectedWarehouse.contacts || '-'} readOnly />
                  </div>
                  <div>
                    <label className={labelClass}>Self Pickup</label>
                    <input type="text" className={inputClass} value={selectedWarehouse.isSelfPickup === 1 ? 'Supported' : selectedWarehouse.isSelfPickup === 0 ? 'Not Supported' : '-'} readOnly />
                  </div>
                </div>

                <div className="pt-4 border-t border-[#E2E8F0]">
                  <label className={labelClass}>Supported Logistics Brands ({selectedWarehouse.logisticsBrandList.length})</label>
                  <div className="flex flex-wrap gap-2 mt-2">
                    {selectedWarehouse.logisticsBrandList.map((brand) => (
                      <span 
                        key={brand.id}
                        className="inline-flex items-center px-3.5 py-1.5 rounded-[8px] text-[11px] font-extrabold uppercase tracking-[0.05em] bg-[#F0F9FF] text-[#0369A1]"
                      >
                        {brand.name}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
