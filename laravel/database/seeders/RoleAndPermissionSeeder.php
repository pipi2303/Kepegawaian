<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Spatie\Permission\Models\Role;
use Spatie\Permission\Models\Permission;

class RoleAndPermissionSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        // Reset cached roles and permissions
        app()[\Spatie\Permission\PermissionRegistrar::class]->forgetCachedPermissions();

        // 1. Definisikan Permissions per Modul Rumah Sakit
        $permissions = [
            // Pegawai
            'pegawai.view', 'pegawai.create', 'pegawai.edit', 'pegawai.delete',
            // Cuti
            'cuti.view-own', 'cuti.view-all', 'cuti.request', 'cuti.approve-unit', 'cuti.approve-direksi',
            // Presensi
            'absensi.view-own', 'absensi.view-all', 'absensi.edit', 'absensi.export',
            // Penjadwalan Shift
            'shift.view', 'shift.manage', 'shift.swap',
            // Credentialing & Lisensi
            'credentialing.view', 'credentialing.request', 'credentialing.review-subkomite', 'credentialing.issue-spk',
            'str.view-all', 'str.manage',
            // K3RS & Kesehatan Pegawai
            'k3rs.view', 'k3rs.report-incident', 'k3rs.investigate',
            'mcu.view-all', 'vaksinasi.view-all',
            // Penggajian & Remunerasi
            'payroll.view-own', 'payroll.view-all', 'payroll.generate',
            // SKP & Kinerja
            'skp.view-own', 'skp.view-all', 'skp.review-atasan', 'skp.approve',
            // Komite RS
            'komite.view', 'komite.manage',
        ];

        foreach ($permissions as $permission) {
            Permission::firstOrCreate(['name' => $permission]);
        }

        // 2. Buat Roles & Petakan Permissions

        // Super Admin (Subbag Kepegawaian & SDM RS)
        $superAdmin = Role::firstOrCreate(['name' => 'admin']);
        $superAdmin->givePermissionTo(Permission::all());

        // Direktur Utama / Direksi RS
        $direktur = Role::firstOrCreate(['name' => 'direktur']);
        $direktur->givePermissionTo([
            'pegawai.view',
            'cuti.view-all', 'cuti.approve-direksi',
            'absensi.view-all', 'absensi.export',
            'credentialing.view', 'credentialing.issue-spk',
            'str.view-all',
            'k3rs.view',
            'payroll.view-all',
            'skp.view-all', 'skp.approve',
            'komite.view',
        ]);

        // Kepala Ruangan / Kepala Unit Kerja
        $kepalaUnit = Role::firstOrCreate(['name' => 'kepala_unit']);
        $kepalaUnit->givePermissionTo([
            'pegawai.view',
            'cuti.view-all', 'cuti.approve-unit',
            'absensi.view-all',
            'shift.view', 'shift.manage',
            'skp.review-atasan',
            'k3rs.report-incident',
        ]);

        // Komite Medik & Komite Keperawatan
        $komiteMedik = Role::firstOrCreate(['name' => 'komite_medik']);
        $komiteMedik->givePermissionTo([
            'credentialing.view', 'credentialing.review-subkomite',
            'str.view-all',
            'komite.view', 'komite.manage',
        ]);

        // Pegawai Biasa (Self-Service)
        $pegawai = Role::firstOrCreate(['name' => 'pegawai']);
        $pegawai->givePermissionTo([
            'cuti.view-own', 'cuti.request',
            'absensi.view-own',
            'shift.view', 'shift.swap',
            'credentialing.view', 'credentialing.request',
            'payroll.view-own',
            'skp.view-own',
            'k3rs.report-incident',
        ]);
    }
}
