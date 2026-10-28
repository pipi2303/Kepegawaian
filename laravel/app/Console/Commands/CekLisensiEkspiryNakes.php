<?php

namespace App\Console\Commands;

use App\Mail\LisensiKadaluarsaSoon;
use App\Models\ActivityLog;
use App\Models\SipRecord;
use App\Models\StrRecord;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Mail;

class CekLisensiEkspiryNakes extends Command
{
    protected $signature   = 'hcms:cek-lisensi-nakes';
    protected $description = 'Kirim notifikasi email pegawai yang STR/SIP akan kadaluarsa';

    // Notify once per milestone, not once per day.
    private const MILESTONES = [90, 60, 30, 14, 7];

    public function handle(): int
    {
        $sent = 0;

        foreach ([StrRecord::class => 'STR', SipRecord::class => 'SIP'] as $model => $type) {
            $records = $model::expiringWithin(90)->with('pegawai')->get();

            foreach ($records as $record) {
                $pegawai      = $record->pegawai;
                $hariTersisa  = (int) now()->diffInDays($record->tanggal_expired);
                $milestone    = collect(self::MILESTONES)->first(fn ($m) => $hariTersisa <= $m);

                if (!$milestone) {
                    continue;
                }

                $cacheKey = "lisensi_notif_{$type}_{$record->id}_m{$milestone}";

                if (Cache::has($cacheKey)) {
                    continue;
                }

                Cache::put($cacheKey, true, now()->addYear());

                $pref      = \App\Models\NotifPreference::forPegawai($pegawai->id);
                $prefEmail = $type === 'SIP' ? $pref->notif_sip_expiry_email : $pref->notif_str_expiry_email;
                $prefWa    = $type === 'SIP' ? $pref->notif_sip_expiry_wa    : $pref->notif_str_expiry_wa;

                if ($pegawai->email && $prefEmail) {
                    Mail::to($pegawai->email)->queue(new LisensiKadaluarsaSoon($pegawai, $hariTersisa));
                }

                if ($pegawai->no_telp && $prefWa) {
                    \App\Services\WhatsAppService::send(
                        $pegawai->no_telp,
                        \App\Services\WhatsAppService::msgLisensiExpiry($pegawai->nama, $type, $record->tanggal_expired, $hariTersisa)
                    );
                }

                ActivityLog::record(
                    action: 'EMAIL',
                    targetType: $type,
                    targetLabel: "Nomor {$type}: " . ($record->{"nomor_" . strtolower($type)} ?? $record->id),
                    description: "Notifikasi kadaluarsa {$type} dikirim (H-{$milestone}, {$hariTersisa} hari tersisa).",
                    pegawaiId: $pegawai->id,
                );

                $sent++;
            }
        }

        $this->info("Notifikasi lisensi terkirim: {$sent}.");

        return self::SUCCESS;
    }
}
