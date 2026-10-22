<?php

namespace Tests;

use App\Models\Pegawai;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Foundation\Testing\TestCase as BaseTestCase;
use Illuminate\Support\Facades\Hash;
use Spatie\Permission\Models\Permission;
use Spatie\Permission\Models\Role;

abstract class TestCase extends BaseTestCase
{
    use RefreshDatabase;

    protected function pegawai(array $attrs = [], ?string $role = null): Pegawai
    {
        $pegawai = Pegawai::create(array_merge([
            'nip'            => '19900101' . rand(100000, 999999),
            'nama'           => 'Test Pegawai',
            'jenis_kelamin'  => 'L',
            'jabatan'        => 'Staf',
            'unit_kerja'     => 'Unit Test',
            'status_pegawai' => 'PNS',
            'status_aktif'   => 'Aktif',
            'email'          => 'test' . rand(1, 9999) . '@rsudam.test',
            'password'       => Hash::make('password'),
        ], $attrs));

        if ($role) {
            $pegawai->assignRole($role);
        }

        return $pegawai;
    }

    protected function createRole(string $name, array $permissions = []): Role
    {
        $role = Role::firstOrCreate(['name' => $name]);
        foreach ($permissions as $perm) {
            $role->givePermissionTo(Permission::firstOrCreate(['name' => $perm]));
        }
        return $role;
    }
}
