<?php

namespace App\Http\Controllers;

use App\Models\Formasi;
use App\Models\Lamaran;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;

class PublicRekrutmenController extends Controller
{
    public function formasiAktif(): JsonResponse
    {
        $formasi = Formasi::aktif()
            ->select([
                'id', 'jabatan', 'unit_kerja', 'kualifikasi_pendidikan',
                'jurusan_dibutuhkan', 'jumlah_formasi', 'gaji_min', 'gaji_max',
                'status_pegawai_target', 'persyaratan_khusus',
                'batas_usia_min', 'batas_usia_max', 'tanggal_tutup',
            ])
            ->withCount('lamaran')
            ->get();

        return response()->json(['status' => 'success', 'data' => $formasi]);
    }

    public function daftar(Request $request): JsonResponse
    {
        $data = $request->validate([
            'formasi_id'          => 'required|exists:t_formasi_jabatan,id',
            'nama_lengkap'        => 'required|string|max:255',
            'nip_lama'            => 'nullable|string|max:30',
            'tempat_lahir'        => 'required|string|max:100',
            'tanggal_lahir'       => 'required|date',
            'jenis_kelamin'       => 'required|in:L,P',
            'agama'               => 'required|string|max:50',
            'alamat'              => 'required|string',
            'no_hp'               => 'required|string|max:25',
            'email'               => 'required|email|max:100',
            'pendidikan_terakhir' => 'required|string|max:50',
            'jurusan'             => 'required|string|max:150',
            'institusi'           => 'required|string|max:255',
            'ipk'                 => 'nullable|numeric|min:0|max:4',
            'pengalaman_kerja'    => 'nullable|string',
        ]);

        $formasi = Formasi::findOrFail($data['formasi_id']);

        if ($formasi->status !== 'Aktif' || $formasi->tanggal_tutup->lt(now())) {
            return response()->json(['status' => 'error', 'message' => 'Formasi sudah ditutup'], 422);
        }

        $duplicate = Lamaran::where('email', $data['email'])
            ->where('formasi_id', $data['formasi_id'])
            ->exists();

        if ($duplicate) {
            return response()->json(['status' => 'error', 'message' => 'Email sudah terdaftar untuk formasi ini'], 422);
        }

        $lamaran = Lamaran::create(array_merge($data, ['status' => 'Diterima']));

        return response()->json([
            'status'         => 'success',
            'nomor_lamaran'  => $lamaran->id,
            'pesan'          => 'Lamaran berhasil dikirim',
        ], 201);
    }

    public function statusLamaran(Request $request): JsonResponse
    {
        $request->validate([
            'email'      => 'required|email',
            'formasi_id' => 'required|integer',
        ]);

        $lamaran = Lamaran::where('email', $request->input('email'))
            ->where('formasi_id', $request->integer('formasi_id'))
            ->first();

        if (! $lamaran) {
            return response()->json(['status' => 'error', 'message' => 'Data lamaran tidak ditemukan'], 404);
        }

        $result = ['status' => $lamaran->status];
        if ($lamaran->catatan_admin) $result['catatan_admin'] = $lamaran->catatan_admin;
        if (in_array($lamaran->status, ['Lolos', 'Tidak Lolos'])) $result['nilai_tes'] = $lamaran->nilai_tes;

        return response()->json(['status' => 'success', 'data' => $result]);
    }
}
