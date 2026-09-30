<?php

namespace App\Services;

use App\Models\StrRecord;
use App\Models\SipRecord;
use Illuminate\Support\Collection;

class LisensiMonitoringService
{
    /**
     * Dapatkan daftar STR yang akan kedaluwarsa dalam $days hari
     */
    public function getExpiringStr(int $days = 90): Collection
    {
        return StrRecord::with('pegawai:id,nip,nama,jabatan,unit_kerja,no_telp,email')
            ->expiringWithin($days)
            ->orderBy('tanggal_expired', 'asc')
            ->get();
    }

    /**
     * Dapatkan daftar SIP yang akan kedaluwarsa dalam $days hari
     */
    public function getExpiringSip(int $days = 90): Collection
    {
        return SipRecord::with('pegawai:id,nip,nama,jabatan,unit_kerja,no_telp,email')
            ->expiringWithin($days)
            ->orderBy('tanggal_expired', 'asc')
            ->get();
    }

    /**
     * Rekapitulasi Status Kepatuhan Lisensi Rumah Sakit
     */
    public function getRingkasanKepatuhan(): array
    {
        $totalStr = StrRecord::count();
        $strAktif = StrRecord::where('status', 'Aktif')->where('tanggal_expired', '>', now())->count();
        $strWarning = StrRecord::expiringWithin(90)->count();
        $strExpired = StrRecord::where('tanggal_expired', '<=', now())->count();

        $totalSip = SipRecord::count();
        $sipAktif = SipRecord::where('status', 'Aktif')->where('tanggal_expired', '>', now())->count();
        $sipWarning = SipRecord::expiringWithin(90)->count();
        $sipExpired = SipRecord::where('tanggal_expired', '<=', now())->count();

        return [
            'str' => [
                'total' => $totalStr,
                'aktif' => $strAktif,
                'akan_expired' => $strWarning,
                'expired' => $strExpired,
                'compliance_rate' => $totalStr > 0 ? round(($strAktif / $totalStr) * 100, 1) : 100,
            ],
            'sip' => [
                'total' => $totalSip,
                'aktif' => $sipAktif,
                'akan_expired' => $sipWarning,
                'expired' => $sipExpired,
                'compliance_rate' => $totalSip > 0 ? round(($sipAktif / $totalSip) * 100, 1) : 100,
            ],
        ];
    }
}
