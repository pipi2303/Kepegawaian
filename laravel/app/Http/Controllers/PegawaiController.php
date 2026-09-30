<?php

namespace App\Http\Controllers;

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

        $perPage = (int) $request->input('per_page', 15);
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
        $pegawai->update($request->validated());

        return response()->json([
            'status' => 'success',
            'message' => 'Data pegawai berhasil diperbarui.',
            'data' => $pegawai,
        ]);
    }

    /**
     * Hapus pegawai (Soft Delete)
     */
    public function destroy(Pegawai $pegawai): JsonResponse
    {
        $pegawai->delete();

        return response()->json([
            'status' => 'success',
            'message' => 'Pegawai berhasil dinonaktifkan.',
        ]);
    }
}
