<?php

namespace App\Console\Commands;

use App\Models\{ActivityLog, KontrakPegawai};
use App\Services\WhatsAppService;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\Cache;

class CekKontrakExpiry extends Command
{
    protected $signature   = 'hcms:cek-kontrak';
    protected $description = 'Kirim notifikasi WA untuk kontrak yang akan berakhir (30/14/7 hari)';

    public function handle(): int
    {
        $milestones = [30, 14, 7];

        foreach ($milestones as $hari) {
            $kontrak = KontrakPegawai::willExpire($hari)
                ->with('pegawai')
                ->get()
                ->filter(fn($k) => $k->tanggal_selesai && $k->tanggal_selesai->diffInDays(now()) <= $hari);

            foreach ($kontrak as $k) {
                $cacheKey = "kontrak_notif_{$k->pegawai_id}_{$k->id}_{$hari}d";

                if (Cache::has($cacheKey)) continue;

                $tgl  = $k->tanggal_selesai->translatedFormat('d F Y');
                $sisa = (int) now()->diffInDays($k->tanggal_selesai);

                $msg = "⚠️ *Notifikasi Kontrak Kerja*\n\nYth. {$k->pegawai->nama},\n\nKontrak Kerja Anda berakhir pada *{$tgl}* ({$sisa} hari lagi).\n\nSegera hubungi Bagian SDM untuk proses perpanjangan.\n\n_HCMS {$k->pegawai->unit_kerja ?? ''}_";

                $phone = $k->pegawai->no_telp ?? null;
                if ($phone) WhatsAppService::send($phone, $msg);

                Cache::put($cacheKey, true, now()->addDays($hari));

                ActivityLog::record(
                    action: 'UPDATE',
                    severity: $hari <= 7 ? 'warning' : 'info',
                    targetType: 'Kontrak',
                    targetId: $k->id,
                    targetLabel: ($k->pegawai->nama ?? '-') . " — {$hari}d expiry",
                    description: "Notifikasi WA kontrak berakhir {$tgl} ({$hari} hari).",
                );
            }

            $this->line("Milestone {$hari}d: {$kontrak->count()} kontrak diproses.");
        }

        return self::SUCCESS;
    }
}
