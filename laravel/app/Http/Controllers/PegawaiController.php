<?php

namespace App\Http\Controllers;

use App\Models\ActivityLog;
use App\Models\Pegawai;
use App\Http\Requests\StorePegawaiRequest;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;

class PegawaiController extends Controller
{
    /**
     * Tampilkan daftar pegawai dengan filter pencarian, unit kerja, dan status
     */
    public function index(Request $request): JsonResponse
    {
        $this->authorize('pegawai.view');

        $query = Pegawai::query();

        if ($search = $request->input('search')) {
            $query->where(function ($q) use ($search) {
                $q->where('nama', 'like', "%{$search}%")
                  ->orWhere('nip', 'like', "%{$search}%")
                  ->orWhere('jabatan', 'like', "%{$search}%");
            });
        }

        if ($unit = $request->input('unit_kerja')) {
            $query->where('unit_kerja', $unit);
        }

        if ($status = $request->input('status_pegawai')) {
            $query->where('status_pegawai', $status);
        }

        if ($aktif = $request->input('status_aktif')) {
            $query->where('status_aktif', $aktif);
        }

        $perPage = min((int) $request->input('per_page', 15), 100);
        $pegawais = $query->latest('id')->paginate($perPage);

        return response()->json([
            'status' => 'success',
            'data' => $pegawais,
        ]);
    }

    /**
     * Tampilkan profil detail pegawai berserta data keluarga, lisensi STR/SIP, dan SKP
     */
    public function show(Pegawai $pegawai): JsonResponse
    {
        $this->authorize('pegawai.view');

        $pegawai->load([
            'keluarga',
            'dokumen',
            'strList',
            'sipList',
            'credentialings',
            'jadwalShifts' => function ($q) {
                $q->whereBetween('tanggal', [now()->startOfWeek(), now()->endOfWeek()]);
            },
        ]);

        return response()->json([
            'status' => 'success',
            'data' => [
                'pegawai' => $pegawai,
                'sisa_cuti_tahunan' => $pegawai->sisa_cuti_tahunan,
                'nama_lengkap' => $pegawai->nama_lengkap,
            ],
        ]);
    }

    /**
     * Tambah pegawai baru
     */
    public function store(StorePegawaiRequest $request): JsonResponse
    {
        $pegawai = Pegawai::create($request->validated());

        ActivityLog::record(
            action: 'CREATE',
            targetType: 'Pegawai',
            targetId: $pegawai->id,
            targetLabel: $pegawai->nama . ' (NIP. ' . $pegawai->nip . ')',
            description: 'Penambahan data pegawai baru.',
            changes: collect($request->validated())->mapWithKeys(fn($v, $k) => [$k => ['old' => null, 'new' => $v]])->toArray(),
            request: $request,
        );

        return response()->json([
            'status' => 'success',
            'message' => 'Data pegawai berhasil disimpan.',
            'data' => $pegawai,
        ], 201);
    }

    /**
     * Update data pegawai
     */
    public function update(StorePegawaiRequest $request, Pegawai $pegawai): JsonResponse
    {
        $old = $pegawai->only(array_keys($request->validated()));
        $pegawai->update($request->validated());

        $changes = [];
        foreach ($request->validated() as $field => $newVal) {
            if ($old[$field] != $newVal) {
                $changes[$field] = ['old' => $old[$field], 'new' => $newVal];
            }
        }

        ActivityLog::record(
            action: 'UPDATE',
            targetType: 'Pegawai',
            targetId: $pegawai->id,
            targetLabel: $pegawai->nama . ' (NIP. ' . $pegawai->nip . ')',
            description: 'Pembaruan data pegawai.',
            changes: $changes ?: null,
            request: $request,
        );

        return response()->json([
            'status' => 'success',
            'message' => 'Data pegawai berhasil diperbarui.',
            'data' => $pegawai,
        ]);
    }

    /**
     * Hapus pegawai (Soft Delete)
     */
    public function destroy(Request $request, Pegawai $pegawai): JsonResponse
    {
        $this->authorize('pegawai.delete');

        $label = $pegawai->nama . ' (NIP. ' . $pegawai->nip . ')';
        $pegawai->delete();

        ActivityLog::record(
            action: 'DELETE',
            severity: 'critical',
            targetType: 'Pegawai',
            targetId: $pegawai->id,
            targetLabel: $label,
            description: 'Penonaktifan / soft-delete data pegawai.',
            changes: ['status_aktif' => ['old' => $pegawai->status_aktif, 'new' => 'Diberhentikan']],
            request: $request,
        );

        return response()->json([
            'status' => 'success',
            'message' => 'Pegawai berhasil dinonaktifkan.',
        ]);
    }
}
