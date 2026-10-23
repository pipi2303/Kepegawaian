<?php

namespace App\Exports;

use Illuminate\Support\Facades\DB;
use Maatwebsite\Excel\Concerns\FromQuery;
use Maatwebsite\Excel\Concerns\ShouldAutoSize;
use Maatwebsite\Excel\Concerns\WithHeadings;
use Maatwebsite\Excel\Concerns\WithMapping;
use Maatwebsite\Excel\Concerns\WithTitle;

class BPJSKetenagakerjaanExport implements FromQuery, WithHeadings, WithMapping, WithTitle, ShouldAutoSize
{
    // JP ceiling 2024 per Permenaker No. 4/2022
    private const JP_CEILING = 9559600;

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
                'p.id', 'p.nip', 'p.nama', 'p.tanggal_lahir', 'p.jenis_kelamin', 'p.golongan',
                'b.nomor_bpjs_ketenagakerjaan', 'b.ikut_jkk', 'b.ikut_jkm', 'b.ikut_jht', 'b.ikut_jp',
                DB::raw('COALESCE(g.gaji_pokok, 0) as gaji_pokok')
            )
            ->orderBy('p.unit_kerja')
            ->orderBy('p.nama');
    }

    public function headings(): array
    {
        return [
            'No.', 'NIK/NIP', 'Nama Peserta', 'Tanggal Lahir', 'Jenis Kelamin',
            'No. BPJS TK', 'Upah JKK', 'Upah JHT', 'Upah JP', 'Upah JKM',
            'Iuran JKK (0.24%)', 'Iuran JHT Pemberi (3.7%)', 'Iuran JHT Pekerja (2%)',
            'Iuran JP Pemberi (2%)', 'Iuran JP Pekerja (1%)', 'Iuran JKM (0.3%)', 'Total Iuran',
        ];
    }

    public function map($row): array
    {
        $gaji = (float) $row->gaji_pokok;
        $gajiJP = min($gaji, self::JP_CEILING); // JP capped

        $jkk  = round($gaji * 0.0024, 0);
        $jhtP = round($gaji * 0.037, 0);  // pemberi kerja
        $jhtW = round($gaji * 0.02, 0);   // pekerja
        $jpP  = round($gajiJP * 0.02, 0); // pemberi kerja
        $jpW  = round($gajiJP * 0.01, 0); // pekerja
        $jkm  = round($gaji * 0.003, 0);
        $total = $jkk + $jhtP + $jhtW + $jpP + $jpW + $jkm;

        return [
            ++$this->no,
            $row->nip,
            $row->nama,
            $row->tanggal_lahir,
            $row->jenis_kelamin,
            $row->nomor_bpjs_ketenagakerjaan ?? '',
            $gaji,    // Upah JKK
            $gaji,    // Upah JHT
            $gajiJP,  // Upah JP (capped)
            $gaji,    // Upah JKM
            $jkk,
            $jhtP,
            $jhtW,
            $jpP,
            $jpW,
            $jkm,
            $total,
        ];
    }

    public function title(): string
    {
        return 'DAFTAR IURAN BPJS KETENAGAKERJAAN';
    }
}
