import React, { useState } from 'react';
import { Head, router } from '@inertiajs/react';
import { CalendarDays, Plus, Check, X, Clock, AlertCircle } from 'lucide-react';
import Layout from '../components/Layout';

interface Props {
  cutiList: {
    data: Array<{
      id: number;
      pegawai: { nama: string; nip: string; jabatan: string; unit_kerja: string };
      jenis_cuti: string;
      tanggal_mulai: string;
      tanggal_selesai: string;
      jumlah_hari: number;
      alasan: string;
      status: string;
    }>;
    links: any[];
  };
  pegawaiList: Array<{ id: number; nama: string; nip: string; jabatan: string }>;
  sisaCutiUser: number;
  canApprove: boolean;
  flash?: { success?: string; error?: string };
}

export default function CutiPage({ cutiList, pegawaiList, sisaCutiUser, canApprove, flash }: Props) {
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({
    pegawai_id: pegawaiList[0]?.id || '',
    jenis_cuti: 'Cuti Tahunan',
    tanggal_mulai: '',
    tanggal_selesai: '',
    jumlah_hari: 1,
    alasan: '',
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    router.post('/cuti', form, {
      onSuccess: () => setShowModal(false),
    });
  };

  const handleApprove = (id: number) => {
    router.post(`/cuti/${id}/approve`);
  };

  const handleReject = (id: number) => {
    const alasan = prompt('Masukkan alasan penolakan:');
    if (alasan) {
      router.post(`/cuti/${id}/reject`, { alasan });
    }
  };

  return (
    <Layout>
      <Head title="Manajemen Cuti Pegawai" />
      <div className="space-y-6">

      {flash?.success && (
        <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 px-4 py-3 rounded-xl flex items-center gap-2">
          <Check className="w-5 h-5 text-emerald-600" />
          <span>{flash.success}</span>
        </div>
      )}

      {/* Header & Sisa Cuti */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Manajemen Cuti ASN</h1>
          <p className="text-sm text-gray-500">Sesuai Peraturan Pemerintah No. 11 Tahun 2017</p>
        </div>
        <div className="flex items-center gap-4">
          <div className="text-right">
            <span className="text-xs text-gray-400">Sisa Kuota Tahunan</span>
            <div className="text-xl font-bold text-[#013E37]">{sisaCutiUser} Hari Kerja</div>
          </div>
          <button
            onClick={() => setShowModal(true)}
            className="flex items-center gap-2 px-4 py-2.5 bg-[#013E37] hover:bg-[#025046] text-white rounded-xl text-sm font-medium transition"
          >
            <Plus className="w-4 h-4" />
            Ajukan Cuti
          </button>
        </div>
      </div>

      {/* Tabel Pengajuan Cuti */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="p-5 border-b border-gray-100">
          <h2 className="font-semibold text-gray-800">Daftar Permohonan Cuti</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-gray-600">
            <thead className="bg-gray-50 text-xs font-semibold uppercase text-gray-500 border-b border-gray-100">
              <tr>
                <th className="px-6 py-4">Pegawai</th>
                <th className="px-6 py-4">Jenis Cuti</th>
                <th className="px-6 py-4">Periode</th>
                <th className="px-6 py-4">Jumlah</th>
                <th className="px-6 py-4">Status</th>
                {canApprove && <th className="px-6 py-4 text-center">Aksi</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {cutiList.data.map((c) => (
                <tr key={c.id} className="hover:bg-gray-50/50">
                  <td className="px-6 py-4">
                    <div className="font-medium text-gray-900">{c.pegawai?.nama}</div>
                    <div className="text-xs text-gray-400">{c.pegawai?.jabatan} • {c.pegawai?.unit_kerja}</div>
                  </td>
                  <td className="px-6 py-4 font-medium text-gray-800">{c.jenis_cuti}</td>
                  <td className="px-6 py-4">{c.tanggal_mulai} s/d {c.tanggal_selesai}</td>
                  <td className="px-6 py-4 font-semibold">{c.jumlah_hari} Hari</td>
                  <td className="px-6 py-4">
                    <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${
                      c.status === 'Disetujui' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' :
                      c.status === 'Ditolak' ? 'bg-red-50 text-red-700 border border-red-200' :
                      'bg-amber-50 text-amber-700 border border-amber-200'
                    }`}>
                      {c.status}
                    </span>
                  </td>
                  {canApprove && (
                    <td className="px-6 py-4 text-center">
                      {c.status === 'Pending' && (
                        <div className="flex justify-center gap-2">
                          <button
                            onClick={() => handleApprove(c.id)}
                            className="p-1.5 bg-emerald-50 text-emerald-600 rounded-lg hover:bg-emerald-100 transition"
                            title="Setujui"
                          >
                            <Check className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleReject(c.id)}
                            className="p-1.5 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 transition"
                            title="Tolak"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                      )}
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal Ajukan Cuti */}
      {showModal && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 space-y-4 shadow-xl">
            <h3 className="text-lg font-bold text-gray-900">Form Pengajuan Cuti</h3>
            <form onSubmit={handleSubmit} className="space-y-4 text-sm">
              <div>
                <label className="block text-gray-600 mb-1">Pilih Pegawai</label>
                <select
                  value={form.pegawai_id}
                  onChange={(e) => setForm({ ...form, pegawai_id: e.target.value })}
                  className="w-full border border-gray-200 rounded-xl p-2.5"
                  required
                >
                  {pegawaiList.map((p) => (
                    <option key={p.id} value={p.id}>{p.nama} ({p.jabatan})</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-gray-600 mb-1">Jenis Cuti</label>
                <select
                  value={form.jenis_cuti}
                  onChange={(e) => setForm({ ...form, jenis_cuti: e.target.value })}
                  className="w-full border border-gray-200 rounded-xl p-2.5"
                >
                  <option value="Cuti Tahunan">Cuti Tahunan</option>
                  <option value="Cuti Sakit">Cuti Sakit</option>
                  <option value="Cuti Melahirkan">Cuti Melahirkan</option>
                  <option value="Cuti Besar">Cuti Besar</option>
                  <option value="Cuti Alasan Penting">Cuti Alasan Penting</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-gray-600 mb-1">Mulai</label>
                  <input
                    type="date"
                    value={form.tanggal_mulai}
                    onChange={(e) => setForm({ ...form, tanggal_mulai: e.target.value })}
                    className="w-full border border-gray-200 rounded-xl p-2.5"
                    required
                  />
                </div>
                <div>
                  <label className="block text-gray-600 mb-1">Selesai</label>
                  <input
                    type="date"
                    value={form.tanggal_selesai}
                    onChange={(e) => setForm({ ...form, tanggal_selesai: e.target.value })}
                    className="w-full border border-gray-200 rounded-xl p-2.5"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-gray-600 mb-1">Jumlah Hari Kerja</label>
                <input
                  type="number"
                  min="1"
                  max="12"
                  value={form.jumlah_hari}
                  onChange={(e) => setForm({ ...form, jumlah_hari: parseInt(e.target.value) || 1 })}
                  className="w-full border border-gray-200 rounded-xl p-2.5"
                  required
                />
              </div>

              <div>
                <label className="block text-gray-600 mb-1">Alasan Cuti</label>
                <textarea
                  value={form.alasan}
                  onChange={(e) => setForm({ ...form, alasan: e.target.value })}
                  className="w-full border border-gray-200 rounded-xl p-2.5"
                  rows={3}
                  required
                />
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 border border-gray-200 text-gray-600 rounded-xl hover:bg-gray-50"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-[#013E37] text-white rounded-xl hover:bg-[#025046]"
                >
                  Kirim Pengajuan
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      </div>
    </Layout>
  );
}
