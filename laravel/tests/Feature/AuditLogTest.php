<?php

namespace Tests\Feature;

use App\Models\ActivityLog;
use Illuminate\Http\Request;
use Tests\TestCase;

class AuditLogTest extends TestCase
{
    public function test_record_creates_database_entry(): void
    {
        ActivityLog::record(
            action: 'CREATE',
            targetType: 'Pegawai',
            targetId: 1,
            targetLabel: 'Test Pegawai (NIP. 123)',
            description: 'Test log entry.',
            changes: ['nama' => ['old' => null, 'new' => 'Test']],
        );

        $this->assertDatabaseHas('activity_logs', [
            'action'       => 'CREATE',
            'target_type'  => 'Pegawai',
            'target_id'    => '1',
            'target_label' => 'Test Pegawai (NIP. 123)',
            'severity'     => 'info',
            'status'       => 'SUCCESS',
        ]);
    }

    public function test_record_captures_pegawai_id_from_auth(): void
    {
        $pegawai = $this->pegawai();
        $this->actingAs($pegawai);

        ActivityLog::record(
            action: 'UPDATE',
            targetType: 'Pegawai',
            targetLabel: 'Test',
            description: 'Test.',
        );

        $this->assertDatabaseHas('activity_logs', [
            'action'     => 'UPDATE',
            'pegawai_id' => $pegawai->id,
        ]);
    }

    public function test_record_with_critical_severity(): void
    {
        ActivityLog::record(
            action: 'DELETE',
            severity: 'critical',
            targetType: 'Pegawai',
            targetLabel: 'Deleted Pegawai',
            description: 'Soft delete.',
        );

        $this->assertDatabaseHas('activity_logs', [
            'action'   => 'DELETE',
            'severity' => 'critical',
        ]);
    }

    public function test_record_captures_ip_and_user_agent(): void
    {
        $request = Request::create('/test', 'POST');
        $request->headers->set('User-Agent', 'TestBrowser/1.0');

        ActivityLog::record(
            action: 'LOGIN',
            targetType: 'Sesi',
            targetLabel: 'Login',
            description: 'Test.',
            request: $request,
        );

        $log = ActivityLog::where('action', 'LOGIN')->latest()->first();
        $this->assertEquals('TestBrowser/1.0', $log->user_agent);
        $this->assertNotNull($log->ip_address);
    }

    public function test_logs_are_immutable_no_updated_at(): void
    {
        $columns = \Illuminate\Support\Facades\Schema::getColumnListing('activity_logs');
        $this->assertNotContains('updated_at', $columns);
        $this->assertContains('created_at', $columns);
    }
}
