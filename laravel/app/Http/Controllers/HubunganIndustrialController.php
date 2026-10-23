<?php

namespace App\Http\Controllers;

use App\Models\{Grievance, PHKPegawai, Pegawai, Pengaturan, ActivityLog};
use Barryvdh\DomPDF\Facade\Pdf;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class HubunganIndustrialController extends Controller
{
    // ─── Grievance ────────────────────────────────────────────────────────────

    public function indexGrievance(Request $request)
    {
        $this->authorize('pegawai.view');

        $rows = Grievance::with(['pegawai:id,nama,unit_kerja', 'mediator:id,nama'])
            ->when($request->status,   fn($q, $v) => $q->where('status', $v))
            ->when($request->kategori, fn($q, $v) => $q->where('kategori', $v))
            ->when($request->tahun,    fn($q, $v) => $q->whereYear('tanggal_laporan', $v))
            ->latest()
            ->paginate(20);

        // Hide pegawai name for anonymous reports (shown only to HR via mediator, not list)
        $rows->getCollection()->transform(function ($g) {
            if ($g->is_anonim) {
                $g->pegawai = ['id' => $g->pegawai_id, 'nama' => 'Anonim', 'unit_kerja' => '—'];
            }
            return $g;
        });

        return response()->json(['status' => 'success', 'data' => $rows]);
    }

    public function storeGrievance(Request $request)
    {
        $data = $request->validate([
            'kategori'        => 'required|in:Remunerasi,Kondisi Kerja,Hubungan Rekan,Diskriminasi,Pelecehan,Lainnya',
            'deskripsi'       => 'required|string',
            'tanggal_laporan' => 'required|date',
            'is_anonim'       => 'boolean',
        ]);

        $data['pegawai_id'] = auth()->id();
        $data['is_anonim']  = $data['is_anonim'] ?? false;

        $grievance = Grievance::create($data);

        ActivityLog::record(
            action: 'CREATE',
            severity: $data['is_anonim'] ? 'warning' : 'info',
            targetType: 'Grievance',
            targetId: $grievance->id,
            targetLabel: 'Pengaduan ' . $data['kategori'] . ($data['is_anonim'] ? ' (Anonim)' : ''),
            description: 'Pengaduan/keluhan pegawai dicatat.',
            request: $request,
        );

        return response()->json(['status' => 'success', 'message' => 'Pengaduan berhasil dicatat.', 'data' => $grievance], 201);
    }

    public function updateGrievance(Request $request, Grievance $grievance)
    {
        $this->authorize('pegawai.edit');

        $data = $request->validate([
            'status'          => 'sometimes|in:Diterima,Sedang Diproses,Mediasi,Selesai,Ditutup',
            'resolusi'        => 'nullable|string',
            'mediator_id'     => 'nullable|exists:m_pegawai,id',
            'tanggal_selesai' => 'nullable|date',
        ]);

        $grievance->update($data);

        ActivityLog::record(
            action: 'UPDATE',
            severity: 'info',
            targetType: 'Grievance',
            targetId: $grievance->id,
            targetLabel: 'Pengaduan #' . $grievance->id . ' → ' . ($data['status'] ?? $grievance->status),
            description: 'Update status/resolusi pengaduan.',
            request: $request,
        );

        return response()->json(['status' => 'success', 'data' => $grievance]);
    }

    public function statsGrievance()
    {
        $byKategori = DB::table('t_grievance')
            ->selectRaw('kategori, COUNT(*) as total')
            ->groupBy('kategori')
            ->pluck('total', 'kategori');

        $byStatus = DB::table('t_grievance')
            ->selectRaw('status, COUNT(*) as total')
            ->groupBy('status')
            ->pluck('total', 'status');

        $avgDays = DB::table('t_grievance')
            ->whereNotNull('tanggal_selesai')
            ->selectRaw('AVG(DATEDIFF(tanggal_selesai, tanggal_laporan)) as avg_days')
            ->value('avg_days');

        return response()->json([
            'status' => 'success',
            'data'   => [
                'by_kategori' => $byKategori,
                'by_status'   => $byStatus,
                'avg_days_to_resolve' => round((float) $avgDays, 1),
            ],
        ]);
    }

    // ─── PHK ─────────────────────────────────────────────────────────────────

    public function indexPHK(Request $request)
    {
        $this->authorize('pegawai.view');

        $rows = PHKPegawai::with('pegawai:id,nip,nama,jabatan,unit_kerja')
            ->when($request->jenis_phk, fn($q, $v) => $q->where('jenis_phk', $v))
            ->when($request->status,    fn($q, $v) => $q->where('status', $v))
            ->when($request->tahun,     fn($q, $v) => $q->whereYear('tanggal_phk', $v))
            ->latest('tanggal_phk')
            ->paginate(20);

        return response()->json(['status' => 'success', 'data' => $rows]);
    }

    public function storePHK(Request $request)
    {
        $this->authorize('pegawai.edit');

        $data = $request->validate([
            'pegawai_id'      => 'required|exists:m_pegawai,id',
            'jenis_phk'       => 'required|in:Pengunduran Diri,Diberhentikan,Kontrak Berakhir,Pensiun Dini,Meninggal Dunia',
            'alasan'          => 'required|string',
            'tanggal_phk'     => 'required|date',
            'pesangon'        => 'nullable|numeric|min:0',
            'uang_penghargaan'=> 'nullable|numeric|min:0',
            'uang_pisah'      => 'nullable|numeric|min:0',
            'nomor_sk'        => 'nullable|string|max:100',
            'tanggal_sk'      => 'nullable|date',
            'catatan'         => 'nullable|string',
        ]);

        $data['total_kompensasi'] = ($data['pesangon'] ?? 0)
            + ($data['uang_penghargaan'] ?? 0)
            + ($data['uang_pisah'] ?? 0);

        $phk = PHKPegawai::create($data);

        // Update status pegawai
        $statusBaru = $data['jenis_phk'] === 'Meninggal Dunia' ? 'Meninggal' : 'Diberhentikan';
        Pegawai::where('id', $data['pegawai_id'])->update(['status_aktif' => $statusBaru]);

        $pegawai = Pegawai::find($data['pegawai_id']);

        ActivityLog::record(
            action: 'CREATE',
            severity: 'critical',
            targetType: 'PHK',
            targetId: $phk->id,
            targetLabel: ($pegawai->nama ?? '-') . ' — ' . $data['jenis_phk'],
            description: 'Pemutusan hubungan kerja dicatat. Status pegawai diubah ke ' . $statusBaru . '.',
            request: $request,
        );

        return response()->json(['status' => 'success', 'message' => 'Data PHK berhasil disimpan.', 'data' => $phk], 201);
    }

    public function generateSuratPHK(Request $request)
    {
        $request->validate(['phk_id' => 'required|integer']);

        $phk     = PHKPegawai::with('pegawai')->findOrFail($request->phk_id);
        $pegawai = $phk->pegawai;

        $pengaturan = [
            'nama_rs'     => Pengaturan::get('nama_rs', 'Rumah Sakit'),
            'kelas_rs'    => Pengaturan::get('kelas_rs', ''),
            'alamat_rs'   => Pengaturan::get('alamat_rs', ''),
            'direktur_rs' => Pengaturan::get('direktur_rs', 'Direktur'),
            'nip_direktur'=> Pengaturan::get('nip_direktur', ''),
        ];

        $pdf = Pdf::loadView('pdf.surat.surat_phk', compact('phk', 'pegawai', 'pengaturan'))->setPaper('a4');

        ActivityLog::record(
            action: 'EXPORT',
            severity: 'info',
            targetType: 'SK PHK',
            targetId: $phk->id,
            targetLabel: 'SK PHK — ' . ($pegawai->nama ?? '-'),
            description: 'Generate Surat Keputusan PHK PDF.',
            request: $request,
        );

        return $pdf->download("surat_phk_{$pegawai->nip}_{$phk->tanggal_phk}.pdf");
    }
}
