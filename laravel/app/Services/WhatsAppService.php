<?php

namespace App\Services;

use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class WhatsAppService
{
    public static function send(string $phone, string $message): bool
    {
        if (!config('whatsapp.enabled') || empty(config('whatsapp.fonnte.token'))) {
            Log::channel('daily')->info('[WhatsApp] disabled or no token', compact('phone', 'message'));
            return false;
        }

        $phone = self::normalizePhone($phone);
        if (!$phone) return false;

        try {
            $response = Http::timeout(10)
                ->withHeaders(['Authorization' => config('whatsapp.fonnte.token')])
                ->post(config('whatsapp.fonnte.api_url'), [
                    'target'  => $phone,
                    'message' => $message,
                ]);

            return $response->successful();
        } catch (\Throwable $e) {
            Log::error('[WhatsApp] send failed: ' . $e->getMessage());
            return false;
        }
    }

    private static function normalizePhone(string $phone): ?string
    {
        $digits = preg_replace('/\D/', '', $phone);
        if (str_starts_with($digits, '0')) $digits = '62' . substr($digits, 1);
        if (str_starts_with($digits, '8'))  $digits = '62' . $digits;
        return strlen($digits) >= 10 ? $digits : null;
    }

    public static function msgCutiDisetujui(string $nama, string $jenisCuti, string $tglMulai, string $tglSelesai, int $sisaCuti): string
    {
        return "✅ *Permohonan Cuti Disetujui*\n\nYth. {$nama},\n\nPermohonan {$jenisCuti} Anda (*{$tglMulai} – {$tglSelesai}*) telah *disetujui*.\n\nSisa cuti tahunan: *{$sisaCuti} hari*.\n\n_HCMS RSUDAM_";
    }

    public static function msgCutiDitolak(string $nama, string $jenisCuti, string $alasan): string
    {
        return "❌ *Permohonan Cuti Ditolak*\n\nYth. {$nama},\n\nPermohonan {$jenisCuti} Anda *ditolak*.\n\nAlasan: {$alasan}\n\nSilakan hubungi Bagian SDM untuk info lebih lanjut.\n\n_HCMS RSUDAM_";
    }

    public static function msgCutiDiajukan(string $namaPegawai, string $unit, string $jenisCuti, string $tglMulai, string $tglSelesai): string
    {
        return "📋 *Pengajuan Cuti Baru*\n\n*{$namaPegawai}* ({$unit}) mengajukan *{$jenisCuti}*\n📅 {$tglMulai} – {$tglSelesai}\n\nSegera proses di HCMS atau balas pesan ini.\n\n_HCMS RSUDAM_";
    }

    public static function msgLisensiExpiry(string $nama, string $jenis, string $tanggalExpiry, int $hariTersisa): string
    {
        $emoji = $hariTersisa <= 30 ? '🚨' : '⚠️';
        return "{$emoji} *Peringatan {$jenis} Segera Kadaluarsa*\n\nYth. {$nama},\n\n{$jenis} Anda akan kadaluarsa pada *{$tanggalExpiry}* ({$hariTersisa} hari lagi).\n\nSegera urus perpanjangan melalui Komite Medik/Keperawatan.\n\n_HCMS RSUDAM_";
    }

    public static function msgSlipGajiTersedia(string $nama, string $periode): string
    {
        return "💰 *Slip Gaji Tersedia*\n\nYth. {$nama},\n\nSlip gaji periode *{$periode}* sudah dapat diunduh di portal HCMS.\n\n_HCMS RSUDAM_";
    }
}
