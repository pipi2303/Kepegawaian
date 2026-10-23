<?php

namespace App\Http\Controllers;

use App\Models\SKPDetail;
use App\Models\SKPHeader;
use App\Models\ActivityLog;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class SKPController extends Controller
{
    private function predikat(float $nilai): string
    {
        if ($nilai >= 110) return 'Sangat Baik';
        if ($nilai >= 90)  return 'Baik';
        if ($nilai >= 70)  return 'Cukup';
        if ($nilai >= 50)  return 'Kurang';
        return 'Sangat Kurang';
    }

    private function canViewOwn(): bool
    {
        $user = auth()->user();
        return $user->hasPermissionTo('skp.view-own') || $user->hasPermissionTo('skp.view-all');
    }

    private function canViewAll(): bool
    {
        return auth()->user()->hasPermissionTo('skp.view-all');
    }

    public function index(Request $request)
    {
        abort_unless($this->canViewOwn(), 403);

        $q = SKPHeader::with(['pegawai:id,nip,nama,jabatan,unit_kerja', 'penilai:id,nama']);

        if (!$this->canViewAll()) {
            $q->where('pegawai_id', auth()->id());
        }

        if ($v = $request->pegawai_id) $q->where('pegawai_id', $v);
        if ($v = $request->tahun)      $q->where('tahun', $v);
        if ($v = $request->semester)   $q->where('semester', $v);
        if ($v = $request->status)     $q->where('status', $v);
        if ($v = $request->unit_kerja) {
            $q->whereHas('pegawai', fn($pq) => $pq->where('unit_kerja', 'like', "%$v%"));
        }

        return response()->json(['status' => 'success', 'data' => $q->latest()->paginate(20)]);
    }

    public function show(SKPHeader $skp)
    {
        abort_unless($this->canViewAll() || $skp->pegawai_id === auth()->id(), 403);

        return response()->json([
            'status' => 'success',
            'data'   => $skp->load(['pegawai', 'penilai', 'details']),
        ]);
    }

    public function store(Request $request)
    {
        $user = auth()->user();
        abort_unless(
            $user->hasPermissionTo('pegawai.edit') || $this->canViewOwn(),
            403
        );

        $data = $request->validate([
            'pegawai_id'                              => 'required|exists:m_pegawai,id',
            'tahun'                                   => 'required|integer|min:2000|max:2100',
            'semester'                                => 'required|in:1,2',
            'details'                                 => 'required|array|min:1',
            'details.*.aspek'                         => 'nullable|string',
            'details.*.rencana_kinerja_atasan'        => 'nullable|string',
            'details.*.rencana_kinerja_individu'      => 'required|string',
            'details.*.indikator_kinerja_individu'    => 'required|string',
            'details.*.target_min'                    => 'nullable|numeric',
            'details.*.target_max'                    => 'nullable|numeric',
            'details.*.satuan'                        => 'required|string',
        ]);

        $exists = SKPHeader::where('pegawai_id', $data['pegawai_id'])
            ->where('tahun', $data['tahun'])
            ->where('semester', $data['semester'])
            ->exists();

        abort_if($exists, 422, 'SKP untuk pegawai, tahun, dan semester ini sudah ada.');

        $skp = DB::transaction(function () use ($data) {
            $skp = SKPHeader::create([
                'pegawai_id' => $data['pegawai_id'],
                'tahun'      => $data['tahun'],
                'semester'   => $data['semester'],
                'status'     => 'Draft',
            ]);
            foreach ($data['details'] as $d) {
                $skp->details()->create($d);
            }
            return $skp;
        });

        ActivityLog::record(
            action: 'CREATE', severity: 'info', targetType: 'SKP',
            targetLabel: "SKP #{$skp->id}",
            description: "Membuat SKP baru untuk pegawai #{$data['pegawai_id']} Sem.{$data['semester']}/{$data['tahun']}",
            request: $request,
        );

        return response()->json(['status' => 'success', 'data' => $skp->load('details')], 201);
    }

    public function update(Request $request, SKPHeader $skp)
    {
        abort_unless(in_array($skp->status, ['Draft', 'Diajukan']), 422, 'Hanya SKP Draft atau Diajukan yang dapat diedit.');
        abort_unless($this->canViewAll() || $skp->pegawai_id === auth()->id(), 403);

        $data = $request->validate([
            'pegawai_id'                              => 'sometimes|exists:m_pegawai,id',
            'tahun'                                   => 'sometimes|integer',
            'semester'                                => 'sometimes|in:1,2',
            'details'                                 => 'required|array|min:1',
            'details.*.aspek'                         => 'nullable|string',
            'details.*.rencana_kinerja_atasan'        => 'nullable|string',
            'details.*.rencana_kinerja_individu'      => 'required|string',
            'details.*.indikator_kinerja_individu'    => 'required|string',
            'details.*.target_min'                    => 'nullable|numeric',
            'details.*.target_max'                    => 'nullable|numeric',
            'details.*.satuan'                        => 'required|string',
        ]);

        DB::transaction(function () use ($skp, $data) {
            $skp->update(array_diff_key($data, ['details' => '']));
            $skp->details()->delete();
            foreach ($data['details'] as $d) {
                $skp->details()->create($d);
            }
        });

        ActivityLog::record(
            action: 'UPDATE', severity: 'info', targetType: 'SKP',
            targetLabel: "SKP #{$skp->id}",
            description: "Memperbarui SKP #{$skp->id}",
            request: $request,
        );

        return response()->json(['status' => 'success', 'data' => $skp->fresh()->load('details')]);
    }

    public function ajukan(SKPHeader $skp)
    {
        abort_unless($skp->pegawai_id === auth()->id(), 403);
        abort_unless($skp->status === 'Draft', 422, 'Hanya SKP Draft yang dapat diajukan.');

        $skp->update(['status' => 'Diajukan']);

        return response()->json(['status' => 'success', 'message' => 'SKP berhasil diajukan.']);
    }

    public function nilai(Request $request, SKPHeader $skp)
    {
        abort_unless(auth()->user()->hasPermissionTo('skp.review-atasan'), 403);
        abort_unless($skp->status === 'Diajukan', 422, 'Hanya SKP Diajukan yang dapat dinilai.');

        $data = $request->validate([
            'nilai_hasil_kerja'   => 'required|numeric|min:0|max:100',
            'nilai_perilaku'      => 'required|numeric|min:0|max:100',
            'catatan_atasan'      => 'nullable|string',
            'pejabat_penilai_id'  => 'required|exists:m_pegawai,id',
        ]);

        $nilaiAkhir = ($data['nilai_hasil_kerja'] * 0.70) + ($data['nilai_perilaku'] * 0.30);

        $skp->update([
            'nilai_hasil_kerja'  => $data['nilai_hasil_kerja'],
            'nilai_perilaku'     => $data['nilai_perilaku'],
            'nilai_akhir'        => $nilaiAkhir,
            'predikat'           => $this->predikat($nilaiAkhir),
            'catatan_atasan'     => $data['catatan_atasan'],
            'pejabat_penilai_id' => $data['pejabat_penilai_id'],
            'status'             => 'Dinilai',
            'tanggal_penilaian'  => now()->toDateString(),
        ]);

        ActivityLog::record(
            action: 'UPDATE', severity: 'info', targetType: 'SKP',
            targetLabel: "SKP #{$skp->id}",
            description: "Menilai SKP #{$skp->id}: nilai_akhir={$nilaiAkhir}, predikat={$skp->predikat}",
            request: $request,
        );

        return response()->json(['status' => 'success', 'data' => $skp->fresh()]);
    }

    public function setujui(SKPHeader $skp)
    {
        abort_unless(auth()->user()->hasPermissionTo('skp.approve'), 403);
        abort_unless($skp->status === 'Dinilai', 422, 'Hanya SKP Dinilai yang dapat disetujui.');

        $skp->update(['status' => 'Disetujui']);

        ActivityLog::record(
            action: 'UPDATE', severity: 'info', targetType: 'SKP',
            targetLabel: "SKP #{$skp->id}",
            description: "Menyetujui SKP #{$skp->id}",
            request: request(),
        );

        return response()->json(['status' => 'success', 'message' => 'SKP berhasil disetujui.']);
    }

    public function updateRealisasi(Request $request, SKPDetail $detail)
    {
        abort_unless($detail->skp->pegawai_id === auth()->id(), 403);

        $data = $request->validate([
            'realisasi'      => 'required|numeric',
            'capaian_persen' => 'nullable|numeric',
            'bukti_dukung'   => 'nullable|string',
            'umpan_balik_berkelanjutan' => 'nullable|string',
        ]);

        $capaian = $data['capaian_persen'] ?? null;
        if ($capaian === null && $detail->target_max > 0) {
            $capaian = min(($data['realisasi'] / $detail->target_max) * 100, 120);
        }

        $detail->update([
            'realisasi'      => $data['realisasi'],
            'capaian_persen' => $capaian,
            'bukti_dukung'   => $data['bukti_dukung'] ?? $detail->bukti_dukung,
            'umpan_balik_berkelanjutan' => $data['umpan_balik_berkelanjutan'] ?? $detail->umpan_balik_berkelanjutan,
        ]);

        return response()->json(['status' => 'success', 'data' => $detail->fresh()]);
    }

    public function summary(Request $request)
    {
        $tahun = $request->integer('tahun', now()->year);

        $base = SKPHeader::where('tahun', $tahun);

        $distribusi = (clone $base)->where('status', 'Disetujui')
            ->selectRaw('predikat, COUNT(*) as jumlah')
            ->groupBy('predikat')
            ->pluck('jumlah', 'predikat');

        $rataUnit = DB::table('t_skp_header as s')
            ->join('m_pegawai as p', 'p.id', '=', 's.pegawai_id')
            ->where('s.tahun', $tahun)
            ->where('s.status', 'Disetujui')
            ->selectRaw('p.unit_kerja as unit, ROUND(AVG(s.nilai_akhir), 1) as rata_rata, COUNT(*) as jumlah')
            ->groupBy('p.unit_kerja')
            ->orderByDesc('rata_rata')
            ->get();

        return response()->json([
            'status' => 'success',
            'data'   => [
                'tahun'               => $tahun,
                'total_diajukan'      => (clone $base)->where('status', 'Diajukan')->count(),
                'total_dinilai'       => (clone $base)->where('status', 'Dinilai')->count(),
                'total_disetujui'     => (clone $base)->where('status', 'Disetujui')->count(),
                'distribusi_predikat' => $distribusi,
                'rata_rata_per_unit'  => $rataUnit,
            ],
        ]);
    }
}
