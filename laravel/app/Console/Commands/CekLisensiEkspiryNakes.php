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

    public function handle(): int
    {
        $sent  = 0;
        $today = now()->toDateString();

        foreach ([StrRecord::class => 'STR', SipRecord::class => 'SIP'] as $model => $type) {
            $records = $model::expiringWithin(90)->with('pegawai')->get();

            foreach ($records as $record) {
                $pegawai = $record->pegawai;

                if (!$pegawai?->email) {
                    continue;
                }

                $cacheKey = "lisensi_notif_{$type}_{$record->id}_{$today}";

                if (Cache::has($cacheKey)) {
                    continue;
                }

                $hariTersisa = (int) now()->diffInDays($record->tanggal_expired);

                Mail::to($pegawai->email)->queue(new LisensiKadaluarsaSoon($pegawai, $hariTersisa));

                if ($pegawai->no_telp) {
                    \App\Services\WhatsAppService::send(
                        $pegawai->no_telp,
                        \App\Services\WhatsAppService::msgLisensiExpiry($pegawai->nama, $type, $record->tanggal_expired, $hariTersisa)
                    );
                }

                Cache::put($cacheKey, true, 86400);

                ActivityLog::record(
                    action: 'EMAIL',
                    targetType: $type,
                    targetLabel: "Nomor {$type}: " . ($record->{"nomor_" . strtolower($type)} ?? $record->id),
                    description: "Notifikasi kadaluarsa {$type} dikirim ke {$pegawai->email} ({$hariTersisa} hari tersisa).",
                    pegawaiId: $pegawai->id,
                );

                $sent++;
            }
        }

        $this->info("Notifikasi lisensi terkirim: {$sent} email.");

        return self::SUCCESS;
    }
}
