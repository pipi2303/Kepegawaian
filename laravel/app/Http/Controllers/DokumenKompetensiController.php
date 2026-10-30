<?php

namespace App\Http\Controllers;

use App\Models\ActivityLog;
use App\Models\DokumenKompetensi;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class DokumenKompetensiController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $query = DokumenKompetensi::with('pegawai:id,nama,jabatan,unit_kerja');

        if ($pid = $request->input('pegawai_id')) {
            $query->where('pegawai_id', $pid);
        }
        if ($jenis = $request->input('jenis_dokumen')) {
            $query->where('jenis_dokumen', $jenis);
        }
        if ($status = $request->input('status')) {
            $query->where('status', $status);
        }

        return response()->json([
            'status' => 'success',
            'data'   => $query->orderBy('tanggal_expired')->paginate(30),
        ]);
    }

    public function expiringSoon(): JsonResponse
    {
        $expiring = DokumenKompetensi::with('pegawai:id,nama,jabatan,unit_kerja')
            ->expiringWithin(90)
            ->orderBy('tanggal_expired')
            ->get();

        $summary = [
            'total_expiring' => $expiring->count(),
            'by_jenis'       => $expiring->groupBy('jenis_dokumen')->map->count(),
            'expired'        => DokumenKompetensi::where('status', 'Expired')->count(),
        ];

        return response()->json(['status' => 'success', 'data' => $expiring, 'summary' => $summary]);
    }

    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'pegawai_id'       => 'required|exists:m_pegawai,id',
            'jenis_dokumen'    => 'required|string',
            'nama_dokumen'     => 'required|string|max:200',
            'nomor_sertifikat' => 'nullable|string|max:100',
            'penyelenggara'    => 'nullable|string|max:200',
            'tanggal_terbit'   => 'required|date',
            'tanggal_expired'  => 'required|date|after:tanggal_terbit',
            'file_dokumen'     => 'nullable|string|max:500',
            'keterangan'       => 'nullable|string|max:1000',
        ]);

        $doc = new DokumenKompetensi($validated);
        $doc->updateStatus();
        $doc->save();

        ActivityLog::record(
            action: 'CREATE',
            targetType: 'DokumenKompetensi',
            targetId: $doc->id,
            targetLabel: ($doc->pegawai->nama ?? '-') . " — {$doc->jenis_dokumen}",
            description: "Dokumen {$doc->jenis_dokumen} ditambahkan. Expired: {$doc->tanggal_expired->format('d/m/Y')}.",
            request: $request,
        );

        return response()->json(['status' => 'success', 'data' => $doc->load('pegawai')], 201);
    }

    public function update(Request $request, DokumenKompetensi $dokumenKompetensi): JsonResponse
    {
        $validated = $request->validate([
            'jenis_dokumen'    => 'sometimes|string',
            'nama_dokumen'     => 'sometimes|string|max:200',
            'nomor_sertifikat' => 'nullable|string|max:100',
            'penyelenggara'    => 'nullable|string|max:200',
            'tanggal_terbit'   => 'sometimes|date',
            'tanggal_expired'  => 'sometimes|date',
            'file_dokumen'     => 'nullable|string|max:500',
            'keterangan'       => 'nullable|string|max:1000',
        ]);

        $dokumenKompetensi->update($validated);
        $dokumenKompetensi->updateStatus();
        $dokumenKompetensi->save();

        return response()->json(['status' => 'success', 'data' => $dokumenKompetensi->load('pegawai')]);
    }

    public function destroy(DokumenKompetensi $dokumenKompetensi): JsonResponse
    {
        $label = ($dokumenKompetensi->pegawai->nama ?? '-') . " — {$dokumenKompetensi->jenis_dokumen}";
        $dokumenKompetensi->delete();
        ActivityLog::record(action: 'DELETE', targetType: 'DokumenKompetensi', targetLabel: $label,
            description: 'Dokumen kompetensi dihapus.');
        return response()->json(['status' => 'success']);
    }
}
