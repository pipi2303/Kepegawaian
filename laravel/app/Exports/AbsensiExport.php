<?php

namespace App\Exports;

use App\Models\Absensi;
use Maatwebsite\Excel\Concerns\FromQuery;
use Maatwebsite\Excel\Concerns\ShouldAutoSize;
use Maatwebsite\Excel\Concerns\WithHeadings;
use Maatwebsite\Excel\Concerns\WithMapping;
use Maatwebsite\Excel\Concerns\WithTitle;

class AbsensiExport implements FromQuery, WithHeadings, WithMapping, WithTitle, ShouldAutoSize
{
    public function __construct(
        public int $bulan,
        public int $tahun,
        public ?string $unitKerja = null,
    ) {}

    public function query()
    {
        $query = Absensi::with('pegawai')
            ->whereMonth('tanggal', $this->bulan)
            ->whereYear('tanggal', $this->tahun)
            ->orderBy('tanggal')
            ->orderBy('pegawai_id');

        if ($this->unitKerja) {
            $query->whereHas('pegawai', fn($q) => $q->where('unit_kerja', $this->unitKerja));
        }

        return $query;
    }

    public function headings(): array
    {
        return [
            'Tanggal', 'NIP', 'Nama', 'Unit Kerja',
            'Jam Masuk', 'Jam Keluar', 'Status', 'Keterlambatan (menit)',
        ];
    }

    public function map($absensi): array
    {
        return [
            $absensi->tanggal?->format('d/m/Y'),
            $absensi->pegawai->nip ?? '-',
            $absensi->pegawai->nama_lengkap ?? '-',
            $absensi->pegawai->unit_kerja ?? '-',
            $absensi->jam_masuk ?? '-',
            $absensi->jam_keluar ?? '-',
            $absensi->status,
            $absensi->menit_terlambat ?? 0,
        ];
    }

    public function title(): string
    {
        $bulanNames = [
            1 => 'Januari', 2 => 'Februari', 3 => 'Maret', 4 => 'April',
            5 => 'Mei', 6 => 'Juni', 7 => 'Juli', 8 => 'Agustus',
            9 => 'September', 10 => 'Oktober', 11 => 'November', 12 => 'Desember',
        ];

        return 'Absensi ' . ($bulanNames[$this->bulan] ?? $this->bulan) . ' ' . $this->tahun;
    }
}
