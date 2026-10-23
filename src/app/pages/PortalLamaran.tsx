import React, { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { Briefcase, MapPin, Clock, X, CheckCircle, Search } from 'lucide-react';
import { toast } from 'sonner';
import { rekrutmenApi } from '../data/api';

// ── Helpers ───────────────────────────────────────────────────────────────────

const formatRp = (v: number | null) =>
  v != null ? new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(v) : null;

const EMPTY_FORM = {
  nama_lengkap: '', nip_lama: '', tempat_lahir: '', tanggal_lahir: '',
  jenis_kelamin: 'L', agama: '', alamat: '', no_hp: '', email: '',
  pendidikan_terakhir: '', jurusan: '', institusi: '', ipk: '',
  pengalaman_kerja: '',
};

// ── Daftar Modal ──────────────────────────────────────────────────────────────

function DaftarModal({ formasi, onClose }: { formasi: any; onClose: () => void }) {
  const [form, setForm] = useState({ ...EMPTY_FORM });
  const [result, setResult] = useState<{ nomor_lamaran: number; pesan: string } | null>(null);

  const mut = useMutation({
    mutationFn: (d: any) => rekrutmenApi.daftar(d),
    onSuccess: (data) => {
      if (data.status === 'success') {
        setResult({ nomor_lamaran: data.nomor_lamaran, pesan: data.pesan });
      } else {
        toast.error(data.message ?? 'Terjadi kesalahan');
      }
    },
    onError: () => toast.error('Gagal mengirim lamaran. Coba lagi.'),
  });

  const set = (k: string, v: string) => setForm(f => ({ ...f, [k]: v }));
  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    mut.mutate({ ...form, formasi_id: formasi.id, ipk: form.ipk || undefined });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[92vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b px-6 py-4 flex justify-between items-center rounded-t-2xl">
          <div>
            <h2 className="text-lg font-bold text-gray-900">Formulir Lamaran</h2>
            <p className="text-sm text-gray-500">{formasi.jabatan} — {formasi.unit_kerja}</p>
          </div>
          <button onClick={onClose} className="p-1 rounded-lg hover:bg-gray-100"><X size={20} /></button>
        </div>

        {result ? (
          <div className="p-8 text-center space-y-4">
            <CheckCircle size={56} className="text-green-500 mx-auto" />
            <h3 className="text-xl font-bold text-gray-900">Lamaran Berhasil Dikirim!</h3>
            <p className="text-gray-600">{result.pesan}</p>
            <div className="bg-blue-50 rounded-xl p-4">
              <p className="text-sm text-blue-600 font-medium">Nomor Lamaran Anda</p>
              <p className="text-3xl font-bold text-blue-700">#{result.nomor_lamaran}</p>
              <p className="text-xs text-blue-500 mt-1">Simpan nomor ini untuk mengecek status lamaran</p>
            </div>
            <button onClick={onClose} className="mt-4 px-6 py-2 bg-gray-900 text-white rounded-lg text-sm">Tutup</button>
          </div>
        ) : (
          <form onSubmit={submit} className="p-6 space-y-4">
            <p className="text-sm text-gray-500 font-medium uppercase tracking-wide">Data Diri</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="sm:col-span-2">
                <label className="block text-sm font-medium mb-1">Nama Lengkap <span className="text-red-500">*</span></label>
                <input className="w-full border rounded-lg px-3 py-2 text-sm" required
                  value={form.nama_lengkap} onChange={e => set('nama_lengkap', e.target.value)} />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">NIP Lama (jika ada)</label>
                <input className="w-full border rounded-lg px-3 py-2 text-sm"
                  value={form.nip_lama} onChange={e => set('nip_lama', e.target.value)} />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Tempat Lahir <span className="text-red-500">*</span></label>
                <input className="w-full border rounded-lg px-3 py-2 text-sm" required
                  value={form.tempat_lahir} onChange={e => set('tempat_lahir', e.target.value)} />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Tanggal Lahir <span className="text-red-500">*</span></label>
                <input className="w-full border rounded-lg px-3 py-2 text-sm" type="date" required
                  value={form.tanggal_lahir} onChange={e => set('tanggal_lahir', e.target.value)} />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Jenis Kelamin <span className="text-red-500">*</span></label>
                <select className="w-full border rounded-lg px-3 py-2 text-sm" required
                  value={form.jenis_kelamin} onChange={e => set('jenis_kelamin', e.target.value)}>
                  <option value="L">Laki-laki</option>
                  <option value="P">Perempuan</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Agama <span className="text-red-500">*</span></label>
                <select className="w-full border rounded-lg px-3 py-2 text-sm" required
                  value={form.agama} onChange={e => set('agama', e.target.value)}>
                  <option value="">Pilih</option>
                  {['Islam','Kristen Protestan','Katolik','Hindu','Buddha','Konghucu'].map(a => (
                    <option key={a} value={a}>{a}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">No HP <span className="text-red-500">*</span></label>
                <input className="w-full border rounded-lg px-3 py-2 text-sm" type="tel" required
                  value={form.no_hp} onChange={e => set('no_hp', e.target.value)} />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Email <span className="text-red-500">*</span></label>
                <input className="w-full border rounded-lg px-3 py-2 text-sm" type="email" required
                  value={form.email} onChange={e => set('email', e.target.value)} />
              </div>
              <div className="sm:col-span-2">
                <label className="block text-sm font-medium mb-1">Alamat <span className="text-red-500">*</span></label>
                <textarea className="w-full border rounded-lg px-3 py-2 text-sm" rows={2} required
                  value={form.alamat} onChange={e => set('alamat', e.target.value)} />
              </div>
            </div>

            <p className="text-sm text-gray-500 font-medium uppercase tracking-wide pt-2">Pendidikan</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1">Pendidikan Terakhir <span className="text-red-500">*</span></label>
                <select className="w-full border rounded-lg px-3 py-2 text-sm" required
                  value={form.pendidikan_terakhir} onChange={e => set('pendidikan_terakhir', e.target.value)}>
                  <option value="">Pilih</option>
                  {['SMA/SMK','D3','D4','S1','S2','S3'].map(d => <option key={d} value={d}>{d}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Jurusan <span className="text-red-500">*</span></label>
                <input className="w-full border rounded-lg px-3 py-2 text-sm" required
                  value={form.jurusan} onChange={e => set('jurusan', e.target.value)} />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Institusi <span className="text-red-500">*</span></label>
                <input className="w-full border rounded-lg px-3 py-2 text-sm" required
                  value={form.institusi} onChange={e => set('institusi', e.target.value)} />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">IPK (opsional)</label>
                <input className="w-full border rounded-lg px-3 py-2 text-sm" type="number" min={0} max={4} step={0.01}
                  value={form.ipk} onChange={e => set('ipk', e.target.value)} placeholder="mis. 3.50" />
              </div>
              <div className="sm:col-span-2">
                <label className="block text-sm font-medium mb-1">Pengalaman Kerja (opsional)</label>
                <textarea className="w-full border rounded-lg px-3 py-2 text-sm" rows={3}
                  value={form.pengalaman_kerja} onChange={e => set('pengalaman_kerja', e.target.value)}
                  placeholder="Uraikan pengalaman kerja relevan..." />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button type="button" onClick={onClose} className="px-4 py-2 border rounded-lg text-sm">Batal</button>
              <button type="submit" disabled={mut.isPending}
                className="px-6 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium disabled:opacity-50">
                {mut.isPending ? 'Mengirim...' : 'Kirim Lamaran'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}

// ── Cek Status Section ────────────────────────────────────────────────────────

function CekStatus({ formasi }: { formasi: any[] }) {
  const [email, setEmail] = useState('');
  const [formasiId, setFormasiId] = useState('');
  const [result, setResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const cek = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !formasiId) return;
    setLoading(true);
    try {
      const data = await rekrutmenApi.cekStatus(email, Number(formasiId));
      setResult(data);
    } catch {
      toast.error('Gagal mengambil data');
    } finally {
      setLoading(false);
    }
  };

  const statusColor: Record<string, string> = {
    Diterima: 'text-yellow-700 bg-yellow-50', Review: 'text-blue-700 bg-blue-50',
    Tes: 'text-purple-700 bg-purple-50', Wawancara: 'text-indigo-700 bg-indigo-50',
    Lolos: 'text-green-700 bg-green-50', 'Tidak Lolos': 'text-red-700 bg-red-50',
    Cadangan: 'text-gray-700 bg-gray-50',
  };

  return (
    <div className="bg-white rounded-2xl shadow-sm border p-6 space-y-4">
      <div className="flex items-center gap-2">
        <Search size={20} className="text-gray-500" />
        <h2 className="text-lg font-semibold text-gray-900">Cek Status Lamaran</h2>
      </div>
      <form onSubmit={cek} className="flex flex-col sm:flex-row gap-3">
        <input className="flex-1 border rounded-lg px-3 py-2 text-sm" type="email" required
          placeholder="Email yang didaftarkan" value={email} onChange={e => setEmail(e.target.value)} />
        <select className="flex-1 border rounded-lg px-3 py-2 text-sm" required
          value={formasiId} onChange={e => setFormasiId(e.target.value)}>
          <option value="">Pilih Formasi</option>
          {formasi.map((f: any) => <option key={f.id} value={f.id}>{f.jabatan}</option>)}
        </select>
        <button type="submit" disabled={loading}
          className="px-4 py-2 bg-gray-900 text-white rounded-lg text-sm font-medium disabled:opacity-50">
          {loading ? 'Memeriksa...' : 'Cek Status'}
        </button>
      </form>

      {result && (
        <div className={`rounded-xl p-4 ${result.status === 'error' ? 'bg-red-50 text-red-700' : 'space-y-2'}`}>
          {result.status === 'error' ? (
            <p className="text-sm">{result.message}</p>
          ) : (
            <>
              <p className="text-sm text-gray-600">Status Lamaran Anda:</p>
              <span className={`inline-block px-3 py-1 rounded-full text-sm font-semibold ${statusColor[result.data?.status] ?? 'text-gray-700 bg-gray-50'}`}>
                {result.data?.status}
              </span>
              {result.data?.catatan_admin && (
                <p className="text-sm text-gray-600">Catatan: {result.data.catatan_admin}</p>
              )}
              {result.data?.nilai_tes != null && (
                <p className="text-sm text-gray-600">Nilai Tes: <strong>{result.data.nilai_tes}</strong></p>
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
}

// ── Main Portal Page ──────────────────────────────────────────────────────────

export default function PortalLamaran() {
  const [selected, setSelected] = useState<any>(null);

  const { data, isLoading, isError } = useQuery({
    queryKey: ['public-lowongan'],
    queryFn: () => rekrutmenApi.getPublicLowongan(),
    staleTime: 60_000,
  });

  const formasi: any[] = data?.data ?? [];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-blue-700 text-white py-12 px-4">
        <div className="max-w-4xl mx-auto text-center space-y-2">
          <Briefcase size={40} className="mx-auto opacity-80" />
          <h1 className="text-3xl font-bold">Portal Rekrutmen</h1>
          <p className="text-blue-200 text-sm">Daftar lowongan PPPK & Tenaga Honorer yang sedang dibuka</p>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-10 space-y-8">
        {/* Lowongan list */}
        <section>
          <h2 className="text-xl font-bold text-gray-900 mb-4">Lowongan Tersedia</h2>
          {isLoading && <p className="text-gray-500 text-sm">Memuat lowongan...</p>}
          {isError && <p className="text-red-500 text-sm">Gagal memuat lowongan. Coba muat ulang halaman.</p>}
          {!isLoading && formasi.length === 0 && (
            <div className="bg-white rounded-2xl border p-10 text-center text-gray-400">
              <Briefcase size={40} className="mx-auto mb-2 opacity-30" />
              <p>Belum ada lowongan yang dibuka saat ini.</p>
            </div>
          )}
          <div className="grid gap-4">
            {formasi.map((f: any) => {
              const gajiMin = formatRp(f.gaji_min);
              const gajiMax = formatRp(f.gaji_max);
              const gajiRange = gajiMin && gajiMax ? `${gajiMin} – ${gajiMax}` : gajiMin ?? gajiMax ?? null;
              return (
                <div key={f.id} className="bg-white rounded-2xl shadow-sm border p-5 space-y-3">
                  <div className="flex justify-between items-start gap-3">
                    <div>
                      <h3 className="text-base font-bold text-gray-900">{f.jabatan}</h3>
                      <div className="flex items-center gap-1 text-sm text-gray-500 mt-0.5">
                        <MapPin size={13} /> <span>{f.unit_kerja}</span>
                      </div>
                    </div>
                    <span className="shrink-0 text-xs font-semibold px-2 py-1 bg-blue-100 text-blue-700 rounded-full">
                      {f.status_pegawai_target}
                    </span>
                  </div>

                  <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-gray-600">
                    <span><strong>Kualifikasi:</strong> {f.kualifikasi_pendidikan}{f.jurusan_dibutuhkan ? ` (${f.jurusan_dibutuhkan})` : ''}</span>
                    <span><strong>Formasi:</strong> {f.jumlah_formasi} posisi</span>
                    {f.batas_usia_min || f.batas_usia_max ? (
                      <span><strong>Usia:</strong> {f.batas_usia_min ?? '?'}–{f.batas_usia_max ?? '?'} tahun</span>
                    ) : null}
                    {gajiRange && <span><strong>Gaji:</strong> {gajiRange}</span>}
                  </div>

                  {f.persyaratan_khusus && (
                    <p className="text-sm text-gray-500 bg-gray-50 rounded-lg px-3 py-2">{f.persyaratan_khusus}</p>
                  )}

                  <div className="flex items-center justify-between pt-1">
                    <div className="flex items-center gap-1 text-xs text-gray-400">
                      <Clock size={12} /> Tutup: {f.tanggal_tutup}
                    </div>
                    <button onClick={() => setSelected(f)}
                      className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors">
                      Daftar Sekarang
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        {/* Cek status */}
        {formasi.length > 0 && <CekStatus formasi={formasi} />}
      </main>

      {selected && <DaftarModal formasi={selected} onClose={() => setSelected(null)} />}
    </div>
  );
}
