<?php

namespace App\Services;

use App\Models\IntegrationLog;
use App\Models\Pegawai;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class SiasnService
{
    private string $baseUrl;
    private string $ssoUrl;
    private string $clientId;
    private string $clientSecret;
    private int $timeout;

    public function __construct()
    {
        $this->baseUrl       = config('integrations.siasn.base_url');
        $this->ssoUrl        = config('integrations.siasn.sso_url');
        $this->clientId      = config('integrations.siasn.client_id');
        $this->clientSecret  = config('integrations.siasn.client_secret');
        $this->timeout       = config('integrations.siasn.timeout', 30);
    }

    public function isConfigured(): bool
    {
        return ! empty($this->clientId) && ! empty($this->clientSecret);
    }

    private function getAccessToken(): string
    {
        // ponytail: 59-minute cache — BKN SSO token TTL is 60m by default
        return Cache::remember('siasn_token', 3540, function () {
            $response = Http::timeout($this->timeout)
                ->retry(3, 500)
                ->asForm()
                ->post($this->ssoUrl, [
                    'grant_type'    => 'client_credentials',
                    'client_id'     => $this->clientId,
                    'client_secret' => $this->clientSecret,
                ]);

            if ($response->failed()) {
                throw new \RuntimeException('SIASN SSO OAuth2 failed: ' . $response->body());
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

    public function getPegawaiByNip(string $nip): array
    {
        try {
            $response = Http::timeout($this->timeout)
                ->retry(3, 500)
                ->withHeaders($this->getHeaders())
                ->get("{$this->baseUrl}/apisiasn/1.0/pns/data-utama-nip/{$nip}");

            return ['success' => $response->successful(), 'data' => $response->json()];
        } catch (\Throwable $e) {
            Log::error('[SIASN] getPegawaiByNip error', ['nip' => $nip, 'error' => $e->getMessage()]);
            return ['success' => false, 'data' => null, 'error' => $e->getMessage()];
        }
    }

    public function syncRiwayatJabatan(Pegawai $pegawai): array
    {
        try {
            $response = Http::timeout($this->timeout)
                ->retry(3, 500)
                ->withHeaders($this->getHeaders())
                ->get("{$this->baseUrl}/apisiasn/1.0/pns/riwayat-jabatan/{$pegawai->nip}");

            if ($response->failed()) {
                throw new \RuntimeException('SIASN riwayat-jabatan request failed: ' . $response->body());
            }

            $rows = $response->json('data') ?? [];
            $upserted = 0;

            foreach ($rows as $row) {
                DB::table('t_riwayat_jabatan')->updateOrInsert(
                    [
                        'pegawai_id'  => $pegawai->id,
                        'no_sk'       => $row['noSk'] ?? null,
                    ],
                    [
                        'nama_jabatan' => $row['namaJabatan'] ?? null,
                        'unit_kerja'   => $row['namaUnorInduk'] ?? null,
                        'tmt_jabatan'  => $row['tmtJabatan'] ?? null,
                        'tgl_sk'       => $row['tglSk'] ?? null,
                        'updated_at'   => now(),
                    ]
                );
                $upserted++;
            }

            IntegrationLog::record(
                service:         'siasn',
                action:          'sync_riwayat_jabatan',
                status:          'success',
                responsePayload: ['upserted' => $upserted],
                pegawaiId:       $pegawai->id,
            );

            return ['success' => true, 'upserted' => $upserted];
        } catch (\Throwable $e) {
            IntegrationLog::record(
                service:      'siasn',
                action:       'sync_riwayat_jabatan',
                status:       'failed',
                errorMessage: $e->getMessage(),
                pegawaiId:    $pegawai->id,
            );

            Log::error('[SIASN] syncRiwayatJabatan error', ['nip' => $pegawai->nip, 'error' => $e->getMessage()]);

            return ['success' => false, 'error' => $e->getMessage()];
        }
    }

    public function syncKenaikanPangkat(Pegawai $pegawai): array
    {
        try {
            $response = Http::timeout($this->timeout)
                ->retry(3, 500)
                ->withHeaders($this->getHeaders())
                ->get("{$this->baseUrl}/apisiasn/1.0/pns/riwayat-golongan/{$pegawai->nip}");

            if ($response->failed()) {
                throw new \RuntimeException('SIASN riwayat-golongan request failed: ' . $response->body());
            }

            $rows = $response->json('data') ?? [];
            $upserted = 0;

            foreach ($rows as $row) {
                DB::table('t_kenaikan_pangkat')->updateOrInsert(
                    [
                        'pegawai_id' => $pegawai->id,
                        'no_sk'      => $row['noSk'] ?? null,
                    ],
                    [
                        'golongan'   => $row['namaGolRuang'] ?? null,
                        'tmt'        => $row['tmt'] ?? null,
                        'tgl_sk'     => $row['tglSk'] ?? null,
                        'updated_at' => now(),
                    ]
                );
                $upserted++;
            }

            IntegrationLog::record(
                service:         'siasn',
                action:          'sync_kenaikan_pangkat',
                status:          'success',
                responsePayload: ['upserted' => $upserted],
                pegawaiId:       $pegawai->id,
            );

            return ['success' => true, 'upserted' => $upserted];
        } catch (\Throwable $e) {
            IntegrationLog::record(
                service:      'siasn',
                action:       'sync_kenaikan_pangkat',
                status:       'failed',
                errorMessage: $e->getMessage(),
                pegawaiId:    $pegawai->id,
            );

            Log::error('[SIASN] syncKenaikanPangkat error', ['nip' => $pegawai->nip, 'error' => $e->getMessage()]);

            return ['success' => false, 'error' => $e->getMessage()];
        }
    }

    public function bulkSync(): array
    {
        $synced = 0;
        $failed = 0;

        $pns = Pegawai::where('status_aktif', 'Aktif')
            ->whereIn('status_pegawai', ['PNS', 'PPPK'])
            ->get();

        foreach ($pns as $pegawai) {
            $jabatan  = $this->syncRiwayatJabatan($pegawai);
            $pangkat  = $this->syncKenaikanPangkat($pegawai);

            if ($jabatan['success'] && $pangkat['success']) {
                $synced++;
            } else {
                $failed++;
            }

            usleep(100_000); // ponytail: 100ms rate-limit; tune to BKN quota
        }

        return ['synced' => $synced, 'failed' => $failed];
    }
}
