<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Http\Request;

class ActivityLog extends Model
{
    public $timestamps = false;

    protected $fillable = [
        'pegawai_id', 'action', 'severity', 'status',
        'target_type', 'target_id', 'target_label',
        'description', 'changes', 'ip_address', 'user_agent',
    ];

    protected $casts = [
        'changes' => 'array',
        'created_at' => 'datetime',
    ];

    public static function record(
        string $action,
        string $targetType,
        string $targetLabel,
        string $description,
        string $severity = 'info',
        int|string|null $targetId = null,
        ?array $changes = null,
        string $status = 'SUCCESS',
        ?Request $request = null,
        ?int $pegawaiId = null,
    ): void {
        try {
            static::create([
                'pegawai_id'   => $pegawaiId ?? auth()->id(),
                'action'       => $action,
                'severity'     => $severity,
                'status'       => $status,
                'target_type'  => $targetType,
                'target_id'    => $targetId,
                'target_label' => $targetLabel,
                'description'  => $description,
                'changes'      => $changes,
                'ip_address'   => $request?->ip(),
                'user_agent'   => $request?->userAgent(),
            ]);
        } catch (\Throwable $e) {
            // Jangan crash operasi utama jika logging gagal
            error_log('[ActivityLog] Failed to write: ' . $e->getMessage());
        }
    }

    public function pegawai()
    {
        return $this->belongsTo(Pegawai::class);
    }
}
