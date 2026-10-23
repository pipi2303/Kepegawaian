<?php

namespace App\Http\Controllers;

use App\Models\{KontrakPegawai, Pegawai, Pengaturan, ActivityLog};
use Barryvdh\DomPDF\Facade\Pdf;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class KontrakController extends Controller
{
    public function index(Request $request)
    {
        $this->authorize('pegawai.view');

        $rows = DB::table('t_kontrak_pegawai as k')
            ->join('m_pegawai as p', 'p.id', '=', 'k.pegawai_id')
            ->select('k.*', 'p.nip', 'p.nama', 'p.jabatan', 'p.unit_kerja',
                DB::raw('DATEDIFF(k.tanggal_selesai, CURDATE()) as hari_tersisa'))
            ->when($request->pegawai_id,   fn($q, $v) => $q->where('k.pegawai_id', $v))
            ->when($request->status_kontrak,fn($q, $v) => $q->where('k.status_kontrak', $v))
            ->when($request->unit_kerja,   fn($q, $v) => $q->where('p.unit_kerja', $v))
            ->orderBy('k.tanggal_selesai')
            ->paginate(20);

        return response()->json(['status' => 'success', 'data' => $rows]);
    }

    public function store(Request $request)
    {
        $this->authorize('pegawai.edit');

        $data = $request->validate([
            'pegawai_id'      => 'required|exists:m_pegawai,id',
            'nomor_perjanjian'=> 'required|string|max:100',
            'tanggal_mulai'   => 'required|date',
            'tanggal_selesai' => 'required|date|after:tanggal_mulai',
            'gaji_kontrak'    => 'nullable|numeric|min:0',
            'posisi_tugas'    => 'required|string|max:150',
            'status_kontrak'  => 'required|in:Aktif,Akan Berakhir,Diperpanjang,Berakhir',
            'file_kontrak'    => 'nullable|string',
        ]);

        $kontrak = KontrakPegawai::create($data);

        $pegawai = Pegawai::find($data['pegawai_id']);
        ActivityLog::record(
            action: 'CREATE',
            targetType: 'Kontrak',
            targetId: $kontrak->id,
            targetLabel: ($pegawai->nama ?? '-') . ' — ' . $data['nomor_perjanjian'],
            description: 'Tambah kontrak baru untuk ' . ($pegawai->nama ?? '-'),
            request: $request,
        );

        return response()->json(['status' => 'success', 'message' => 'Kontrak berhasil ditambahkan.', 'data' => $kontrak]);
    }

    public function update(Request $request, KontrakPegawai $kontrak)
    {
        $this->authorize('pegawai.edit');

        $data = $request->validate([
            'pegawai_id'      => 'required|exists:m_pegawai,id',
            'nomor_perjanjian'=> 'required|string|max:100',
            'tanggal_mulai'   => 'required|date',
            'tanggal_selesai' => 'required|date|after:tanggal_mulai',
            'gaji_kontrak'    => 'nullable|numeric|min:0',
            'posisi_tugas'    => 'required|string|max:150',
            'status_kontrak'  => 'required|in:Aktif,Akan Berakhir,Diperpanjang,Berakhir',
            'file_kontrak'    => 'nullable|string',
        ]);

        $kontrak->update($data);

        $pegawai = Pegawai::find($data['pegawai_id']);
        ActivityLog::record(
            action: 'UPDATE',
            targetType: 'Kontrak',
            targetId: $kontrak->id,
            targetLabel: ($pegawai->nama ?? '-') . ' — ' . $data['nomor_perjanjian'],
            description: 'Update kontrak.',
            request: $request,
        );

        return response()->json(['status' => 'success', 'message' => 'Kontrak diperbarui.', 'data' => $kontrak]);
    }

    public function perpanjang(Request $request, KontrakPegawai $kontrak)
    {
        $this->authorize('pegawai.edit');

        $request->validate(['tanggal_selesai_baru' => 'required|date|after:today']);

        DB::transaction(function () use ($request, $kontrak) {
            $kontrak->update(['status_kontrak' => 'Diperpanjang']);

            KontrakPegawai::create([
                'pegawai_id'       => $kontrak->pegawai_id,
                'nomor_perjanjian' => $kontrak->nomor_perjanjian . '/PERPANJANG',
                'tanggal_mulai'    => $kontrak->tanggal_selesai ?? now()->toDateString(),
                'tanggal_selesai'  => $request->tanggal_selesai_baru,
                'gaji_kontrak'     => $kontrak->gaji_kontrak,
                'posisi_tugas'     => $kontrak->posisi_tugas,
                'status_kontrak'   => 'Aktif',
            ]);
        });

        $pegawai = Pegawai::find($kontrak->pegawai_id);
        ActivityLog::record(
            action: 'UPDATE',
            targetType: 'Kontrak',
            targetId: $kontrak->id,
            targetLabel: ($pegawai->nama ?? '-') . ' — perpanjangan',
            description: 'Perpanjangan kontrak hingga ' . $request->tanggal_selesai_baru,
            request: $request,
        );

        return response()->json(['status' => 'success', 'message' => 'Kontrak berhasil diperpanjang.']);
    }

    public function expiring(Request $request)
    {
        $this->authorize('pegawai.view');

        $hari = max(1, (int) ($request->input('hari', 30)));

        $base = DB::table('t_kontrak_pegawai as k')
            ->join('m_pegawai as p', 'p.id', '=', 'k.pegawai_id')
            ->select('k.*', 'p.nip', 'p.nama', 'p.unit_kerja',
                DB::raw('DATEDIFF(k.tanggal_selesai, CURDATE()) as hari_tersisa'))
            ->where('k.status_kontrak', 'Aktif')
            ->orderBy('k.tanggal_selesai');

        $expiring30 = (clone $base)
            ->whereBetween('k.tanggal_selesai', [now()->toDateString(), now()->addDays(30)->toDateString()])
            ->get();

        $expiring7 = $expiring30->filter(fn($r) => $r->hari_tersisa <= 7)->values();

        return response()->json([
            'status' => 'success',
            'data'   => [
                'expiring_30' => $expiring30,
                'expiring_7'  => $expiring7,
            ],
        ]);
    }

    public function generateKontrak(Request $request)
    {
        $request->validate(['kontrak_id' => 'required|integer']);

        $kontrak    = KontrakPegawai::with('pegawai')->findOrFail($request->kontrak_id);
        $pegawai    = $kontrak->pegawai;
        $nomorSurat = $kontrak->nomor_perjanjian;

        $pengaturan = array_merge(
            array_fill_keys(Pengaturan::all_rs(), null),
            DB::table('pengaturan')->whereIn('key', Pengaturan::all_rs())->pluck('value', 'key')->toArray()
        );

        $pdf = Pdf::loadView('pdf.surat.kontrak_pppk', compact('pegawai', 'kontrak', 'nomorSurat', 'pengaturan'))->setPaper('a4');

        ActivityLog::record(
            action: 'EXPORT',
            targetType: 'Kontrak PDF',
            targetId: $kontrak->id,
            targetLabel: 'Kontrak — ' . ($pegawai->nama ?? '-'),
            description: 'Generate PDF kontrak ' . $nomorSurat,
            request: $request,
        );

        return $pdf->download("kontrak_{$pegawai->nip}_{$nomorSurat}.pdf");
    }
}
