<?php

namespace App\Http\Controllers;

use App\Models\AngkaKredit;
use App\Models\TargetAngkaKredit;
use App\Models\Pegawai;
use App\Models\ActivityLog;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class AngkaKreditController extends Controller
{
    public function index(Request $request)
    {
        $q = AngkaKredit::with('pegawai:id,nip,nama,jabatan_fungsional')
            ->latest();

        if ($pegawaiId = $request->pegawai_id) $q->where('pegawai_id', $pegawaiId);
        if ($tahun = $request->tahun)           $q->where('tahun', $tahun);
        if ($semester = $request->semester)     $q->where('semester', $semester);
        if ($status = $request->status)         $q->where('status', $status);

        return response()->json(['status' => 'success', 'data' => $q->paginate(20)]);
    }

    public function store(Request $request)
    {
        $data = $request->validate([
            'pegawai_id'               => 'required|exists:m_pegawai,id',
            'tahun'                    => 'required|integer',
            'semester'                 => 'required|in:1,2',
            'jabatan_fungsional'       => 'required|string|max:100',
            'unsur'                    => 'required|in:Pendidikan,Pelayanan,Pengembangan,Penunjang',
            'sub_unsur'                => 'required|string|max:150',
            'kegiatan'                 => 'required|string',
            'satuan'                   => 'required|string|max:50',
            'jumlah_kegiatan'          => 'required|numeric|min:0',
            'angka_kredit_per_satuan'  => 'required|numeric|min:0',
            'bukti'                    => 'nullable|string',
        ]);

        $data['total_angka_kredit'] = round($data['jumlah_kegiatan'] * $data['angka_kredit_per_satuan'], 3);
        $data['status']             = 'Draft';

        $ak = AngkaKredit::create($data);

        ActivityLog::record(
            action: 'CREATE',
            targetType: 'AngkaKredit',
            targetId: $ak->id,
            targetLabel: $data['kegiatan'],
            description: "Input AK: {$data['unsur']} — {$data['sub_unsur']} (total: {$data['total_angka_kredit']})",
            request: $request,
        );

        return response()->json(['status' => 'success', 'data' => $ak], 201);
    }

    public function ajukan(Request $request)
    {
        $data = $request->validate([
            'pegawai_id' => 'required|exists:m_pegawai,id',
            'tahun'      => 'required|integer',
            'semester'   => 'required|in:1,2',
        ]);

        $count = AngkaKredit::where('pegawai_id', $data['pegawai_id'])
            ->where('tahun', $data['tahun'])
            ->where('semester', $data['semester'])
            ->where('status', 'Draft')
            ->update(['status' => 'Diajukan']);

        ActivityLog::record(
            action: 'UPDATE',
            targetType: 'AngkaKredit',
            targetLabel: "Pengajuan AK Sem {$data['semester']} {$data['tahun']}",
            description: "{$count} kegiatan AK diajukan oleh pegawai ID {$data['pegawai_id']}",
            request: $request,
        );

        return response()->json(['status' => 'success', 'updated' => $count]);
    }

    public function verifikasi(Request $request, int $id)
    {
        $ak = AngkaKredit::findOrFail($id);
        $ak->update(['status' => 'Diverifikasi']);

        ActivityLog::record(
            action: 'UPDATE',
            targetType: 'AngkaKredit',
            targetId: $id,
            targetLabel: $ak->kegiatan,
            description: 'AK diverifikasi oleh tim penilai',
            request: $request,
        );

        return response()->json(['status' => 'success', 'data' => $ak]);
    }

    public function setujui(Request $request, int $id)
    {
        $ak = AngkaKredit::findOrFail($id);
        $ak->update(['status' => 'Disetujui']);

        ActivityLog::record(
            action: 'UPDATE',
            targetType: 'AngkaKredit',
            targetId: $id,
            targetLabel: $ak->kegiatan,
            description: 'AK disetujui',
            request: $request,
        );

        return response()->json(['status' => 'success', 'data' => $ak]);
    }

    public function rekap(Request $request)
    {
        $tahun = $request->tahun ?? now()->year;

        $rekap = AngkaKredit::with('pegawai:id,nip,nama,jabatan_fungsional,golongan')
            ->where('tahun', $tahun)
            ->where('status', 'Disetujui')
            ->selectRaw('pegawai_id, jabatan_fungsional, SUM(total_angka_kredit) as total_ak')
            ->groupBy('pegawai_id', 'jabatan_fungsional')
            ->get()
            ->map(function ($r) use ($tahun) {
                $pegawai = $r->pegawai;
                $target  = TargetAngkaKredit::where('jabatan_fungsional', $r->jabatan_fungsional)
                    ->where('golongan', $pegawai?->golongan ?? '')
                    ->value('target_per_tahun') ?? 0;

                $gap = $r->total_ak - $target;

                return [
                    'pegawai_id'        => $r->pegawai_id,
                    'nip'               => $pegawai?->nip,
                    'nama'              => $pegawai?->nama,
                    'jabatan_fungsional'=> $r->jabatan_fungsional,
                    'golongan'          => $pegawai?->golongan,
                    'total_ak_tahun'    => round($r->total_ak, 3),
                    'target'            => $target,
                    'gap'               => round($gap, 3),
                    'predikat'          => $gap >= 0 ? 'Memenuhi' : ($gap >= -($target * 0.1) ? 'Kurang' : 'Belum Memenuhi'),
                ];
            });

        return response()->json(['status' => 'success', 'data' => $rekap, 'tahun' => $tahun]);
    }

    public function target()
    {
        return response()->json([
            'status' => 'success',
            'data'   => TargetAngkaKredit::orderBy('jabatan_fungsional')->get(),
        ]);
    }

    public function storeTarget(Request $request)
    {
        $data = $request->validate([
            'jabatan_fungsional' => 'required|string|max:100',
            'golongan'           => 'required|string|max:10',
            'target_per_tahun'   => 'required|numeric|min:0',
            'keterangan'         => 'nullable|string',
        ]);

        $target = TargetAngkaKredit::updateOrCreate(
            ['jabatan_fungsional' => $data['jabatan_fungsional'], 'golongan' => $data['golongan']],
            $data
        );

        return response()->json(['status' => 'success', 'data' => $target], 201);
    }
}
