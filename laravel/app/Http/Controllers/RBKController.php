<?php

namespace App\Http\Controllers;

use App\Models\ActivityLog;
use App\Models\Pegawai;
use App\Models\RBKBulanan;
use App\Models\RBKIndeks;
use App\Services\RBKService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Maatwebsite\Excel\Facades\Excel;
use Maatwebsite\Excel\Concerns\FromCollection;
use Maatwebsite\Excel\Concerns\WithHeadings;

class RBKController extends Controller
{
    public function __construct(private RBKService $rbk) {}

    public function index(Request $request): JsonResponse
    {
        $this->authorize('payroll.view-all');

        $query = RBKBulanan::with('pegawai:id,nip,nama,unit_kerja,jabatan,eselon', 'indeks')
            ->latest('id');

        if ($bulan = $request->integer('bulan'))     $query->where('bulan', $bulan);
        if ($tahun = $request->integer('tahun'))     $query->where('tahun', $tahun);
        if ($unitKerja = $request->input('unit_kerja'))
            $query->whereHas('pegawai', fn($q) => $q->where('unit_kerja', $unitKerja));
        if ($status = $request->input('status'))     $query->where('status', $status);

        return response()->json(['status' => 'success', 'data' => $query->paginate(20)]);
    }

    public function store(Request $request): JsonResponse
    {
        $this->authorize('payroll.generate');

        $data = $request->validate([
            'pegawai_id' => 'required|exists:m_pegawai,id',
            'bulan'      => 'required|integer|between:1,12',
            'tahun'      => 'required|integer|min:2020|max:2100',
        ]);

        $pegawai = Pegawai::findOrFail($data['pegawai_id']);
        $record  = $this->rbk->hitungRBK($pegawai, $data['bulan'], $data['tahun']);

        ActivityLog::record(
            action: 'CREATE',
            targetType: 'RBKBulanan',
            targetId: $record->id,
            targetLabel: 'RBK ' . $pegawai->nama . ' - ' . $data['bulan'] . '/' . $data['tahun'],
            description: 'Generate RBK pegawai.',
            request: $request,
        );

        return response()->json(['status' => 'success', 'data' => $record->load('indeks')], 201);
    }

    public function bulkGenerate(Request $request): JsonResponse
    {
        $this->authorize('payroll.generate');

        $data = $request->validate([
            'bulan' => 'required|integer|between:1,12',
            'tahun' => 'required|integer|min:2020|max:2100',
        ]);

        $result = $this->rbk->bulkHitung($data['bulan'], $data['tahun']);

        ActivityLog::record(
            action: 'CREATE',
            targetType: 'RBKBulanan',
            targetLabel: 'Bulk RBK ' . $data['bulan'] . '/' . $data['tahun'],
            description: 'Bulk generate RBK: ' . $result['success'] . ' berhasil, ' . $result['failed'] . ' gagal.',
            request: $request,
        );

        return response()->json(['status' => 'success', ...$result]);
    }

    public function approve(Request $request, RBKBulanan $rbk): JsonResponse
    {
        $this->authorize('payroll.generate');
        abort_if($rbk->status !== 'Draft', 422, 'Hanya RBK berstatus Draft yang dapat disetujui.');

        $rbk->update(['status' => 'Approved']);

        ActivityLog::record(
            action: 'UPDATE',
            targetType: 'RBKBulanan',
            targetId: $rbk->id,
            targetLabel: 'Approve RBK #' . $rbk->id,
            description: 'RBK disetujui.',
            request: $request,
        );

        return response()->json(['status' => 'success', 'message' => 'RBK disetujui.']);
    }

    public function bayar(Request $request, RBKBulanan $rbk): JsonResponse
    {
        $this->authorize('payroll.generate');
        abort_if($rbk->status !== 'Approved', 422, 'Hanya RBK berstatus Approved yang dapat ditandai dibayarkan.');

        $rbk->update(['status' => 'Dibayarkan']);

        ActivityLog::record(
            action: 'UPDATE',
            targetType: 'RBKBulanan',
            targetId: $rbk->id,
            targetLabel: 'Bayar RBK #' . $rbk->id,
            description: 'RBK ditandai dibayarkan.',
            request: $request,
        );

        return response()->json(['status' => 'success', 'message' => 'RBK ditandai dibayarkan.']);
    }

    public function export(Request $request)
    {
        $data = $request->validate([
            'bulan' => 'required|integer|between:1,12',
            'tahun' => 'required|integer|min:2020|max:2100',
        ]);

        $rows = RBKBulanan::with('pegawai:id,nip,nama,unit_kerja,jabatan', 'indeks')
            ->where('bulan', $data['bulan'])->where('tahun', $data['tahun'])
            ->orderBy('id')->get();

        $export = new class($rows) implements FromCollection, WithHeadings {
            public function __construct(private $rows) {}
            public function collection() { return $this->rows->map(fn($r) => [
                $r->pegawai?->nip          ?? '',
                $r->pegawai?->nama         ?? '',
                $r->pegawai?->jabatan      ?? '',
                $r->pegawai?->unit_kerja   ?? '',
                $r->indeks?->nama_jabatan  ?? ($r->indeks?->eselon ?? '—'),
                $r->nilai_dasar,
                $r->indeks_jabatan,
                $r->capaian_skp,
                $r->capaian_kehadiran,
                $r->komponen_skp,
                $r->komponen_kehadiran,
                $r->potongan_alpha,
                $r->total_rbk,
                $r->status,
            ]); }
            public function headings(): array { return [
                'NIP', 'Nama', 'Jabatan', 'Unit Kerja', 'Indeks Jabatan',
                'Nilai Dasar', 'Indeks', 'Capaian SKP %', 'Capaian Hadir %',
                'Komponen SKP', 'Komponen Kehadiran', 'Potongan Alpha',
                'Total RBK', 'Status',
            ]; }
        };

        return Excel::download($export, 'rbk-' . $data['bulan'] . '-' . $data['tahun'] . '.xlsx');
    }

    public function indeks(): JsonResponse
    {
        return response()->json([
            'status' => 'success',
            'data'   => RBKIndeks::orderByDesc('nilai_dasar_rbk')->get(),
        ]);
    }

    public function storeIndeks(Request $request): JsonResponse
    {
        $this->authorize('payroll.generate');

        $data = $request->validate([
            'id'             => 'nullable|exists:t_rbk_indeks,id',
            'nama_jabatan'   => 'nullable|string|max:150',
            'eselon'         => 'nullable|string|max:20',
            'indeks'         => 'required|numeric|min:0',
            'nilai_dasar_rbk'=> 'required|numeric|min:0',
            'keterangan'     => 'nullable|string|max:255',
        ]);

        $indeks = isset($data['id'])
            ? tap(RBKIndeks::findOrFail($data['id']))->update($data)
            : RBKIndeks::create($data);

        return response()->json(['status' => 'success', 'data' => $indeks], 201);
    }

    public function destroyIndeks(Request $request, RBKIndeks $indeks): JsonResponse
    {
        $this->authorize('payroll.generate');
        $indeks->delete();

        return response()->json(['status' => 'success', 'message' => 'Indeks RBK dihapus.']);
    }
}
