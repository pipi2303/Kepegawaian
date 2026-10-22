<?php

namespace App\Exports;

use App\Models\Cuti;
use Maatwebsite\Excel\Concerns\FromQuery;
use Maatwebsite\Excel\Concerns\ShouldAutoSize;
use Maatwebsite\Excel\Concerns\WithHeadings;
use Maatwebsite\Excel\Concerns\WithMapping;
use Maatwebsite\Excel\Concerns\WithTitle;

class CutiExport implements FromQuery, WithHeadings, WithMapping, WithTitle, ShouldAutoSize
{
    public function __construct(
        public int $tahun,
        public ?string $status = null,
    ) {}

    public function query()
    {
        $query = Cuti::with('pegawai')
            ->whereYear('tanggal_mulai', $this->tahun)
            ->orderBy('tanggal_mulai');

        if ($this->status) {
            $query->where('status', $this->status);
        }

        return $query;
    }

    public function headings(): array
    {
        return [
            'NIP', 'Nama', 'Unit Kerja', 'Jenis Cuti',
            'Tanggal Mulai', 'Tanggal Selesai', 'Jumlah Hari', 'Status', 'Alasan',
        ];
    }

    public function map($cuti): array
    {
        return [
            $cuti->pegawai->nip ?? '-',
            $cuti->pegawai->nama_lengkap ?? '-',
            $cuti->pegawai->unit_kerja ?? '-',
            $cuti->jenis_cuti,
            $cuti->tanggal_mulai?->format('d/m/Y'),
            $cuti->tanggal_selesai?->format('d/m/Y'),
            $cuti->jumlah_hari,
            $cuti->status,
            $cuti->alasan,
        ];
    }

    public function title(): string
    {
        return 'Data Cuti ' . $this->tahun;
    }
}
