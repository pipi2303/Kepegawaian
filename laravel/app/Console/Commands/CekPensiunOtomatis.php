<?php

namespace App\Console\Commands;

use App\Models\ActivityLog;
use App\Services\WhatsAppService;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\DB;

class CekPensiunOtomatis extends Command
{
    protected $signature   = 'hcms:cek-pensiun';
    protected $description = 'Kirim notifikasi WhatsApp untuk pegawai yang mendekati masa pensiun';

    public function handle(): int
    {
        $milestones = [180, 90, 30];
        $notified   = 0;
        $total      = 0;

        foreach ($milestones as $m) {
            $from = now()->addDays($m - 3)->toDateString();
            $to   = now()->addDays($m + 3)->toDateString();

            $pegawais = DB::table('m_pegawai')
                ->whereNull('deleted_at')
                ->where('status_aktif', 'Aktif')
                ->whereNotNull('batas_pensiun')
                ->whereBetween('batas_pensiun', [$from, $to])
                ->select('id', 'nama', 'unit_kerja', 'batas_pensiun', 'no_telp')
                ->get();

            $total += $pegawais->count();

            foreach ($pegawais as $pegawai) {
                $cacheKey = "pensiun_notif_{$pegawai->id}_{$m}";
                if (Cache::has($cacheKey)) {
                    continue;
                }

                $tgl = \Carbon\Carbon::parse($pegawai->batas_pensiun)->format('d/m/Y');
                $msg = "⚠️ PENSIUN H-{$m}: {$pegawai->nama} ({$pegawai->unit_kerja}) pensiun {$tgl}. Siapkan dokumen segera.";

                if ($pegawai->no_telp) {
                    WhatsAppService::send($pegawai->no_telp, $msg);
                }

                // Notify SDM admin
                $adminPhone = DB::table('pengaturan')->where('key', 'wa_admin_sdm')->value('value');
                if ($adminPhone) {
                    WhatsAppService::send($adminPhone, $msg);
                }

                ActivityLog::record(
                    action: 'EMAIL',
                    targetType: 'Pensiun',
                    targetId: $pegawai->id,
                    targetLabel: "Notif Pensiun H-{$m}: {$pegawai->nama}",
                    description: "Notifikasi pensiun H-{$m} dikirim untuk {$pegawai->nama}, pensiun {$tgl}.",
                    pegawaiId: $pegawai->id,
                );

                Cache::put($cacheKey, true, now()->addDays(25));
                $notified++;
            }
        }

        $this->info("Pensiun check selesai. Ditemukan: {$total}, notifikasi terkirim: {$notified}.");
        return self::SUCCESS;
    }
}
