<?php

namespace App\Services;

use App\Models\ActivityLog;
use App\Models\GajiDetail;
use App\Models\GajiHeader;
use App\Models\Pegawai;
use Carbon\Carbon;
use Illuminate\Support\Facades\DB;

class PayrollService
{
    // PP 5/2024 approximate values
    private static array $gajiPokokTable = [
        'I/a' => 1685700, 'I/b' => 1840800, 'I/c' => 1918000, 'I/d' => 1999900,
        'II/a' => 2184000, 'II/b' => 2385000, 'II/c' => 2485900, 'II/d' => 2591100,
        'III/a' => 2785700, 'III/b' => 2903600, 'III/c' => 3026900, 'III/d' => 3154200,
        'IV/a' => 3287800, 'IV/b' => 3426800, 'IV/c' => 3571400, 'IV/d' => 3720000, 'IV/e' => 3873900,
    ];

    public function generateSlipGaji(Pegawai $pegawai, int $bulan, int $tahun, float $tunjanganKinerja = 0): GajiHeader
    {
        return DB::transaction(function () use ($pegawai, $bulan, $tahun, $tunjanganKinerja) {
            // Hapus slip existing untuk regenerate
            GajiHeader::where('pegawai_id', $pegawai->id)
                ->where('bulan', $bulan)
                ->where('tahun', $tahun)
                ->each(function ($h) {
                    $h->details()->delete();
                    $h->delete();
                });

            $gajiPokok = $this->resolveGajiPokok($pegawai);
            $penerimaan = [];
            $potongan   = [];

            // --- PENERIMAAN ---
            $penerimaan[] = ['kode' => 'GP', 'nama' => 'Gaji Pokok', 'jumlah' => $gajiPokok];

            // Tunjangan Suami/Istri (10%)
            if ($pegawai->status_perkawinan && $pegawai->status_perkawinan !== 'Belum Kawin') {
                $tunjSuamiIstri = round($gajiPokok * 0.10);
                $penerimaan[] = ['kode' => 'TSI', 'nama' => 'Tunjangan Suami/Istri', 'jumlah' => $tunjSuamiIstri];
            }

            // Tunjangan Anak (2% per anak, max 2)
            $jumlahAnak = DB::table('t_pegawai_keluarga')
                ->where('pegawai_id', $pegawai->id)
                ->where('hubungan', 'Anak')
                ->where('status_hidup', 'Hidup')
                ->count();
            $jumlahAnak = min($jumlahAnak, 2);
            if ($jumlahAnak > 0) {
                $tunjAnak = round($gajiPokok * 0.02 * $jumlahAnak);
                $penerimaan[] = ['kode' => 'TA', 'nama' => 'Tunjangan Anak (' . $jumlahAnak . ' anak)', 'jumlah' => $tunjAnak];
            }

            // Tunjangan Beras
            $tanggungan  = $jumlahAnak + ($pegawai->status_perkawinan && $pegawai->status_perkawinan !== 'Belum Kawin' ? 1 : 0);
            $tunjBeras   = 30980 * (1 + $tanggungan);
            $penerimaan[] = ['kode' => 'TB', 'nama' => 'Tunjangan Beras', 'jumlah' => $tunjBeras];

            // Tunjangan Kinerja
            if ($tunjanganKinerja > 0) {
                $penerimaan[] = ['kode' => 'TK', 'nama' => 'Tunjangan Kinerja', 'jumlah' => $tunjanganKinerja];
            }

            // Uang Makan
            $hariKerja   = $this->countWorkDays($bulan, $tahun);
            $uangMakan   = 41000 * $hariKerja;
            $penerimaan[] = ['kode' => 'UM', 'nama' => 'Uang Makan (' . $hariKerja . ' hari)', 'jumlah' => $uangMakan];

            $totalBruto = collect($penerimaan)->sum('jumlah');

            // --- POTONGAN ---

            // BPJS Kesehatan 1% (max 42.000)
            $bpjsKes = min(round($gajiPokok * 0.01), 42000);
            $potongan[] = ['kode' => 'BPJSKES', 'nama' => 'BPJS Kesehatan (1%)', 'jumlah' => $bpjsKes];

            // BPJS JHT 2%
            $bpjsJHT = round($gajiPokok * 0.02);
            $potongan[] = ['kode' => 'JHT', 'nama' => 'BPJS Ketenagakerjaan JHT (2%)', 'jumlah' => $bpjsJHT];

            // BPJS JP 1% (max 99.000)
            $bpjsJP = min(round($gajiPokok * 0.01), 99000);
            $potongan[] = ['kode' => 'JP', 'nama' => 'BPJS JP (1%)', 'jumlah' => $bpjsJP];

            // TAPERA 2.5% (PNS & PPPK only)
            if (in_array($pegawai->status_pegawai, ['PNS', 'PPPK'], true)) {
                $tapera = round($gajiPokok * 0.025);
                $potongan[] = ['kode' => 'TAPERA', 'nama' => 'Iuran TAPERA (2.5%)', 'jumlah' => $tapera];
            }

            // PPh 21 simplified: 5% of (bruto - PTKP_monthly)
            $ptkp = ($jumlahAnak > 0 || $tanggungan > 0) ? 4750000 : 4500000;
            $kenapajakBruto = max(0, $totalBruto - $ptkp);
            $pph21 = round($kenapajakBruto * 0.05);
            if ($pph21 > 0) {
                $potongan[] = ['kode' => 'PPH21', 'nama' => 'PPh 21 (5%)', 'jumlah' => $pph21];
            }

            $totalPotongan = collect($potongan)->sum('jumlah');
            $totalNetto    = $totalBruto - $totalPotongan;

            $header = GajiHeader::create([
                'pegawai_id'                => $pegawai->id,
                'bulan'                     => $bulan,
                'tahun'                     => $tahun,
                'gaji_pokok'                => $gajiPokok,
                'tunjangan_kinerja'         => $tunjanganKinerja,
                'remunerasi_jasa_pelayanan' => 0,
                'total_bruto'               => $totalBruto,
                'total_potongan'            => $totalPotongan,
                'total_netto'               => $totalNetto,
                'status_pembayaran'         => 'Draft',
            ]);

            foreach ($penerimaan as $item) {
                GajiDetail::create([
                    'gaji_id'        => $header->id,
                    'jenis'          => 'Penerimaan',
                    'kode_komponen'  => $item['kode'],
                    'nama_komponen'  => $item['nama'],
                    'jumlah'         => $item['jumlah'],
                ]);
            }

            foreach ($potongan as $item) {
                GajiDetail::create([
                    'gaji_id'        => $header->id,
                    'jenis'          => 'Potongan',
                    'kode_komponen'  => $item['kode'],
                    'nama_komponen'  => $item['nama'],
                    'jumlah'         => $item['jumlah'],
                ]);
            }

            return $header;
        });
    }

    public function approvePayroll(GajiHeader $gaji): void
    {
        $gaji->update(['status_pembayaran' => 'Approved']);
        ActivityLog::record(
            action: 'UPDATE',
            targetType: 'GajiHeader',
            targetId: $gaji->id,
            targetLabel: 'Slip Gaji #' . $gaji->id,
            description: 'Slip gaji disetujui.',
        );
    }

    public function markDibayar(GajiHeader $gaji): void
    {
        $gaji->update([
            'status_pembayaran' => 'Dibayarkan',
            'tanggal_dibayar'   => now()->toDateString(),
        ]);
        ActivityLog::record(
            action: 'UPDATE',
            targetType: 'GajiHeader',
            targetId: $gaji->id,
            targetLabel: 'Slip Gaji #' . $gaji->id,
            description: 'Slip gaji ditandai sebagai dibayarkan.',
        );
    }

    private function resolveGajiPokok(Pegawai $pegawai): float
    {
        if ($pegawai->status_pegawai === 'Honorer') {
            $kontrak = DB::table('t_kontrak_pegawai')
                ->where('pegawai_id', $pegawai->id)
                ->where('status_kontrak', 'Aktif')
                ->value('gaji_kontrak');
            return (float) ($kontrak ?? 2000000);
        }

        $golongan = $pegawai->golongan ?? '';
        return (float) (self::$gajiPokokTable[$golongan] ?? 2785700);
    }

    private function countWorkDays(int $bulan, int $tahun): int
    {
        $start = Carbon::create($tahun, $bulan, 1);
        $end   = $start->copy()->endOfMonth();
        $count = 0;

        for ($day = $start->copy(); $day->lte($end); $day->addDay()) {
            if ($day->isWeekday()) {
                $count++;
            }
        }

        return $count;
    }
}
