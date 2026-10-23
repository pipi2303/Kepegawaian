<?php

namespace App\Http\Controllers;

use App\Models\{Pegawai, ActivityLog};
use Barryvdh\DomPDF\Facade\Pdf;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class KenaikanPangkatController extends Controller
{
    public function index(Request $request)
    {
        $this->authorize('pegawai.view');
        $q = DB::table('t_kenaikan_pangkat as kp')
            ->join('m_pegawai as p', 'p.id', '=', 'kp.pegawai_id')
            ->select('kp.*', 'p.nip', 'p.nama', 'p.unit_kerja')
            ->when($request->status, fn($q,$v) => $q->where('kp.status', $v))
            ->when($request->pegawai_id, fn($q,$v) => $q->where('kp.pegawai_id', $v))
            ->orderByDesc('kp.created_at');
        return response()->json(['status'=>'success','data'=>$q->paginate(20)]);
    }

    public function store(Request $request)
    {
        $this->authorize('pegawai.edit');
        $request->validate([
            'pegawai_id'     => 'required|exists:m_pegawai,id',
            'golongan_lama'  => 'required|string|max:10',
            'pangkat_lama'   => 'required|string|max:100',
            'golongan_baru'  => 'required|string|max:10',
            'pangkat_baru'   => 'required|string|max:100',
            'jenis_kenaikan' => 'required|in:Reguler,Pilihan,Anumerta,Pengabdian,Penyesuaian Ijazah',
            'tmt_baru'       => 'required|date',
            'nomor_sk'       => 'nullable|string|max:100',
            'tanggal_sk'     => 'nullable|date',
        ]);
        $id = DB::table('t_kenaikan_pangkat')->insertGetId(array_merge(
            $request->only(['pegawai_id','golongan_lama','pangkat_lama','golongan_baru','pangkat_baru','jenis_kenaikan','tmt_baru','nomor_sk','tanggal_sk']),
            ['status'=>'Usulan','created_at'=>now(),'updated_at'=>now()]
        ));
        $p = Pegawai::find($request->pegawai_id);
        ActivityLog::record(
            action: 'CREATE',
            targetType: 'KenaikanPangkat',
            targetId: $id,
            targetLabel: ($p->nama ?? '-') . ' ' . $request->golongan_lama . '→' . $request->golongan_baru,
            description: 'Usulan kenaikan pangkat dibuat.',
            request: $request,
        );
        return response()->json(['status'=>'success','message'=>'Usulan kenaikan pangkat berhasil dibuat.']);
    }

    public function updateStatus(Request $request, int $id)
    {
        $this->authorize('pegawai.edit');
        $request->validate([
            'status'     => 'required|in:Verifikasi BKD,Disetujui BKN,SK Terbit,Ditolak',
            'nomor_sk'   => 'nullable|string',
            'tanggal_sk' => 'nullable|date',
            'catatan'    => 'nullable|string',
        ]);
        $kp = DB::table('t_kenaikan_pangkat')->where('id', $id)->first();
        DB::table('t_kenaikan_pangkat')->where('id', $id)->update(array_filter([
            'status'     => $request->status,
            'nomor_sk'   => $request->nomor_sk,
            'tanggal_sk' => $request->tanggal_sk,
            'catatan'    => $request->catatan,
            'updated_at' => now(),
        ]));
        if ($request->status === 'SK Terbit' && $kp) {
            Pegawai::where('id', $kp->pegawai_id)->update([
                'golongan'    => $kp->golongan_baru,
                'pangkat'     => $kp->pangkat_baru,
                'tmt_golongan'=> $kp->tmt_baru,
            ]);
        }
        ActivityLog::record(
            action: 'UPDATE',
            targetType: 'KenaikanPangkat',
            targetId: $id,
            targetLabel: 'Status KP → ' . $request->status,
            description: 'Update status kenaikan pangkat.',
            request: $request,
        );
        return response()->json(['status'=>'success','message'=>'Status kenaikan pangkat diperbarui.']);
    }

    public function generateSuratUsulan(Request $request)
    {
        $request->validate(['pegawai_id'=>'required|exists:m_pegawai,id','kp_id'=>'required|integer']);
        $pegawai = Pegawai::findOrFail($request->pegawai_id);
        $kp = DB::table('t_kenaikan_pangkat')->where('id', $request->kp_id)->first();
        $namaRS = \App\Models\Pengaturan::get('nama_rs','Rumah Sakit');
        $pdf = Pdf::loadView('pdf.surat.usulan_kp', compact('pegawai','kp','namaRS'))->setPaper('a4');
        ActivityLog::record(
            action: 'EXPORT',
            targetType: 'Surat KP',
            targetId: $pegawai->id,
            targetLabel: 'Usulan KP - ' . $pegawai->nama,
            description: 'Generate surat usulan kenaikan pangkat.',
            request: $request,
        );
        return $pdf->download("usulan_kp_{$pegawai->nip}.pdf");
    }
}
