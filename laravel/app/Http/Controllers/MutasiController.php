<?php

namespace App\Http\Controllers;

use App\Models\{Pegawai, Pengaturan, ActivityLog};
use Barryvdh\DomPDF\Facade\Pdf;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class MutasiController extends Controller
{
    public function index(Request $request)
    {
        $this->authorize('pegawai.view');
        $query = DB::table('t_riwayat_jabatan as r')
            ->join('m_pegawai as p', 'p.id', '=', 'r.pegawai_id')
            ->select('r.*', 'p.nip', 'p.nama', 'p.unit_kerja as unit_saat_ini')
            ->when($request->unit_kerja, fn($q,$v) => $q->where('r.unit_kerja', $v))
            ->when($request->pegawai_id, fn($q,$v) => $q->where('r.pegawai_id', $v))
            ->when($request->is_current, fn($q,$v) => $q->where('r.is_current', (bool)$v))
            ->orderByDesc('r.tmt_jabatan');
        return response()->json(['status'=>'success','data' => $query->paginate(20)]);
    }

    public function store(Request $request)
    {
        $this->authorize('pegawai.edit');
        $request->validate([
            'pegawai_id'      => 'required|exists:m_pegawai,id',
            'nama_jabatan'    => 'required|string|max:150',
            'unit_kerja'      => 'required|string|max:150',
            'eselon'          => 'nullable|string|max:20',
            'tmt_jabatan'     => 'required|date',
            'nomor_sk'        => 'required|string|max:100',
            'tanggal_sk'      => 'required|date',
            'pejabat_penetap' => 'nullable|string|max:255',
        ]);

        DB::transaction(function () use ($request) {
            DB::table('t_riwayat_jabatan')
                ->where('pegawai_id', $request->pegawai_id)->where('is_current', true)
                ->update(['is_current' => false, 'tmt_selesai' => $request->tmt_jabatan]);

            DB::table('t_riwayat_jabatan')->insert([
                'pegawai_id'      => $request->pegawai_id,
                'nama_jabatan'    => $request->nama_jabatan,
                'unit_kerja'      => $request->unit_kerja,
                'eselon'          => $request->eselon,
                'tmt_jabatan'     => $request->tmt_jabatan,
                'nomor_sk'        => $request->nomor_sk,
                'tanggal_sk'      => $request->tanggal_sk,
                'pejabat_penetap' => $request->pejabat_penetap,
                'is_current'      => true,
                'created_at'      => now(), 'updated_at' => now(),
            ]);

            Pegawai::where('id', $request->pegawai_id)->update([
                'jabatan'     => $request->nama_jabatan,
                'unit_kerja'  => $request->unit_kerja,
                'eselon'      => $request->eselon,
                'tmt_jabatan' => $request->tmt_jabatan,
            ]);
        });

        $pegawai = Pegawai::find($request->pegawai_id);
        ActivityLog::record(
            action: 'UPDATE',
            targetType: 'Mutasi',
            targetId: $request->pegawai_id,
            targetLabel: ($pegawai->nama ?? '-') . ' → ' . $request->unit_kerja,
            description: 'Mutasi jabatan ke ' . $request->nama_jabatan . ' di ' . $request->unit_kerja,
            request: $request,
        );

        return response()->json(['status'=>'success','message'=>'Mutasi jabatan berhasil dicatat.']);
    }

    public function generateSuratMutasi(Request $request)
    {
        $request->validate(['pegawai_id'=>'required|exists:m_pegawai,id','riwayat_id'=>'required|integer']);
        $pegawai  = Pegawai::findOrFail($request->pegawai_id);
        $riwayat  = DB::table('t_riwayat_jabatan')->where('id', $request->riwayat_id)->first();
        $namaRS   = Pengaturan::get('nama_rs', 'Rumah Sakit');
        $direktur = Pengaturan::get('direktur_rs', 'Direktur');
        $pdf = Pdf::loadView('pdf.surat.surat_mutasi', compact('pegawai','riwayat','namaRS','direktur'))->setPaper('a4');
        ActivityLog::record(
            action: 'EXPORT',
            targetType: 'Surat Mutasi',
            targetId: $pegawai->id,
            targetLabel: 'SK Mutasi - ' . $pegawai->nama,
            description: 'Generate surat mutasi.',
            request: $request,
        );
        return $pdf->download("surat_mutasi_{$pegawai->nip}.pdf");
    }

    public function riwayat(Pegawai $pegawai)
    {
        $this->authorize('pegawai.view');
        $data = DB::table('t_riwayat_jabatan')->where('pegawai_id', $pegawai->id)->orderByDesc('tmt_jabatan')->get();
        return response()->json(['status'=>'success','data'=>$data]);
    }
}
