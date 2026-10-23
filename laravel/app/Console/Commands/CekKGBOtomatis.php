<?php

namespace App\Console\Commands;

use App\Models\ActivityLog;
use App\Models\Pegawai;
use App\Services\WhatsAppService;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Mail;

class CekKGBOtomatis extends Command
{
    protected $signature   = 'hcms:cek-kgb';
    protected $description = 'Notifikasi KGB yang jatuh tempo dalam 60 hari';

    public function handle(): int
    {
        $today   = now();
        $found   = 0;
        $notified = 0;

        // Auto-calculate kgb_berikutnya for pegawai that are missing it
        Pegawai::whereIn('status_pegawai', ['PNS', 'PPPK'])
            ->where('status_aktif', 'Aktif')
            ->whereNull('kgb_berikutnya')
            ->where(function ($q) {
                $q->whereNotNull('tmt_gaji_berkala')->orWhereNotNull('tmt_golongan');
            })
            ->each(function (Pegawai $p) {
                $base = $p->tmt_gaji_berkala ?? $p->tmt_golongan;
                $p->kgb_berikutnya = $base->addYears(2);
                $p->saveQuietly();
            });

        // Notify upcoming KGB within 60 days
        $upcoming = Pegawai::whereIn('status_pegawai', ['PNS', 'PPPK'])
            ->where('status_aktif', 'Aktif')
            ->whereNotNull('kgb_berikutnya')
            ->whereBetween('kgb_berikutnya', [$today->toDateString(), $today->copy()->addDays(60)->toDateString()])
            ->get();

        $found = $upcoming->count();

        foreach ($upcoming as $pegawai) {
            $cacheKey = "kgb_notif_{$pegawai->id}_" . $today->format('Y_m');

            if (Cache::has($cacheKey)) {
                continue;
            }

            $hariTersisa = (int) $today->diffInDays($pegawai->kgb_berikutnya);
            $tanggalKgb  = $pegawai->kgb_berikutnya->format('d/m/Y');
            $msg = "📋 *Kenaikan Gaji Berkala (KGB)*\n\nYth. {$pegawai->nama},\n\nKGB Anda jatuh tempo pada *{$tanggalKgb}* ({$hariTersisa} hari lagi).\n\nSegera koordinasi dengan Bagian SDM untuk proses administrasi.\n\n_HCMS RSUDAM_";

            if ($pegawai->no_telp) {
                WhatsAppService::send($pegawai->no_telp, $msg);
            }

            // Notify SDM admin — ponytail: reads from pengaturan; fallback to env
            $adminEmail = \Illuminate\Support\Facades\DB::table('t_pengaturan')
                ->where('key', 'email_admin_sdm')
                ->value('value') ?? config('mail.from.address');

            if ($adminEmail) {
                Mail::raw(
                    "KGB pegawai {$pegawai->nama} (NIP: {$pegawai->nip}) jatuh tempo {$tanggalKgb} ({$hariTersisa} hari lagi).",
                    fn($m) => $m->to($adminEmail)->subject("KGB: {$pegawai->nama} — {$tanggalKgb}")
                );
            }

            ActivityLog::record(
                action: 'EMAIL',
                targetType: 'KGB',
                targetLabel: "KGB {$pegawai->nama}",
                description: "Notifikasi KGB dikirim: jatuh tempo {$tanggalKgb} ({$hariTersisa} hari).",
                pegawaiId: $pegawai->id,
            );

            Cache::put($cacheKey, true, now()->endOfMonth());

            $notified++;
        }

        $this->info("KGB upcoming: {$found}, notified: {$notified}.");

        return self::SUCCESS;
    }
}
