<?php

namespace App\Services;

use App\Models\IntegrationLog;
use App\Models\Pegawai;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class SatuSehatService
{
    private string $baseUrl;
    private string $authUrl;
    private string $clientId;
    private string $clientSecret;
    private string $orgId;
    private int $timeout;
    private int $retry;

    public function __construct()
    {
        $this->baseUrl       = config('integrations.satusehat.base_url');
        $this->authUrl       = config('integrations.satusehat.auth_url');
        $this->clientId      = config('integrations.satusehat.client_id');
        $this->clientSecret  = config('integrations.satusehat.client_secret');
        $this->orgId         = config('integrations.satusehat.org_id');
        $this->timeout       = config('integrations.satusehat.timeout', 30);
        $this->retry         = config('integrations.satusehat.retry', 3);
    }

    public function isConfigured(): bool
    {
        return ! empty($this->clientId) && ! empty($this->clientSecret);
    }

    private function getAccessToken(): string
    {
        // ponytail: 59-minute cache — token TTL is typically 60m; adjust if SATUSEHAT shortens it
        return Cache::remember('satusehat_token', 3540, function () {
            $response = Http::timeout($this->timeout)
                ->retry($this->retry, 500)
                ->asForm()
                ->post($this->authUrl, [
                    'grant_type'    => 'client_credentials',
                    'client_id'     => $this->clientId,
                    'client_secret' => $this->clientSecret,
                ]);

            if ($response->failed()) {
                throw new \RuntimeException('SATUSEHAT OAuth2 failed: ' . $response->body());
            }

            return $response->json('access_token');
        });
    }

    private function getHeaders(): array
    {
        return [
            'Authorization' => 'Bearer ' . $this->getAccessToken(),
            'Content-Type'  => 'application/json',
        ];
    }

    private function buildPractitionerResource(Pegawai $pegawai): array
    {
        return [
            'resourceType' => 'Practitioner',
            'identifier'   => [
                [
                    'system' => 'https://nakes.kemkes.go.id/nip',
                    'value'  => $pegawai->nip,
                ],
            ],
            'active'    => $pegawai->status_aktif === 'Aktif',
            'name'      => [
                [
                    'use'    => 'official',
                    'text'   => $pegawai->nama_lengkap,
                    'family' => $pegawai->nama,
                    'prefix' => [$pegawai->gelar_depan ?? ''],
                ],
            ],
            'gender'    => $pegawai->jenis_kelamin === 'L' ? 'male' : 'female',
            'birthDate' => $pegawai->tanggal_lahir?->format('Y-m-d'),
        ];
    }

    public function syncPractitioner(Pegawai $pegawai): array
    {
        $payload = $this->buildPractitionerResource($pegawai);

        try {
            $response = Http::timeout($this->timeout)
                ->retry($this->retry, 500)
                ->withHeaders($this->getHeaders())
                ->put("{$this->baseUrl}/fhir-r4/v1/Practitioner/{$pegawai->nip}", $payload);

            $success = $response->successful();

            IntegrationLog::record(
                service:         'satusehat',
                action:          'sync_practitioner',
                status:          $success ? 'success' : 'failed',
                requestPayload:  $payload,
                responsePayload: $response->json(),
                errorMessage:    $success ? null : $response->body(),
                pegawaiId:       $pegawai->id,
            );

            return ['success' => $success, 'data' => $response->json()];
        } catch (\Throwable $e) {
            IntegrationLog::record(
                service:        'satusehat',
                action:         'sync_practitioner',
                status:         'failed',
                requestPayload: $payload,
                errorMessage:   $e->getMessage(),
                pegawaiId:      $pegawai->id,
            );

            Log::error('[SatuSehat] syncPractitioner error', ['nip' => $pegawai->nip, 'error' => $e->getMessage()]);

            return ['success' => false, 'data' => null, 'error' => $e->getMessage()];
        }
    }

    public function getPractitioner(string $nip): array
    {
        try {
            $response = Http::timeout($this->timeout)
                ->retry($this->retry, 500)
                ->withHeaders($this->getHeaders())
                ->get("{$this->baseUrl}/fhir-r4/v1/Practitioner", ['identifier' => $nip]);

            return ['success' => $response->successful(), 'data' => $response->json()];
        } catch (\Throwable $e) {
            Log::error('[SatuSehat] getPractitioner error', ['nip' => $nip, 'error' => $e->getMessage()]);
            return ['success' => false, 'data' => null, 'error' => $e->getMessage()];
        }
    }

    public function syncOrganization(): array
    {
        try {
            $response = Http::timeout($this->timeout)
                ->retry($this->retry, 500)
                ->withHeaders($this->getHeaders())
                ->get("{$this->baseUrl}/fhir-r4/v1/Organization/{$this->orgId}");

            return ['success' => $response->successful(), 'data' => $response->json()];
        } catch (\Throwable $e) {
            Log::error('[SatuSehat] syncOrganization error', ['error' => $e->getMessage()]);
            return ['success' => false, 'data' => null, 'error' => $e->getMessage()];
        }
    }

    public function bulkSyncNakes(): array
    {
        $synced = 0;
        $failed = 0;
        $errors = [];

        // Only sync active nakes who have STR or SIP on record
        $nakes = Pegawai::where('status_aktif', 'Aktif')
            ->where(function ($q) {
                $q->whereHas('strList')->orWhereHas('sipList');
            })
            ->get();

        foreach ($nakes as $pegawai) {
            $result = $this->syncPractitioner($pegawai);

            if ($result['success']) {
                $synced++;
            } else {
                $failed++;
                $errors[] = ['nip' => $pegawai->nip, 'error' => $result['error'] ?? 'Unknown'];
            }

            usleep(100_000); // ponytail: 100ms rate-limit; lower if Kemenkes raises quota
        }

        return ['synced' => $synced, 'failed' => $failed, 'errors' => $errors];
    }
}
