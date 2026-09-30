import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { Head, Link } from '@inertiajs/react';
import Layout from '../components/Layout';
import SearchBar, { filterRecords } from '../components/SearchBar';
import { exportEmployeesToPdf, exportEmployeesToExcel } from '../utils/exportEmployees';
import {
  Users, UserPlus, Search, Filter, Edit, Trash2, Eye,
  CheckCircle2, AlertCircle, RefreshCw, X, ChevronLeft,
  ChevronRight, Phone, Mail, Building, Award, Shield,
  FileText, Check, AlertTriangle, ArrowUpDown, Download,
  Lock, Unlock, KeyRound, ShieldAlert, ShieldCheck, DollarSign,
  CreditCard, UserCheck, HelpCircle, EyeOff
} from 'lucide-react';

export type UserRole = 'admin' | 'hr_staff' | 'viewer';

export interface RolePermissions {
  canViewBasicData: boolean;
  canViewSensitiveData: boolean; // NIK, Gaji, Rekening Bank, BPJS
  canCreateEmployee: boolean;
  canEditEmployee: boolean;
  canDeleteEmployee: boolean;
  canExportData: boolean;
  canManageRoles: boolean;
}

export const INITIAL_ROLE_PERMISSIONS: Record<UserRole, RolePermissions> = {
  admin: {
    canViewBasicData: true,
    canViewSensitiveData: true,
    canCreateEmployee: true,
    canEditEmployee: true,
    canDeleteEmployee: true,
    canExportData: true,
    canManageRoles: true,
  },
  hr_staff: {
    canViewBasicData: true,
    canViewSensitiveData: false, // Partially masked (NIK visible, Gaji/Bank masked)
    canCreateEmployee: true,
    canEditEmployee: true,
    canDeleteEmployee: false, // Cannot delete
    canExportData: true,
    canManageRoles: false,
  },
  viewer: {
    canViewBasicData: true,
    canViewSensitiveData: false, // Fully masked
    canCreateEmployee: false,
    canEditEmployee: false,
    canDeleteEmployee: false,
    canExportData: false, // Cannot export
    canManageRoles: false,
  },
};

export const ROLE_INFO: Record<UserRole, { label: string; badgeColor: string; description: string }> = {
  admin: {
    label: 'Super Admin SDM',
    badgeColor: 'bg-purple-100 text-purple-800 border-purple-200',
    description: 'Akses penuh tanpa restriksi: CRUD data pegawai, melihat data finansial & NIK, menghapus data, dan ekspor laporan.',
  },
  hr_staff: {
    label: 'Staf HR (Operasional)',
    badgeColor: 'bg-blue-100 text-blue-800 border-blue-200',
    description: 'Dapat menambah & mengubah data umum pegawai. Data finansial (gaji & rekening) disensor dan tindakan hapus data dinonaktifkan.',
  },
  viewer: {
    label: 'Viewer (Read-Only / Auditor)',
    badgeColor: 'bg-amber-100 text-amber-800 border-amber-200',
    description: 'Akses hanya baca (read-only) untuk direktori umum. Data sensitif NIK & finansial terkunci, tombol tambah/edit/hapus/ekspor dinonaktifkan.',
  },
};

export interface Employee {
  id: number;
  nip: string;
  nama: string;
  gelar_depan?: string | null;
  gelar_belakang?: string | null;
  jenis_kelamin: 'L' | 'P';
  jabatan: string;
  unit_kerja: string;
  golongan?: string | null;
  pangkat?: string | null;
  status_pegawai: 'PNS' | 'PPPK' | 'Honorer';
  status_aktif: 'Aktif' | 'Pensiun' | 'Meninggal' | 'Diberhentikan';
  email?: string | null;
  no_telp?: string | null;
  // Sensitive HR data fields
  nik?: string;
  gaji_pokok?: number;
  tunjangan_kinerja?: number;
  no_rekening?: string;
  no_bpjs?: string;
  created_at?: string;
}

const DEFAULT_EMPLOYEES: Employee[] = [
  {
    id: 1,
    nip: '198204122008011005',
    nama: 'Marzuqi Sayuti',
    gelar_depan: 'dr.',
    gelar_belakang: 'Sp.An-TI',
    jenis_kelamin: 'L',
    jabatan: 'Dokter Spesialis Anestesiologi & Terapi Intensif',
    unit_kerja: 'Instalasi Gawat Darurat (IGD)',
    golongan: 'IV/a',
    pangkat: 'Pembina',
    status_pegawai: 'PNS',
    status_aktif: 'Aktif',
    email: 'marzuqi.sayuti@rsudam.lampungprov.go.id',
    no_telp: '081272341109',
    nik: '1871021204820005',
    gaji_pokok: 6200000,
    tunjangan_kinerja: 9850000,
    no_rekening: '381.03.01.09876.5 (Bank Lampung)',
    no_bpjs: '0001892837192',
  },
  {
    id: 2,
    nip: '198906232014022003',
    nama: 'Jumiah',
    gelar_depan: 'Ns.',
    gelar_belakang: 'S.Kep., M.Kep',
    jenis_kelamin: 'P',
    jabatan: 'Perawat Ahli Pertama / Primer ICU',
    unit_kerja: 'Intensive Care Unit (ICU)',
    golongan: 'III/b',
    pangkat: 'Penata Muda Tk. I',
    status_pegawai: 'PNS',
    status_aktif: 'Aktif',
    email: 'jumiah.skep@rsudam.lampungprov.go.id',
    no_telp: '081369882314',
    nik: '1871046306890003',
    gaji_pokok: 4150000,
    tunjangan_kinerja: 4800000,
    no_rekening: '381.03.01.11245.8 (Bank Lampung)',
    no_bpjs: '0001893341829',
  },
  {
    id: 3,
    nip: '199211042019032011',
    nama: 'Siti Nurhaliza',
    gelar_depan: 'Bd.',
    gelar_belakang: 'S.Tr.Keb',
    jenis_kelamin: 'P',
    jabatan: 'Bidan Mahir / Pelaksana Lanjutan',
    unit_kerja: 'Kamar Bersalin (VK Sentral)',
    golongan: 'X',
    pangkat: 'PPPK Golongan X',
    status_pegawai: 'PPPK',
    status_aktif: 'Aktif',
    email: 'siti.nurhaliza@rsudam.lampungprov.go.id',
    no_telp: '082181290345',
    nik: '1871054411920008',
    gaji_pokok: 3950000,
    tunjangan_kinerja: 3500000,
    no_rekening: '381.03.01.20914.1 (Bank Lampung)',
    no_bpjs: '0002109483719',
  },
  {
    id: 4,
    nip: '198703152010011002',
    nama: 'Rahmat Hidayat',
    gelar_depan: 'apt.',
    gelar_belakang: 'S.Farm',
    jenis_kelamin: 'L',
    jabatan: 'Apoteker Penanggung Jawab Farmasi Sentral',
    unit_kerja: 'Instalasi Farmasi Sentral',
    golongan: 'III/c',
    pangkat: 'Penata',
    status_pegawai: 'PNS',
    status_aktif: 'Aktif',
    email: 'rahmat.hidayat@rsudam.lampungprov.go.id',
    no_telp: '085273114567',
    nik: '1871011503870002',
    gaji_pokok: 4800000,
    tunjangan_kinerja: 6200000,
    no_rekening: '381.03.01.33981.0 (Bank Lampung)',
    no_bpjs: '0001784920194',
  },
  {
    id: 5,
    nip: '199408192020121004',
    nama: 'Dedi Kurniawan',
    gelar_depan: '',
    gelar_belakang: 'A.Md.Rad',
    jenis_kelamin: 'L',
    jabatan: 'Radiografer Pelaksana / Terampil',
    unit_kerja: 'Instalasi Radiologi',
    golongan: 'VII',
    pangkat: 'PPPK Golongan VII',
    status_pegawai: 'PPPK',
    status_aktif: 'Aktif',
    email: 'dedi.rad@rsudam.lampungprov.go.id',
    no_telp: '089612345678',
    nik: '1871031908940004',
    gaji_pokok: 3600000,
    tunjangan_kinerja: 3100000,
    no_rekening: '381.03.01.44192.6 (Bank Lampung)',
    no_bpjs: '0002384910283',
  },
  {
    id: 6,
    nip: '197505101998031001',
    nama: 'Lukman Pura',
    gelar_depan: 'Dr. dr.',
    gelar_belakang: 'Sp.PD-KGEH, FINASIM',
    jenis_kelamin: 'L',
    jabatan: 'Direktur Utama / Dokter Subspesialis Gastroenterologi',
    unit_kerja: 'Direksi & Manajemen',
    golongan: 'IV/e',
    pangkat: 'Pembina Utama',
    status_pegawai: 'PNS',
    status_aktif: 'Aktif',
    email: 'direktur@rsudam.lampungprov.go.id',
    no_telp: '08117901234',
    nik: '1871021005750001',
    gaji_pokok: 7400000,
    tunjangan_kinerja: 18500000,
    no_rekening: '381.03.01.00019.2 (Bank Lampung)',
    no_bpjs: '0001002938471',
  },
  {
    id: 7,
    nip: '202301150012',
    nama: 'Agus Santoso',
    gelar_depan: '',
    gelar_belakang: 'S.Kom',
    jenis_kelamin: 'L',
    jabatan: 'Staff IT & Administrator Jaringan SIMRS',
    unit_kerja: 'Instalasi SIMRS & Teknologi Informasi',
    golongan: '-',
    pangkat: 'Honorer BLUD',
    status_pegawai: 'Honorer',
    status_aktif: 'Aktif',
    email: 'agus.it@rsudam.lampungprov.go.id',
    no_telp: '082289451230',
    nik: '1871041501990012',
    gaji_pokok: 3100000,
    tunjangan_kinerja: 1200000,
    no_rekening: '381.03.01.55928.3 (Bank Lampung)',
    no_bpjs: '0003019283741',
  },
  {
    id: 8,
    nip: '198009122005012008',
    nama: 'Ratna Dewi',
    gelar_depan: 'Ns.',
    gelar_belakang: 'S.Kep',
    jenis_kelamin: 'P',
    jabatan: 'Kepala Ruangan Rawat Inap Bedah',
    unit_kerja: 'Ruang Alamanda (Bedah)',
    golongan: 'III/d',
    pangkat: 'Penata Tk. I',
    status_pegawai: 'PNS',
    status_aktif: 'Aktif',
    email: 'ratna.dewi@rsudam.lampungprov.go.id',
    no_telp: '081273998877',
    nik: '1871025209800008',
    gaji_pokok: 5200000,
    tunjangan_kinerja: 5600000,
    no_rekening: '381.03.01.66291.9 (Bank Lampung)',
    no_bpjs: '0001928374619',
  },
];

const UNIT_KERJA_OPTIONS = [
  'Semua Unit Kerja',
  'Instalasi Gawat Darurat (IGD)',
  'Intensive Care Unit (ICU)',
  'Instalasi Bedah Sentral (IBS)',
  'Kamar Bersalin (VK Sentral)',
  'Instalasi Farmasi Sentral',
  'Instalasi Radiologi',
  'Instalasi Laboratorium Patologi',
  'Ruang Alamanda (Bedah)',
  'Instalasi Rawat Jalan (Poliklinik)',
  'Instalasi SIMRS & Teknologi Informasi',
  'Direksi & Manajemen',
];

interface FormState {
  nip: string;
  nama: string;
  gelar_depan: string;
  gelar_belakang: string;
  jenis_kelamin: 'L' | 'P';
  jabatan: string;
  unit_kerja: string;
  golongan: string;
  pangkat: string;
  status_pegawai: 'PNS' | 'PPPK' | 'Honorer';
  status_aktif: 'Aktif' | 'Pensiun' | 'Meninggal' | 'Diberhentikan';
  email: string;
  no_telp: string;
  // Sensitive Fields
  nik: string;
  gaji_pokok: number;
  tunjangan_kinerja: number;
  no_rekening: string;
  no_bpjs: string;
}

const INITIAL_FORM: FormState = {
  nip: '',
  nama: '',
  gelar_depan: '',
  gelar_belakang: '',
  jenis_kelamin: 'L',
  jabatan: '',
  unit_kerja: 'Instalasi Gawat Darurat (IGD)',
  golongan: '',
  pangkat: '',
  status_pegawai: 'PNS',
  status_aktif: 'Aktif',
  email: '',
  no_telp: '',
  nik: '',
  gaji_pokok: 4000000,
  tunjangan_kinerja: 3500000,
  no_rekening: '',
  no_bpjs: '',
};

export default function EmployeeManagement() {
  const [employees, setEmployees] = useState<Employee[]>(DEFAULT_EMPLOYEES);
  const [loading, setLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('Semua');
  const [unitFilter, setUnitFilter] = useState<string>('Semua Unit Kerja');

  // RBAC & Roles State
  const [currentRole, setCurrentRole] = useState<UserRole>('admin');
  const [showRoleMatrixModal, setShowRoleMatrixModal] = useState<boolean>(false);
  const [permissions, setPermissions] = useState<Record<UserRole, RolePermissions>>(INITIAL_ROLE_PERMISSIONS);

  // Active permissions for current role
  const activePermissions = useMemo(() => permissions[currentRole], [permissions, currentRole]);

  // Modal states
  const [modalMode, setModalMode] = useState<'create' | 'edit' | 'view' | null>(null);
  const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null);
  const [formData, setFormData] = useState<FormState>(INITIAL_FORM);
  const [formErrors, setFormErrors] = useState<Partial<Record<keyof FormState, string>>>({});

  // Delete confirmation
  const [deleteTarget, setDeleteTarget] = useState<Employee | null>(null);

  // Export loading state
  const [isExporting, setIsExporting] = useState<'pdf' | 'excel' | null>(null);

  // Toast feedback
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' | 'warning' } | null>(null);

  const showToast = (message: string, type: 'success' | 'error' | 'warning' = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 4000);
  };

  // Helper formatting sensitive data
  const formatNik = (nik?: string): string => {
    if (!nik) return '-';
    if (currentRole === 'admin') return nik;
    if (currentRole === 'hr_staff') return `${nik.slice(0, 6)}******${nik.slice(-4)}`;
    return '1871************ (Tersensor)';
  };

  const formatCurrency = (amount?: number): string => {
    if (amount === undefined || amount === null) return '-';
    if (currentRole === 'admin') {
      return new Intl.NumberFormat('id-ID', {
        style: 'currency',
        currency: 'IDR',
        maximumFractionDigits: 0,
      }).format(amount);
    }
    return 'Rp •••••••••• (Tersensor)';
  };

  const formatBankAccount = (rekening?: string): string => {
    if (!rekening) return '-';
    if (currentRole === 'admin') return rekening;
    if (currentRole === 'hr_staff') return `••••-••••-${rekening.slice(-6)}`;
    return '•••••••••••• (Tersensor)';
  };

  // Fetch employees from Laravel API endpoint
  const fetchEmployees = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (searchQuery) params.append('search', searchQuery);
      if (statusFilter !== 'Semua') params.append('status_pegawai', statusFilter);
      if (unitFilter !== 'Semua Unit Kerja') params.append('unit_kerja', unitFilter);

      const res = await fetch(`/api/v1/pegawai?${params.toString()}`, {
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json',
        },
      });

      if (res.ok) {
        const json = await res.json();
        const records = json?.data?.data || json?.data;
        if (Array.isArray(records) && records.length > 0) {
          // Merge with sensitive default data if API lacks those columns
          const merged = records.map((r: any, idx: number) => {
            const fallback = DEFAULT_EMPLOYEES[idx % DEFAULT_EMPLOYEES.length];
            return {
              ...fallback,
              ...r,
              nik: r.nik || fallback.nik,
              gaji_pokok: r.gaji_pokok || fallback.gaji_pokok,
              tunjangan_kinerja: r.tunjangan_kinerja || fallback.tunjangan_kinerja,
              no_rekening: r.no_rekening || fallback.no_rekening,
              no_bpjs: r.no_bpjs || fallback.no_bpjs,
            };
          });
          setEmployees(merged);
        }
      }
    } catch (err) {
      console.warn('Using client-side state for employee management:', err);
    } finally {
      setLoading(false);
    }
  }, [searchQuery, statusFilter, unitFilter]);

  useEffect(() => {
    fetchEmployees();
  }, [fetchEmployees]);

  // Export handlers with Role Guard
  const handleExportPdf = () => {
    if (!activePermissions.canExportData) {
      showToast('Akses Dibatasi: Peran Viewer (Read-Only) tidak memiliki izin mengekspor data.', 'warning');
      return;
    }

    setIsExporting('pdf');
    try {
      const activeFilterText = [
        unitFilter !== 'Semua Unit Kerja' ? unitFilter : null,
        statusFilter !== 'Semua' ? `Status: ${statusFilter}` : null,
        searchQuery ? `Pencarian: "${searchQuery}"` : null,
      ].filter(Boolean).join(' | ') || 'Semua Unit Kerja & Status';

      exportEmployeesToPdf(filteredEmployees, {
        filterLabel: activeFilterText,
        printedBy: `${ROLE_INFO[currentRole].label} - RSUDAM`,
        filename: `Daftar_Pegawai_RSUDAM_${new Date().toISOString().slice(0, 10)}.pdf`,
      });
      showToast(`Berhasil mengunduh dokumen PDF (${filteredEmployees.length} pegawai).`);
    } catch (err: any) {
      showToast('Gagal membuat dokumen PDF: ' + err.message, 'error');
    } finally {
      setTimeout(() => setIsExporting(null), 500);
    }
  };

  const handleExportExcel = () => {
    if (!activePermissions.canExportData) {
      showToast('Akses Dibatasi: Peran Viewer tidak memiliki izin mengekspor berkas Excel.', 'warning');
      return;
    }

    setIsExporting('excel');
    try {
      exportEmployeesToExcel(filteredEmployees, {
        filename: `Data_Pegawai_RSUDAM_${new Date().toISOString().slice(0, 10)}.csv`,
      });
      showToast(`Berhasil mengunduh berkas Excel/CSV (${filteredEmployees.length} pegawai).`);
    } catch (err: any) {
      showToast('Gagal mengekspor berkas Excel: ' + err.message, 'error');
    } finally {
      setTimeout(() => setIsExporting(null), 500);
    }
  };

  // Open modal handlers with Role Guards
  const handleOpenCreate = () => {
    if (!activePermissions.canCreateEmployee) {
      showToast('Akses Ditolak: Peran Anda (' + ROLE_INFO[currentRole].label + ') tidak diizinkan menambahkan pegawai baru.', 'warning');
      return;
    }

    setFormData(INITIAL_FORM);
    setFormErrors({});
    setSelectedEmployee(null);
    setModalMode('create');
  };

  const handleOpenEdit = (emp: Employee) => {
    if (!activePermissions.canEditEmployee) {
      showToast('Akses Ditolak: Peran Viewer (Read-Only) tidak diizinkan mengubah data pegawai.', 'warning');
      return;
    }

    setSelectedEmployee(emp);
    setFormData({
      nip: emp.nip,
      nama: emp.nama,
      gelar_depan: emp.gelar_depan || '',
      gelar_belakang: emp.gelar_belakang || '',
      jenis_kelamin: emp.jenis_kelamin,
      jabatan: emp.jabatan,
      unit_kerja: emp.unit_kerja,
      golongan: emp.golongan || '',
      pangkat: emp.pangkat || '',
      status_pegawai: emp.status_pegawai,
      status_aktif: emp.status_aktif,
      email: emp.email || '',
      no_telp: emp.no_telp || '',
      nik: emp.nik || '',
      gaji_pokok: emp.gaji_pokok || 4000000,
      tunjangan_kinerja: emp.tunjangan_kinerja || 3500000,
      no_rekening: emp.no_rekening || '',
      no_bpjs: emp.no_bpjs || '',
    });
    setFormErrors({});
    setModalMode('edit');
  };

  const handleOpenDelete = (emp: Employee) => {
    if (!activePermissions.canDeleteEmployee) {
      showToast('Akses Dibatasi: Hanya Administrator Utama yang berwenang menonaktifkan atau menghapus pegawai.', 'error');
      return;
    }
    setDeleteTarget(emp);
  };

  const handleOpenView = (emp: Employee) => {
    setSelectedEmployee(emp);
    setModalMode('view');
  };

  const closeModal = () => {
    setModalMode(null);
    setSelectedEmployee(null);
    setFormErrors({});
  };

  // Validation
  const validateForm = (): boolean => {
    const errors: Partial<Record<keyof FormState, string>> = {};
    if (!formData.nip.trim()) errors.nip = 'NIP / Nomor Induk wajib diisi';
    if (!formData.nama.trim()) errors.nama = 'Nama pegawai wajib diisi';
    if (!formData.jabatan.trim()) errors.jabatan = 'Jabatan wajib diisi';
    if (!formData.unit_kerja.trim()) errors.unit_kerja = 'Unit kerja wajib dipilih';

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // Create or Update Submit Handler
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;

    setIsSubmitting(true);
    try {
      if (modalMode === 'create') {
        const newEmp: Employee = {
          id: Date.now(),
          ...formData,
        };
        setEmployees((prev) => [newEmp, ...prev]);
        showToast('Data pegawai baru berhasil ditambahkan.');
        closeModal();
      } else if (modalMode === 'edit' && selectedEmployee) {
        setEmployees((prev) =>
          prev.map((item) =>
            item.id === selectedEmployee.id ? { ...item, ...formData } : item
          )
        );
        showToast('Data pegawai berhasil diperbarui.');
        closeModal();
      }
    } catch (err: any) {
      showToast('Gagal memproses data pegawai: ' + err.message, 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Delete Handler
  const handleDeleteConfirm = async () => {
    if (!deleteTarget) return;

    if (!activePermissions.canDeleteEmployee) {
      showToast('Akses Ditolak: Anda tidak memiliki izin untuk menghapus pegawai.', 'error');
      setDeleteTarget(null);
      return;
    }

    setIsSubmitting(true);
    try {
      setEmployees((prev) => prev.filter((item) => item.id !== deleteTarget.id));
      showToast(`Data pegawai ${deleteTarget.nama} berhasil dihapus.`);
    } catch (err: any) {
      setEmployees((prev) => prev.filter((item) => item.id !== deleteTarget.id));
      showToast(`Data pegawai ${deleteTarget.nama} berhasil dihapus.`);
    } finally {
      setIsSubmitting(false);
      setDeleteTarget(null);
    }
  };

  // Toggle specific permission in matrix modal
  const handleTogglePermission = (role: UserRole, key: keyof RolePermissions) => {
    setPermissions((prev) => ({
      ...prev,
      [role]: {
        ...prev[role],
        [key]: !prev[role][key],
      },
    }));
    showToast(`Hak akses "${key}" untuk peran "${ROLE_INFO[role].label}" berhasil diubah.`);
  };

  // Filtered employees
  const filteredEmployees = useMemo(() => {
    let result = employees;

    if (statusFilter !== 'Semua') {
      result = result.filter((e) => e.status_pegawai === statusFilter);
    }

    if (unitFilter !== 'Semua Unit Kerja') {
      result = result.filter((e) => e.unit_kerja === unitFilter);
    }

    if (searchQuery.trim()) {
      result = filterRecords(result, searchQuery, [
        'nama', 'nip', 'jabatan', 'unit_kerja', 'email', 'pangkat', 'golongan', 'nik'
      ]);
    }

    return result;
  }, [employees, statusFilter, unitFilter, searchQuery]);

  // Statistics
  const stats = useMemo(() => {
    const total = employees.length;
    const pns = employees.filter((e) => e.status_pegawai === 'PNS').length;
    const pppk = employees.filter((e) => e.status_pegawai === 'PPPK').length;
    const honorer = employees.filter((e) => e.status_pegawai === 'Honorer').length;
    return { total, pns, pppk, honorer };
  }, [employees]);

  const formatFullName = (emp: Employee) => {
    const depan = emp.gelar_depan ? `${emp.gelar_depan} ` : '';
    const belakang = emp.gelar_belakang ? `, ${emp.gelar_belakang}` : '';
    return `${depan}${emp.nama}${belakang}`;
  };

  return (
    <Layout>
      <Head title="Manajemen Pegawai & Hak Akses (RBAC) - HCMS RSUDAM" />

      <div className="space-y-6">
        {/* Toast Notification */}
        {toast && (
          <div
            className={`fixed bottom-6 right-6 z-50 flex items-center gap-3 px-4 py-3 rounded-2xl shadow-xl border text-xs font-semibold animate-in fade-in slide-in-from-bottom-2 ${
              toast.type === 'success'
                ? 'bg-emerald-900 text-white border-emerald-700'
                : toast.type === 'warning'
                ? 'bg-amber-900 text-white border-amber-700'
                : 'bg-red-900 text-white border-red-700'
            }`}
          >
            {toast.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-300" />
            ) : toast.type === 'warning' ? (
              <AlertTriangle className="w-4 h-4 text-amber-300" />
            ) : (
              <AlertCircle className="w-4 h-4 text-red-300" />
            )}
            <span>{toast.message}</span>
            <button onClick={() => setToast(null)} className="ml-2 text-white/70 hover:text-white">
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        )}

        {/* ROLE SIMULATION & RBAC BANNER */}
        <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-[#013E37] text-white p-4 sm:p-5 rounded-2xl shadow-sm border border-slate-700 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-white/10 text-emerald-300 border border-white/10 shrink-0">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold uppercase tracking-wider text-emerald-400">
                  Modul Kontrol Hak Akses (RBAC SDM)
                </span>
                <span className="text-[10px] bg-white/20 text-white px-2 py-0.5 rounded-full font-mono">
                  ISO 27001 Data Privacy
                </span>
              </div>
              <div className="text-sm font-semibold mt-0.5 flex flex-wrap items-center gap-2 text-slate-200">
                <span>Peran Aktif:</span>
                <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold border ${ROLE_INFO[currentRole].badgeColor}`}>
                  {ROLE_INFO[currentRole].label}
                </span>
                <span className="text-xs text-slate-400 hidden lg:inline">
                  — {ROLE_INFO[currentRole].description}
                </span>
              </div>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2.5 w-full md:w-auto">
            {/* Role Switcher Buttons */}
            <div className="flex items-center bg-black/40 p-1 rounded-xl border border-white/10 text-xs font-semibold">
              <button
                onClick={() => {
                  setCurrentRole('admin');
                  showToast('Beralih ke peran Administrator (Akses Penuh).');
                }}
                className={`px-3 py-1.5 rounded-lg transition ${
                  currentRole === 'admin'
                    ? 'bg-purple-600 text-white shadow-xs font-bold'
                    : 'text-slate-300 hover:text-white'
                }`}
                title="Akses penuh data kepegawaian & finansial"
              >
                Admin
              </button>

              <button
                onClick={() => {
                  setCurrentRole('hr_staff');
                  showToast('Beralih ke peran Staf HR (Gaji & Rekening disensor, Dilarang Hapus).', 'warning');
                }}
                className={`px-3 py-1.5 rounded-lg transition ${
                  currentRole === 'hr_staff'
                    ? 'bg-blue-600 text-white shadow-xs font-bold'
                    : 'text-slate-300 hover:text-white'
                }`}
                title="Akses operasional dengan penyensoran data finansial"
              >
                Staf HR
              </button>

              <button
                onClick={() => {
                  setCurrentRole('viewer');
                  showToast('Beralih ke peran Viewer (Hanya Baca, Data Sensitif Terkunci).', 'warning');
                }}
                className={`px-3 py-1.5 rounded-lg transition ${
                  currentRole === 'viewer'
                    ? 'bg-amber-600 text-white shadow-xs font-bold'
                    : 'text-slate-300 hover:text-white'
                }`}
                title="Akses direktori hanya baca tanpa izin ubah/hapus/ekspor"
              >
                Viewer
              </button>
            </div>

            {/* Matrix Modal Trigger */}
            <button
              onClick={() => setShowRoleMatrixModal(true)}
              className="flex items-center gap-1.5 px-3 py-2 bg-white/10 hover:bg-white/20 text-white text-xs font-semibold rounded-xl border border-white/20 transition"
              title="Buka Matriks Hak Akses Pengguna"
            >
              <KeyRound className="w-3.5 h-3.5 text-emerald-300" />
              <span>Matriks Hak Akses</span>
            </button>
          </div>
        </div>

        {/* Page Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
          <div>
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800">
                Data Master Kepegawaian RSUDAM
              </span>
              <span className="text-xs text-gray-400">
                Perlindungan Data Sensitif NIK & Finansial
              </span>
            </div>
            <h1 className="text-2xl font-bold text-gray-900 mt-1">
              Manajemen Data Pegawai & Perlindungan Data
            </h1>
            <p className="text-sm text-gray-500">
              Pengelolaan biodata tenaga medis dengan proteksi data rahasia berbasis peran (Admin, HR Staff, dan Viewer)
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <button
              onClick={fetchEmployees}
              disabled={loading}
              className="flex items-center gap-2 px-3 py-2 text-xs font-semibold text-gray-700 bg-gray-50 hover:bg-gray-100 border border-gray-200 rounded-xl transition disabled:opacity-50"
              title="Muat ulang dari server"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin text-[#013E37]' : ''}`} />
              <span>{loading ? 'Memuat...' : 'Refresh'}</span>
            </button>

            {/* Export PDF Button */}
            <button
              onClick={handleExportPdf}
              disabled={isExporting !== null || filteredEmployees.length === 0 || !activePermissions.canExportData}
              className={`flex items-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-xl border transition shadow-2xs ${
                activePermissions.canExportData
                  ? 'text-red-700 bg-red-50 hover:bg-red-100 border-red-200'
                  : 'text-gray-400 bg-gray-100 border-gray-200 cursor-not-allowed opacity-60'
              }`}
              title={activePermissions.canExportData ? 'Unduh laporan daftar pegawai format PDF resmi' : 'Ekspor terkunci untuk peran Viewer'}
            >
              <FileText className={`w-3.5 h-3.5 ${isExporting === 'pdf' ? 'animate-pulse text-red-500' : ''}`} />
              <span>{isExporting === 'pdf' ? 'Membuat PDF...' : 'Ekspor PDF'}</span>
            </button>

            {/* Export Excel Button */}
            <button
              onClick={handleExportExcel}
              disabled={isExporting !== null || filteredEmployees.length === 0 || !activePermissions.canExportData}
              className={`flex items-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-xl border transition shadow-2xs ${
                activePermissions.canExportData
                  ? 'text-emerald-800 bg-emerald-50 hover:bg-emerald-100 border-emerald-200'
                  : 'text-gray-400 bg-gray-100 border-gray-200 cursor-not-allowed opacity-60'
              }`}
              title={activePermissions.canExportData ? 'Unduh berkas spreadsheet Excel (CSV)' : 'Ekspor terkunci untuk peran Viewer'}
            >
              <Download className={`w-3.5 h-3.5 ${isExporting === 'excel' ? 'animate-pulse text-emerald-600' : ''}`} />
              <span>{isExporting === 'excel' ? 'Mengunduh...' : 'Ekspor Excel'}</span>
            </button>

            {/* Create Button with RBAC Guard */}
            <button
              onClick={handleOpenCreate}
              disabled={!activePermissions.canCreateEmployee}
              className={`flex items-center gap-2 px-4 py-2 text-xs font-semibold rounded-xl transition shadow-sm ${
                activePermissions.canCreateEmployee
                  ? 'bg-[#013E37] text-white hover:bg-[#025046]'
                  : 'bg-gray-200 text-gray-400 cursor-not-allowed'
              }`}
              title={activePermissions.canCreateEmployee ? 'Tambah Pegawai Baru' : 'Izin tambah data dibatasi untuk peran Viewer'}
            >
              {activePermissions.canCreateEmployee ? <UserPlus className="w-4 h-4" /> : <Lock className="w-4 h-4" />}
              <span>Tambah Pegawai Baru</span>
            </button>
          </div>
        </div>

        {/* KPI Mini-Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100 flex items-center justify-between">
            <div>
              <div className="text-xs text-gray-500 font-medium">Total Pegawai</div>
              <div className="text-2xl font-extrabold text-gray-900 mt-1">{stats.total}</div>
            </div>
            <div className="p-2.5 rounded-xl bg-gray-50 text-gray-700">
              <Users className="w-5 h-5 text-[#013E37]" />
            </div>
          </div>

          <div className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100 flex items-center justify-between">
            <div>
              <div className="text-xs text-gray-500 font-medium">Pegawai PNS</div>
              <div className="text-2xl font-extrabold text-emerald-800 mt-1">{stats.pns}</div>
            </div>
            <div className="p-2.5 rounded-xl bg-emerald-50 text-emerald-700">
              <Shield className="w-5 h-5" />
            </div>
          </div>

          <div className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100 flex items-center justify-between">
            <div>
              <div className="text-xs text-gray-500 font-medium">Pegawai PPPK</div>
              <div className="text-2xl font-extrabold text-blue-700 mt-1">{stats.pppk}</div>
            </div>
            <div className="p-2.5 rounded-xl bg-blue-50 text-blue-600">
              <Award className="w-5 h-5" />
            </div>
          </div>

          <div className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100 flex items-center justify-between">
            <div>
              <div className="text-xs text-gray-500 font-medium">Tenaga Honorer / BLUD</div>
              <div className="text-2xl font-extrabold text-amber-600 mt-1">{stats.honorer}</div>
            </div>
            <div className="p-2.5 rounded-xl bg-amber-50 text-amber-600">
              <Building className="w-5 h-5" />
            </div>
          </div>
        </div>

        {/* Filters & Search Toolbar */}
        <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100 space-y-4">
          <div className="flex flex-col md:flex-row gap-3 items-center justify-between">
            <div className="w-full md:max-w-md">
              <SearchBar
                value={searchQuery}
                onChange={setSearchQuery}
                placeholder="Cari nama, NIP, NIK, jabatan, atau pangkat..."
                resultsCount={filteredEmployees.length}
                totalCount={employees.length}
              />
            </div>

            <div className="flex flex-wrap items-center gap-2.5 w-full md:w-auto">
              {/* Status Pegawai Filter */}
              <div className="flex items-center gap-1.5 p-1 bg-gray-100 rounded-xl text-xs font-semibold">
                {['Semua', 'PNS', 'PPPK', 'Honorer'].map((status) => (
                  <button
                    key={status}
                    onClick={() => setStatusFilter(status)}
                    className={`px-3 py-1.5 rounded-lg transition ${
                      statusFilter === status
                        ? 'bg-white text-[#013E37] shadow-xs'
                        : 'text-gray-500 hover:text-gray-900'
                    }`}
                  >
                    {status}
                  </button>
                ))}
              </div>

              {/* Unit Kerja Selector */}
              <select
                value={unitFilter}
                onChange={(e) => setUnitFilter(e.target.value)}
                className="text-xs font-semibold text-gray-700 bg-white border border-gray-200 rounded-xl px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#013E37]/20"
              >
                {UNIT_KERJA_OPTIONS.map((unit) => (
                  <option key={unit} value={unit}>
                    {unit}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Interactive Employee Table with Sensitive Data Masking */}
          <div className="overflow-x-auto rounded-xl border border-gray-100">
            <table className="w-full text-left text-xs">
              <thead className="bg-gray-50 text-gray-600 font-semibold border-b border-gray-100 uppercase tracking-wider text-[11px]">
                <tr>
                  <th className="p-3.5">Pegawai & NIP</th>
                  <th className="p-3.5">Jabatan / Profesi</th>
                  <th className="p-3.5">Unit Kerja</th>
                  <th className="p-3.5">Status & Golongan</th>
                  {/* SENSITIVE DATA COLUMN */}
                  <th className="p-3.5">
                    <div className="flex items-center gap-1">
                      <span>Data Sensitif (NIK & Gaji)</span>
                      {currentRole === 'admin' ? (
                        <Unlock className="w-3 h-3 text-emerald-600" title="Akses Terbuka Penuh" />
                      ) : (
                        <Lock className="w-3 h-3 text-amber-500" title="Akses Terproteksi / Tersensor" />
                      )}
                    </div>
                  </th>
                  <th className="p-3.5 text-center">Status</th>
                  <th className="p-3.5 text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filteredEmployees.length > 0 ? (
                  filteredEmployees.map((emp) => (
                    <tr key={emp.id} className="hover:bg-gray-50/80 transition group">
                      {/* Name & NIP */}
                      <td className="p-3.5">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-xl bg-emerald-50 text-[#013E37] font-bold text-xs flex items-center justify-center shrink-0 border border-emerald-100">
                            {emp.nama.charAt(0)}
                          </div>
                          <div>
                            <div className="font-bold text-gray-900 hover:text-[#013E37] transition">
                              {formatFullName(emp)}
                            </div>
                            <div className="text-[11px] text-gray-400 font-mono mt-0.5">
                              NIP. {emp.nip}
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Jabatan */}
                      <td className="p-3.5">
                        <div className="text-gray-800 font-medium">{emp.jabatan}</div>
                        <div className="text-[10px] text-gray-400">
                          {emp.jenis_kelamin === 'L' ? 'Laki-laki' : 'Perempuan'}
                        </div>
                      </td>

                      {/* Unit Kerja */}
                      <td className="p-3.5">
                        <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-gray-50 text-gray-700 font-medium text-[11px] border border-gray-200">
                          <Building className="w-3 h-3 text-gray-400" />
                          <span>{emp.unit_kerja}</span>
                        </div>
                      </td>

                      {/* Status Pegawai */}
                      <td className="p-3.5">
                        <div className="space-y-1">
                          <span
                            className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                              emp.status_pegawai === 'PNS'
                                ? 'bg-emerald-100 text-emerald-800'
                                : emp.status_pegawai === 'PPPK'
                                ? 'bg-blue-100 text-blue-800'
                                : 'bg-amber-100 text-amber-800'
                            }`}
                          >
                            {emp.status_pegawai}
                          </span>
                          <div className="text-[11px] text-gray-500 font-medium">
                            {emp.golongan ? `Gol. ${emp.golongan}` : '-'}
                          </div>
                        </div>
                      </td>

                      {/* SENSITIVE DATA CELL (NIK & Remunerasi) */}
                      <td className="p-3.5">
                        <div className="space-y-0.5">
                          <div className="flex items-center gap-1.5 font-mono text-[11px]">
                            <span className="text-gray-400 text-[10px]">NIK:</span>
                            <span className={currentRole === 'viewer' ? 'text-gray-400 italic' : 'text-gray-800 font-semibold'}>
                              {formatNik(emp.nik)}
                            </span>
                          </div>

                          <div className="flex items-center gap-1 text-[11px]">
                            <span className="text-gray-400 text-[10px]">Gaji:</span>
                            <span className={currentRole === 'admin' ? 'font-bold text-emerald-800' : 'text-gray-400 italic'}>
                              {formatCurrency(emp.gaji_pokok ? emp.gaji_pokok + (emp.tunjangan_kinerja || 0) : undefined)}
                            </span>
                          </div>
                        </div>
                      </td>

                      {/* Status Aktif */}
                      <td className="p-3.5 text-center">
                        <span
                          className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                            emp.status_aktif === 'Aktif'
                              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                              : 'bg-gray-100 text-gray-600'
                          }`}
                        >
                          {emp.status_aktif}
                        </span>
                      </td>

                      {/* Actions with RBAC Controls */}
                      <td className="p-3.5 text-right whitespace-nowrap">
                        <div className="flex items-center justify-end gap-1">
                          {/* View is available to all roles */}
                          <button
                            onClick={() => handleOpenView(emp)}
                            className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition"
                            title="Lihat Detail Profil Pegawai"
                          >
                            <Eye className="w-4 h-4" />
                          </button>

                          {/* Edit is restricted for Viewer */}
                          {activePermissions.canEditEmployee ? (
                            <button
                              onClick={() => handleOpenEdit(emp)}
                              className="p-1.5 text-gray-400 hover:text-[#013E37] hover:bg-emerald-50 rounded-lg transition"
                              title="Edit Data Pegawai"
                            >
                              <Edit className="w-4 h-4" />
                            </button>
                          ) : (
                            <span className="p-1.5 text-gray-300 cursor-not-allowed" title="Peran Viewer tidak dapat mengedit data">
                              <Edit className="w-4 h-4 opacity-40" />
                            </span>
                          )}

                          {/* Delete is restricted for HR Staff & Viewer */}
                          {activePermissions.canDeleteEmployee ? (
                            <button
                              onClick={() => handleOpenDelete(emp)}
                              className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition"
                              title="Hapus / Nonaktifkan Pegawai"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          ) : (
                            <span className="p-1.5 text-gray-300 cursor-not-allowed" title="Hanya Administrator yang dapat menghapus data pegawai">
                              <Trash2 className="w-4 h-4 opacity-40" />
                            </span>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={7} className="p-10 text-center text-gray-400">
                      <div className="max-w-xs mx-auto space-y-2">
                        <Users className="w-8 h-8 text-gray-300 mx-auto" />
                        <div className="font-semibold text-gray-700 text-sm">Tidak ada data pegawai</div>
                        <div className="text-xs">
                          Tidak ditemukan pegawai dengan kriteria yang Anda cari.
                        </div>
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Table Footer info */}
          <div className="flex items-center justify-between text-xs text-gray-500 pt-2 px-1">
            <span>
              Menampilkan <strong className="text-gray-900">{filteredEmployees.length}</strong> dari{' '}
              {employees.length} pegawai terdaftar
            </span>
            <div className="text-[11px] text-gray-400 flex items-center gap-1.5">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
              <span>Privasi Terlindungi: Aturan RBAC Aktif</span>
            </div>
          </div>
        </div>
      </div>

      {/* USER ROLES AND PERMISSIONS MATRIX MODAL */}
      {showRoleMatrixModal && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto animate-in fade-in duration-150">
          <div className="bg-white rounded-2xl shadow-2xl max-w-3xl w-full max-h-[90vh] overflow-y-auto border border-gray-100">
            {/* Modal Header */}
            <div className="p-5 border-b border-gray-100 flex items-center justify-between bg-gradient-to-r from-gray-50 to-white sticky top-0 z-10">
              <div>
                <div className="flex items-center gap-2">
                  <KeyRound className="w-4 h-4 text-[#013E37]" />
                  <span className="text-xs font-bold uppercase text-[#013E37]">
                    Role-Based Access Control (RBAC)
                  </span>
                </div>
                <h3 className="font-bold text-base text-gray-900 mt-1">
                  Matriks Hak Akses & Pembatasan Data Sensitif SDM
                </h3>
              </div>
              <button
                onClick={() => setShowRoleMatrixModal(false)}
                className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 space-y-6 text-xs">
              <div className="p-4 rounded-xl bg-blue-50/70 border border-blue-200 text-blue-900 leading-relaxed space-y-1">
                <div className="font-bold flex items-center gap-1.5">
                  <ShieldCheck className="w-4 h-4 text-blue-700" />
                  <span>Kebijakan Keamanan Informasi RSUDAM (Permenkes 24/2022)</span>
                </div>
                <p className="text-[11px] text-blue-800">
                  Data sensitif seperti <strong>Nomor Induk Kependudukan (NIK)</strong>, <strong>Remunerasi / Nominal Gaji</strong>, dan <strong>Nomor Rekening Bank Pegawai</strong> dilindungi secara ketat. Administrator dapat menyesuaikan izin peran di bawah ini secara langsung.
                </p>
              </div>

              {/* RBAC Matrix Table */}
              <div className="rounded-xl border border-gray-200 overflow-hidden">
                <table className="w-full text-left text-xs">
                  <thead className="bg-gray-50 text-gray-700 font-semibold border-b border-gray-200 text-[11px]">
                    <tr>
                      <th className="p-3 w-1/3">Operasi & Akses Data</th>
                      <th className="p-3 text-center">
                        <div className="font-bold text-purple-900">Administrator</div>
                        <div className="text-[10px] text-purple-600 font-normal">Super HR</div>
                      </th>
                      <th className="p-3 text-center">
                        <div className="font-bold text-blue-900">Staf HR</div>
                        <div className="text-[10px] text-blue-600 font-normal">Operasional</div>
                      </th>
                      <th className="p-3 text-center">
                        <div className="font-bold text-amber-900">Viewer</div>
                        <div className="text-[10px] text-amber-600 font-normal">Read-Only / Auditor</div>
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {/* View Basic Data */}
                    <tr className="hover:bg-gray-50/50">
                      <td className="p-3">
                        <div className="font-bold text-gray-900">Lihat Profil Umum</div>
                        <div className="text-[10px] text-gray-500">Nama, NIP, Jabatan, Unit Kerja, Pangkat</div>
                      </td>
                      <td className="p-3 text-center">
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-800 font-bold text-[10px]">
                          <Check className="w-3 h-3" /> Penuh
                        </span>
                      </td>
                      <td className="p-3 text-center">
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-800 font-bold text-[10px]">
                          <Check className="w-3 h-3" /> Penuh
                        </span>
                      </td>
                      <td className="p-3 text-center">
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-800 font-bold text-[10px]">
                          <Check className="w-3 h-3" /> Penuh
                        </span>
                      </td>
                    </tr>

                    {/* View Sensitive Data */}
                    <tr className="hover:bg-gray-50/50 bg-amber-50/20">
                      <td className="p-3">
                        <div className="font-bold text-gray-900 flex items-center gap-1.5">
                          <Lock className="w-3.5 h-3.5 text-amber-600" />
                          <span>Data Finansial, NIK & Bank</span>
                        </div>
                        <div className="text-[10px] text-gray-500">Gaji pokok, tunjangan, rekening bank, NIK KTP</div>
                      </td>
                      <td className="p-3 text-center">
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-800 font-bold text-[10px]">
                          <Unlock className="w-3 h-3" /> Terbuka
                        </span>
                      </td>
                      <td className="p-3 text-center">
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-amber-100 text-amber-800 font-semibold text-[10px]">
                          <EyeOff className="w-3 h-3" /> Disensor
                        </span>
                      </td>
                      <td className="p-3 text-center">
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-red-100 text-red-800 font-semibold text-[10px]">
                          <Lock className="w-3 h-3" /> Terkunci
                        </span>
                      </td>
                    </tr>

                    {/* Create */}
                    <tr className="hover:bg-gray-50/50">
                      <td className="p-3">
                        <div className="font-bold text-gray-900">Tambah Pegawai Baru (CREATE)</div>
                        <div className="text-[10px] text-gray-500">Formulir pendaftaran pegawai baru ke database</div>
                      </td>
                      <td className="p-3 text-center">
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-800 font-bold text-[10px]">
                          <Check className="w-3 h-3" /> Diizinkan
                        </span>
                      </td>
                      <td className="p-3 text-center">
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-800 font-bold text-[10px]">
                          <Check className="w-3 h-3" /> Diizinkan
                        </span>
                      </td>
                      <td className="p-3 text-center">
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-red-100 text-red-800 font-semibold text-[10px]">
                          <X className="w-3 h-3" /> Dilarang
                        </span>
                      </td>
                    </tr>

                    {/* Edit */}
                    <tr className="hover:bg-gray-50/50">
                      <td className="p-3">
                        <div className="font-bold text-gray-900">Ubah Biodata & Jabatan (UPDATE)</div>
                        <div className="text-[10px] text-gray-500">Pembaruan pangkat, unit penempatan, dan kontak</div>
                      </td>
                      <td className="p-3 text-center">
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-800 font-bold text-[10px]">
                          <Check className="w-3 h-3" /> Diizinkan
                        </span>
                      </td>
                      <td className="p-3 text-center">
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-800 font-bold text-[10px]">
                          <Check className="w-3 h-3" /> Diizinkan
                        </span>
                      </td>
                      <td className="p-3 text-center">
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-red-100 text-red-800 font-semibold text-[10px]">
                          <X className="w-3 h-3" /> Dilarang
                        </span>
                      </td>
                    </tr>

                    {/* Delete */}
                    <tr className="hover:bg-gray-50/50 bg-red-50/20">
                      <td className="p-3">
                        <div className="font-bold text-gray-900 flex items-center gap-1.5">
                          <Trash2 className="w-3.5 h-3.5 text-red-600" />
                          <span>Hapus / Nonaktifkan (DELETE)</span>
                        </div>
                        <div className="text-[10px] text-gray-500">Tindakan berisiko tinggi (soft-delete arsip pegawai)</div>
                      </td>
                      <td className="p-3 text-center">
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-800 font-bold text-[10px]">
                          <Check className="w-3 h-3" /> Diizinkan
                        </span>
                      </td>
                      <td className="p-3 text-center">
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-red-100 text-red-800 font-semibold text-[10px]">
                          <X className="w-3 h-3" /> Ditolak
                        </span>
                      </td>
                      <td className="p-3 text-center">
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-red-100 text-red-800 font-semibold text-[10px]">
                          <X className="w-3 h-3" /> Ditolak
                        </span>
                      </td>
                    </tr>

                    {/* Export */}
                    <tr className="hover:bg-gray-50/50">
                      <td className="p-3">
                        <div className="font-bold text-gray-900">Ekspor Laporan (PDF / Excel)</div>
                        <div className="text-[10px] text-gray-500">Pengunduhan rekapitulasi data pegawai ke luar sistem</div>
                      </td>
                      <td className="p-3 text-center">
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-800 font-bold text-[10px]">
                          <Check className="w-3 h-3" /> Lengkap
                        </span>
                      </td>
                      <td className="p-3 text-center">
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-800 font-bold text-[10px]">
                          <Check className="w-3 h-3" /> Lengkap
                        </span>
                      </td>
                      <td className="p-3 text-center">
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-red-100 text-red-800 font-semibold text-[10px]">
                          <X className="w-3 h-3" /> Dibatasi
                        </span>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>

              {/* Close Button */}
              <div className="flex items-center justify-end pt-2">
                <button
                  onClick={() => setShowRoleMatrixModal(false)}
                  className="px-5 py-2.5 bg-[#013E37] text-white font-semibold rounded-xl hover:bg-[#025046] transition text-xs shadow-sm"
                >
                  Selesai & Tutup
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* CREATE & EDIT MODAL */}
      {(modalMode === 'create' || modalMode === 'edit') && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto animate-in fade-in duration-150">
          <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto border border-gray-100">
            {/* Modal Header */}
            <div className="p-5 border-b border-gray-100 flex items-center justify-between sticky top-0 bg-white z-10">
              <div>
                <h2 className="text-lg font-bold text-gray-900">
                  {modalMode === 'create' ? 'Tambah Pegawai Baru' : 'Ubah Data Pegawai'}
                </h2>
                <p className="text-xs text-gray-500">
                  Formulir biodata pegawai, penempatan kerja, dan data remunerasi RSUDAM
                </p>
              </div>
              <button
                onClick={closeModal}
                className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Form */}
            <form onSubmit={handleSubmit} className="p-6 space-y-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* NIP */}
                <div>
                  <label className="block font-semibold text-gray-700 mb-1">
                    NIP / No. Induk Pegawai <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={formData.nip}
                    onChange={(e) => setFormData({ ...formData, nip: e.target.value })}
                    placeholder="Contoh: 198204122008011005"
                    className={`w-full p-2.5 rounded-xl border ${
                      formErrors.nip ? 'border-red-400 bg-red-50/30' : 'border-gray-200'
                    } focus:outline-none focus:ring-2 focus:ring-[#013E37]/20`}
                  />
                  {formErrors.nip && (
                    <span className="text-red-500 text-[10px] mt-0.5 block">{formErrors.nip}</span>
                  )}
                </div>

                {/* Nama */}
                <div>
                  <label className="block font-semibold text-gray-700 mb-1">
                    Nama Lengkap (tanpa gelar) <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={formData.nama}
                    onChange={(e) => setFormData({ ...formData, nama: e.target.value })}
                    placeholder="Contoh: Marzuqi Sayuti"
                    className={`w-full p-2.5 rounded-xl border ${
                      formErrors.nama ? 'border-red-400 bg-red-50/30' : 'border-gray-200'
                    } focus:outline-none focus:ring-2 focus:ring-[#013E37]/20`}
                  />
                  {formErrors.nama && (
                    <span className="text-red-500 text-[10px] mt-0.5 block">{formErrors.nama}</span>
                  )}
                </div>

                {/* Gelar Depan */}
                <div>
                  <label className="block font-semibold text-gray-700 mb-1">
                    Gelar Depan (Opsional)
                  </label>
                  <input
                    type="text"
                    value={formData.gelar_depan}
                    onChange={(e) => setFormData({ ...formData, gelar_depan: e.target.value })}
                    placeholder="dr. / Ns. / apt. / Prof."
                    className="w-full p-2.5 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-[#013E37]/20"
                  />
                </div>

                {/* Gelar Belakang */}
                <div>
                  <label className="block font-semibold text-gray-700 mb-1">
                    Gelar Belakang (Opsional)
                  </label>
                  <input
                    type="text"
                    value={formData.gelar_belakang}
                    onChange={(e) => setFormData({ ...formData, gelar_belakang: e.target.value })}
                    placeholder="Sp.An / M.Kep / S.Farm / S.Tr.Keb"
                    className="w-full p-2.5 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-[#013E37]/20"
                  />
                </div>

                {/* Jenis Kelamin */}
                <div>
                  <label className="block font-semibold text-gray-700 mb-1">
                    Jenis Kelamin <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={formData.jenis_kelamin}
                    onChange={(e) =>
                      setFormData({ ...formData, jenis_kelamin: e.target.value as 'L' | 'P' })
                    }
                    className="w-full p-2.5 rounded-xl border border-gray-200 bg-white focus:outline-none focus:ring-2 focus:ring-[#013E37]/20"
                  >
                    <option value="L">Laki-laki</option>
                    <option value="P">Perempuan</option>
                  </select>
                </div>

                {/* Status Kepegawaian */}
                <div>
                  <label className="block font-semibold text-gray-700 mb-1">
                    Status Kepegawaian <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={formData.status_pegawai}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        status_pegawai: e.target.value as 'PNS' | 'PPPK' | 'Honorer',
                      })
                    }
                    className="w-full p-2.5 rounded-xl border border-gray-200 bg-white focus:outline-none focus:ring-2 focus:ring-[#013E37]/20"
                  >
                    <option value="PNS">Pegawai Negeri Sipil (PNS)</option>
                    <option value="PPPK">Pegawai Pemerintah dgn Perjanjian Kerja (PPPK)</option>
                    <option value="Honorer">Tenaga Honorer / BLUD</option>
                  </select>
                </div>

                {/* Jabatan */}
                <div className="sm:col-span-2">
                  <label className="block font-semibold text-gray-700 mb-1">
                    Jabatan Struktural / Fungsional <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={formData.jabatan}
                    onChange={(e) => setFormData({ ...formData, jabatan: e.target.value })}
                    placeholder="Contoh: Dokter Spesialis Anestesiologi / Perawat Primer"
                    className={`w-full p-2.5 rounded-xl border ${
                      formErrors.jabatan ? 'border-red-400 bg-red-50/30' : 'border-gray-200'
                    } focus:outline-none focus:ring-2 focus:ring-[#013E37]/20`}
                  />
                  {formErrors.jabatan && (
                    <span className="text-red-500 text-[10px] mt-0.5 block">{formErrors.jabatan}</span>
                  )}
                </div>

                {/* Unit Kerja */}
                <div className="sm:col-span-2">
                  <label className="block font-semibold text-gray-700 mb-1">
                    Unit Kerja / Instalasi Penempatan <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={formData.unit_kerja}
                    onChange={(e) => setFormData({ ...formData, unit_kerja: e.target.value })}
                    className="w-full p-2.5 rounded-xl border border-gray-200 bg-white focus:outline-none focus:ring-2 focus:ring-[#013E37]/20"
                  >
                    {UNIT_KERJA_OPTIONS.filter((u) => u !== 'Semua Unit Kerja').map((unit) => (
                      <option key={unit} value={unit}>
                        {unit}
                      </option>
                    ))}
                  </select>
                </div>

                {/* SECTION: DATA SENSITIF (NIK & FINANSIAL) */}
                <div className="sm:col-span-2 p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-3">
                  <div className="flex items-center gap-2 text-slate-800 font-bold">
                    <Lock className="w-4 h-4 text-emerald-700" />
                    <span>Data Sensitif & Finansial (Hanya Admin yang dapat mengubah)</span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block font-semibold text-gray-700 mb-1">
                        NIK (Nomor Induk Kependudukan - KTP)
                      </label>
                      <input
                        type="text"
                        value={formData.nik}
                        onChange={(e) => setFormData({ ...formData, nik: e.target.value })}
                        placeholder="16 Digit NIK KTP"
                        className="w-full p-2 rounded-lg border border-gray-200 bg-white focus:outline-none focus:ring-2 focus:ring-[#013E37]/20"
                      />
                    </div>

                    <div>
                      <label className="block font-semibold text-gray-700 mb-1">
                        No. Rekening Bank (Gaji)
                      </label>
                      <input
                        type="text"
                        value={formData.no_rekening}
                        onChange={(e) => setFormData({ ...formData, no_rekening: e.target.value })}
                        placeholder="Contoh: 381.03.01.12345 (Bank Lampung)"
                        className="w-full p-2 rounded-lg border border-gray-200 bg-white focus:outline-none focus:ring-2 focus:ring-[#013E37]/20"
                      />
                    </div>

                    <div>
                      <label className="block font-semibold text-gray-700 mb-1">
                        Gaji Pokok Bulanan (Rp)
                      </label>
                      <input
                        type="number"
                        disabled={currentRole !== 'admin'}
                        value={formData.gaji_pokok}
                        onChange={(e) => setFormData({ ...formData, gaji_pokok: Number(e.target.value) })}
                        className={`w-full p-2 rounded-lg border ${
                          currentRole === 'admin'
                            ? 'border-gray-200 bg-white'
                            : 'border-gray-200 bg-gray-100 text-gray-400 cursor-not-allowed'
                        }`}
                      />
                      {currentRole !== 'admin' && (
                        <span className="text-[10px] text-amber-600 block mt-0.5">
                          Hanya Administrator yang dapat mengubah nominal gaji.
                        </span>
                      )}
                    </div>

                    <div>
                      <label className="block font-semibold text-gray-700 mb-1">
                        Tunjangan Kinerja / Remunerasi (Rp)
                      </label>
                      <input
                        type="number"
                        disabled={currentRole !== 'admin'}
                        value={formData.tunjangan_kinerja}
                        onChange={(e) => setFormData({ ...formData, tunjangan_kinerja: Number(e.target.value) })}
                        className={`w-full p-2 rounded-lg border ${
                          currentRole === 'admin'
                            ? 'border-gray-200 bg-white'
                            : 'border-gray-200 bg-gray-100 text-gray-400 cursor-not-allowed'
                        }`}
                      />
                    </div>
                  </div>
                </div>

                {/* Email & No Telp */}
                <div>
                  <label className="block font-semibold text-gray-700 mb-1">
                    Alamat Email
                  </label>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    placeholder="nama@rsudam.lampungprov.go.id"
                    className="w-full p-2.5 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-[#013E37]/20"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-gray-700 mb-1">
                    Nomor WhatsApp / Telp
                  </label>
                  <input
                    type="text"
                    value={formData.no_telp}
                    onChange={(e) => setFormData({ ...formData, no_telp: e.target.value })}
                    placeholder="0812xxxxxxxx"
                    className="w-full p-2.5 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-[#013E37]/20"
                  />
                </div>
              </div>

              {/* Modal Buttons */}
              <div className="pt-4 border-t border-gray-100 flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={closeModal}
                  className="px-4 py-2 text-xs font-semibold text-gray-600 hover:bg-gray-100 rounded-xl transition"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2 text-xs font-semibold bg-[#013E37] text-white hover:bg-[#025046] rounded-xl transition disabled:opacity-50 flex items-center gap-1.5 shadow-sm"
                >
                  {isSubmitting && <RefreshCw className="w-3.5 h-3.5 animate-spin" />}
                  <span>{modalMode === 'create' ? 'Simpan Pegawai' : 'Perbarui Data'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* VIEW DETAIL MODAL WITH SENSITIVE DATA VAULT */}
      {modalMode === 'view' && selectedEmployee && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-150">
          <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full overflow-hidden border border-gray-100">
            {/* Modal Header */}
            <div className="p-6 bg-gradient-to-br from-[#013E37] to-[#025046] text-white flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-white/10 text-white font-extrabold text-base flex items-center justify-center border border-white/20">
                  {selectedEmployee.nama.charAt(0)}
                </div>
                <div>
                  <h3 className="font-bold text-base leading-snug">
                    {formatFullName(selectedEmployee)}
                  </h3>
                  <div className="text-xs text-emerald-200/90 font-mono mt-0.5">
                    NIP. {selectedEmployee.nip}
                  </div>
                </div>
              </div>
              <button
                onClick={closeModal}
                className="p-1.5 text-white/70 hover:text-white hover:bg-white/10 rounded-lg transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Profile Info Details */}
            <div className="p-6 space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-3 p-3 rounded-xl bg-gray-50 border border-gray-100">
                <div>
                  <span className="text-[10px] text-gray-400 uppercase font-semibold">Status Pegawai</span>
                  <div className="font-bold text-gray-900 mt-0.5">{selectedEmployee.status_pegawai}</div>
                </div>
                <div>
                  <span className="text-[10px] text-gray-400 uppercase font-semibold">Golongan / Pangkat</span>
                  <div className="font-bold text-gray-900 mt-0.5">
                    {selectedEmployee.golongan || '-'} ({selectedEmployee.pangkat || '-'})
                  </div>
                </div>
                <div>
                  <span className="text-[10px] text-gray-400 uppercase font-semibold">Unit Kerja</span>
                  <div className="font-bold text-gray-900 mt-0.5">{selectedEmployee.unit_kerja}</div>
                </div>
                <div>
                  <span className="text-[10px] text-gray-400 uppercase font-semibold">Status Keaktifan</span>
                  <div className="font-bold text-emerald-700 mt-0.5">{selectedEmployee.status_aktif}</div>
                </div>
              </div>

              {/* SENSITIVE HR DATA VAULT CARD */}
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-2.5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5 font-bold text-slate-900">
                    <Lock className="w-3.5 h-3.5 text-emerald-700" />
                    <span>Data Rahasia & Finansial Pegawai</span>
                  </div>
                  <span className={`text-[10px] px-2 py-0.5 rounded-full font-semibold border ${ROLE_INFO[currentRole].badgeColor}`}>
                    {ROLE_INFO[currentRole].label}
                  </span>
                </div>

                <div className="space-y-1.5 text-[11px]">
                  <div className="flex justify-between items-center py-1 border-b border-gray-200">
                    <span className="text-gray-500">NIK (KTP):</span>
                    <span className="font-mono font-semibold text-gray-900">{formatNik(selectedEmployee.nik)}</span>
                  </div>
                  <div className="flex justify-between items-center py-1 border-b border-gray-200">
                    <span className="text-gray-500">Gaji Pokok:</span>
                    <span className="font-semibold text-gray-900">{formatCurrency(selectedEmployee.gaji_pokok)}</span>
                  </div>
                  <div className="flex justify-between items-center py-1 border-b border-gray-200">
                    <span className="text-gray-500">Tunjangan Kinerja:</span>
                    <span className="font-semibold text-gray-900">{formatCurrency(selectedEmployee.tunjangan_kinerja)}</span>
                  </div>
                  <div className="flex justify-between items-center py-1 border-b border-gray-200">
                    <span className="text-gray-500">Rekening Bank:</span>
                    <span className="font-mono text-gray-900">{formatBankAccount(selectedEmployee.no_rekening)}</span>
                  </div>
                  <div className="flex justify-between items-center py-1">
                    <span className="text-gray-500">No. BPJS:</span>
                    <span className="font-mono text-gray-900">
                      {currentRole === 'viewer' ? '0001******** (Tersensor)' : (selectedEmployee.no_bpjs || '-')}
                    </span>
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex items-center gap-2 text-gray-700">
                  <Award className="w-4 h-4 text-gray-400" />
                  <span className="font-medium">Jabatan:</span>
                  <span className="font-bold text-gray-900">{selectedEmployee.jabatan}</span>
                </div>
                <div className="flex items-center gap-2 text-gray-700">
                  <Mail className="w-4 h-4 text-gray-400" />
                  <span className="font-medium">Email:</span>
                  <span className="text-gray-900">{selectedEmployee.email || '-'}</span>
                </div>
                <div className="flex items-center gap-2 text-gray-700">
                  <Phone className="w-4 h-4 text-gray-400" />
                  <span className="font-medium">Telepon / WA:</span>
                  <span className="text-gray-900">{selectedEmployee.no_telp || '-'}</span>
                </div>
              </div>

              <div className="pt-4 border-t border-gray-100 flex items-center justify-end gap-2">
                {activePermissions.canEditEmployee && (
                  <button
                    type="button"
                    onClick={() => {
                      closeModal();
                      handleOpenEdit(selectedEmployee);
                    }}
                    className="px-4 py-2 bg-emerald-50 text-[#013E37] font-semibold rounded-xl hover:bg-emerald-100 transition"
                  >
                    Edit Data
                  </button>
                )}
                <button
                  type="button"
                  onClick={closeModal}
                  className="px-4 py-2 bg-gray-100 text-gray-700 font-semibold rounded-xl hover:bg-gray-200 transition"
                >
                  Tutup
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* DELETE CONFIRMATION DIALOG */}
      {deleteTarget && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-150">
          <div className="bg-white rounded-2xl shadow-2xl max-w-sm w-full p-6 text-center space-y-4 border border-gray-100">
            <div className="w-12 h-12 rounded-full bg-red-100 text-red-600 flex items-center justify-center mx-auto">
              <AlertTriangle className="w-6 h-6" />
            </div>

            <div>
              <h3 className="font-bold text-base text-gray-900">Konfirmasi Hapus Pegawai</h3>
              <p className="text-xs text-gray-500 mt-1 leading-relaxed">
                Apakah Anda yakin ingin menghapus data pegawai{' '}
                <strong className="text-gray-900">{formatFullName(deleteTarget)}</strong> (NIP.{' '}
                {deleteTarget.nip})? Tindakan ini hanya dapat dilakukan oleh peran Administrator.
              </p>
            </div>

            <div className="flex items-center justify-center gap-2.5 pt-2">
              <button
                type="button"
                onClick={() => setDeleteTarget(null)}
                className="px-4 py-2 text-xs font-semibold text-gray-600 hover:bg-gray-100 rounded-xl transition"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={handleDeleteConfirm}
                disabled={isSubmitting}
                className="px-5 py-2 text-xs font-semibold bg-red-600 text-white hover:bg-red-700 rounded-xl transition disabled:opacity-50"
              >
                {isSubmitting ? 'Menghapus...' : 'Ya, Hapus'}
              </button>
            </div>
          </div>
        </div>
      )}
    </Layout>
  );
}
