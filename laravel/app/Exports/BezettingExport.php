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

class BezettingExport implements FromCollection, WithHeadings, WithMapping, WithTitle, ShouldAutoSize, WithStyles
{
    private int $no = 0;

    public function collection()
    {
        return DB::table('m_pegawai')
            ->select(
                'jabatan',
                'unit_kerja',
                'eselon',
                DB::raw('COUNT(*) as jumlah_terisi'),
                DB::raw("SUM(status_pegawai = 'PNS') as pns"),
                DB::raw("SUM(status_pegawai = 'PPPK') as pppk"),
                DB::raw("SUM(status_pegawai = 'Honorer') as honorer"),
            )
            ->where('status_aktif', 'Aktif')
            ->whereNotNull('jabatan')
            ->groupBy('jabatan', 'unit_kerja', 'eselon')
            ->orderBy('unit_kerja')
            ->orderBy('jabatan')
            ->get();
    }

    public function headings(): array
    {
        return ['No.', 'Jabatan', 'Unit Kerja', 'Eselon', 'Jumlah Terisi', 'Status Pegawai (PNS/PPPK/Honorer)'];
    }

    public function map($row): array
    {
        $breakdown = "PNS: {$row->pns} | PPPK: {$row->pppk} | Honorer: {$row->honorer}";

        return [
            ++$this->no,
            $row->jabatan,
            $row->unit_kerja,
            $row->eselon,
            $row->jumlah_terisi,
            $breakdown,
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
        return 'BEZETTING PEGAWAI';
    }
}
