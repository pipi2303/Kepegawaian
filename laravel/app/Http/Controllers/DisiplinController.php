<?php

namespace App\Http\Controllers;

use App\Models\{DisiplinPegawai, Pegawai, Pengaturan, ActivityLog};
use App\Services\WhatsAppService;
use Barryvdh\DomPDF\Facade\Pdf;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class DisiplinController extends Controller
{
    public function index(Request $request)
    {
        $this->authorize('pegawai.view');

        $rows = DB::table('t_disiplin_pegawai as d')
            ->join('m_pegawai as p', 'p.id', '=', 'd.pegawai_id')
            ->select('d.*', 'p.nip', 'p.nama', 'p.jabatan', 'p.unit_kerja')
            ->when($request->pegawai_id,     fn($q, $v) => $q->where('d.pegawai_id', $v))
            ->when($request->tingkat_hukuman,fn($q, $v) => $q->where('d.tingkat_hukuman', $v))
            ->when($request->unit_kerja,     fn($q, $v) => $q->where('p.unit_kerja', $v))
            ->when($request->tahun,          fn($q, $v) => $q->whereYear('d.tanggal_sk', $v))
            ->orderByDesc('d.tanggal_sk')
            ->paginate(20);

        return response()->json(['status' => 'success', 'data' => $rows]);
    }

    public function store(Request $request)
    {
        $this->authorize('pegawai.edit');

        $data = $request->validate([
            'pegawai_id'            => 'required|exists:m_pegawai,id',
            'tingkat_hukuman'       => 'required|in:Ringan,Sedang,Berat',
            'jenis_hukuman'         => 'required|string|max:150',
            'uraian_pelanggaran'    => 'required|string',
            'nomor_sk'              => 'required|string|max:100',
            'tanggal_sk'            => 'required|date',
            'tanggal_mulai_berlaku' => 'required|date',
            'tanggal_selesai'       => 'nullable|date',
            'status_hukuman'        => 'nullable|string|max:50',
        ]);
        $data['status_hukuman'] = $data['status_hukuman'] ?? 'Aktif';

        $disiplin = DisiplinPegawai::create($data);

        $pegawai = Pegawai::find($data['pegawai_id']);

        if ($data['tingkat_hukuman'] === 'Berat') {
            $adminPhone = Pengaturan::get('no_telp_admin_sdm');
            if ($adminPhone) {
                WhatsAppService::send(
                    $adminPhone,
                    "🚨 *Hukuman Disiplin BERAT*\n\n{$pegawai->nama} ({$pegawai->unit_kerja}) dikenai hukuman disiplin BERAT.\nJenis: {$data['jenis_hukuman']}\nNo. SK: {$data['nomor_sk']}\n\nSegera tindak lanjuti di HCMS."
                );
            }
        }

        ActivityLog::record(
            action: 'CREATE',
            severity: $data['tingkat_hukuman'] === 'Berat' ? 'critical' : 'warning',
            targetType: 'Disiplin',
            targetId: $disiplin->id,
            targetLabel: ($pegawai->nama ?? '-') . ' — ' . $data['tingkat_hukuman'],
            description: 'Catat hukuman disiplin ' . $data['tingkat_hukuman'] . ': ' . $data['jenis_hukuman'],
            request: $request,
        );

        return response()->json(['status' => 'success', 'message' => 'Data disiplin berhasil disimpan.', 'data' => $disiplin]);
    }

    public function update(Request $request, int $id)
    {
        $this->authorize('pegawai.edit');

        $disiplin = DisiplinPegawai::findOrFail($id);

        $data = $request->validate([
            'pegawai_id'            => 'required|exists:m_pegawai,id',
            'tingkat_hukuman'       => 'required|in:Ringan,Sedang,Berat',
            'jenis_hukuman'         => 'required|string|max:150',
            'uraian_pelanggaran'    => 'required|string',
            'nomor_sk'              => 'required|string|max:100',
            'tanggal_sk'            => 'required|date',
            'tanggal_mulai_berlaku' => 'required|date',
            'tanggal_selesai'       => 'nullable|date',
            'status_hukuman'        => 'nullable|string|max:50',
        ]);

        $disiplin->update($data);

        $pegawai = Pegawai::find($data['pegawai_id']);
        ActivityLog::record(
            action: 'UPDATE',
            severity: 'warning',
            targetType: 'Disiplin',
            targetId: $disiplin->id,
            targetLabel: ($pegawai->nama ?? '-') . ' — ' . $data['tingkat_hukuman'],
            description: 'Update data disiplin: ' . $data['jenis_hukuman'],
            request: $request,
        );

        return response()->json(['status' => 'success', 'message' => 'Data disiplin berhasil diperbarui.', 'data' => $disiplin]);
    }

    public function destroy(Request $request, int $id)
    {
        $this->authorize('pegawai.edit');

        $disiplin = DisiplinPegawai::findOrFail($id);
        $label = optional($disiplin->pegawai)->nama . ' — ' . $disiplin->jenis_hukuman;
        $disiplin->delete();

        ActivityLog::record(
            action: 'DELETE',
            severity: 'warning',
            targetType: 'Disiplin',
            targetId: $id,
            targetLabel: $label,
            description: 'Hapus data disiplin.',
            request: $request,
        );

        return response()->json(['status' => 'success', 'message' => 'Data disiplin dihapus.']);
    }

    public function generateSKDisiplin(Request $request)
    {
        $request->validate(['disiplin_id' => 'required|integer']);

        $disiplin = DisiplinPegawai::with('pegawai')->findOrFail($request->disiplin_id);
        $pegawai  = $disiplin->pegawai;

        $pengaturan = [
            'nama_rs'     => Pengaturan::get('nama_rs', 'Rumah Sakit'),
            'kelas_rs'    => Pengaturan::get('kelas_rs', ''),
            'alamat_rs'   => Pengaturan::get('alamat_rs', ''),
            'direktur_rs' => Pengaturan::get('direktur_rs', 'Direktur'),
        ];

        $pdf = Pdf::loadView('pdf.surat.sk_disiplin', compact('disiplin', 'pegawai', 'pengaturan'))->setPaper('a4');

        ActivityLog::record(
            action: 'EXPORT',
            severity: 'info',
            targetType: 'SK Disiplin',
            targetId: $disiplin->id,
            targetLabel: 'SK Disiplin — ' . ($pegawai->nama ?? '-'),
            description: 'Generate SK Hukuman Disiplin PDF.',
            request: $request,
        );

        return $pdf->download("sk_disiplin_{$pegawai->nip}_{$disiplin->nomor_sk}.pdf");
    }

    public function stats()
    {
        $tahun     = now()->year;
        $tahunLalu = $tahun - 1;

        $byTingkat = DB::table('t_disiplin_pegawai')
            ->selectRaw("tingkat_hukuman, COUNT(*) as total")
            ->groupBy('tingkat_hukuman')
            ->pluck('total', 'tingkat_hukuman');

        $tahunIni  = DB::table('t_disiplin_pegawai')->whereYear('tanggal_sk', $tahun)->count();
        $tahunLaluC= DB::table('t_disiplin_pegawai')->whereYear('tanggal_sk', $tahunLalu)->count();

        $jenisUmum = DB::table('t_disiplin_pegawai')
            ->selectRaw("jenis_hukuman, COUNT(*) as total")
            ->groupBy('jenis_hukuman')
            ->orderByDesc('total')
            ->limit(5)
            ->get();

        return response()->json([
            'status' => 'success',
            'data'   => [
                'ringan'      => $byTingkat['Ringan'] ?? 0,
                'sedang'      => $byTingkat['Sedang'] ?? 0,
                'berat'       => $byTingkat['Berat']  ?? 0,
                'tahun_ini'   => $tahunIni,
                'tahun_lalu'  => $tahunLaluC,
                'jenis_umum'  => $jenisUmum,
            ],
        ]);
    }
}
