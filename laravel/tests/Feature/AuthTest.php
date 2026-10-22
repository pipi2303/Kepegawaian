<?php

namespace Tests\Feature;

use App\Models\ActivityLog;
use Tests\TestCase;

class AuthTest extends TestCase
{
    public function test_login_page_is_accessible_to_guests(): void
    {
        $this->get('/login')->assertOk();
    }

    public function test_login_with_email_succeeds(): void
    {
        $pegawai = $this->pegawai(['email' => 'dokter@rsudam.test']);

        $this->post('/login', ['email' => 'dokter@rsudam.test', 'password' => 'password'])
            ->assertRedirect('/');

        $this->assertAuthenticatedAs($pegawai);
    }

    public function test_login_with_nip_succeeds(): void
    {
        $pegawai = $this->pegawai(['nip' => '197505101998031001']);

        $this->post('/login', ['email' => '197505101998031001', 'password' => 'password'])
            ->assertRedirect('/');

        $this->assertAuthenticatedAs($pegawai);
    }

    public function test_login_with_wrong_password_fails(): void
    {
        $this->pegawai(['email' => 'salah@rsudam.test']);

        $this->post('/login', ['email' => 'salah@rsudam.test', 'password' => 'wrong'])
            ->assertRedirect()
            ->assertSessionHasErrors('email');

        $this->assertGuest();
    }

    public function test_login_rate_limited_after_five_attempts(): void
    {
        $this->pegawai(['email' => 'target@rsudam.test']);

        for ($i = 0; $i < 5; $i++) {
            $this->post('/login', ['email' => 'target@rsudam.test', 'password' => 'wrong']);
        }

        $this->post('/login', ['email' => 'target@rsudam.test', 'password' => 'wrong'])
            ->assertStatus(429);
    }

    public function test_successful_login_is_logged_in_activity_log(): void
    {
        $this->pegawai(['email' => 'audit@rsudam.test']);

        $this->post('/login', ['email' => 'audit@rsudam.test', 'password' => 'password']);

        $this->assertDatabaseHas('activity_logs', [
            'action' => 'LOGIN',
            'status' => 'SUCCESS',
        ]);
    }

    public function test_failed_login_is_logged_with_warning(): void
    {
        $this->pegawai(['email' => 'audit2@rsudam.test']);

        $this->post('/login', ['email' => 'audit2@rsudam.test', 'password' => 'wrong']);

        $this->assertDatabaseHas('activity_logs', [
            'action'   => 'LOGIN',
            'severity' => 'warning',
            'status'   => 'FAILED',
        ]);
    }

    public function test_authenticated_user_cannot_access_login_page(): void
    {
        $this->actingAs($this->pegawai())
            ->get('/login')
            ->assertRedirect('/');
    }

    public function test_logout_clears_session(): void
    {
        $pegawai = $this->pegawai();

        $this->actingAs($pegawai)
            ->post('/logout')
            ->assertRedirect('/');

        $this->assertGuest();
    }
}
