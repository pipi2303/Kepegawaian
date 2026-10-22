<?php

namespace Tests\Feature;

use Spatie\Permission\Models\Permission;
use Tests\TestCase;

class PegawaiApiTest extends TestCase
{
    public function test_unauthenticated_request_returns_401(): void
    {
        $this->getJson('/api/v1/pegawai')->assertStatus(401);
    }

    public function test_per_page_is_capped_at_100(): void
    {
        $this->createRole('admin', ['pegawai.view']);
        $pegawai = $this->pegawai(role: 'admin');

        $response = $this->actingAs($pegawai)
            ->getJson('/api/v1/pegawai?per_page=99999')
            ->assertOk();

        $this->assertEquals(100, $response->json('data.per_page'));
    }

    public function test_creating_pegawai_without_permission_returns_403(): void
    {
        $this->createRole('readonly', ['pegawai.view']);
        $pegawai = $this->pegawai(role: 'readonly');

        $this->actingAs($pegawai)
            ->postJson('/api/v1/pegawai', [
                'nip'            => '199901010001',
                'nama'           => 'Baru',
                'jenis_kelamin'  => 'L',
                'jabatan'        => 'Staf',
                'unit_kerja'     => 'IGD',
                'status_pegawai' => 'PNS',
                'status_aktif'   => 'Aktif',
            ])
            ->assertStatus(403);
    }

    public function test_creating_pegawai_with_permission_succeeds(): void
    {
        $this->createRole('admin', ['pegawai.create', 'pegawai.edit']);
        $actor = $this->pegawai(role: 'admin');

        $this->actingAs($actor)
            ->postJson('/api/v1/pegawai', [
                'nip'            => '199901010002',
                'nama'           => 'Pegawai Baru',
                'jenis_kelamin'  => 'L',
                'jabatan'        => 'Perawat',
                'unit_kerja'     => 'IGD',
                'status_pegawai' => 'PNS',
                'status_aktif'   => 'Aktif',
            ])
            ->assertCreated()
            ->assertJsonPath('status', 'success');

        $this->assertDatabaseHas('m_pegawai', ['nip' => '199901010002']);
    }

    public function test_create_pegawai_is_logged(): void
    {
        $this->createRole('admin', ['pegawai.create', 'pegawai.edit']);
        $actor = $this->pegawai(role: 'admin');

        $this->actingAs($actor)->postJson('/api/v1/pegawai', [
            'nip'            => '199901010003',
            'nama'           => 'Log Test',
            'jenis_kelamin'  => 'P',
            'jabatan'        => 'Bidan',
            'unit_kerja'     => 'VK',
            'status_pegawai' => 'PNS',
            'status_aktif'   => 'Aktif',
        ]);

        $this->assertDatabaseHas('activity_logs', [
            'action'      => 'CREATE',
            'target_type' => 'Pegawai',
            'pegawai_id'  => $actor->id,
        ]);
    }

    public function test_soft_delete_is_logged_as_critical(): void
    {
        $this->createRole('admin', ['pegawai.create', 'pegawai.edit', 'pegawai.delete']);
        $actor = $this->pegawai(role: 'admin');
        $target = $this->pegawai();

        $this->actingAs($actor)
            ->deleteJson('/api/v1/pegawai/' . $target->id)
            ->assertOk();

        $this->assertDatabaseHas('activity_logs', [
            'action'   => 'DELETE',
            'severity' => 'critical',
        ]);

        $this->assertSoftDeleted('m_pegawai', ['id' => $target->id]);
    }
}
