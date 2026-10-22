<?php

namespace App\Http\Controllers\Self;

use App\Http\Controllers\Controller;
use App\Models\ActivityLog;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Illuminate\Validation\Rule;

class SelfProfileController extends Controller
{
    public function me(Request $request): JsonResponse
    {
        $user = $request->user();

        return response()->json([
            'status' => 'success',
            'data' => [
                'id'                => $user->id,
                'nip'               => $user->nip,
                'nama'              => $user->nama_lengkap,
                'email'             => $user->email,
                'jabatan'           => $user->jabatan,
                'jabatan_fungsional'=> $user->jabatan_fungsional,
                'unit_kerja'        => $user->unit_kerja,
                'golongan'          => $user->golongan,
                'pangkat'           => $user->pangkat,
                'status_pegawai'    => $user->status_pegawai,
                'no_telp'           => $user->no_telp,
                'alamat'            => $user->alamat,
                'foto'              => $user->foto,
                'sisa_cuti_tahunan' => $user->sisa_cuti_tahunan,
                'roles'             => $user->getRoleNames(),
            ],
        ]);
    }

    public function update(Request $request): JsonResponse
    {
        $user = $request->user();

        $data = $request->validate([
            'no_telp' => 'nullable|string|max:30',
            'alamat'  => 'nullable|string|max:500',
            'email'   => ['nullable', 'email', Rule::unique('m_pegawai', 'email')->ignore($user->id)],
        ]);

        $old = $user->only(['no_telp', 'alamat', 'email']);
        $user->update(array_filter($data, fn($v) => $v !== null));

        ActivityLog::record(
            action: 'UPDATE',
            targetType: 'Pegawai',
            targetId: $user->id,
            targetLabel: $user->nama,
            description: 'Self-service: pembaruan data profil pribadi.',
            changes: ['before' => $old, 'after' => $user->only(['no_telp', 'alamat', 'email'])],
            request: $request,
        );

        return response()->json(['status' => 'success', 'message' => 'Profil berhasil diperbarui.']);
    }

    public function uploadStr(Request $request): JsonResponse
    {
        $request->validate([
            'file' => 'required|file|mimes:pdf,jpg,jpeg,png|max:5120',
        ]);

        $user = $request->user();
        $file = $request->file('file');
        $path = $file->storeAs(
            'public/str',
            $user->id . '_' . $file->getClientOriginalName()
        );

        ActivityLog::record(
            action: 'CREATE',
            targetType: 'STR Renewal',
            targetId: $user->id,
            targetLabel: $user->nama . ' — STR Renewal',
            description: 'Self-service: upload berkas perpanjangan STR.',
            request: $request,
        );

        return response()->json([
            'status'  => 'success',
            'message' => 'Berkas STR berhasil diunggah. Tim HR akan memproses permohonan Anda.',
            'path'    => Storage::url($path),
        ]);
    }

    public function uploadSip(Request $request): JsonResponse
    {
        $request->validate([
            'file' => 'required|file|mimes:pdf,jpg,jpeg,png|max:5120',
        ]);

        $user = $request->user();
        $file = $request->file('file');
        $path = $file->storeAs(
            'public/sip',
            $user->id . '_' . $file->getClientOriginalName()
        );

        ActivityLog::record(
            action: 'CREATE',
            targetType: 'SIP Renewal',
            targetId: $user->id,
            targetLabel: $user->nama . ' — SIP Renewal',
            description: 'Self-service: upload berkas perpanjangan SIP.',
            request: $request,
        );

        return response()->json([
            'status'  => 'success',
            'message' => 'Berkas SIP berhasil diunggah. Tim HR akan memproses permohonan Anda.',
            'path'    => Storage::url($path),
        ]);
    }
}
