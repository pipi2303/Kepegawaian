<?php

namespace Tests\Feature;

use App\Models\ActivityLog;
use Tests\TestCase;

class SessionTest extends TestCase
{
    public function test_idle_user_is_logged_out_after_timeout(): void
    {
        $pegawai = $this->pegawai();

        // Simulasi last_activity 31 menit lalu
        $this->actingAs($pegawai)
            ->withSession(['last_activity_at' => now()->subMinutes(31)])
            ->get('/')
            ->assertRedirect('/login');

        $this->assertGuest();
    }

    public function test_active_user_is_not_logged_out(): void
    {
        $pegawai = $this->pegawai();

        $this->actingAs($pegawai)
            ->withSession(['last_activity_at' => now()->subMinutes(5)])
            ->get('/')
            ->assertOk();

        $this->assertAuthenticatedAs($pegawai);
    }

    public function test_idle_logout_is_recorded_in_activity_log(): void
    {
        $pegawai = $this->pegawai();

        $this->actingAs($pegawai)
            ->withSession(['last_activity_at' => now()->subMinutes(31)])
            ->get('/');

        $this->assertDatabaseHas('activity_logs', [
            'action' => 'LOGOUT',
        ]);
    }
}
