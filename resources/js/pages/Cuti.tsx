import React, { useState, useMemo, useEffect } from 'react';
import { Head, Link } from '@inertiajs/react';
import Layout from '../components/Layout';
import SearchBar, { filterRecords } from '../components/SearchBar';
import {
  Calendar, CheckCircle2, Clock, AlertTriangle, XCircle,
  Plus, Filter, UserCheck, Shield, FileText, Download,
  ArrowRight, Check, X, Building, ChevronRight, Eye,
  AlertCircle, Users, BarChart3, PieChart as PieChartIcon,
  RefreshCw, Award, Send
} from 'lucide-react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from 'recharts';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

export interface CutiRecord {
  id: number;
  pegawai_id: number;
  pegawai: {
    id: number;
    nip: string;
    nama: string;
    jabatan: string;
    unit_kerja: string;
    sisa_cuti_tahunan?: number;
  };
  jenis_cuti: 'Cuti Tahunan' | 'Cuti Sakit' | 'Cuti Alasan Penting' | 'Cuti Melahirkan' | 'Cuti Besar';
  tanggal_mulai: string;
  tanggal_selesai: string;
  jumlah_hari: number;
  alasan: string;
  alamat_selama_cuti?: string;
  no_telp_cuti?: string;
  status: 'Pending' | 'Disetujui' | 'Ditolak';
  tanggal_pengajuan: string;
  tanggal_disetujui?: string;
  disetujui_oleh?: string;
  catatan?: string;
  approvals: {
    level: number;
    jabatan_penilai: string;
    status: 'Pending' | 'Disetujui' | 'Ditolak';
    approver_nama?: string;
    tanggal_aksi?: string;
    catatan?: string;
  }[];
}

const INITIAL_PEGAWAI_LIST = [
  { id: 1, nip: '198204122008011005', nama: 'dr. Marzuqi Sayuti, Sp.An-TI', jabatan: 'Dokter Spesialis Anestesiologi', unit_kerja: 'Instalasi Gawat Darurat (IGD)', sisa_cuti_tahunan: 8 },
  { id: 2, nip: '198906232014022003', nama: 'Ns. Jumiah, S.Kep., M.Kep', jabatan: 'Perawat Primer ICU', unit_kerja: 'Intensive Care Unit (ICU)', sisa_cuti_tahunan: 6 },
  { id: 3, nip: '199211042019032011', nama: 'Bd. Siti Nurhaliza, S.Tr.Keb', jabatan: 'Bidan Pelaksana Lanjutan', unit_kerja: 'Kamar Bersalin (VK Sentral)', sisa_cuti_tahunan: 10 },
  { id: 4, nip: '198703152010011002', nama: 'apt. Rahmat Hidayat, S.Farm', jabatan: 'Apoteker Penanggung Jawab Farmasi', unit_kerja: 'Instalasi Farmasi Sentral', sisa_cuti_tahunan: 9 },
  { id: 5, nip: '199408192020121004', nama: 'Dedi Kurniawan, A.Md.Rad', jabatan: 'Radiografer Pelaksana', unit_kerja: 'Instalasi Radiologi', sisa_cuti_tahunan: 11 },
  { id: 6, nip: '197505101998031001', nama: 'Dr. dr. Lukman Pura, Sp.PD-KGEH', jabatan: 'Direktur Utama', unit_kerja: 'Direksi & Manajemen', sisa_cuti_tahunan: 12 },
  { id: 7, nip: '202301150012', nama: 'Agus Santoso, S.Kom', jabatan: 'Staff IT SIMRS', unit_kerja: 'Instalasi SIMRS & TI', sisa_cuti_tahunan: 7 },
  { id: 8, nip: '198009122005012008', nama: 'Ns. Ratna Dewi, S.Kep', jabatan: 'Kepala Ruangan Rawat Inap Bedah', unit_kerja: 'Ruang Alamanda (Bedah)', sisa_cuti_tahunan: 5 },
];

const INITIAL_CUTI_LIST: CutiRecord[] = [
  {
    id: 101,
    pegawai_id: 2,
    pegawai: {
      id: 2,
      nip: '198906232014022003',
      nama: 'Ns. Jumiah, S.Kep., M.Kep',
      jabatan: 'Perawat Primer ICU',
      unit_kerja: 'Intensive Care Unit (ICU)',
      sisa_cuti_tahunan: 6,
    },
    jenis_cuti: 'Cuti Tahunan',
    tanggal_mulai: '2026-10-05',
    tanggal_selesai: '2026-10-08',
    jumlah_hari: 4,
    alasan: 'Keperluan keluarga penting dan pendampingan orang tua di luar daerah.',
    alamat_selama_cuti: 'Jl. Raden Intan No. 45, Bandar Lampung',
    no_telp_cuti: '081369882314',
    status: 'Pending',
    tanggal_pengajuan: '2026-09-28',
    approvals: [
      {
        level: 1,
        jabatan_penilai: 'Kepala Ruangan ICU',
        status: 'Disetujui',
        approver_nama: 'Ns. Ratna Dewi, S.Kep',
        tanggal_aksi: '2026-09-29 09:30 WIB',
        catatan: 'Jadwal shift ICU telah didelegasikan kepada perawat pengganti.',
      },
      {
        level: 2,
        jabatan_penilai: 'Subbag Kepegawaian & Direksi RS',
        status: 'Pending',
      },
    ],
  },
  {
    id: 102,
    pegawai_id: 3,
    pegawai: {
      id: 3,
      nip: '199211042019032011',
      nama: 'Bd. Siti Nurhaliza, S.Tr.Keb',
      jabatan: 'Bidan Pelaksana Lanjutan',
      unit_kerja: 'Kamar Bersalin (VK Sentral)',
      sisa_cuti_tahunan: 10,
    },
    jenis_cuti: 'Cuti Alasan Penting',
    tanggal_mulai: '2026-10-12',
    tanggal_selesai: '2026-10-14',
    jumlah_hari: 3,
    alasan: 'Pernikahan saudara kandung di Kabupaten Pringsewu.',
    alamat_selama_cuti: 'Pringsewu, Lampung',
    no_telp_cuti: '082181290345',
    status: 'Pending',
    tanggal_pengajuan: '2026-09-29',
    approvals: [
      {
        level: 1,
        jabatan_penilai: 'Kepala Ruangan VK Sentral',
        status: 'Pending',
      },
      {
        level: 2,
        jabatan_penilai: 'Subbag Kepegawaian & Direksi RS',
        status: 'Pending',
      },
    ],
  },
  {
    id: 103,
    pegawai_id: 1,
    pegawai: {
      id: 1,
      nip: '198204122008011005',
      nama: 'dr. Marzuqi Sayuti, Sp.An-TI',
      jabatan: 'Dokter Spesialis Anestesiologi',
      unit_kerja: 'Instalasi Gawat Darurat (IGD)',
      sisa_cuti_tahunan: 8,
    },
    jenis_cuti: 'Cuti Tahunan',
    tanggal_mulai: '2026-09-21',
    tanggal_selesai: '2026-09-24',
    jumlah_hari: 4,
    alasan: 'Cuti tahunan terjadwal pasca rotasi jaga IGD cito intensif.',
    alamat_selama_cuti: 'Bandar Lampung',
    no_telp_cuti: '081272341109',
    status: 'Disetujui',
    tanggal_pengajuan: '2026-09-14',
    tanggal_disetujui: '2026-09-16',
    disetujui_oleh: 'Dr. dr. H. Lukman Pura, Sp.PD-KGEH',
    catatan: 'Disetujui penuh dengan pertimbangan kuota nakes jaga mencukupi.',
    approvals: [
      {
        level: 1,
        jabatan_penilai: 'Kepala Instalasi Gawat Darurat (IGD)',
        status: 'Disetujui',
        approver_nama: 'dr. Rian Pratama, Sp.B',
        tanggal_aksi: '2026-09-15 11:20 WIB',
        catatan: 'Dokter spesialis anestesi on-call cadangan telah ditunjuk.',
      },
      {
        level: 2,
        jabatan_penilai: 'Subbag Kepegawaian & Direksi RS',
        status: 'Disetujui',
        approver_nama: 'Dr. dr. H. Lukman Pura, Sp.PD-KGEH',
        tanggal_aksi: '2026-09-16 14:00 WIB',
        catatan: 'Disetujui Direktur Utama.',
      },
    ],
  },
  {
    id: 104,
    pegawai_id: 4,
    pegawai: {
      id: 4,
      nip: '198703152010011002',
      nama: 'apt. Rahmat Hidayat, S.Farm',
      jabatan: 'Apoteker Penanggung Jawab Farmasi',
      unit_kerja: 'Instalasi Farmasi Sentral',
      sisa_cuti_tahunan: 9,
    },
    jenis_cuti: 'Cuti Sakit',
    tanggal_mulai: '2026-09-10',
    tanggal_selesai: '2026-09-12',
    jumlah_hari: 3,
    alasan: 'Rawat jalan pasca infeksi saluran pernapasan atas (ISPA).',
    alamat_selama_cuti: 'Kedaton, Bandar Lampung',
    no_telp_cuti: '085273114567',
    status: 'Disetujui',
    tanggal_pengajuan: '2026-09-10',
    tanggal_disetujui: '2026-09-10',
    disetujui_oleh: 'Dr. dr. H. Lukman Pura, Sp.PD-KGEH',
    approvals: [
      {
        level: 1,
        jabatan_penilai: 'Kepala Instalasi Farmasi',
        status: 'Disetujui',
        approver_nama: 'apt. Maya Sari, M.Farm',
        tanggal_aksi: '2026-09-10 08:30 WIB',
        catatan: 'Surat dokter poliklinik terlampir.',
      },
      {
        level: 2,
        jabatan_penilai: 'Subbag Kepegawaian',
        status: 'Disetujui',
        approver_nama: 'Siti Rahmawati, S.Kom',
        tanggal_aksi: '2026-09-10 10:15 WIB',
        catatan: 'Disahkan sebagai Cuti Sakit.',
      },
    ],
  },
  {
    id: 105,
    pegawai_id: 8,
    pegawai: {
      id: 8,
      nip: '198009122005012008',
      nama: 'Ns. Ratna Dewi, S.Kep',
      jabatan: 'Kepala Ruangan Rawat Inap Bedah',
      unit_kerja: 'Ruang Alamanda (Bedah)',
      sisa_cuti_tahunan: 5,
    },
    jenis_cuti: 'Cuti Tahunan',
    tanggal_mulai: '2026-10-19',
    tanggal_selesai: '2026-10-23',
    jumlah_hari: 5,
    alasan: 'Cuti tahunan reguler.',
    status: 'Pending',
    tanggal_pengajuan: '2026-09-29',
    approvals: [
      {
        level: 1,
        jabatan_penilai: 'Kepala Instalasi Rawat Inap Bedah',
        status: 'Pending',
      },
      {
        level: 2,
        jabatan_penilai: 'Subbag Kepegawaian & Direksi RS',
        status: 'Pending',
      },
    ],
  },
];

const JENIS_CUTI_OPTIONS = [
  'Cuti Tahunan',
  'Cuti Sakit',
  'Cuti Alasan Penting',
  'Cuti Melahirkan',
  'Cuti Besar',
];

interface FormState {
  pegawai_id: number;
  jenis_cuti: 'Cuti Tahunan' | 'Cuti Sakit' | 'Cuti Alasan Penting' | 'Cuti Melahirkan' | 'Cuti Besar';
  tanggal_mulai: string;
  tanggal_selesai: string;
  jumlah_hari: number;
  alasan: string;
  alamat_selama_cuti: string;
  no_telp_cuti: string;
  pegawai_pengganti: string;
}

export default function CutiPage() {
  const [cutiList, setCutiList] = useState<CutiRecord[]>(INITIAL_CUTI_LIST);
  const [pegawaiList, setPegawaiList] = useState(INITIAL_PEGAWAI_LIST);

  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('Semua');
  const [jenisFilter, setJenisFilter] = useState('Semua Jenis');

  // Modals
  const [isSubmitModalOpen, setIsSubmitModalOpen] = useState(false);
  const [selectedCutiForReview, setSelectedCutiForReview] = useState<CutiRecord | null>(null);
  const [rejectionReason, setRejectionReason] = useState('');
  const [approvalNote, setApprovalNote] = useState('');

  // Selected Employee for Balance Calculator inspection
  const [inspectedEmployeeId, setInspectedEmployeeId] = useState<number>(2); // Default Ns. Jumiah

  // Form State
  const [formData, setFormData] = useState<FormState>({
    pegawai_id: 2,
    jenis_cuti: 'Cuti Tahunan',
    tanggal_mulai: '',
    tanggal_selesai: '',
    jumlah_hari: 1,
    alasan: '',
    alamat_selama_cuti: '',
    no_telp_cuti: '',
    pegawai_pengganti: '',
  });

  // Toast feedback
  const [toastMessage, setToastMessage] = useState<{ text: string; type: 'success' | 'warning' | 'error' } | null>(null);

  const showToast = (text: string, type: 'success' | 'warning' | 'error' = 'success') => {
    setToastMessage({ text, type });
    setTimeout(() => setToastMessage(null), 4000);
  };

  // Automated Balance Calculation Engine
  const employeeBalances = useMemo(() => {
    const balances: Record<
      number,
      {
        totalQuota: number;
        approvedDays: number;
        pendingDays: number;
        remainingBalance: number;
        availableNetBalance: number;
      }
    > = {};

    pegawaiList.forEach((p) => {
      const baseQuota = 12; // PP No. 11/2017 annual quota standard

      // Approved annual leave days
      const approvedDays = cutiList
        .filter((c) => c.pegawai_id === p.id && c.status === 'Disetujui' && c.jenis_cuti === 'Cuti Tahunan')
        .reduce((sum, c) => sum + c.jumlah_hari, 0);

      // Pending annual leave days
      const pendingDays = cutiList
        .filter((c) => c.pegawai_id === p.id && c.status === 'Pending' && c.jenis_cuti === 'Cuti Tahunan')
        .reduce((sum, c) => sum + c.jumlah_hari, 0);

      const remainingBalance = Math.max(0, baseQuota - approvedDays);
      const availableNetBalance = Math.max(0, remainingBalance - pendingDays);

      balances[p.id] = {
        totalQuota: baseQuota,
        approvedDays,
        pendingDays,
        remainingBalance,
        availableNetBalance,
      };
    });

    return balances;
  }, [pegawaiList, cutiList]);

  // Overall Global System Metrics
  const systemMetrics = useMemo(() => {
    const totalRequests = cutiList.length;
    const approvedRequests = cutiList.filter((c) => c.status === 'Disetujui');
    const pendingRequests = cutiList.filter((c) => c.status === 'Pending');
    const rejectedRequests = cutiList.filter((c) => c.status === 'Ditolak');

    const totalApprovedDays = approvedRequests.reduce((sum, c) => sum + c.jumlah_hari, 0);
    const totalPendingDays = pendingRequests.reduce((sum, c) => sum + c.jumlah_hari, 0);

    const avgRemainingQuota = Math.round(
      (Object.values(employeeBalances).reduce((acc, b) => acc + b.availableNetBalance, 0) /
        (pegawaiList.length || 1)) *
        10
    ) / 10;

    return {
      totalRequests,
      totalApprovedDays,
      approvedCount: approvedRequests.length,
      totalPendingDays,
      pendingCount: pendingRequests.length,
      rejectedCount: rejectedRequests.length,
      avgRemainingQuota,
    };
  }, [cutiList, employeeBalances, pegawaiList]);

  // Automated Working Days calculation
  const handleDateChange = (start: string, end: string) => {
    setFormData((prev) => {
      const next = { ...prev, tanggal_mulai: start, tanggal_selesai: end };
      if (start && end) {
        const d1 = new Date(start);
        const d2 = new Date(end);
        if (d2 >= d1) {
          // Calculate calendar/working days
          let count = 0;
          const cur = new Date(d1);
          while (cur <= d2) {
            const dayOfWeek = cur.getDay();
            // Count working days (excluding Sunday: 0)
            if (dayOfWeek !== 0) {
              count++;
            }
            cur.setDate(cur.getDate() + 1);
          }
          next.jumlah_hari = Math.max(1, count);
        }
      }
      return next;
    });
  };

  // Inspecting balance for selected form employee
  const currentFormBalance = employeeBalances[formData.pegawai_id] || {
    totalQuota: 12,
    approvedDays: 0,
    pendingDays: 0,
    remainingBalance: 12,
    availableNetBalance: 12,
  };

  const isOverQuota =
    formData.jenis_cuti === 'Cuti Tahunan' &&
    formData.jumlah_hari > currentFormBalance.availableNetBalance;

  // Handle Submit New Cuti Request
  const handleSubmitCuti = (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.tanggal_mulai || !formData.tanggal_selesai) {
      showToast('Harap pilih rentang tanggal mulai dan tanggal selesai.', 'error');
      return;
    }

    if (!formData.alasan.trim()) {
      showToast('Alasan pengajuan cuti wajib diisi.', 'error');
      return;
    }

    if (isOverQuota) {
      showToast(
        `Permohonan ditolak sistem: Jumlah cuti diajukan (${formData.jumlah_hari} hari) melebihi sisa kuota yang tersedia (${currentFormBalance.availableNetBalance} hari).`,
        'error'
      );
      return;
    }

    const targetPegawai = pegawaiList.find((p) => p.id === Number(formData.pegawai_id))!;

    const newRecord: CutiRecord = {
      id: Date.now(),
      pegawai_id: targetPegawai.id,
      pegawai: {
        id: targetPegawai.id,
        nip: targetPegawai.nip,
        nama: targetPegawai.nama,
        jabatan: targetPegawai.jabatan,
        unit_kerja: targetPegawai.unit_kerja,
        sisa_cuti_tahunan: currentFormBalance.availableNetBalance - formData.jumlah_hari,
      },
      jenis_cuti: formData.jenis_cuti,
      tanggal_mulai: formData.tanggal_mulai,
      tanggal_selesai: formData.tanggal_selesai,
      jumlah_hari: formData.jumlah_hari,
      alasan: formData.alasan,
      alamat_selama_cuti: formData.alamat_selama_cuti,
      no_telp_cuti: formData.no_telp_cuti,
      status: 'Pending',
      tanggal_pengajuan: new Date().toISOString().slice(0, 10),
      approvals: [
        {
          level: 1,
          jabatan_penilai: `Kepala Ruangan (${targetPegawai.unit_kerja})`,
          status: 'Pending',
        },
        {
          level: 2,
          jabatan_penilai: 'Subbag Kepegawaian & Direksi RS',
          status: 'Pending',
        },
      ],
    };

    setCutiList((prev) => [newRecord, ...prev]);
    setIsSubmitModalOpen(false);
    showToast(
      `Permohonan cuti (${formData.jumlah_hari} hari) untuk ${targetPegawai.nama} berhasil diajukan dan masuk antrean persetujuan.`,
      'success'
    );
  };

  // Handle Approve Action
  const handleApprove = (cuti: CutiRecord) => {
    setCutiList((prev) =>
      prev.map((item) => {
        if (item.id === cuti.id) {
          // If level 1 is pending, approve level 1
          const level1 = item.approvals.find((a) => a.level === 1);
          const level2 = item.approvals.find((a) => a.level === 2);

          if (level1 && level1.status === 'Pending') {
            return {
              ...item,
              approvals: item.approvals.map((a) =>
                a.level === 1
                  ? {
                      ...a,
                      status: 'Disetujui',
                      approver_nama: 'Ns. Ratna Dewi, S.Kep (Kepala Ruangan)',
                      tanggal_aksi: new Date().toLocaleTimeString('id-ID') + ' WIB',
                      catatan: approvalNote || 'Shift nakes telah dikoordinasikan.',
                    }
                  : a
              ),
            };
          } else {
            // Level 2 approves -> Final Approval
            return {
              ...item,
              status: 'Disetujui',
              tanggal_disetujui: new Date().toISOString().slice(0, 10),
              disetujui_oleh: 'Dr. dr. H. Lukman Pura, Sp.PD-KGEH',
              catatan: approvalNote || 'Disetujui Direktur Utama RSUDAM.',
              approvals: item.approvals.map((a) =>
                a.level === 2
                  ? {
                      ...a,
                      status: 'Disetujui',
                      approver_nama: 'Dr. dr. H. Lukman Pura, Sp.PD-KGEH',
                      tanggal_aksi: new Date().toLocaleTimeString('id-ID') + ' WIB',
                      catatan: approvalNote || 'Disetujui penuh.',
                    }
                  : a
              ),
            };
          }
        }
        return item;
      })
    );

    setSelectedCutiForReview(null);
    setApprovalNote('');
    showToast(`Pengajuan cuti atas nama ${cuti.pegawai.nama} berhasil disetujui.`);
  };

  // Handle Reject Action
  const handleReject = (cuti: CutiRecord) => {
    if (!rejectionReason.trim()) {
      showToast('Wajib menyertakan alasan penolakan permohonan cuti.', 'error');
      return;
    }

    setCutiList((prev) =>
      prev.map((item) => {
        if (item.id === cuti.id) {
          return {
            ...item,
            status: 'Ditolak',
            catatan: rejectionReason,
            approvals: item.approvals.map((a) =>
              a.status === 'Pending'
                ? {
                    ...a,
                    status: 'Ditolak',
                    approver_nama: 'Subbag Kepegawaian RSUDAM',
                    tanggal_aksi: new Date().toLocaleTimeString('id-ID') + ' WIB',
                    catatan: rejectionReason,
                  }
                : a
            ),
          };
        }
        return item;
      })
    );

    setSelectedCutiForReview(null);
    setRejectionReason('');
    showToast(
      `Permohonan cuti telah ditolak. Kuota ${cuti.jumlah_hari} hari otomatis dikembalikan ke saldo pegawai.`,
      'warning'
    );
  };

  // Filtered Cuti List
  const filteredCuti = useMemo(() => {
    let result = cutiList;

    if (statusFilter !== 'Semua') {
      result = result.filter((c) => c.status === statusFilter);
    }

    if (jenisFilter !== 'Semua Jenis') {
      result = result.filter((c) => c.jenis_cuti === jenisFilter);
    }

    if (searchQuery.trim()) {
      result = filterRecords(result, searchQuery, [
        'pegawai.nama',
        'pegawai.nip',
        'pegawai.unit_kerja',
        'alasan',
        'jenis_cuti',
      ]);
    }

    return result;
  }, [cutiList, statusFilter, jenisFilter, searchQuery]);

  // Chart Data: Monthly Pending vs Approved
  const chartData = [
    { bulan: 'Mei', disetujui: 18, pending: 2 },
    { bulan: 'Jun', disetujui: 24, pending: 4 },
    { bulan: 'Jul', disetujui: 20, pending: 3 },
    { bulan: 'Agt', disetujui: 28, pending: 5 },
    { bulan: 'Sep', disetujui: systemMetrics.totalApprovedDays, pending: systemMetrics.totalPendingDays },
    { bulan: 'Okt (Est)', disetujui: 15, pending: 8 },
  ];

  // Pie chart by leave type
  const pieLeaveType = useMemo(() => {
    const counts: Record<string, number> = {};
    cutiList.forEach((c) => {
      counts[c.jenis_cuti] = (counts[c.jenis_cuti] || 0) + c.jumlah_hari;
    });

    const colors: Record<string, string> = {
      'Cuti Tahunan': '#013E37',
      'Cuti Sakit': '#0D9488',
      'Cuti Alasan Penting': '#F59E0B',
      'Cuti Melahirkan': '#8B5CF6',
      'Cuti Besar': '#3B82F6',
    };

    return Object.keys(counts).map((key) => ({
      name: key,
      value: counts[key],
      color: colors[key] || '#64748B',
    }));
  }, [cutiList]);

  // Export to PDF
  const handleExportPdf = () => {
    const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' });
    const printDate = new Date().toLocaleDateString('id-ID', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });

    doc.setFillColor(1, 62, 55);
    doc.rect(14, 10, 269, 3, 'F');

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(13);
    doc.setTextColor(1, 62, 55);
    doc.text('RSUD Dr. H. ABDUL MOELOEK PROVINSI LAMPUNG', 14, 20);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    doc.setTextColor(100, 116, 139);
    doc.text('Rekapitulasi Saldo & Permohonan Cuti Pegawai (Berdasarkan PP No. 11/2017)', 14, 25);
    doc.text(`Waktu Cetak: ${printDate} | Total Permohonan: ${filteredCuti.length}`, 14, 30);

    const rows = filteredCuti.map((c, i) => [
      (i + 1).toString(),
      c.pegawai.nip,
      c.pegawai.nama,
      c.pegawai.unit_kerja,
      c.jenis_cuti,
      `${c.tanggal_mulai} s/d ${c.tanggal_selesai}`,
      `${c.jumlah_hari} Hari`,
      c.status,
      c.alasan,
    ]);

    autoTable(doc, {
      startY: 35,
      head: [['No', 'NIP', 'Nama Pegawai', 'Unit Kerja', 'Jenis Cuti', 'Periode Tanggal', 'Durasi', 'Status', 'Alasan']],
      body: rows,
      theme: 'grid',
      headStyles: { fillColor: [1, 62, 55], textColor: [255, 255, 255], fontSize: 8 },
      bodyStyles: { fontSize: 7.5, cellPadding: 2 },
    });

    doc.save(`Laporan_Cuti_Pegawai_RSUDAM_${new Date().toISOString().slice(0, 10)}.pdf`);
    showToast('Laporan cuti format PDF berhasil diunduh.');
  };

  // Inspected employee object
  const inspectedEmp = pegawaiList.find((p) => p.id === inspectedEmployeeId) || pegawaiList[0];
  const inspectedBal = employeeBalances[inspectedEmp.id] || {
    totalQuota: 12,
    approvedDays: 0,
    pendingDays: 0,
    remainingBalance: 12,
    availableNetBalance: 12,
  };

  return (
    <Layout>
      <Head title="Manajemen Cuti & Saldo Kuota Pegawai - HCMS RSUDAM" />

      <div className="space-y-6">
        {/* Toast Feedback */}
        {toastMessage && (
          <div
            className={`fixed bottom-6 right-6 z-50 flex items-center gap-3 px-4 py-3 rounded-2xl shadow-xl border text-xs font-semibold animate-in fade-in slide-in-from-bottom-2 ${
              toastMessage.type === 'success'
                ? 'bg-emerald-900 text-white border-emerald-700'
                : toastMessage.type === 'warning'
                ? 'bg-amber-900 text-white border-amber-700'
                : 'bg-red-900 text-white border-red-700'
            }`}
          >
            {toastMessage.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-300" />
            ) : (
              <AlertTriangle className="w-4 h-4 text-amber-300" />
            )}
            <span>{toastMessage.text}</span>
            <button onClick={() => setToastMessage(null)} className="ml-2 text-white/70 hover:text-white">
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        )}

        {/* Top Header Card */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
          <div>
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800 flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5" />
                <span>Regulasi PP No. 11/2017 & BKN</span>
              </span>
              <span className="text-xs text-gray-400">Tahun Kalender: 2026</span>
            </div>
            <h1 className="text-2xl font-bold text-gray-900 mt-1">
              Sistem Manajemen Cuti & Pelacakan Saldo Kuota
            </h1>
            <p className="text-sm text-gray-500">
              Pelacakan kuota cuti tahunan otomatis, kalkulasi komparatif hari disetujui vs menunggu persetujuan (pending), dan alur verifikasi bertingkat
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <button
              onClick={handleExportPdf}
              className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-red-700 bg-red-50 hover:bg-red-100 border border-red-200 rounded-xl transition shadow-2xs"
            >
              <FileText className="w-3.5 h-3.5" />
              <span>Ekspor PDF</span>
            </button>

            <button
              onClick={() => {
                setFormData({
                  pegawai_id: inspectedEmployeeId,
                  jenis_cuti: 'Cuti Tahunan',
                  tanggal_mulai: '',
                  tanggal_selesai: '',
                  jumlah_hari: 1,
                  alasan: '',
                  alamat_selama_cuti: '',
                  no_telp_cuti: '',
                  pegawai_pengganti: '',
                });
                setIsSubmitModalOpen(true);
              }}
              className="flex items-center gap-2 px-4 py-2 text-xs font-semibold text-white bg-[#013E37] hover:bg-[#025046] rounded-xl transition shadow-sm"
            >
              <Plus className="w-4 h-4" />
              <span>Ajukan Cuti Baru</span>
            </button>
          </div>
        </div>

        {/* 4 AUTOMATED METRICS STATS CARDS */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {/* 1. Approved Leave Days */}
          <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100 flex flex-col justify-between">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">Cuti Disetujui</span>
              <div className="p-2 rounded-xl bg-emerald-50 text-emerald-700">
                <CheckCircle2 className="w-4 h-4" />
              </div>
            </div>
            <div className="mt-3">
              <div className="text-3xl font-extrabold text-emerald-800">
                {systemMetrics.totalApprovedDays} <span className="text-sm font-medium text-gray-500">Hari</span>
              </div>
              <div className="text-xs text-gray-500 mt-1 flex items-center justify-between">
                <span>{systemMetrics.approvedCount} Berkas Disahkan</span>
                <span className="text-[10px] bg-emerald-50 text-emerald-700 font-semibold px-2 py-0.5 rounded-full">
                  Resmi Terpotong
                </span>
              </div>
            </div>
          </div>

          {/* 2. Pending Leave Days */}
          <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100 flex flex-col justify-between">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">Menunggu Approval (Pending)</span>
              <div className="p-2 rounded-xl bg-amber-50 text-amber-700">
                <Clock className="w-4 h-4" />
              </div>
            </div>
            <div className="mt-3">
              <div className="text-3xl font-extrabold text-amber-600">
                {systemMetrics.totalPendingDays} <span className="text-sm font-medium text-gray-500">Hari</span>
              </div>
              <div className="text-xs text-gray-500 mt-1 flex items-center justify-between">
                <span>{systemMetrics.pendingCount} Berkas Dalam Antrean</span>
                <span className="text-[10px] bg-amber-50 text-amber-700 font-semibold px-2 py-0.5 rounded-full">
                  Mengunci Saldo
                </span>
              </div>
            </div>
          </div>

          {/* 3. Average Remaining Balance */}
          <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100 flex flex-col justify-between">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">Rata-Rata Sisa Kuota</span>
              <div className="p-2 rounded-xl bg-blue-50 text-blue-700">
                <Shield className="w-4 h-4" />
              </div>
            </div>
            <div className="mt-3">
              <div className="text-3xl font-extrabold text-[#013E37]">
                {systemMetrics.avgRemainingQuota} <span className="text-sm font-medium text-gray-500">Hari</span>
              </div>
              <div className="text-xs text-gray-500 mt-1">
                Dari Kuota Standar 12 Hari / Pegawai
              </div>
            </div>
          </div>

          {/* 4. Total Requests This Year */}
          <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100 flex flex-col justify-between">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">Total Pengajuan</span>
              <div className="p-2 rounded-xl bg-purple-50 text-purple-700">
                <Users className="w-4 h-4" />
              </div>
            </div>
            <div className="mt-3">
              <div className="text-3xl font-extrabold text-purple-900">
                {systemMetrics.totalRequests} <span className="text-sm font-medium text-gray-500">Berkas</span>
              </div>
              <div className="text-xs text-gray-500 mt-1">
                {systemMetrics.rejectedCount} Permohonan Ditolak
              </div>
            </div>
          </div>
        </div>

        {/* DEDICATED INDIVIDUAL LEAVE BALANCE TRACKER & CALCULATOR WIDGET */}
        <div className="bg-gradient-to-br from-slate-900 via-slate-800 to-[#013E37] text-white p-6 rounded-2xl shadow-sm border border-slate-700">
          <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6">
            <div className="space-y-2 max-w-xl">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 text-emerald-300 text-xs font-semibold backdrop-blur-xs">
                <UserCheck className="w-3.5 h-3.5" />
                <span>Simulasi & Kalkulator Saldo Kuota Pegawai Real-Time</span>
              </div>
              <h2 className="text-xl font-bold text-white">
                Kalkulasi Kuota Cuti Tahunan: {inspectedEmp.nama}
              </h2>
              <p className="text-xs text-slate-300 leading-relaxed">
                Sistem secara otomatis menghitung sisa hari bersih dengan mengurangkan hari yang telah disetujui (Approved) serta mencadangkan hari yang sedang dalam tahap verifikasi (Pending).
              </p>

              {/* Employee Selector for live balance check */}
              <div className="pt-2 flex items-center gap-2 text-xs">
                <span className="text-slate-400">Pilih Pegawai:</span>
                <select
                  value={inspectedEmployeeId}
                  onChange={(e) => setInspectedEmployeeId(Number(e.target.value))}
                  className="bg-white/10 border border-white/20 rounded-xl px-3 py-1.5 text-xs text-white focus:outline-none focus:ring-2 focus:ring-emerald-400"
                >
                  {pegawaiList.map((p) => (
                    <option key={p.id} value={p.id} className="text-gray-900">
                      {p.nama} ({p.unit_kerja})
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Live Visual Calculation Breakdown */}
            <div className="w-full lg:w-auto bg-black/40 p-4 rounded-xl border border-white/10 space-y-3 shrink-0">
              <div className="text-xs font-bold text-emerald-400 uppercase tracking-wider flex items-center justify-between">
                <span>Rincian Saldo Kuota</span>
                <span>Tahun 2026</span>
              </div>

              <div className="grid grid-cols-4 gap-3 text-center text-xs">
                <div className="p-2.5 rounded-lg bg-white/5 border border-white/10">
                  <div className="text-[10px] text-slate-400">Hak Cuti Dasar</div>
                  <div className="text-lg font-bold text-white mt-1">{inspectedBal.totalQuota}</div>
                  <div className="text-[9px] text-slate-400">Hari / Tahun</div>
                </div>

                <div className="p-2.5 rounded-lg bg-emerald-950/60 border border-emerald-500/30">
                  <div className="text-[10px] text-emerald-300">Disetujui</div>
                  <div className="text-lg font-bold text-emerald-400 mt-1">-{inspectedBal.approvedDays}</div>
                  <div className="text-[9px] text-emerald-200">Hari Terpakai</div>
                </div>

                <div className="p-2.5 rounded-lg bg-amber-950/60 border border-amber-500/30">
                  <div className="text-[10px] text-amber-300">Pending</div>
                  <div className="text-lg font-bold text-amber-400 mt-1">-{inspectedBal.pendingDays}</div>
                  <div className="text-[9px] text-amber-200">Hari Terkunci</div>
                </div>

                <div className="p-2.5 rounded-lg bg-emerald-500/20 border border-emerald-400/40">
                  <div className="text-[10px] text-emerald-200 font-bold">Saldo Tersedia</div>
                  <div className="text-xl font-extrabold text-emerald-300 mt-1">
                    {inspectedBal.availableNetBalance}
                  </div>
                  <div className="text-[9px] text-emerald-100">Hari Bebas</div>
                </div>
              </div>

              {/* Progress bar visualizer */}
              <div className="space-y-1 pt-1">
                <div className="flex justify-between text-[10px] text-slate-300 font-mono">
                  <span>Terpakai ({inspectedBal.approvedDays}h)</span>
                  <span>Pending ({inspectedBal.pendingDays}h)</span>
                  <span className="font-bold text-emerald-400">Tersedia ({inspectedBal.availableNetBalance}h)</span>
                </div>
                <div className="w-full bg-white/20 rounded-full h-2 flex overflow-hidden">
                  <div
                    className="bg-emerald-500 h-full"
                    style={{ width: `${(inspectedBal.approvedDays / 12) * 100}%` }}
                    title={`Disetujui: ${inspectedBal.approvedDays} Hari`}
                  />
                  <div
                    className="bg-amber-400 h-full"
                    style={{ width: `${(inspectedBal.pendingDays / 12) * 100}%` }}
                    title={`Pending: ${inspectedBal.pendingDays} Hari`}
                  />
                  <div
                    className="bg-white/40 h-full"
                    style={{ width: `${(inspectedBal.availableNetBalance / 12) * 100}%` }}
                    title={`Sisa Bebas: ${inspectedBal.availableNetBalance} Hari`}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* VISUAL ANALYTICS: CHARTS ROW */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Chart 1: Monthly Comparison (Approved vs Pending) */}
          <div className="lg:col-span-2 bg-white p-5 rounded-2xl shadow-sm border border-gray-100 space-y-3">
            <div className="flex items-center justify-between border-b border-gray-100 pb-3">
              <div>
                <h3 className="font-bold text-gray-900 text-sm flex items-center gap-2">
                  <BarChart3 className="w-4 h-4 text-[#013E37]" />
                  <span>Tren Hari Cuti: Disetujui vs Menunggu Approval (Bulanan)</span>
                </h3>
                <p className="text-xs text-gray-500">
                  Perbandingan total hari cuti yang dieksekusi nakes rumah sakit
                </p>
              </div>
              <span className="text-xs font-semibold text-emerald-800 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200">
                Tahun 2026
              </span>
            </div>

            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData} margin={{ top: 10, right: 20, left: -10, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                  <XAxis dataKey="bulan" tick={{ fontSize: 11, fill: '#64748B' }} />
                  <YAxis tick={{ fontSize: 11, fill: '#64748B' }} />
                  <Tooltip
                    contentStyle={{ backgroundColor: '#1E293B', borderRadius: '12px', color: '#fff', fontSize: '11px', border: 'none' }}
                    formatter={(val: any, name: any) => [`${val} Hari`, name === 'disetujui' ? 'Disetujui' : 'Menunggu Approval']}
                  />
                  <Legend wrapperStyle={{ fontSize: '11px' }} />
                  <Bar dataKey="disetujui" name="Hari Disetujui (Approved)" fill="#013E37" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="pending" name="Hari Pending (In-Flight)" fill="#F59E0B" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Chart 2: Donut Breakdown by Leave Type */}
          <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100 space-y-3 flex flex-col justify-between">
            <div className="border-b border-gray-100 pb-3">
              <h3 className="font-bold text-gray-900 text-sm flex items-center gap-2">
                <PieChartIcon className="w-4 h-4 text-[#013E37]" />
                <span>Distribusi Jenis Cuti</span>
              </h3>
              <p className="text-xs text-gray-500">Berdasarkan akumulasi hari terambil</p>
            </div>

            <div className="h-44 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={pieLeaveType} innerRadius={42} outerRadius={65} paddingAngle={4} dataKey="value">
                    {pieLeaveType.map((entry, idx) => (
                      <Cell key={`cell-${idx}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(val: any) => [`${val} Hari`, 'Durasi']} />
                </PieChart>
              </ResponsiveContainer>
            </div>

            <div className="space-y-1.5 text-xs pt-1 border-t border-gray-100">
              {pieLeaveType.map((item, idx) => (
                <div key={idx} className="flex items-center justify-between text-[11px]">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-sm" style={{ backgroundColor: item.color }} />
                    <span className="text-gray-700">{item.name}</span>
                  </div>
                  <strong className="text-gray-900">{item.value} Hari</strong>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* LEAVE REQUESTS TABLE SECTION WITH FILTERS */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 space-y-4">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
            <div>
              <h3 className="font-bold text-gray-900 text-sm flex items-center gap-2">
                <Calendar className="w-4 h-4 text-[#013E37]" />
                <span>Daftar Permohonan Cuti Pegawai & Status Persetujuan</span>
              </h3>
              <p className="text-xs text-gray-500">
                Pilih pengajuan untuk meninjau jalur verifikasi kepala ruangan dan direksi
              </p>
            </div>
            <span className="text-xs font-semibold px-2.5 py-1 bg-gray-100 text-gray-700 rounded-full">
              Menampilkan {filteredCuti.length} dari {cutiList.length} Permohonan
            </span>
          </div>

          {/* SearchBar and Filter Controls */}
          <div className="flex flex-col md:flex-row gap-3 items-center justify-between">
            <div className="w-full md:max-w-md">
              <SearchBar
                value={searchQuery}
                onChange={setSearchQuery}
                placeholder="Cari nama pemohon, NIP, unit kerja, atau alasan..."
                resultsCount={filteredCuti.length}
                totalCount={cutiList.length}
              />
            </div>

            <div className="flex flex-wrap items-center gap-2 w-full md:w-auto text-xs">
              {/* Status Filter */}
              <div className="flex items-center bg-gray-100 p-1 rounded-xl font-semibold">
                {['Semua', 'Pending', 'Disetujui', 'Ditolak'].map((st) => (
                  <button
                    key={st}
                    onClick={() => setStatusFilter(st)}
                    className={`px-3 py-1.5 rounded-lg transition ${
                      statusFilter === st
                        ? 'bg-white text-[#013E37] shadow-xs'
                        : 'text-gray-500 hover:text-gray-900'
                    }`}
                  >
                    {st}
                  </button>
                ))}
              </div>

              {/* Jenis Cuti Filter */}
              <select
                value={jenisFilter}
                onChange={(e) => setJenisFilter(e.target.value)}
                className="bg-white border border-gray-200 rounded-xl px-3 py-2 font-semibold text-gray-700 focus:outline-none focus:ring-2 focus:ring-[#013E37]/20"
              >
                <option value="Semua Jenis">Semua Jenis Cuti</option>
                {JENIS_CUTI_OPTIONS.map((j) => (
                  <option key={j} value={j}>
                    {j}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Table */}
          <div className="overflow-x-auto rounded-xl border border-gray-100">
            <table className="w-full text-left text-xs">
              <thead className="bg-gray-50 text-gray-600 font-semibold border-b border-gray-100 text-[11px] uppercase tracking-wider">
                <tr>
                  <th className="p-3.5">Pegawai Pemohon</th>
                  <th className="p-3.5">Jenis Cuti</th>
                  <th className="p-3.5">Tanggal Pelaksanaan</th>
                  <th className="p-3.5 text-center">Durasi</th>
                  <th className="p-3.5">Alasan Pengajuan</th>
                  <th className="p-3.5 text-center">Jalur Approval</th>
                  <th className="p-3.5 text-center">Status</th>
                  <th className="p-3.5 text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filteredCuti.length > 0 ? (
                  filteredCuti.map((cuti) => {
                    const isPending = cuti.status === 'Pending';
                    const isDisetujui = cuti.status === 'Disetujui';

                    return (
                      <tr key={cuti.id} className="hover:bg-gray-50/80 transition">
                        {/* Pegawai */}
                        <td className="p-3.5">
                          <div className="font-bold text-gray-900">{cuti.pegawai.nama}</div>
                          <div className="text-[11px] text-gray-400 font-mono">NIP. {cuti.pegawai.nip}</div>
                          <div className="text-[10px] text-[#013E37] font-semibold mt-0.5">
                            {cuti.pegawai.unit_kerja}
                          </div>
                        </td>

                        {/* Jenis Cuti */}
                        <td className="p-3.5">
                          <span className="font-semibold text-gray-800">{cuti.jenis_cuti}</span>
                          <div className="text-[10px] text-gray-400 mt-0.5">
                            Sisa Saldo: {employeeBalances[cuti.pegawai_id]?.availableNetBalance ?? 8} Hari
                          </div>
                        </td>

                        {/* Tanggal */}
                        <td className="p-3.5 whitespace-nowrap text-gray-700">
                          <div>
                            {new Date(cuti.tanggal_mulai).toLocaleDateString('id-ID', {
                              day: '2-digit',
                              month: 'short',
                              year: 'numeric',
                            })}
                          </div>
                          <div className="text-[10px] text-gray-400">
                            s/d{' '}
                            {new Date(cuti.tanggal_selesai).toLocaleDateString('id-ID', {
                              day: '2-digit',
                              month: 'short',
                              year: 'numeric',
                            })}
                          </div>
                        </td>

                        {/* Durasi */}
                        <td className="p-3.5 text-center">
                          <span className="px-2 py-0.5 rounded-full font-bold text-xs bg-gray-100 text-gray-900">
                            {cuti.jumlah_hari} Hari
                          </span>
                        </td>

                        {/* Alasan */}
                        <td className="p-3.5 max-w-xs text-gray-600 truncate" title={cuti.alasan}>
                          {cuti.alasan}
                        </td>

                        {/* Jalur Approval Stepper Indicator */}
                        <td className="p-3.5 text-center">
                          <div className="inline-flex items-center gap-1.5">
                            {cuti.approvals.map((app, idx) => (
                              <React.Fragment key={idx}>
                                <div
                                  className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold ${
                                    app.status === 'Disetujui'
                                      ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                                      : app.status === 'Ditolak'
                                      ? 'bg-red-100 text-red-800 border border-red-300'
                                      : 'bg-amber-100 text-amber-800 border border-amber-300'
                                  }`}
                                  title={`Tingkat ${app.level}: ${app.jabatan_penilai} (${app.status})`}
                                >
                                  {app.status === 'Disetujui' ? '✓' : app.level}
                                </div>
                                {idx < cuti.approvals.length - 1 && (
                                  <ChevronRight className="w-3 h-3 text-gray-300" />
                                )}
                              </React.Fragment>
                            ))}
                          </div>
                        </td>

                        {/* Status */}
                        <td className="p-3.5 text-center">
                          <span
                            className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                              isDisetujui
                                ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                                : isPending
                                ? 'bg-amber-100 text-amber-800 border border-amber-200'
                                : 'bg-red-100 text-red-800 border border-red-200'
                            }`}
                          >
                            {cuti.status}
                          </span>
                        </td>

                        {/* Actions */}
                        <td className="p-3.5 text-right whitespace-nowrap">
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              onClick={() => setSelectedCutiForReview(cuti)}
                              className="px-2.5 py-1.5 bg-[#013E37] text-white hover:bg-[#025046] font-semibold text-[11px] rounded-lg transition flex items-center gap-1 shadow-2xs"
                              title="Tinjau Detail Permohonan & Jalur Approval"
                            >
                              <Eye className="w-3 h-3" />
                              <span>{isPending ? 'Tinjau / Proses' : 'Detail'}</span>
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td colSpan={8} className="p-10 text-center text-gray-400">
                      Tidak ditemukan permohonan cuti sesuai filter.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* MODAL 1: AJUKAN CUTI BARU (SUBMIT REQUEST) */}
      {isSubmitModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto animate-in fade-in duration-150">
          <div className="bg-white rounded-2xl shadow-2xl max-w-xl w-full max-h-[90vh] overflow-y-auto border border-gray-100">
            {/* Header */}
            <div className="p-5 border-b border-gray-100 flex items-center justify-between bg-gradient-to-r from-gray-50 to-white">
              <div>
                <span className="text-[10px] uppercase font-bold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded-md">
                  Formulir Cuti Elektronik
                </span>
                <h3 className="font-bold text-base text-gray-900 mt-1">
                  Permohonan Cuti Pegawai RSUDAM
                </h3>
              </div>
              <button
                onClick={() => setIsSubmitModalOpen(false)}
                className="p-1.5 text-gray-400 hover:text-gray-600 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmitCuti} className="p-6 space-y-4 text-xs">
              {/* Pegawai Selector */}
              <div className="space-y-1">
                <label className="font-semibold text-gray-700">Pilih Pegawai Pemohon</label>
                <select
                  value={formData.pegawai_id}
                  onChange={(e) => setFormData({ ...formData, pegawai_id: Number(e.target.value) })}
                  className="w-full p-2.5 rounded-xl border border-gray-200 font-medium text-gray-900 focus:ring-2 focus:ring-[#013E37]/20 focus:outline-none"
                >
                  {pegawaiList.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.nama} — {p.jabatan} ({p.unit_kerja})
                    </option>
                  ))}
                </select>
              </div>

              {/* Live Quota Indicator Box */}
              <div className="p-3 rounded-xl bg-gray-50 border border-gray-200 flex items-center justify-between text-xs">
                <div>
                  <div className="text-[11px] text-gray-500">Saldo Kuota Tahunan Bersih:</div>
                  <div className="font-extrabold text-sm text-[#013E37]">
                    {currentFormBalance.availableNetBalance} Hari Tersedia
                  </div>
                </div>
                <div className="text-right text-[10px] text-gray-400">
                  <div>Hak Dasar: {currentFormBalance.totalQuota} Hari</div>
                  <div>Disetujui: {currentFormBalance.approvedDays}h | Pending: {currentFormBalance.pendingDays}h</div>
                </div>
              </div>

              {/* Jenis Cuti */}
              <div className="space-y-1">
                <label className="font-semibold text-gray-700">Jenis Cuti</label>
                <select
                  value={formData.jenis_cuti}
                  onChange={(e) => setFormData({ ...formData, jenis_cuti: e.target.value as any })}
                  className="w-full p-2.5 rounded-xl border border-gray-200 font-medium text-gray-900 focus:ring-2 focus:ring-[#013E37]/20 focus:outline-none"
                >
                  {JENIS_CUTI_OPTIONS.map((j) => (
                    <option key={j} value={j}>
                      {j}
                    </option>
                  ))}
                </select>
              </div>

              {/* Date Pickers */}
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="font-semibold text-gray-700">Tanggal Mulai</label>
                  <input
                    type="date"
                    required
                    value={formData.tanggal_mulai}
                    onChange={(e) => handleDateChange(e.target.value, formData.tanggal_selesai)}
                    className="w-full p-2.5 rounded-xl border border-gray-200 text-xs focus:ring-2 focus:ring-[#013E37]/20 focus:outline-none"
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-semibold text-gray-700">Tanggal Selesai</label>
                  <input
                    type="date"
                    required
                    value={formData.tanggal_selesai}
                    onChange={(e) => handleDateChange(formData.tanggal_mulai, e.target.value)}
                    className="w-full p-2.5 rounded-xl border border-gray-200 text-xs focus:ring-2 focus:ring-[#013E37]/20 focus:outline-none"
                  />
                </div>
              </div>

              {/* Automated Day Calculation Badge */}
              <div className="flex items-center justify-between p-2.5 rounded-xl bg-emerald-50 border border-emerald-100 text-xs">
                <span className="text-emerald-800 font-medium">Durasi Hari Kerja Dihitung:</span>
                <span className="font-extrabold text-[#013E37] text-sm">
                  {formData.jumlah_hari} Hari Kerja
                </span>
              </div>

              {/* Quota Exceeded Warning Guard */}
              {isOverQuota && (
                <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-red-800 flex items-start gap-2 text-xs">
                  <AlertCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
                  <div>
                    <strong className="block font-bold">Peringatan Kuota Melampaui Batas!</strong>
                    <span>
                      Jumlah hari yang diajukan ({formData.jumlah_hari} hari) melebihi saldo kuota cuti tahunan bersih yang tersisa ({currentFormBalance.availableNetBalance} hari). Silakan sesuaikan tanggal pelaksanaan.
                    </span>
                  </div>
                </div>
              )}

              {/* Alasan */}
              <div className="space-y-1">
                <label className="font-semibold text-gray-700">Alasan Permohonan Cuti</label>
                <textarea
                  required
                  rows={2}
                  value={formData.alasan}
                  onChange={(e) => setFormData({ ...formData, alasan: e.target.value })}
                  placeholder="Jelaskan keperluan cuti..."
                  className="w-full p-2.5 rounded-xl border border-gray-200 text-xs focus:ring-2 focus:ring-[#013E37]/20 focus:outline-none"
                />
              </div>

              {/* Alamat & Telepon */}
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="font-semibold text-gray-700">Alamat Selama Cuti</label>
                  <input
                    type="text"
                    value={formData.alamat_selama_cuti}
                    onChange={(e) => setFormData({ ...formData, alamat_selama_cuti: e.target.value })}
                    placeholder="Kota / Alamat tinggal"
                    className="w-full p-2.5 rounded-xl border border-gray-200 text-xs focus:ring-2 focus:ring-[#013E37]/20 focus:outline-none"
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-semibold text-gray-700">No. Telp / HP Darurat</label>
                  <input
                    type="text"
                    value={formData.no_telp_cuti}
                    onChange={(e) => setFormData({ ...formData, no_telp_cuti: e.target.value })}
                    placeholder="0812xxxxxxxx"
                    className="w-full p-2.5 rounded-xl border border-gray-200 text-xs focus:ring-2 focus:ring-[#013E37]/20 focus:outline-none"
                  />
                </div>
              </div>

              {/* Actions */}
              <div className="pt-3 border-t border-gray-100 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsSubmitModalOpen(false)}
                  className="px-4 py-2 text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-xl font-semibold transition"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={isOverQuota}
                  className="px-5 py-2 text-white bg-[#013E37] hover:bg-[#025046] disabled:opacity-40 disabled:cursor-not-allowed rounded-xl font-bold transition flex items-center gap-1.5 shadow-sm"
                >
                  <Send className="w-4 h-4" />
                  <span>Kirim Permohonan Cuti</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: REVIEW & APPROVAL WORKFLOW MODAL */}
      {selectedCutiForReview && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto animate-in fade-in duration-150">
          <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto border border-gray-100">
            {/* Header */}
            <div className="p-5 border-b border-gray-100 flex items-center justify-between bg-gradient-to-r from-gray-50 to-white">
              <div>
                <span className="text-[10px] uppercase font-bold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded-md">
                  Review & Verifikasi Berjenjang
                </span>
                <h3 className="font-bold text-base text-gray-900 mt-1">
                  Detail Permohonan Cuti #{selectedCutiForReview.id}
                </h3>
              </div>
              <button
                onClick={() => setSelectedCutiForReview(null)}
                className="p-1.5 text-gray-400 hover:text-gray-600 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Content */}
            <div className="p-6 space-y-5 text-xs">
              {/* Pegawai Info Card */}
              <div className="p-4 rounded-xl bg-gray-50 border border-gray-100 flex items-center justify-between">
                <div>
                  <div className="font-bold text-gray-900 text-sm">{selectedCutiForReview.pegawai.nama}</div>
                  <div className="text-gray-400 font-mono mt-0.5">NIP. {selectedCutiForReview.pegawai.nip}</div>
                  <div className="text-[#013E37] font-semibold mt-1">
                    {selectedCutiForReview.pegawai.jabatan} — {selectedCutiForReview.pegawai.unit_kerja}
                  </div>
                </div>

                <div className="text-right">
                  <span
                    className={`inline-block px-3 py-1 rounded-full text-xs font-bold ${
                      selectedCutiForReview.status === 'Disetujui'
                        ? 'bg-emerald-100 text-emerald-800'
                        : selectedCutiForReview.status === 'Pending'
                        ? 'bg-amber-100 text-amber-800'
                        : 'bg-red-100 text-red-800'
                    }`}
                  >
                    {selectedCutiForReview.status}
                  </span>
                  <div className="text-[10px] text-gray-400 mt-1">
                    Diajukan: {selectedCutiForReview.tanggal_pengajuan}
                  </div>
                </div>
              </div>

              {/* Leave Details Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                <div className="p-3 rounded-xl bg-gray-50 border border-gray-100">
                  <div className="text-gray-400 text-[10px]">Jenis Cuti</div>
                  <div className="font-bold text-gray-900 mt-0.5">{selectedCutiForReview.jenis_cuti}</div>
                </div>

                <div className="p-3 rounded-xl bg-gray-50 border border-gray-100">
                  <div className="text-gray-400 text-[10px]">Durasi Cuti</div>
                  <div className="font-bold text-[#013E37] mt-0.5">{selectedCutiForReview.jumlah_hari} Hari Kerja</div>
                </div>

                <div className="p-3 rounded-xl bg-gray-50 border border-gray-100">
                  <div className="text-gray-400 text-[10px]">Periode Tanggal</div>
                  <div className="font-bold text-gray-900 mt-0.5">
                    {selectedCutiForReview.tanggal_mulai} s/d {selectedCutiForReview.tanggal_selesai}
                  </div>
                </div>
              </div>

              {/* Alasan */}
              <div className="p-3.5 rounded-xl bg-blue-50/60 border border-blue-100 space-y-1">
                <span className="font-bold text-blue-950">Alasan Permohonan:</span>
                <p className="text-blue-900 leading-relaxed">{selectedCutiForReview.alasan}</p>
                {selectedCutiForReview.alamat_selama_cuti && (
                  <div className="text-[11px] text-blue-700 mt-2">
                    <strong>Alamat / Kontak Selama Cuti:</strong> {selectedCutiForReview.alamat_selama_cuti} (
                    {selectedCutiForReview.no_telp_cuti || '-'})
                  </div>
                )}
              </div>

              {/* Multi-tier Approval Stepper Visualizer */}
              <div className="space-y-3">
                <span className="font-bold text-gray-900 text-xs block">
                  Jalur Persetujuan Berjenjang (Audit Trail)
                </span>

                <div className="space-y-2">
                  {selectedCutiForReview.approvals.map((app) => (
                    <div
                      key={app.level}
                      className="p-3 rounded-xl border border-gray-200 flex items-start justify-between"
                    >
                      <div className="flex items-start gap-2.5">
                        <div
                          className={`w-6 h-6 rounded-full flex items-center justify-center font-bold text-xs shrink-0 ${
                            app.status === 'Disetujui'
                              ? 'bg-emerald-100 text-emerald-800'
                              : app.status === 'Ditolak'
                              ? 'bg-red-100 text-red-800'
                              : 'bg-amber-100 text-amber-800'
                          }`}
                        >
                          {app.status === 'Disetujui' ? '✓' : app.level}
                        </div>
                        <div>
                          <div className="font-bold text-gray-900">{app.jabatan_penilai}</div>
                          {app.approver_nama && (
                            <div className="text-gray-600 text-[11px] mt-0.5">
                              Pejabat Penilai: <strong>{app.approver_nama}</strong>
                            </div>
                          )}
                          {app.catatan && (
                            <div className="text-gray-500 italic text-[11px] mt-1">
                              "{app.catatan}"
                            </div>
                          )}
                        </div>
                      </div>

                      <div className="text-right shrink-0">
                        <span
                          className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-bold ${
                            app.status === 'Disetujui'
                              ? 'bg-emerald-100 text-emerald-800'
                              : app.status === 'Ditolak'
                              ? 'bg-red-100 text-red-800'
                              : 'bg-amber-100 text-amber-800'
                          }`}
                        >
                          {app.status}
                        </span>
                        {app.tanggal_aksi && (
                          <div className="text-[10px] text-gray-400 mt-0.5">{app.tanggal_aksi}</div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Action Form if still pending */}
              {selectedCutiForReview.status === 'Pending' && (
                <div className="p-4 rounded-xl bg-gray-50 border border-gray-200 space-y-3">
                  <div className="font-bold text-gray-900 text-xs">
                    Tindakan Pejabat Penilai / Subbag Kepegawaian:
                  </div>

                  <div className="space-y-1">
                    <label className="text-[11px] font-semibold text-gray-700">
                      Catatan Persetujuan / Alasan Penolakan:
                    </label>
                    <input
                      type="text"
                      value={approvalNote || rejectionReason}
                      onChange={(e) => {
                        setApprovalNote(e.target.value);
                        setRejectionReason(e.target.value);
                      }}
                      placeholder="Masukkan catatan rekomendasi atau alasan jika menolak..."
                      className="w-full p-2.5 rounded-xl border border-gray-200 text-xs focus:ring-2 focus:ring-[#013E37]/20 focus:outline-none"
                    />
                  </div>

                  <div className="flex items-center justify-end gap-2 pt-1">
                    <button
                      type="button"
                      onClick={() => handleReject(selectedCutiForReview)}
                      className="px-4 py-2 bg-red-50 hover:bg-red-100 text-red-700 font-bold rounded-xl transition flex items-center gap-1.5"
                    >
                      <XCircle className="w-4 h-4" />
                      <span>Tolak Permohonan</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => handleApprove(selectedCutiForReview)}
                      className="px-5 py-2 bg-[#013E37] hover:bg-[#025046] text-white font-bold rounded-xl transition flex items-center gap-1.5 shadow-sm"
                    >
                      <CheckCircle2 className="w-4 h-4 text-emerald-300" />
                      <span>Setujui (Approve)</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </Layout>
  );
}
