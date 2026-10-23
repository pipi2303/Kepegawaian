<?php

namespace App\Exports;

use Illuminate\Support\Facades\DB;
use Maatwebsite\Excel\Concerns\FromCollection;
use Maatwebsite\Excel\Concerns\ShouldAutoSize;
use Maatwebsite\Excel\Concerns\WithHeadings;
use Maatwebsite\Excel\Concerns\WithMapping;
use Maatwebsite\Excel\Concerns\WithStyles;
use Maatwebsite\Excel\Concerns\WithTitle;
use PhpOffice\PhpSpreadsheet\Worksheet\Worksheet;

class RekapAbsensiExport implements FromCollection, WithHeadings, WithMapping, WithTitle, ShouldAutoSize, WithStyles
{
    private int $no = 0;

    public function __construct(public int $bulan, public int $tahun) {}

    public function collection()
    {
        return DB::table('m_pegawai as p')
            ->leftJoin('t_absensi as a', function ($join) {
                $join->on('a.pegawai_id', '=', 'p.id')
                    ->whereMonth('a.tanggal', $this->bulan)
                    ->whereYear('a.tanggal', $this->tahun);
            })
            ->where('p.status_aktif', 'Aktif')
            ->select(
                'p.id',
                'p.nip',
                'p.nama',
                'p.jabatan',
                'p.unit_kerja',
                'p.golongan',
                DB::raw("SUM(a.status = 'Hadir') as hadir"),
                DB::raw("SUM(a.status = 'Terlambat') as terlambat"),
                DB::raw("SUM(a.status = 'Alpha') as alpha"),
                DB::raw("SUM(a.status = 'Izin') as izin"),
                DB::raw("SUM(a.status = 'Sakit') as sakit"),
                DB::raw("SUM(a.status = 'Cuti') as cuti"),
            )
            ->groupBy('p.id', 'p.nip', 'p.nama', 'p.jabatan', 'p.unit_kerja', 'p.golongan')
            ->orderBy('p.unit_kerja')
            ->orderBy('p.nama')
            ->get();
    }

    public function headings(): array
    {
        return [
            'No.', 'NIP', 'Nama', 'Jabatan', 'Unit Kerja', 'Gol.',
            'Hadir', 'Terlambat', 'Alpha', 'Izin', 'Sakit', 'Cuti',
            'Total Hari Kerja', '% Kehadiran',
        ];
    }

    public function map($row): array
    {
        $totalHariKerja = $row->hadir + $row->terlambat + $row->alpha + $row->izin + $row->sakit + $row->cuti;
        $persenHadir = $totalHariKerja > 0
            ? round((($row->hadir + $row->terlambat) / $totalHariKerja) * 100, 1)
            : 0;

        return [
            ++$this->no,
            $row->nip,
            $row->nama,
            $row->jabatan,
            $row->unit_kerja,
            $row->golongan,
            $row->hadir,
            $row->terlambat,
            $row->alpha,
            $row->izin,
            $row->sakit,
            $row->cuti,
            $totalHariKerja,
            $persenHadir . '%',
        ];
    }

    public function styles(Worksheet $sheet): array
    {
        return [
            1 => [
                'font' => ['bold' => true],
                'fill' => [
                    'fillType' => \PhpOffice\PhpSpreadsheet\Style\Fill::FILL_SOLID,
                    'startColor' => ['argb' => 'FFD3D3D3'],
                ],
            ],
        ];
    }

    public function title(): string
    {
        return 'REKAPITULASI ABSENSI PEGAWAI';
    }
}
