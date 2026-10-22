<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class IntegrationLog extends Model
{
    protected $table = 'integration_logs';

    public $timestamps = false;

    protected $fillable = [
        'service',
        'action',
        'status',
        'request_payload',
        'response_payload',
        'error_message',
        'pegawai_id',
    ];

    protected $casts = [
        'request_payload'  => 'array',
        'response_payload' => 'array',
        'created_at'       => 'datetime',
    ];

    public function pegawai()
    {
        return $this->belongsTo(Pegawai::class);
    }

    public static function record(
        string $service,
        string $action,
        string $status,
        ?array $requestPayload = null,
        ?array $responsePayload = null,
        ?string $errorMessage = null,
        ?int $pegawaiId = null,
    ): void {
        try {
            static::create([
                'service'          => $service,
                'action'           => $action,
                'status'           => $status,
                'request_payload'  => $requestPayload,
                'response_payload' => $responsePayload,
                'error_message'    => $errorMessage,
                'pegawai_id'       => $pegawaiId,
            ]);
        } catch (\Throwable $e) {
            error_log('[IntegrationLog] Failed to write: ' . $e->getMessage());
        }
    }
}
