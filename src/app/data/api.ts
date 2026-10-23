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

// BPJS e-REPORTING
export const bpjsApi = {
  exportTK: (bulan: number, tahun: number) =>
    http.get('/bpjs/export-tk', { params: { bulan, tahun }, responseType: 'blob' }),
  exportKesehatan: (bulan: number, tahun: number) =>
    http.get('/bpjs/export-kesehatan', { params: { bulan, tahun }, responseType: 'blob' }),
  summary: () => http.get('/bpjs/summary').then(r => r.data),
};
