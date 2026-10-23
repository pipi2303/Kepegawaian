<?php

namespace App\Exports;

use App\Models\Pegawai;
use Maatwebsite\Excel\Concerns\FromQuery;
use Maatwebsite\Excel\Concerns\ShouldAutoSize;
use Maatwebsite\Excel\Concerns\WithColumnWidths;
use Maatwebsite\Excel\Concerns\WithHeadings;
use Maatwebsite\Excel\Concerns\WithMapping;
use Maatwebsite\Excel\Concerns\WithStyles;
use Maatwebsite\Excel\Concerns\WithTitle;
use PhpOffice\PhpSpreadsheet\Worksheet\Worksheet;

class DUKExport implements FromQuery, WithHeadings, WithMapping, WithTitle, ShouldAutoSize, WithStyles, WithColumnWidths
{
    private int $no = 0;

    public function query()
    {
        return Pegawai::where('status_aktif', 'Aktif')
            ->orderByRaw("FIELD(golongan,'IV/e','IV/d','IV/c','IV/b','IV/a','III/d','III/c','III/b','III/a','II/d','II/c','II/b','II/a') ASC")
            ->orderBy('tmt_golongan')
            ->orderBy('tanggal_masuk');
    }

    public function headings(): array
    {
        return [
            'No.', 'NIP', 'Nama Lengkap', 'Gelar Depan', 'Gelar Belakang',
            'Tempat Lahir', 'Tgl. Lahir', 'Jenis Kelamin', 'Agama', 'Status Perkawinan',
            'Jabatan', 'Unit Kerja', 'Eselon', 'Golongan/Ruang', 'Pangkat',
            'TMT Golongan', 'Pendidikan Terakhir', 'Status Pegawai', 'Tgl. Masuk',
            'Batas Pensiun', 'Masa Kerja',
        ];
    }

    public function map($pegawai): array
    {
        // Masa kerja dalam tahun-bulan dari tanggal_masuk
        $masaKerja = $pegawai->tanggal_masuk
            ? $pegawai->tanggal_masuk->diff(now())->format('%y Tahun %m Bulan')
            : '-';

        return [
            ++$this->no,
            $pegawai->nip,
            $pegawai->nama_lengkap,
            $pegawai->gelar_depan,
            $pegawai->gelar_belakang,
            $pegawai->tempat_lahir,
            $pegawai->tanggal_lahir?->format('d/m/Y'),
            $pegawai->jenis_kelamin,
            $pegawai->agama,
            $pegawai->status_perkawinan,
            $pegawai->jabatan,
            $pegawai->unit_kerja,
            $pegawai->eselon,
            $pegawai->golongan,
            $pegawai->pangkat,
            $pegawai->tmt_golongan?->format('d/m/Y'),
            $pegawai->pendidikan_terakhir,
            $pegawai->status_pegawai,
            $pegawai->tanggal_masuk?->format('d/m/Y'),
            $pegawai->batas_pensiun?->format('d/m/Y'),
            $masaKerja,
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

    public function columnWidths(): array
    {
        return [
            'A' => 6,
            'B' => 20,
            'C' => 32,
            'D' => 14,
            'E' => 14,
            'F' => 16,
            'G' => 14,
            'H' => 14,
            'I' => 12,
            'J' => 18,
            'K' => 28,
            'L' => 24,
            'M' => 10,
            'N' => 14,
            'O' => 20,
            'P' => 14,
            'Q' => 20,
            'R' => 16,
            'S' => 14,
            'T' => 14,
            'U' => 18,
        ];
    }

    public function title(): string
    {
        return 'DAFTAR URUT KEPANGKATAN (DUK)';
    }
}
