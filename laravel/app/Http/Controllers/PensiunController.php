<?php

namespace App\Http\Controllers;

use App\Models\{Pegawai, Pengaturan, ActivityLog};
use Barryvdh\DomPDF\Facade\Pdf;
use Illuminate\Support\Facades\DB;
use Illuminate\Http\Request;

class PensiunController extends Controller
{
    public function index(Request $request)
    {
        $hari = (int) $request->input('hari', 180);
        $this->authorize('pegawai.view');

        $pegawais = DB::table('m_pegawai')
            ->whereNull('deleted_at')
            ->where('status_aktif', 'Aktif')
            ->whereNotNull('batas_pensiun')
            ->whereBetween('batas_pensiun', [now()->toDateString(), now()->addDays($hari)->toDateString()])
            ->select('id','nip','nama','jabatan','unit_kerja','golongan','pangkat','batas_pensiun','foto',
                DB::raw('DATEDIFF(batas_pensiun, CURDATE()) as hari_tersisa'))
            ->orderBy('batas_pensiun')
            ->get()
            ->map(function ($p) {
                $p->urgency = $p->hari_tersisa <= 30 ? 'critical' : ($p->hari_tersisa <= 90 ? 'warning' : 'info');
                return $p;
            });

        return response()->json([
            'status' => 'success',
            'data'   => [
                'critical' => $pegawais->where('urgency', 'critical')->values(),
                'warning'  => $pegawais->where('urgency', 'warning')->values(),
                'info'     => $pegawais->where('urgency', 'info')->values(),
                'total'    => $pegawais->count(),
            ],
        ]);
    }

    public function stats()
    {
        $tahun = now()->year;
        return response()->json([
            'status' => 'success',
            'data'   => [
                'pensiun_tahun_ini'  => DB::table('m_pegawai')->whereYear('batas_pensiun', $tahun)->where('status_aktif','Aktif')->count(),
                'pensiun_bulan_ini'  => DB::table('m_pegawai')->whereYear('batas_pensiun', $tahun)->whereMonth('batas_pensiun', now()->month)->where('status_aktif','Aktif')->count(),
                'sudah_pensiun'      => DB::table('m_pegawai')->where('status_aktif','Pensiun')->count(),
                'rata_masa_kerja'    => round(DB::table('m_pegawai')->where('status_aktif','Aktif')->whereNotNull('tanggal_masuk')->avg(DB::raw('TIMESTAMPDIFF(YEAR, tanggal_masuk, CURDATE())')), 1),
            ],
        ]);
    }

    public function generateSuratPengantar(Request $request)
    {
        $request->validate(['pegawai_id' => 'required|exists:m_pegawai,id']);
        $this->authorize('pegawai.view');

        $pegawai  = Pegawai::findOrFail($request->pegawai_id);
        $namaRS   = Pengaturan::get('nama_rs', 'Rumah Sakit');
        $alamatRS = Pengaturan::get('alamat_rs', '');
        $direktur = Pengaturan::get('direktur_rs', 'Direktur');

        $nomor = 'SP/' . $pegawai->nip . '/' . now()->year;
        $masaKerja = $pegawai->tanggal_masuk ? now()->diffInYears($pegawai->tanggal_masuk) : '-';

        $pdf = Pdf::loadView('pdf.surat.pengantar_pensiun', compact('pegawai','namaRS','alamatRS','direktur','nomor','masaKerja'))
            ->setPaper('a4');

        ActivityLog::record(
            action: 'EXPORT',
            targetType: 'Surat Pensiun',
            targetId: $pegawai->id,
            targetLabel: 'Surat Pengantar Pensiun - ' . $pegawai->nama,
            description: 'Generate surat pengantar pensiun.',
        );

        return $pdf->download("surat_pensiun_{$pegawai->nip}.pdf");
    }
}
