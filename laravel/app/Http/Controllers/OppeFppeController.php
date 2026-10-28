<?php

namespace App\Http\Controllers;

use App\Models\ActivityLog;
use App\Models\OppeFppe;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class OppeFppeController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $query = OppeFppe::with([
            'pegawai:id,nip,nama,jabatan,unit_kerja',
            'penilai:id,nama',
        ]);

        if ($jenis = $request->input('jenis')) {
            $query->where('jenis', $jenis);
        }
        if ($status = $request->input('status')) {
            $query->where('status', $status);
        }
        if ($smf = $request->input('smf')) {
            $query->where('smf', $smf);
        }
        if ($periode = $request->input('periode')) {
            $query->where('periode', $periode);
        }

        return response()->json([
            'status' => 'success',
            'data'   => $query->latest('id')->paginate(20),
        ]);
    }

    public function summary(): JsonResponse
    {
        $total        = OppeFppe::count();
        $selesai      = OppeFppe::where('status', 'Selesai')->count();
        $berlangsung  = OppeFppe::where('status', 'Berlangsung')->count();
        $tindakLanjut = OppeFppe::where('status', 'Tindak Lanjut')->count();

        $rekomendasiDist = OppeFppe::where('status', 'Selesai')
            ->whereNotNull('rekomendasi')
            ->selectRaw('rekomendasi, count(*) as jumlah')
            ->groupBy('rekomendasi')
            ->pluck('jumlah', 'rekomendasi');

        $rataRata = OppeFppe::where('status', 'Selesai')
            ->whereNotNull('nilai_total')
            ->avg('nilai_total');

        $smfList = OppeFppe::distinct()->whereNotNull('smf')->pluck('smf')->sort()->values();
        $periodeList = OppeFppe::distinct()->orderByDesc('periode')->pluck('periode')->unique()->values();

        return response()->json([
            'status' => 'success',
            'data'   => [
                'total'          => $total,
                'selesai'        => $selesai,
                'berlangsung'    => $berlangsung,
                'tindak_lanjut'  => $tindakLanjut,
                'pct_complete'   => $total > 0 ? round($selesai / $total * 100, 1) : 0,
                'rata_nilai'     => $rataRata ? round($rataRata, 1) : null,
                'rekomendasi'    => $rekomendasiDist,
                'smf_list'       => $smfList,
                'periode_list'   => $periodeList,
            ],
        ]);
    }

    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'pegawai_id'         => 'required|exists:m_pegawai,id',
            'credentialing_id'   => 'nullable|exists:t_credentialing,id',
            'jenis'              => 'required|in:OPPE,FPPE',
            'periode'            => 'required|string|max:50',
            'smf'                => 'nullable|string|max:100',
            'tanggal_mulai'      => 'required|date',
            'tanggal_selesai'    => 'nullable|date|after_or_equal:tanggal_mulai',
            'status'             => 'required|in:Draft,Berlangsung,Selesai,Tindak Lanjut',
            'jumlah_kasus'       => 'nullable|integer|min:0',
            'jumlah_komplikasi'  => 'nullable|integer|min:0',
            'alos'               => 'nullable|numeric|min:0',
            'kepatuhan_cp'       => 'nullable|numeric|min:0|max:100',
            'kelengkapan_klpcm'  => 'nullable|numeric|min:0|max:100',
            'nilai_rekan'        => 'nullable|numeric|min:0|max:100',
            'catatan_rekan'      => 'nullable|string|max:2000',
            'rekomendasi'        => 'nullable|in:Lanjutkan Kewenangan,Supervisi Ketat,Batasi Kewenangan,Cabut Kewenangan',
            'catatan_komite'     => 'nullable|string|max:2000',
            'penilai_id'         => 'nullable|exists:m_pegawai,id',
            'tanggal_keputusan'  => 'nullable|date',
        ]);

        $oppe = OppeFppe::create($validated);
        $oppe->nilai_total = $oppe->hitungNilai();
        $oppe->save();

        ActivityLog::record(
            action: 'CREATE',
            targetType: $oppe->jenis,
            targetId: $oppe->id,
            targetLabel: ($oppe->pegawai->nama ?? '-') . ' — ' . $oppe->jenis . ' ' . $oppe->periode,
            description: 'Evaluasi ' . $oppe->jenis . ' dibuat untuk periode ' . $oppe->periode . '.',
            request: $request,
        );

        return response()->json([
            'status' => 'success',
            'data'   => $oppe->load('pegawai'),
        ], 201);
    }

    public function update(Request $request, OppeFppe $oppe): JsonResponse
    {
        $validated = $request->validate([
            'credentialing_id'   => 'nullable|exists:t_credentialing,id',
            'jenis'              => 'sometimes|in:OPPE,FPPE',
            'periode'            => 'sometimes|string|max:50',
            'smf'                => 'nullable|string|max:100',
            'tanggal_mulai'      => 'sometimes|date',
            'tanggal_selesai'    => 'nullable|date',
            'status'             => 'sometimes|in:Draft,Berlangsung,Selesai,Tindak Lanjut',
            'jumlah_kasus'       => 'nullable|integer|min:0',
            'jumlah_komplikasi'  => 'nullable|integer|min:0',
            'alos'               => 'nullable|numeric|min:0',
            'kepatuhan_cp'       => 'nullable|numeric|min:0|max:100',
            'kelengkapan_klpcm'  => 'nullable|numeric|min:0|max:100',
            'nilai_rekan'        => 'nullable|numeric|min:0|max:100',
            'catatan_rekan'      => 'nullable|string|max:2000',
            'rekomendasi'        => 'nullable|in:Lanjutkan Kewenangan,Supervisi Ketat,Batasi Kewenangan,Cabut Kewenangan',
            'catatan_komite'     => 'nullable|string|max:2000',
            'penilai_id'         => 'nullable|exists:m_pegawai,id',
            'tanggal_keputusan'  => 'nullable|date',
        ]);

        $oppe->update($validated);
        $oppe->nilai_total = $oppe->hitungNilai();
        $oppe->save();

        ActivityLog::record(
            action: 'UPDATE',
            targetType: $oppe->jenis,
            targetId: $oppe->id,
            targetLabel: ($oppe->pegawai->nama ?? '-') . ' — ' . $oppe->jenis . ' ' . $oppe->periode,
            description: 'Data evaluasi ' . $oppe->jenis . ' diperbarui. Status: ' . $oppe->status . '.',
            request: $request,
        );

        return response()->json([
            'status' => 'success',
            'data'   => $oppe->load('pegawai'),
        ]);
    }

    public function destroy(OppeFppe $oppe): JsonResponse
    {
        $label = ($oppe->pegawai->nama ?? '-') . ' — ' . $oppe->jenis . ' ' . $oppe->periode;
        $oppe->delete();

        ActivityLog::record(
            action: 'DELETE',
            targetType: $oppe->jenis,
            targetLabel: $label,
            description: 'Data evaluasi ' . $oppe->jenis . ' dihapus.',
        );

        return response()->json(['status' => 'success']);
    }
}
