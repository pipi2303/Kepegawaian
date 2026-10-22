import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { DollarSign, Download, Loader2, CheckCircle, Clock, AlertCircle } from 'lucide-react';
import { selfApi } from '../data/api';
import { toast } from 'sonner';

const BULAN = ['', 'Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'];

const statusConfig: Record<string, { icon: React.ReactNode; cls: string; label: string }> = {
  Draft:       { icon: <Clock className="w-3.5 h-3.5" />, cls: 'bg-gray-100 text-gray-600', label: 'Draft' },
  Approved:    { icon: <CheckCircle className="w-3.5 h-3.5" />, cls: 'bg-blue-50 text-blue-700', label: 'Disetujui' },
  Dibayarkan:  { icon: <CheckCircle className="w-3.5 h-3.5" />, cls: 'bg-green-50 text-green-700', label: 'Dibayarkan' },
};

function formatRp(n: number | string) {
  return Number(n).toLocaleString('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 });
}

async function downloadSlip(id: number, bulan: number, tahun: number) {
  try {
    const res = await selfApi.downloadSlip(id);
    const url = URL.createObjectURL(new Blob([res.data], { type: 'application/pdf' }));
    const a = document.createElement('a');
    a.href = url;
    a.download = `slip_gaji_${BULAN[bulan]}_${tahun}.pdf`;
    a.click();
    URL.revokeObjectURL(url);
  } catch {
    toast.error('Gagal mengunduh slip gaji');
  }
}

export default function MyPayroll() {
  const { data, isLoading } = useQuery({
    queryKey: ['self-payroll'],
    queryFn: () => selfApi.payroll(),
  });

  const items: any[] = data?.data ?? [];

  return (
    <div className="max-w-2xl mx-auto p-4 space-y-5">
      <h1 className="text-xl font-semibold text-gray-800">Slip Gaji Saya</h1>

      {isLoading && (
        <div className="flex justify-center py-12">
          <Loader2 className="w-6 h-6 animate-spin text-[#013E37]" />
        </div>
      )}

      {!isLoading && items.length === 0 && (
        <div className="text-center py-16 text-gray-400">
          <DollarSign className="w-10 h-10 mx-auto mb-2 opacity-30" />
          <p className="text-sm">Belum ada slip gaji tersedia</p>
        </div>
      )}

      <div className="space-y-3">
        {items.map((g: any) => {
          const s = statusConfig[g.status_pembayaran] ?? statusConfig['Draft'];
          return (
            <div key={g.id} className="bg-white rounded-xl border border-gray-100 shadow-sm p-4 flex items-center justify-between gap-3">
              <div className="min-w-0">
                <p className="font-medium text-gray-800 text-sm">
                  {BULAN[g.bulan]} {g.tahun}
                </p>
                <p className="text-xs text-gray-500 mt-0.5">
                  Netto: <span className="font-semibold text-[#013E37]">{formatRp(g.total_netto)}</span>
                </p>
              </div>
              <div className="flex items-center gap-2 flex-shrink-0">
                <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium ${s.cls}`}>
                  {s.icon} {s.label}
                </span>
                {g.status_pembayaran !== 'Draft' && (
                  <button
                    onClick={() => downloadSlip(g.id, g.bulan, g.tahun)}
                    className="p-2 rounded-lg text-gray-500 hover:bg-gray-100 hover:text-[#013E37] transition-colors"
                    title="Unduh PDF"
                  >
                    <Download className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {!isLoading && items.length > 0 && (
        <p className="text-xs text-center text-gray-400 flex items-center justify-center gap-1">
          <AlertCircle className="w-3.5 h-3.5" />
          Slip gaji berstatus Draft belum dapat diunduh
        </p>
      )}
    </div>
  );
}
