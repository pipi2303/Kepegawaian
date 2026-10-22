<?php

namespace App\Imports;

use App\Models\Pegawai;
use Illuminate\Support\Facades\Hash;
use Maatwebsite\Excel\Concerns\ToModel;
use Maatwebsite\Excel\Concerns\WithHeadingRow;
use Maatwebsite\Excel\Concerns\WithValidation;
use Maatwebsite\Excel\Concerns\SkipsOnFailure;
use Maatwebsite\Excel\Concerns\SkipsFailures;
use Maatwebsite\Excel\Validators\Failure;

class PegawaiImport implements ToModel, WithHeadingRow, WithValidation, SkipsOnFailure
{
    use SkipsFailures;

    /** @var array */
    private array $importFailures = [];

    private int $processedRows = 0;

    public function model(array $row): ?Pegawai
    {
        $this->processedRows++;
        $nip = trim($row['nip'] ?? '');
        if (empty($nip)) {
            return null;
        }

        return Pegawai::updateOrCreate(
            ['nip' => $nip],
            [
                'nama'            => $row['nama'],
                'gelar_depan'     => $row['gelar_depan'] ?? null,
                'gelar_belakang'  => $row['gelar_belakang'] ?? null,
                'jenis_kelamin'   => $row['jenis_kelamin'],
                'tempat_lahir'    => $row['tempat_lahir'] ?? null,
                'tanggal_lahir'   => $row['tanggal_lahir'] ?? null,
                'email'           => $row['email'] ?? null,
                'no_telp'         => $row['no_telp'] ?? null,
                'jabatan'         => $row['jabatan'] ?? 'Staf',
                'unit_kerja'      => $row['unit_kerja'] ?? 'Umum',
                'golongan'        => $row['golongan'] ?? null,
                'pangkat'         => $row['pangkat'] ?? null,
                'status_pegawai'  => $row['status_pegawai'] ?? 'PNS',
                'tanggal_masuk'   => $row['tanggal_masuk'] ?? null,
                'status_aktif'    => 'Aktif',
                'password'        => Hash::make(substr($nip, -6)),
            ]
        );
    }

    public function rules(): array
    {
        return [
            'nip'            => 'required|string',
            'nama'           => 'required|string|max:255',
            'jenis_kelamin'  => 'required|in:L,P',
            'status_pegawai' => 'nullable|in:PNS,PPPK,Honorer',
            'email'          => 'nullable|email',
            'tanggal_lahir'  => 'nullable|date',
            'tanggal_masuk'  => 'nullable|date',
        ];
    }

    public function onFailure(Failure ...$failures): void
    {
        foreach ($failures as $failure) {
            $this->importFailures[] = [
                'row'    => $failure->row(),
                'column' => $failure->attribute(),
                'errors' => $failure->errors(),
                'values' => $failure->values(),
            ];
        }
    }

    public function getFailures(): array
    {
        return $this->importFailures;
    }

    public function getRowCount(): int
    {
        return $this->processedRows;
    }
}
