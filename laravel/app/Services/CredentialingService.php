<?php

namespace App\Services;

use App\Models\Pegawai;
use App\Models\Credentialing;
use App\Models\StrRecord;
use App\Models\SipRecord;
use Illuminate\Validation\ValidationException;
use Illuminate\Support\Facades\DB;

class CredentialingService
{
    /**
     * Pengajuan Permohonan Kredensial / Re-Kredensial oleh Nakes
     */
    public function ajukanKredensial(Pegawai $pegawai, array $data): Credentialing
    {
        // 1. Validasi Keaktifan STR & SIP Nakes
        $strAktif = StrRecord::where('pegawai_id', $pegawai->id)
            ->where('status', 'Aktif')
            ->where('tanggal_expired', '>', now())
            ->first();

        if (!$strAktif) {
            throw ValidationException::withMessages([
                'str' => 'Tenaga medis wajib memiliki Surat Tanda Registrasi (STR) aktif untuk mengajukan kewenangan klinis.',
            ]);
        }

        $sipAktif = SipRecord::where('pegawai_id', $pegawai->id)
            ->where('status', 'Aktif')
            ->where('tanggal_expired', '>', now())
            ->first();

        if (!$sipAktif) {
            throw ValidationException::withMessages([
                'sip' => 'Tenaga medis wajib memiliki Surat Izin Praktik (SIP) aktif di RSUDAM.',
            ]);
        }

        return Credentialing::create([
            'pegawai_id' => $pegawai->id,
            'komite_terkait' => $data['komite_terkait'], // Komite Medik / Keperawatan
            'jenis_kredensial' => $data['jenis_kredensial'], // Kredensial Awal / Re-Kredensial
            'status' => 'Diajukan',
            'rincian_kewenangan_klinis' => $data['rincian_kewenangan_klinis'] ?? [],
        ]);
    }

    /**
     * Asesmen oleh Mitra Bestari / Subkomite Kredensial
     */
    public function submitRekomendasiMitraBestari(Credentialing $cred, array $rkkDisetujui, string $catatan): Credentialing
    {
        $cred->update([
            'status' => 'Rekomendasi Terbit',
            'rincian_kewenangan_klinis' => $rkkDisetujui,
            'catatan_mitra_bestari' => $catatan,
        ]);

        return $cred;
    }

    /**
     * Penerbitan Surat Penugasan Klinis (SPK) oleh Direktur Utama
     */
    public function terbitkanSpk(Credentialing $cred, string $nomorSpk, ?string $fileDokumen = null): Credentialing
    {
        $cred->update([
            'nomor_spk' => $nomorSpk,
            'tanggal_spk' => now()->toDateString(),
            'tanggal_berlaku_sampai' => now()->addYears(3)->toDateString(), // SPK berlaku 3 tahun
            'status' => 'SPK Diterbitkan',
            'file_dokumen_spk' => $fileDokumen,
        ]);

        return $cred;
    }
}
