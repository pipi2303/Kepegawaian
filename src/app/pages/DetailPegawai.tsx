import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router';
import {
  ArrowLeft, User, Briefcase, GraduationCap, Clock,
  Calendar, TrendingUp, Target, Phone, Mail, MapPin,
  Edit2, Printer, Award,
} from 'lucide-react';
import { dataPegawai, dataRiwayatJabatan, dataCuti, dataKenaikanPangkat, dataSKP } from '../data/mockData';
import { PANGKAT_GOLONGAN } from '../data/constants';

const InfoRow = ({ label, value }: { label: string; value?: string | number }) => (
  <div className="flex flex-col sm:flex-row sm:items-start gap-1 sm:gap-3">
    <span className="text-xs text-gray-400 w-44 flex-shrink-0">{label}</span>
    <span className="text-sm text-gray-800 font-medium flex-1">{value || '-'}</span>
  </div>
);

const tabs = [
  { id: 'profil', label: 'Profil', icon: User },
  { id: 'jabatan', label: 'Riwayat Jabatan', icon: Briefcase },
  { id: 'cuti', label: 'Riwayat Cuti', icon: Calendar },
  { id: 'pangkat', label: 'Kenaikan Pangkat', icon: TrendingUp },
  { id: 'skp', label: 'SKP', icon: Target },
];

export default function DetailPegawai() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('profil');

  const pegawai = dataPegawai.find(p => p.id === id);
  if (!pegawai) {
    return (
      <div className="p-6 text-center">
        <p className="text-gray-500">Pegawai tidak ditemukan</p>
        <button onClick={() => navigate('/pegawai')} className="mt-4 text-blue-600 hover:underline text-sm">
          Kembali ke Daftar Pegawai
        </button>
      </div>
    );
  }

  const riwayatJabatan = dataRiwayatJabatan.filter(r => r.pegawaiId === id);
  const riwayatCuti = dataCuti.filter(c => c.pegawaiId === id);
  const riwayatKP = dataKenaikanPangkat.filter(k => k.pegawaiId === id);
  const riwayatSKP = dataSKP.filter(s => s.pegawaiId === id);

  const getFullName = () => `${pegawai.gelarDepan || ''} ${pegawai.nama}${pegawai.gelarBelakang ? ', ' + pegawai.gelarBelakang : ''}`.trim();

  const statusColorCuti: Record<string, string> = {
    'Disetujui': 'bg-green-100 text-green-700',
    'Pending': 'bg-yellow-100 text-yellow-700',
    'Ditolak': 'bg-red-100 text-red-700',
  };

  const predikatColor: Record<string, string> = {
    'Sangat Baik': 'bg-emerald-100 text-emerald-700',
    'Baik': 'bg-blue-100 text-blue-700',
    'Cukup': 'bg-yellow-100 text-yellow-700',
    'Kurang': 'bg-orange-100 text-orange-700',
    'Sangat Kurang': 'bg-red-100 text-red-700',
  };

  return (
    <div className="p-4 lg:p-6">
      {/* Back */}
      <button
        onClick={() => navigate('/pegawai')}
        className="flex items-center gap-2 text-sm text-gray-500 hover:text-gray-800 mb-5 transition-colors"
      >
        <ArrowLeft className="w-4 h-4" /> Kembali ke Daftar Pegawai
      </button>

      {/* Profile Header */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm mb-5 overflow-hidden">
        <div className="bg-gradient-to-r from-[#1e3a5f] to-[#2563eb] px-6 pt-8 pb-5 relative">
          <div className="flex flex-col md:flex-row md:items-end gap-5">
            <div className="w-20 h-20 rounded-2xl bg-white/20 flex items-center justify-center text-white text-2xl font-bold border-2 border-white/40 shadow">
              {pegawai.nama.charAt(0)}
            </div>
            <div className="flex-1">
              <h2 className="text-white text-xl font-semibold">{getFullName()}</h2>
              <p className="text-blue-200 text-sm mt-0.5">{pegawai.jabatan}</p>
              <div className="flex flex-wrap items-center gap-2 mt-2">
                <span className="bg-white/20 text-white text-xs px-2.5 py-1 rounded-full">{pegawai.unitKerja}</span>
                <span className="bg-white/20 text-white text-xs px-2.5 py-1 rounded-full">Gol. {pegawai.golongan}</span>
                <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${pegawai.statusPegawai === 'PNS' ? 'bg-blue-500 text-white' : 'bg-green-500 text-white'}`}>
                  {pegawai.statusPegawai}
                </span>
                <span className="bg-emerald-500 text-white text-xs px-2.5 py-1 rounded-full">{pegawai.statusAktif}</span>
              </div>
            </div>
            <div className="flex gap-2">
              <button className="flex items-center gap-2 px-3 py-2 bg-white/20 hover:bg-white/30 text-white rounded-lg text-sm transition-colors">
                <Printer className="w-4 h-4" /> Cetak
              </button>
              <button className="flex items-center gap-2 px-3 py-2 bg-white text-blue-700 rounded-lg text-sm hover:bg-blue-50 transition-colors">
                <Edit2 className="w-4 h-4" /> Edit
              </button>
            </div>
          </div>
        </div>

        {/* Quick Info Bar */}
        <div className="px-6 py-3 bg-gray-50 border-t border-gray-100 grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
          <div className="flex items-center gap-2 text-gray-600">
            <Award className="w-4 h-4 text-gray-400" />
            <span className="text-xs">NIP: <strong>{pegawai.nip}</strong></span>
          </div>
          <div className="flex items-center gap-2 text-gray-600">
            <Phone className="w-4 h-4 text-gray-400" />
            <span className="text-xs">{pegawai.noTelp}</span>
          </div>
          <div className="flex items-center gap-2 text-gray-600">
            <Mail className="w-4 h-4 text-gray-400" />
            <span className="text-xs truncate">{pegawai.email}</span>
          </div>
          <div className="flex items-center gap-2 text-gray-600">
            <Clock className="w-4 h-4 text-gray-400" />
            <span className="text-xs">Masa Kerja: <strong>{pegawai.masaKerja}</strong></span>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="flex overflow-x-auto border-b border-gray-100">
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-5 py-3.5 text-sm whitespace-nowrap transition-all border-b-2 ${
                activeTab === tab.id
                  ? 'border-blue-600 text-blue-600 bg-blue-50/50'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:bg-gray-50'
              }`}
            >
              <tab.icon className="w-4 h-4" />
              {tab.label}
            </button>
          ))}
        </div>

        <div className="p-6">
          {/* Profil Tab */}
          {activeTab === 'profil' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {/* Data Pribadi */}
              <div>
                <h4 className="text-gray-500 text-xs font-semibold uppercase tracking-wider mb-4 flex items-center gap-2">
                  <User className="w-4 h-4" /> Data Pribadi
                </h4>
                <div className="space-y-3">
                  <InfoRow label="Nama Lengkap" value={getFullName()} />
                  <InfoRow label="NIP" value={pegawai.nip} />
                  <InfoRow label="Jenis Kelamin" value={pegawai.jenisKelamin === 'L' ? 'Laki-laki' : 'Perempuan'} />
                  <InfoRow label="Tempat, Tgl. Lahir" value={`${pegawai.tempatLahir}, ${new Date(pegawai.tanggalLahir).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}`} />
                  <InfoRow label="Agama" value={pegawai.agama} />
                  <InfoRow label="Status Perkawinan" value={pegawai.statusPerkawinan} />
                  <InfoRow label="No. Telepon" value={pegawai.noTelp} />
                  <InfoRow label="Email" value={pegawai.email} />
                  <InfoRow label="Alamat" value={pegawai.alamat} />
                </div>
              </div>

              {/* Data Kepegawaian */}
              <div>
                <h4 className="text-gray-500 text-xs font-semibold uppercase tracking-wider mb-4 flex items-center gap-2">
                  <Briefcase className="w-4 h-4" /> Data Kepegawaian
                </h4>
                <div className="space-y-3">
                  <InfoRow label="Status Pegawai" value={pegawai.statusPegawai} />
                  <InfoRow label="Status Aktif" value={pegawai.statusAktif} />
                  <InfoRow label="Jabatan" value={pegawai.jabatan} />
                  <InfoRow label="Jabatan Fungsional" value={pegawai.jabatanFungsional} />
                  {pegawai.eselon && <InfoRow label="Eselon" value={pegawai.eselon} />}
                  <InfoRow label="Unit Kerja" value={pegawai.unitKerja} />
                  <InfoRow label="Golongan / Pangkat" value={`${pegawai.golongan} / ${pegawai.pangkat}`} />
                  <InfoRow label="TMT Golongan" value={new Date(pegawai.tmtGolongan).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })} />
                  <InfoRow label="TMT Jabatan" value={new Date(pegawai.tmtJabatan).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })} />
                  <InfoRow label="Tanggal Masuk" value={new Date(pegawai.tanggalMasuk).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })} />
                  <InfoRow label="Masa Kerja" value={pegawai.masaKerja} />
                  <InfoRow label="Batas Usia Pensiun" value={new Date(pegawai.batasPensiun).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })} />
                </div>

                <div className="mt-6">
                  <h4 className="text-gray-500 text-xs font-semibold uppercase tracking-wider mb-4 flex items-center gap-2">
                    <GraduationCap className="w-4 h-4" /> Pendidikan Terakhir
                  </h4>
                  <div className="space-y-3">
                    <InfoRow label="Jenjang" value={pegawai.pendidikanTerakhir} />
                    <InfoRow label="Jurusan" value={pegawai.jurusan} />
                    <InfoRow label="Institusi" value={pegawai.institusi} />
                    <InfoRow label="Tahun Lulus" value={pegawai.tahunLulus} />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Riwayat Jabatan Tab */}
          {activeTab === 'jabatan' && (
            <div>
              <div className="flex items-center justify-between mb-5">
                <h4 className="font-medium text-gray-800">Riwayat Jabatan</h4>
              </div>
              {riwayatJabatan.length === 0 ? (
                <div className="text-center py-12 text-gray-400">
                  <Briefcase className="w-12 h-12 mx-auto mb-3 opacity-30" />
                  <p className="text-sm">Belum ada riwayat jabatan</p>
                </div>
              ) : (
                <div className="relative">
                  <div className="absolute left-5 top-0 bottom-0 w-0.5 bg-gray-200"></div>
                  <div className="space-y-4">
                    {riwayatJabatan.map((r, i) => (
                      <div key={r.id} className="flex gap-4 relative">
                        <div className={`w-10 h-10 rounded-full flex-shrink-0 flex items-center justify-center z-10 ${i === 0 ? 'bg-blue-600 text-white' : 'bg-white border-2 border-gray-300 text-gray-400'}`}>
                          <Briefcase className="w-4 h-4" />
                        </div>
                        <div className="flex-1 bg-gray-50 rounded-xl p-4 mb-2">
                          <div className="flex flex-col md:flex-row md:items-start justify-between gap-2">
                            <div>
                              <p className="font-medium text-gray-800 text-sm">{r.jabatan}</p>
                              <p className="text-xs text-gray-500 mt-0.5">{r.unitKerja}</p>
                            </div>
                            <span className={`text-xs px-2.5 py-1 rounded-full font-medium self-start ${r.jenisJabatan === 'Struktural' ? 'bg-purple-100 text-purple-700' : r.jenisJabatan === 'Fungsional' ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-600'}`}>
                              {r.jenisJabatan}
                            </span>
                          </div>
                          <div className="mt-3 grid grid-cols-2 md:grid-cols-4 gap-3 text-xs">
                            <div>
                              <span className="text-gray-400">Golongan</span>
                              <p className="text-gray-700 font-medium mt-0.5">{r.golongan}</p>
                            </div>
                            <div>
                              <span className="text-gray-400">TMT Mulai</span>
                              <p className="text-gray-700 font-medium mt-0.5">{new Date(r.tmtMulai).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}</p>
                            </div>
                            <div>
                              <span className="text-gray-400">TMT Selesai</span>
                              <p className="text-gray-700 font-medium mt-0.5">{r.tmtSelesai ? new Date(r.tmtSelesai).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' }) : 'Sekarang'}</p>
                            </div>
                            <div>
                              <span className="text-gray-400">No. SK</span>
                              <p className="text-gray-700 font-medium mt-0.5">{r.nomorSK}</p>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Riwayat Cuti Tab */}
          {activeTab === 'cuti' && (
            <div>
              <h4 className="font-medium text-gray-800 mb-5">Riwayat Cuti</h4>
              {riwayatCuti.length === 0 ? (
                <div className="text-center py-12 text-gray-400">
                  <Calendar className="w-12 h-12 mx-auto mb-3 opacity-30" />
                  <p className="text-sm">Belum ada riwayat cuti</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="bg-gray-50 rounded-lg">
                        <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500">Jenis Cuti</th>
                        <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500">Tanggal</th>
                        <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500">Jumlah Hari</th>
                        <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500">Alasan</th>
                        <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50">
                      {riwayatCuti.map(c => (
                        <tr key={c.id} className="hover:bg-gray-50">
                          <td className="px-4 py-3 text-gray-700">{c.jenisCuti}</td>
                          <td className="px-4 py-3 text-gray-600 text-xs">
                            {new Date(c.tanggalMulai).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })} —{' '}
                            {new Date(c.tanggalSelesai).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}
                          </td>
                          <td className="px-4 py-3 text-center font-medium text-gray-700">{c.jumlahHari} hari</td>
                          <td className="px-4 py-3 text-gray-600 max-w-xs truncate">{c.alasan}</td>
                          <td className="px-4 py-3">
                            <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${statusColorCuti[c.status]}`}>
                              {c.status}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {/* Kenaikan Pangkat Tab */}
          {activeTab === 'pangkat' && (
            <div>
              <h4 className="font-medium text-gray-800 mb-5">Riwayat Kenaikan Pangkat</h4>
              {riwayatKP.length === 0 ? (
                <div className="text-center py-12 text-gray-400">
                  <TrendingUp className="w-12 h-12 mx-auto mb-3 opacity-30" />
                  <p className="text-sm">Belum ada riwayat kenaikan pangkat</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {riwayatKP.map(k => (
                    <div key={k.id} className="bg-gray-50 rounded-xl p-4">
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <div className="flex items-center gap-3">
                            <span className="text-sm font-medium text-gray-800">{k.pangkatLama} → {k.pangkatBaru}</span>
                            <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded">{k.golonganLama} → {k.golonganBaru}</span>
                          </div>
                          <p className="text-xs text-gray-500 mt-1">{k.jenisKenaikan} · Periode {k.periodeUsulan}</p>
                          {k.nomorSK && <p className="text-xs text-gray-400 mt-0.5">SK: {k.nomorSK}</p>}
                        </div>
                        <span className={`text-xs px-2.5 py-1 rounded-full font-medium flex-shrink-0 ${k.status === 'Selesai' ? 'bg-green-100 text-green-700' : k.status === 'Proses' ? 'bg-yellow-100 text-yellow-700' : 'bg-red-100 text-red-700'}`}>
                          {k.status}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* SKP Tab */}
          {activeTab === 'skp' && (
            <div>
              <h4 className="font-medium text-gray-800 mb-5">Riwayat SKP (Sasaran Kinerja Pegawai)</h4>
              {riwayatSKP.length === 0 ? (
                <div className="text-center py-12 text-gray-400">
                  <Target className="w-12 h-12 mx-auto mb-3 opacity-30" />
                  <p className="text-sm">Belum ada data SKP</p>
                </div>
              ) : (
                <div className="space-y-5">
                  {riwayatSKP.map(skp => (
                    <div key={skp.id} className="border border-gray-200 rounded-xl overflow-hidden">
                      <div className="flex items-center justify-between px-5 py-3 bg-gray-50">
                        <div className="flex items-center gap-3">
                          <Target className="w-4 h-4 text-gray-400" />
                          <span className="text-sm font-medium text-gray-800">
                            SKP Semester {skp.semester} Tahun {skp.tahun}
                          </span>
                        </div>
                        <div className="flex items-center gap-3">
                          {skp.nilaiAkhir && (
                            <span className="text-sm font-semibold text-gray-700">Nilai: {skp.nilaiAkhir}</span>
                          )}
                          {skp.predikat && (
                            <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${predikatColor[skp.predikat]}`}>
                              {skp.predikat}
                            </span>
                          )}
                          <span className={`text-xs px-2.5 py-1 rounded-full ${skp.status === 'Selesai' ? 'bg-green-100 text-green-700' : skp.status === 'Aktif' ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-600'}`}>
                            {skp.status}
                          </span>
                        </div>
                      </div>
                      <div className="p-4">
                        <table className="w-full text-xs">
                          <thead>
                            <tr className="text-gray-400">
                              <th className="text-left pb-2">Uraian Kegiatan</th>
                              <th className="text-center pb-2">Target</th>
                              <th className="text-center pb-2">Realisasi</th>
                              <th className="text-center pb-2">Bobot</th>
                              <th className="text-center pb-2">Capaian</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-gray-50">
                            {skp.targetKinerja.map(t => (
                              <tr key={t.id} className="hover:bg-gray-50">
                                <td className="py-2 pr-4 text-gray-700">{t.uraianKegiatan}</td>
                                <td className="py-2 text-center text-gray-600">{t.target} {t.satuan}</td>
                                <td className="py-2 text-center text-gray-600">{t.realisasi ?? '-'} {t.realisasi ? t.satuan : ''}</td>
                                <td className="py-2 text-center text-gray-600">{t.bobot}%</td>
                                <td className="py-2 text-center">
                                  {t.nilaiCapaian ? (
                                    <span className={`font-medium ${t.nilaiCapaian >= 100 ? 'text-green-600' : 'text-yellow-600'}`}>
                                      {t.nilaiCapaian.toFixed(1)}%
                                    </span>
                                  ) : '-'}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}