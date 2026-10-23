<?php

namespace App\Listeners;

use App\Events\CutiStatusChanged;
use App\Services\WhatsAppService;

class SendWhatsAppOnCutiStatusChanged
{
    public function handle(CutiStatusChanged $event): void
    {
        $cuti    = $event->cuti;
        $pegawai = $cuti->pegawai;
        if (!$pegawai?->no_telp) return;

        if ($event->newStatus === 'Disetujui') {
            WhatsAppService::send($pegawai->no_telp,
                WhatsAppService::msgCutiDisetujui(
                    $pegawai->nama, $cuti->jenis_cuti,
                    $cuti->tanggal_mulai, $cuti->tanggal_selesai,
                    $pegawai->sisa_cuti_tahunan
                )
            );
        } elseif ($event->newStatus === 'Ditolak') {
            WhatsAppService::send($pegawai->no_telp,
                WhatsAppService::msgCutiDitolak($pegawai->nama, $cuti->jenis_cuti, $event->catatan)
            );
        }
    }
}
