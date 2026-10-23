<?php

namespace App\Imports;

use App\Models\Absensi;
use App\Models\Pegawai;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\DB;
use Maatwebsite\Excel\Concerns\ToCollection;

class AbsensiMesinImport implements ToCollection
{
    public array $results = [
        'processed' => 0,
        'created'   => 0,
        'updated'   => 0,
        'skipped'   => 0,
        'errors'    => [],
    ];

    // 07:52:30 tolerance = 472.5 minutes from midnight → compare as string is enough for hh:mm
    private const CUTOFF = '07:52:30';

    public function collection(Collection $rows): void
    {
        DB::transaction(function () use ($rows) {
            // Group by NIP + date
            $grouped = [];
            foreach ($rows as $row) {
                $cells = array_values($row->toArray());
                // Skip blank rows
                if (empty(array_filter($cells))) continue;

                [$nip, $tanggal, $waktu] = $this->parseRow($cells);
                if (!$nip || !$tanggal || !$waktu) continue;

                $grouped[$nip][$tanggal][] = $waktu;
            }

            foreach ($grouped as $nip => $dates) {
                $pegawai = Pegawai::where('nip', $nip)->first();
                if (!$pegawai) {
                    $this->results['errors'][] = "NIP tidak ditemukan: {$nip}";
                    $this->results['skipped']++;
                    continue;
                }

                foreach ($dates as $tanggal => $times) {
                    sort($times);
                    $jamMasuk  = $times[0];
                    $jamKeluar = count($times) > 1 ? end($times) : null;
                    $status    = $jamMasuk <= self::CUTOFF ? 'Hadir' : 'Terlambat';

                    $menit_terlambat = 0;
                    if ($status === 'Terlambat') {
                        [$h, $m] = explode(':', $jamMasuk);
                        $menit_terlambat = ($h * 60 + $m) - (7 * 60 + 52);
                    }

                    $existing = Absensi::where('pegawai_id', $pegawai->id)
                        ->where('tanggal', $tanggal)
                        ->exists();

                    Absensi::updateOrCreate(
                        ['pegawai_id' => $pegawai->id, 'tanggal' => $tanggal],
                        [
                            'jam_masuk'       => $jamMasuk,
                            'jam_keluar'      => $jamKeluar,
                            'status'          => $status,
                            'menit_terlambat' => $menit_terlambat,
                            'keterangan'      => 'Import mesin fingerprint',
                        ]
                    );

                    $this->results['processed']++;
                    $existing ? $this->results['updated']++ : $this->results['created']++;
                }
            }
        });
    }

    /**
     * Returns [nip, tanggal (Y-m-d), waktu (H:i:s)]
     * Supports:
     *   CSV format:  NIP, Tanggal, Waktu, Jenis   (header or headerless)
     *   ZKTeco log:  NIP  datetime  device  type
     */
    private function parseRow(array $cells): array
    {
        $c0 = trim((string) ($cells[0] ?? ''));
        $c1 = trim((string) ($cells[1] ?? ''));
        $c2 = trim((string) ($cells[2] ?? ''));

        // Skip header row
        if (strtolower($c0) === 'nip') return [null, null, null];

        // ZKTeco log: first cell is numeric NIP, second is "date time" combined
        if (is_numeric(str_replace(' ', '', $c0)) && str_contains($c1, ' ')) {
            // "2026-10-01 07:45:22"
            [$date, $time] = explode(' ', $c1, 2);
            return [$c0, $date, $time];
        }

        // CSV format: NIP, Tanggal, Waktu, [Jenis]
        if ($c0 && $c1 && $c2) {
            return [$c0, $c1, $c2];
        }

        return [null, null, null];
    }
}
