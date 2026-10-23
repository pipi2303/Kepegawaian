<?php

namespace App\Listeners;

use App\Events\CutiDiajukan;
use App\Models\Pegawai;
use App\Services\WhatsAppService;

class SendWhatsAppOnCutiDiajukan
{
    public function handle(CutiDiajukan $event): void
    {
        $cuti    = $event->cuti;
        $pegawai = $cuti->pegawai;

        Pegawai::role(['admin', 'kepala_unit'])
            ->where('status_aktif', 'Aktif')
            ->whereNotNull('no_telp')
            ->each(function ($approver) use ($cuti, $pegawai) {
                WhatsAppService::send(
                    $approver->no_telp,
                    WhatsAppService::msgCutiDiajukan(
                        $pegawai->nama ?? '-',
                        $pegawai->unit_kerja ?? '-',
                        $cuti->jenis_cuti,
                        $cuti->tanggal_mulai ?? '-',
                        $cuti->tanggal_selesai ?? '-'
                    )
                );
            });
    }
}
