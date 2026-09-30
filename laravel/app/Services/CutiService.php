<?php

namespace App\Services;

use App\Models\Pegawai;
use App\Models\Cuti;
use App\Models\CutiApproval;
use Illuminate\Validation\ValidationException;
use Illuminate\Support\Facades\DB;

class CutiService
{
    /**
     * Ajukan Cuti Pegawai dengan validasi kuota PP 11/2017 & inisiasi approval berjenjang
     */
    public function ajukanCuti(Pegawai $pegawai, array $data): Cuti
    {
        return DB::transaction(function () use ($pegawai, $data) {
            $jenisCuti = $data['jenis_cuti'];
            $jumlahHari = (int) $data['jumlah_hari'];

            // 1. Validasi Kuota Cuti Tahunan (Maksimal 12 Hari Kerja per tahun)
            if ($jenisCuti === 'Cuti Tahunan') {
                $sisaCuti = $pegawai->sisa_cuti_tahunan;
                if ($jumlahHari > $sisaCuti) {
                    throw ValidationException::withMessages([
                        'jumlah_hari' => "Jumlah cuti ({$jumlahHari} hari) melebihi sisa kuota cuti tahunan Anda ({$sisaCuti} hari).",
                    ]);
                }
            }

            // 2. Simpan Data Pengajuan Cuti
            $cuti = Cuti::create([
                'pegawai_id' => $pegawai->id,
                'jenis_cuti' => $jenisCuti,
                'tanggal_mulai' => $data['tanggal_mulai'],
                'tanggal_selesai' => $data['tanggal_selesai'],
                'jumlah_hari' => $jumlahHari,
                'alasan' => $data['alasan'],
                'alamat_selama_cuti' => $data['alamat_selama_cuti'] ?? null,
                'no_telp_cuti' => $data['no_telp_cuti'] ?? $pegawai->no_telp,
                'status' => 'Pending',
                'tanggal_pengajuan' => now()->toDateString(),
            ]);

            // 3. Bentuk Jalur Approval Berjenjang
            // Level 1: Kepala Ruangan / Kepala Unit Kerja
            CutiApproval::create([
                'cuti_id' => $cuti->id,
                'level' => 1,
                'jabatan_penilai' => 'Kepala Ruangan / Unit Kerja (' . $pegawai->unit_kerja . ')',
                'status' => 'Pending',
            ]);

            // Level 2: Subbag Kepegawaian & Direksi RS
            CutiApproval::create([
                'cuti_id' => $cuti->id,
                'level' => 2,
                'jabatan_penilai' => 'Kepala Subbag Kepegawaian / Wakil Direktur',
                'status' => 'Pending',
            ]);

            return $cuti->load('approvals');
        });
    }

    /**
     * Persetujuan Cuti oleh Pejabat Berwenang
     */
    public function approve(Cuti $cuti, Pegawai $approver, ?string $catatan = null): Cuti
    {
        return DB::transaction(function () use ($cuti, $approver, $catatan) {
            // Cari step approval yang masih pending
            $currentApproval = $cuti->approvals()
                ->where('status', 'Pending')
                ->orderBy('level', 'asc')
                ->first();

            if (!$currentApproval) {
                throw new \Exception('Semua jenjang persetujuan untuk pengajuan cuti ini telah selesai.');
            }

            $currentApproval->update([
                'approver_pegawai_id' => $approver->id,
                'approver_nama' => $approver->nama_lengkap,
                'status' => 'Disetujui',
                'tanggal_aksi' => now(),
                'catatan' => $catatan,
            ]);

            // Cek apakah masih ada level approval berikutnya
            $remaining = $cuti->approvals()->where('status', 'Pending')->count();
            if ($remaining === 0) {
                // Semua level menyetujui -> Status Final Disetujui
                $cuti->update([
                    'status' => 'Disetujui',
                    'disetujui_oleh' => $approver->nama_lengkap ?? $approver->nama,
                    'tanggal_disetujui' => now()->toDateString(),
                ]);

                // Otomatis kurangi sisa cuti tahunan jika jenisnya Cuti Tahunan
                if ($cuti->jenis_cuti === 'Cuti Tahunan') {
                    $pegawaiTarget = $cuti->pegawai;
                    if ($pegawaiTarget) {
                        $currentBalance = $pegawaiTarget->sisa_cuti_tahunan ?? 12;
                        $newBalance = max(0, $currentBalance - (int)$cuti->jumlah_hari);
                        $pegawaiTarget->update(['sisa_cuti_tahunan' => $newBalance]);
                    }
                }
            }

            return $cuti->fresh(['approvals', 'pegawai']);
        });
    }

    /**
     * Penolakan Cuti
     */
    public function reject(Cuti $cuti, Pegawai $approver, string $alasan): Cuti
    {
        return DB::transaction(function () use ($cuti, $approver, $alasan) {
            $currentApproval = $cuti->approvals()
                ->where('status', 'Pending')
                ->orderBy('level', 'asc')
                ->first();

            if ($currentApproval) {
                $currentApproval->update([
                    'approver_pegawai_id' => $approver->id,
                    'approver_nama' => $approver->nama_lengkap,
                    'status' => 'Ditolak',
                    'tanggal_aksi' => now(),
                    'catatan' => $alasan,
                ]);
            }

            $cuti->update([
                'status' => 'Ditolak',
                'catatan' => $alasan,
            ]);

            return $cuti->fresh(['approvals', 'pegawai']);
        });
    }
}
