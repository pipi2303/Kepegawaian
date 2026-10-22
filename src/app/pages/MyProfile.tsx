import React, { useState, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { User, Phone, Mail, MapPin, Upload, Award, Save, Loader2, CheckCircle } from 'lucide-react';
import { selfApi } from '../data/api';
import { toast } from 'sonner';

export default function MyProfile() {
  const qc = useQueryClient();
  const strRef = useRef<HTMLInputElement>(null);
  const sipRef = useRef<HTMLInputElement>(null);

  const { data: profile, isLoading } = useQuery({
    queryKey: ['self-me'],
    queryFn: selfApi.me,
  });

  const [form, setForm] = useState({ email: '', no_telp: '', alamat: '' });
  const [edited, setEdited] = useState(false);

  // Sync form once loaded
  React.useEffect(() => {
    if (profile && !edited) {
      setForm({
        email: profile.email ?? '',
        no_telp: profile.no_telp ?? '',
        alamat: profile.alamat ?? '',
      });
    }
  }, [profile, edited]);

  const updateMut = useMutation({
    mutationFn: selfApi.updateProfile,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['self-me'] });
      toast.success('Profil berhasil diperbarui');
      setEdited(false);
    },
    onError: (e: any) => toast.error(e.response?.data?.message || 'Gagal menyimpan profil'),
  });

  const uploadStrMut = useMutation({
    mutationFn: selfApi.uploadStr,
    onSuccess: () => toast.success('Berkas STR berhasil diunggah, menunggu proses HR'),
    onError: (e: any) => toast.error(e.response?.data?.message || 'Gagal unggah STR'),
  });

  const uploadSipMut = useMutation({
    mutationFn: selfApi.uploadSip,
    onSuccess: () => toast.success('Berkas SIP berhasil diunggah, menunggu proses HR'),
    onError: (e: any) => toast.error(e.response?.data?.message || 'Gagal unggah SIP'),
  });

  const handleChange = (field: string, value: string) => {
    setForm(f => ({ ...f, [field]: value }));
    setEdited(true);
  };

  const handleSave = () => updateMut.mutate(form);

  const initials = profile?.nama
    ? profile.nama.split(' ').slice(0, 2).map((w: string) => w[0]).join('').toUpperCase()
    : '?';

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-6 h-6 animate-spin text-[#013E37]" />
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto p-4 space-y-5">
      <h1 className="text-xl font-semibold text-gray-800">Profil Saya</h1>

      {/* Avatar + identity */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 flex items-start gap-5">
        <div className="w-16 h-16 rounded-full bg-[#013E37] flex items-center justify-center text-[#FFEFB2] text-2xl font-bold flex-shrink-0">
          {initials}
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-lg font-semibold text-gray-900 truncate">{profile?.nama}</p>
          <p className="text-sm text-gray-500">{profile?.nip}</p>
          <p className="text-sm text-gray-600 mt-1">{profile?.jabatan}</p>
          <p className="text-sm text-gray-500">{profile?.unit_kerja}</p>
          <div className="flex flex-wrap gap-2 mt-3">
            {profile?.golongan && (
              <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-[#013E37]/10 text-[#013E37] text-xs font-medium rounded-full">
                <Award className="w-3 h-3" />
                Gol. {profile.golongan}
              </span>
            )}
            <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-green-50 text-green-700 text-xs font-medium rounded-full">
              <CheckCircle className="w-3 h-3" />
              {profile?.sisa_cuti_tahunan ?? 0} hari cuti tersisa
            </span>
          </div>
        </div>
      </div>

      {/* Editable fields */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 space-y-4">
        <h2 className="font-medium text-gray-700 text-sm uppercase tracking-wide">Data Kontak</h2>

        <div className="space-y-1">
          <label className="flex items-center gap-1.5 text-xs font-medium text-gray-500">
            <Mail className="w-3.5 h-3.5" /> Email
          </label>
          <input
            type="email"
            value={form.email}
            onChange={e => handleChange('email', e.target.value)}
            className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#013E37]/30"
            placeholder="email@example.com"
          />
        </div>

        <div className="space-y-1">
          <label className="flex items-center gap-1.5 text-xs font-medium text-gray-500">
            <Phone className="w-3.5 h-3.5" /> No. Telepon
          </label>
          <input
            type="tel"
            value={form.no_telp}
            onChange={e => handleChange('no_telp', e.target.value)}
            className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#013E37]/30"
            placeholder="08xx-xxxx-xxxx"
          />
        </div>

        <div className="space-y-1">
          <label className="flex items-center gap-1.5 text-xs font-medium text-gray-500">
            <MapPin className="w-3.5 h-3.5" /> Alamat
          </label>
          <textarea
            value={form.alamat}
            onChange={e => handleChange('alamat', e.target.value)}
            rows={3}
            className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#013E37]/30 resize-none"
            placeholder="Alamat lengkap..."
          />
        </div>

        {edited && (
          <button
            onClick={handleSave}
            disabled={updateMut.isPending}
            className="flex items-center gap-2 px-4 py-2 bg-[#013E37] text-white text-sm rounded-lg hover:bg-[#025046] disabled:opacity-50 transition-colors"
          >
            {updateMut.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            Simpan Perubahan
          </button>
        )}
      </div>

      {/* STR / SIP Upload */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 space-y-4">
        <h2 className="font-medium text-gray-700 text-sm uppercase tracking-wide">Perpanjangan Lisensi</h2>
        <p className="text-xs text-gray-500">Upload berkas STR/SIP untuk diproses oleh Tim HR. Format: PDF, JPG, PNG. Maks 5 MB.</p>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <p className="text-sm font-medium text-gray-700 mb-2">Surat Tanda Registrasi (STR)</p>
            <input ref={strRef} type="file" accept=".pdf,.jpg,.jpeg,.png" className="hidden"
              onChange={e => e.target.files?.[0] && uploadStrMut.mutate(e.target.files[0])} />
            <button
              onClick={() => strRef.current?.click()}
              disabled={uploadStrMut.isPending}
              className="flex items-center gap-2 w-full px-4 py-2.5 border-2 border-dashed border-gray-200 rounded-lg text-sm text-gray-600 hover:border-[#013E37] hover:text-[#013E37] disabled:opacity-50 transition-colors"
            >
              {uploadStrMut.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
              Upload Berkas STR
            </button>
          </div>

          <div>
            <p className="text-sm font-medium text-gray-700 mb-2">Surat Izin Praktik (SIP)</p>
            <input ref={sipRef} type="file" accept=".pdf,.jpg,.jpeg,.png" className="hidden"
              onChange={e => e.target.files?.[0] && uploadSipMut.mutate(e.target.files[0])} />
            <button
              onClick={() => sipRef.current?.click()}
              disabled={uploadSipMut.isPending}
              className="flex items-center gap-2 w-full px-4 py-2.5 border-2 border-dashed border-gray-200 rounded-lg text-sm text-gray-600 hover:border-[#013E37] hover:text-[#013E37] disabled:opacity-50 transition-colors"
            >
              {uploadSipMut.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
              Upload Berkas SIP
            </button>
          </div>
        </div>
      </div>

      {/* Read-only fields */}
      <div className="bg-gray-50 rounded-2xl border border-gray-100 p-6 space-y-3">
        <h2 className="font-medium text-gray-500 text-sm uppercase tracking-wide">Data Kepegawaian (dikelola HR)</h2>
        <div className="grid grid-cols-2 gap-x-6 gap-y-2 text-sm">
          {[
            ['NIP', profile?.nip],
            ['Jabatan', profile?.jabatan],
            ['Unit Kerja', profile?.unit_kerja],
            ['Golongan', profile?.golongan],
            ['Status', profile?.status_pegawai],
          ].map(([label, val]) => (
            <div key={label as string}>
              <span className="text-gray-400 text-xs">{label}</span>
              <p className="text-gray-700 font-medium truncate">{val || '-'}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
