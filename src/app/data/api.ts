import http from '../lib/http';

// AUTH
export const authApi = {
  login: (email: string, password: string) =>
    http.post('/login', { email, password }),
  logout: () => http.post('/logout'),
  me: () => http.get('/auth/me').then(r => r.data.data),
};

// PEGAWAI
export const pegawaiApi = {
  getAll: (params?: Record<string, any>) =>
    http.get('/pegawai', { params }).then(r => r.data.data),
  getOne: (id: number | string) =>
    http.get(`/pegawai/${id}`).then(r => r.data.data),
  create: (data: any) =>
    http.post('/pegawai', data).then(r => r.data.data),
  update: (id: number | string, data: any) =>
    http.put(`/pegawai/${id}`, data).then(r => r.data.data),
  remove: (id: number | string) =>
    http.delete(`/pegawai/${id}`).then(r => r.data),
  importTemplate: () =>
    http.get('/import/pegawai/template', { responseType: 'blob' }),
  import: (file: File) => {
    const fd = new FormData();
    fd.append('file', file);
    return http.post('/import/pegawai', fd, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },
};

// CUTI
export const cutiApi = {
  getAll: (params?: Record<string, any>) =>
    http.get('/cuti', { params }).then(r => r.data.data),
  create: (data: any) =>
    http.post('/cuti', data).then(r => r.data.data),
  approve: (id: number | string, catatan?: string) =>
    http.post(`/cuti/${id}/approve`, { catatan }).then(r => r.data),
  reject: (id: number | string, alasan: string) =>
    http.post(`/cuti/${id}/reject`, { alasan }).then(r => r.data),
  getSisaCuti: (pegawaiId: number | string) =>
    http.get(`/pegawai/${pegawaiId}/sisa-cuti`).then(r => r.data.data),
};

// ABSENSI
export const absensiApi = {
  getAll: (params?: Record<string, any>) =>
    http.get('/absensi/rekap-bulanan', { params }).then(r => r.data.data),
  checkIn: (pegawai_id: number | string) =>
    http.post('/absensi/check-in', { pegawai_id }).then(r => r.data),
  checkOut: (pegawai_id: number | string) =>
    http.post('/absensi/check-out', { pegawai_id }).then(r => r.data),
};

// DASHBOARD
export const dashboardApi = {
  summary: () => http.get('/dashboard/summary').then(r => r.data.data),
  notifications: () => http.get('/notifications').then(r => r.data),
  direkturSummary: () => http.get('/dashboard/direktur-summary').then(r => ({ ...r.data.data, generated_at: r.data.generated_at })),
  trendAbsensi: () => http.get('/dashboard/trend-absensi').then(r => r.data.data),
  kontrakExpiring: () => http.get('/dashboard/kontrak-expiring').then(r => r.data),
  strByUnit: () => http.get('/dashboard/str-by-unit').then(r => r.data.data),
  workforceMap: () => http.get('/dashboard/workforce-map').then(r => r.data.data),
};

// CREDENTIALING
export const credentialingApi = {
  getAll: (params?: Record<string, any>) =>
    http.get('/credentialing', { params }).then(r => r.data.data),
  create: (data: any) =>
    http.post('/credentialing', data).then(r => r.data.data),
  licenseAlerts: () =>
    http.get('/credentialing/license-alerts').then(r => r.data.data),
};

// PAYROLL
export const payrollApi = {
  getAll: (params?: Record<string, any>) =>
    http.get('/payroll', { params }).then(r => r.data.data),
  generate: (data: { pegawai_id: number; bulan: number; tahun: number; tunjangan_kinerja?: number }) =>
    http.post('/payroll/generate', data).then(r => r.data.data),
  bulkGenerate: (bulan: number, tahun: number) =>
    http.post('/payroll/bulk-generate', { bulan, tahun }).then(r => r.data),
  getOne: (id: number | string) =>
    http.get(`/payroll/${id}`).then(r => r.data.data),
  approve: (id: number | string) =>
    http.post(`/payroll/${id}/approve`).then(r => r.data),
  bayar: (id: number | string) =>
    http.post(`/payroll/${id}/bayar`).then(r => r.data),
  downloadPdf: (id: number | string) =>
    http.get(`/payroll/${id}/pdf`, { responseType: 'blob' }),
};

// PENGATURAN (RS Config)
export const pengaturanApi = {
  get: () => http.get('/pengaturan').then(r => r.data.data),
  update: (data: Record<string, string>) =>
    http.put('/pengaturan', data).then(r => r.data),
};

// ACTIVITY LOG
export const activityLogApi = {
  getAll: (params?: Record<string, any>) =>
    http.get('/activity-logs', { params }).then(r => r.data),
};

// EXPORT
export const exportApi = {
  pegawai: () =>
    http.get('/export/pegawai', { responseType: 'blob' }),
  absensi: (bulan: number, tahun: number) =>
    http.get('/export/absensi', { params: { bulan, tahun }, responseType: 'blob' }),
  cuti: (tahun: number, status?: string) =>
    http.get('/export/cuti', { params: { tahun, status }, responseType: 'blob' }),
};

// KPI
export const kpiApi = {
  summary: () => http.get('/kpi/summary').then(r => r.data.data),
};

// LICENSE
export const licenseApi = {
  info: () => http.get('/license/info').then(r => r.data),
};

// SELF-SERVICE (portal pegawai)
export const selfApi = {
  me: () => http.get('/self/me').then(r => r.data.data),
  updateProfile: (data: { no_telp?: string; alamat?: string; email?: string }) =>
    http.put('/self/me', data).then(r => r.data),
  getCuti: (params?: Record<string, any>) =>
    http.get('/self/cuti', { params }).then(r => r.data.data),
  submitCuti: (data: any) => http.post('/self/cuti', data).then(r => r.data),
  sisaCuti: () => http.get('/self/cuti/sisa').then(r => r.data),
  jadwal: () => http.get('/self/jadwal').then(r => r.data.data),
  payroll: (params?: Record<string, any>) =>
    http.get('/self/payroll', { params }).then(r => r.data.data),
  downloadSlip: (id: number) =>
    http.get(`/self/payroll/${id}/pdf`, { responseType: 'blob' }),
  uploadStr: (file: File) => {
    const fd = new FormData(); fd.append('file', file);
    return http.post('/self/str-renewal', fd, { headers: { 'Content-Type': 'multipart/form-data' } });
  },
  uploadSip: (file: File) => {
    const fd = new FormData(); fd.append('file', file);
    return http.post('/self/sip-renewal', fd, { headers: { 'Content-Type': 'multipart/form-data' } });
  },
};

// AI CHAT
export const aiApi = {
  chat: (message: string, context?: Record<string, any>) =>
    http.post('/ai/chat', { message, context }).then(r => r.data),
};

// LAPORAN BKD
export const laporanBKDApi = {
  duk: () => http.get('/laporan-bkd/duk', { responseType: 'blob' }),
  bezetting: () => http.get('/laporan-bkd/bezetting', { responseType: 'blob' }),
  rekapAbsensi: (bulan: number, tahun: number) =>
    http.get('/laporan-bkd/rekap-absensi', { params: { bulan, tahun }, responseType: 'blob' }),
};

// KGB (Kenaikan Gaji Berkala)
export const kgbApi = {
  getAll: (params?: Record<string, any>) => http.get('/kgb', { params }).then(r => r.data),
  update: (id: number, tmt: string) => http.put(`/kgb/${id}`, { tmt_gaji_berkala: tmt }).then(r => r.data),
  bulkCalculate: () => http.post('/kgb/bulk-calculate').then(r => r.data),
};

// IMPORT ABSENSI MESIN
export const absensiImportApi = {
  template: () => http.get('/import/absensi/template', { responseType: 'blob' }),
  upload: (file: File) => {
    const fd = new FormData();
    fd.append('file', file);
    return http.post('/import/absensi', fd, { headers: { 'Content-Type': 'multipart/form-data' } });
  },
};

// TPP (Tambahan Penghasilan Pegawai)
export const tppApi = {
  getAll: (params?: Record<string, any>) => http.get('/tpp', { params }).then(r => r.data),
  generate: (d: { pegawai_id: number; bulan: number; tahun: number }) =>
    http.post('/tpp/generate', d).then(r => r.data),
  bulkGenerate: (bulan: number, tahun: number) =>
    http.post('/tpp/bulk-generate', { bulan, tahun }).then(r => r.data),
  approve: (id: number) => http.post(`/tpp/${id}/approve`).then(r => r.data),
  bayar: (id: number) => http.post(`/tpp/${id}/bayar`).then(r => r.data),
  export: (bulan: number, tahun: number) =>
    http.get('/tpp/export', { params: { bulan, tahun }, responseType: 'blob' }),
  kelas: () => http.get('/tpp/kelas').then(r => r.data),
  storeKelas: (d: any) => http.post('/tpp/kelas', d).then(r => r.data),
  deleteKelas: (id: number) => http.delete(`/tpp/kelas/${id}`).then(r => r.data),
};

// REKRUTMEN PPPK/HONORER
export const rekrutmenApi = {
  // Admin
  getFormasi: (p?: any) => http.get('/rekrutmen/formasi', { params: p }).then(r => r.data),
  createFormasi: (d: any) => http.post('/rekrutmen/formasi', d).then(r => r.data),
  updateFormasi: (id: number, d: any) => http.put(`/rekrutmen/formasi/${id}`, d).then(r => r.data),
  aktifkan: (id: number) => http.post(`/rekrutmen/formasi/${id}/aktifkan`).then(r => r.data),
  tutup: (id: number) => http.post(`/rekrutmen/formasi/${id}/tutup`).then(r => r.data),
  getLamaran: (p?: any) => http.get('/rekrutmen/lamaran', { params: p }).then(r => r.data),
  updateStatus: (id: number, d: any) => http.put(`/rekrutmen/lamaran/${id}/status`, d).then(r => r.data),
  exportLamaran: (formasi_id: number) => http.get('/rekrutmen/export-lamaran', { params: { formasi_id }, responseType: 'blob' }),
  // Public (no auth — web.php routes)
  getPublicLowongan: () => fetch('/rekrutmen/lowongan').then(r => r.json()),
  daftar: (d: any) => fetch('/rekrutmen/daftar', { method: 'POST', headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' }, body: JSON.stringify(d) }).then(r => r.json()),
  cekStatus: (email: string, formasi_id: number) => fetch(`/rekrutmen/status?email=${encodeURIComponent(email)}&formasi_id=${formasi_id}`).then(r => r.json()),
};

// GENERATOR SURAT KEPEGAWAIAN
export const suratApi = {
  keteranganBekerja: (pegawai_id: number, tujuan: string) =>
    http.post('/surat/keterangan-bekerja', { pegawai_id, tujuan }, { responseType: 'blob' }),
  suratTugas: (data: { pegawai_id: number; tugas: string; tempat: string; tanggal_mulai: string; tanggal_selesai: string }) =>
    http.post('/surat/surat-tugas', data, { responseType: 'blob' }),
  suratCuti: (cuti_id: number) =>
    http.post('/surat/surat-cuti', { cuti_id }, { responseType: 'blob' }),
  kontrakPPPK: (pegawai_id: number) =>
    http.post('/surat/kontrak-pppk', { pegawai_id }, { responseType: 'blob' }),
};

// DIKLAT & KOMPETENSI
export const diklatApi = {
  getAll: (params?: any) => http.get('/diklat', { params }).then(r => r.data),
  create: (d: any) => http.post('/diklat', d).then(r => r.data),
  update: (id: number, d: any) => http.put(`/diklat/${id}`, d).then(r => r.data),
  remove: (id: number) => http.delete(`/diklat/${id}`).then(r => r.data),
  rekap: (tahun: number) => http.get('/diklat-rekap', { params: { tahun } }).then(r => r.data),
  uploadSertifikat: (id: number, file: File) => {
    const fd = new FormData();
    fd.append('file', file);
    return http.post(`/diklat/${id}/sertifikat`, fd, { headers: { 'Content-Type': 'multipart/form-data' } });
  },
};

// ABSENSI SELF-SERVICE (GPS + Selfie)
export const selfAbsensiApi = {
  checkIn: (d: { latitude: number; longitude: number; foto_selfie?: string }) =>
    http.post('/self/checkin', d).then(r => r.data),
  checkOut: (d: { latitude: number; longitude: number }) =>
    http.post('/self/checkout', d).then(r => r.data),
  riwayat: () => http.get('/self/absensi').then(r => r.data),
};

// BPJS e-REPORTING
export const bpjsApi = {
  exportTK: (bulan: number, tahun: number) =>
    http.get('/bpjs/export-tk', { params: { bulan, tahun }, responseType: 'blob' }),
  exportKesehatan: (bulan: number, tahun: number) =>
    http.get('/bpjs/export-kesehatan', { params: { bulan, tahun }, responseType: 'blob' }),
  summary: () => http.get('/bpjs/summary').then(r => r.data),
};

// RBK (Remunerasi Berbasis Kinerja)
export const rbkApi = {
  getAll:       (p?: any)             => http.get('/rbk', { params: p }).then(r => r.data),
  generate:     (d: any)              => http.post('/rbk/generate', d).then(r => r.data),
  bulkGenerate: (b: number, t: number)=> http.post('/rbk/bulk-generate', { bulan: b, tahun: t }).then(r => r.data),
  approve:      (id: number)          => http.post(`/rbk/${id}/approve`).then(r => r.data),
  bayar:        (id: number)          => http.post(`/rbk/${id}/bayar`).then(r => r.data),
  export:       (b: number, t: number)=> http.get('/rbk/export', { params: { bulan: b, tahun: t }, responseType: 'blob' }),
  indeks:       ()                    => http.get('/rbk/indeks').then(r => r.data),
  storeIndeks:  (d: any)              => http.post('/rbk/indeks', d).then(r => r.data),
  deleteIndeks: (id: number)          => http.delete(`/rbk/indeks/${id}`).then(r => r.data),
};

// PENSIUN TRACKER
export const pensiunApi = {
  getAll: (hari?: number) => http.get('/pensiun', { params: { hari } }).then(r => r.data),
  stats: () => http.get('/pensiun/stats').then(r => r.data),
  suratPengantar: (pegawai_id: number) =>
    http.post('/pensiun/surat-pengantar', { pegawai_id }, { responseType: 'blob' }),
};

// MUTASI JABATAN
export const mutasiApi = {
  getAll: (p?: any) => http.get('/mutasi', { params: p }).then(r => r.data),
  create: (d: any) => http.post('/mutasi', d).then(r => r.data),
  suratMutasi: (d: { pegawai_id: number; riwayat_id: number }) =>
    http.post('/mutasi/surat-mutasi', d, { responseType: 'blob' }),
  riwayat: (id: number) => http.get(`/mutasi/riwayat/${id}`).then(r => r.data),
};

// KENAIKAN PANGKAT
export const kenaikanPangkatApi = {
  getAll: (p?: any) => http.get('/kenaikan-pangkat', { params: p }).then(r => r.data),
  create: (d: any) => http.post('/kenaikan-pangkat', d).then(r => r.data),
  updateStatus: (id: number, d: any) =>
    http.put(`/kenaikan-pangkat/${id}/status`, d).then(r => r.data),
  suratUsulan: (d: { pegawai_id: number; kp_id: number }) =>
    http.post('/kenaikan-pangkat/surat-usulan', d, { responseType: 'blob' }),
};

// DISIPLIN ASN (PP 94/2021)
export const disiplinApi = {
  getAll:     (p?: any)             => http.get('/disiplin', { params: p }).then(r => r.data),
  create:     (d: any)              => http.post('/disiplin', d).then(r => r.data),
  update:     (id: number, d: any)  => http.put(`/disiplin/${id}`, d).then(r => r.data),
  remove:     (id: number)          => http.delete(`/disiplin/${id}`).then(r => r.data),
  skDisiplin: (disiplin_id: number) => http.post('/disiplin/sk-disiplin', { disiplin_id }, { responseType: 'blob' }),
  stats:      ()                    => http.get('/disiplin/stats').then(r => r.data),
};

// KONTRAK PEGAWAI
export const kontrakApi = {
  getAll:      (p?: any)                                         => http.get('/kontrak', { params: p }).then(r => r.data),
  create:      (d: any)                                          => http.post('/kontrak', d).then(r => r.data),
  update:      (id: number, d: any)                              => http.put(`/kontrak/${id}`, d).then(r => r.data),
  perpanjang:  (id: number, d: { tanggal_selesai_baru: string }) => http.post(`/kontrak/${id}/perpanjang`, d).then(r => r.data),
  expiring:    (hari?: number)                                   => http.get('/kontrak/expiring', { params: { hari } }).then(r => r.data),
  generatePDF: (d: any)                                          => http.post('/kontrak/generate-pdf', d, { responseType: 'blob' }),
};

// SKP (Sasaran Kinerja Pegawai)
export const skpApi = {
  getAll: (p?: any) => http.get('/skp', { params: p }).then(r => r.data),
  getOne: (id: number) => http.get(`/skp/${id}`).then(r => r.data),
  create: (d: any) => http.post('/skp', d).then(r => r.data),
  update: (id: number, d: any) => http.put(`/skp/${id}`, d).then(r => r.data),
  ajukan: (id: number) => http.post(`/skp/${id}/ajukan`).then(r => r.data),
  nilai: (id: number, d: any) => http.post(`/skp/${id}/nilai`, d).then(r => r.data),
  setujui: (id: number) => http.post(`/skp/${id}/setujui`).then(r => r.data),
  updateRealisasi: (detailId: number, d: { realisasi: number; capaian_persen?: number }) =>
    http.put(`/skp/detail/${detailId}/realisasi`, d).then(r => r.data),
  summary: (tahun: number) => http.get('/skp/summary', { params: { tahun } }).then(r => r.data),
};

// K3RS — Keselamatan & Kesehatan Kerja RS
export const k3rsApi = {
  getInsiden:     (p?: any)            => http.get('/k3rs/insiden', { params: p }).then(r => r.data),
  createInsiden:  (d: any)             => http.post('/k3rs/insiden', d).then(r => r.data),
  updateInsiden:  (id: number, d: any) => http.put(`/k3rs/insiden/${id}`, d).then(r => r.data),
  statsInsiden:   ()                   => http.get('/k3rs/insiden/stats').then(r => r.data),
  getVaksinasi:   (p?: any)            => http.get('/k3rs/vaksinasi', { params: p }).then(r => r.data),
  createVaksinasi:(d: any)             => http.post('/k3rs/vaksinasi', d).then(r => r.data),
  updateVaksinasi:(id: number, d: any) => http.put(`/k3rs/vaksinasi/${id}`, d).then(r => r.data),
  deleteVaksinasi:(id: number)         => http.delete(`/k3rs/vaksinasi/${id}`).then(r => r.data),
  coverage:       ()                   => http.get('/k3rs/vaksinasi/coverage').then(r => r.data),
  getMCU:         (p?: any)            => http.get('/k3rs/mcu', { params: p }).then(r => r.data),
  createMCU:      (d: any)             => http.post('/k3rs/mcu', d).then(r => r.data),
  updateMCU:      (id: number, d: any) => http.put(`/k3rs/mcu/${id}`, d).then(r => r.data),
  deleteMCU:      (id: number)         => http.delete(`/k3rs/mcu/${id}`).then(r => r.data),
  mcuSummary:     ()                   => http.get('/k3rs/mcu/summary').then(r => r.data),
};

// ANGKA KREDIT JFT
export const angkaKreditApi = {
  getAll:     (p?: any)                                                      => http.get('/angka-kredit', { params: p }).then(r => r.data),
  create:     (d: any)                                                       => http.post('/angka-kredit', d).then(r => r.data),
  ajukan:     (d: { pegawai_id: number; tahun: number; semester: number })  => http.post('/angka-kredit/ajukan', d).then(r => r.data),
  verifikasi: (id: number)                                                   => http.post(`/angka-kredit/${id}/verifikasi`).then(r => r.data),
  setujui:    (id: number)                                                   => http.post(`/angka-kredit/${id}/setujui`).then(r => r.data),
  rekap:      (p?: any)                                                      => http.get('/angka-kredit/rekap', { params: p }).then(r => r.data),
  target:     ()                                                             => http.get('/angka-kredit/target').then(r => r.data),
  storeTarget:(d: any)                                                       => http.post('/angka-kredit/target', d).then(r => r.data),
};
