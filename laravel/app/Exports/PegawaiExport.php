<?php

namespace App\Exports;

use App\Models\Pegawai;
use Maatwebsite\Excel\Concerns\FromQuery;
use Maatwebsite\Excel\Concerns\ShouldAutoSize;
use Maatwebsite\Excel\Concerns\WithHeadings;
use Maatwebsite\Excel\Concerns\WithMapping;
use Maatwebsite\Excel\Concerns\WithTitle;

class PegawaiExport implements FromQuery, WithHeadings, WithMapping, WithTitle, ShouldAutoSize
{
    private int $no = 0;

    public function query()
    {
        return Pegawai::where('status_aktif', 'Aktif')
            ->orderBy('unit_kerja')
            ->orderBy('nama');
    }

    public function headings(): array
    {
        return [
            'No', 'NIP', 'Nama Lengkap', 'Jabatan', 'Unit Kerja',
            'Golongan', 'Pangkat', 'Status Pegawai', 'Tanggal Masuk', 'No. Telp', 'Email',
        ];
    }

    public function map($pegawai): array
    {
        return [
            ++$this->no,
            $pegawai->nip,
            $pegawai->nama_lengkap,
            $pegawai->jabatan,
            $pegawai->unit_kerja,
            $pegawai->golongan,
            $pegawai->pangkat,
            $pegawai->status_pegawai,
            $pegawai->tanggal_masuk?->format('d/m/Y'),
            $pegawai->no_telp,
            $pegawai->email,
        ];
    }

    public function title(): string
    {
        return 'Data Pegawai Aktif';
    }
}
