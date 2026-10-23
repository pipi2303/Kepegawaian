<?php

namespace App\Exports;

use Illuminate\Support\Facades\DB;
use Maatwebsite\Excel\Concerns\FromQuery;
use Maatwebsite\Excel\Concerns\ShouldAutoSize;
use Maatwebsite\Excel\Concerns\WithHeadings;
use Maatwebsite\Excel\Concerns\WithMapping;
use Maatwebsite\Excel\Concerns\WithTitle;

class BPJSKesehatanExport implements FromQuery, WithHeadings, WithMapping, WithTitle, ShouldAutoSize
{
    // Iuran pekerja max Rp 42.000/bln (Perpres 64/2020, golongan I & II)
    // ponytail: ceiling hardcoded; update when Perpres changes
    private const MAX_IURAN_PEKERJA = 42000;

    private int $no = 0;

    public function __construct(
        private readonly int $bulan,
        private readonly int $tahun,
    ) {}

    public function query()
    {
        return DB::table('m_pegawai as p')
            ->where('p.status_aktif', 'Aktif')
            ->whereNull('p.deleted_at')
            ->leftJoin('t_bpjs_pegawai as b', 'b.pegawai_id', '=', 'p.id')
            ->leftJoin('t_gaji_header as g', function ($j) {
                $j->on('g.pegawai_id', '=', 'p.id')
                  ->where('g.bulan', '=', $this->bulan)
                  ->where('g.tahun', '=', $this->tahun);
            })
            ->select(
                'p.id', 'p.nip', 'p.nama',
                'b.nomor_bpjs_kesehatan', 'b.faskes_tingkat_1', 'b.status_bpjs_kesehatan',
                DB::raw('COALESCE(g.gaji_pokok, 0) as gaji_pokok')
            )
            ->orderBy('p.unit_kerja')
            ->orderBy('p.nama');
    }

    public function headings(): array
    {
        return [
            'No.', 'NIP', 'Nama', 'No. BPJS Kesehatan', 'Faskes Tk.1',
            'Gaji Dasar', 'Iuran Pegawai (1%)', 'Iuran Pemberi Kerja (4%)', 'Total Iuran', 'Ket.',
        ];
    }

    public function map($row): array
    {
        $gaji = (float) $row->gaji_pokok;
        $iuranPekerja = min(round($gaji * 0.01, 0), self::MAX_IURAN_PEKERJA);
        $iuranPemberi = round($gaji * 0.04, 0);
        $total = $iuranPekerja + $iuranPemberi;

        return [
            ++$this->no,
            $row->nip,
            $row->nama,
            $row->nomor_bpjs_kesehatan ?? '',
            $row->faskes_tingkat_1 ?? '',
            $gaji,
            $iuranPekerja,
            $iuranPemberi,
            $total,
            $row->status_bpjs_kesehatan ?? 'Aktif',
        ];
    }

    public function title(): string
    {
        return 'DAFTAR IURAN BPJS KESEHATAN';
    }
}
