import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { pegawaiApi, cutiApi, dashboardApi, payrollApi, credentialingApi, activityLogApi } from '../data/api';
import { toast } from 'sonner';

// ── PEGAWAI ──────────────────────────────────────────────────────────────────

export function usePegawai(params?: Record<string, any>) {
  return useQuery({ queryKey: ['pegawai', params], queryFn: () => pegawaiApi.getAll(params) });
}

export function useCreatePegawai() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: pegawaiApi.create,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['pegawai'] });
      toast.success('Pegawai berhasil ditambahkan');
    },
    onError: (e: any) => toast.error(e.response?.data?.message || 'Gagal menambahkan pegawai'),
  });
}

export function useUpdatePegawai() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: number | string; data: any }) => pegawaiApi.update(id, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['pegawai'] });
      toast.success('Data pegawai diperbarui');
    },
    onError: (e: any) => toast.error(e.response?.data?.message || 'Gagal memperbarui data'),
  });
}

export function useDeletePegawai() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: pegawaiApi.remove,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['pegawai'] });
      toast.success('Pegawai dinonaktifkan');
    },
    onError: (e: any) => toast.error(e.response?.data?.message || 'Gagal menghapus pegawai'),
  });
}

// ── CUTI ─────────────────────────────────────────────────────────────────────

export function useCuti(params?: Record<string, any>) {
  return useQuery({
    queryKey: ['cuti', params],
    queryFn: () => cutiApi.getAll(params),
    staleTime: 30_000,
  });
}

export function useSubmitCuti() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: cutiApi.create,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['cuti'] });
      toast.success('Cuti berhasil diajukan');
    },
    onError: (e: any) => toast.error(e.response?.data?.message || 'Gagal mengajukan cuti'),
  });
}

export function useApproveCuti() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, catatan }: { id: number | string; catatan?: string }) =>
      cutiApi.approve(id, catatan),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['cuti'] });
      toast.success('Cuti disetujui');
    },
  });
}

export function useRejectCuti() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, alasan }: { id: number | string; alasan: string }) =>
      cutiApi.reject(id, alasan),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['cuti'] });
      toast.warning('Cuti ditolak');
    },
  });
}

// ── DASHBOARD ─────────────────────────────────────────────────────────────────

export function useDashboardSummary() {
  return useQuery({
    queryKey: ['dashboard-summary'],
    queryFn: dashboardApi.summary,
    staleTime: 60_000,
  });
}

export function useNotifications() {
  return useQuery({
    queryKey: ['notifications'],
    queryFn: dashboardApi.notifications,
    refetchInterval: 30_000,
  });
}

// ── PAYROLL ───────────────────────────────────────────────────────────────────

export function usePayroll(params?: Record<string, any>) {
  return useQuery({
    queryKey: ['payroll', params],
    queryFn: () => payrollApi.getAll(params),
  });
}

export function useGeneratePayroll() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: payrollApi.generate,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['payroll'] });
      toast.success('Slip gaji berhasil digenerate');
    },
    onError: (e: any) => toast.error(e.response?.data?.message || 'Gagal generate payroll'),
  });
}

// ── CREDENTIALING ─────────────────────────────────────────────────────────────

export function useCredentialing(params?: Record<string, any>) {
  return useQuery({
    queryKey: ['credentialing', params],
    queryFn: () => credentialingApi.getAll(params),
  });
}

// ── ACTIVITY LOG ──────────────────────────────────────────────────────────────

export function useActivityLog(params?: Record<string, any>) {
  return useQuery({
    queryKey: ['activity-logs', params],
    queryFn: () => activityLogApi.getAll(params),
    staleTime: 10_000,
  });
}
