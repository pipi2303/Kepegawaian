<?php

namespace App\Http\Controllers;

use App\Models\ActivityLog;
use App\Models\Pegawai;
use App\Models\TPPBulanan;
use App\Models\TPPKelas;
use App\Services\TPPService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Maatwebsite\Excel\Facades\Excel;
use Maatwebsite\Excel\Concerns\FromCollection;
use Maatwebsite\Excel\Concerns\WithHeadings;

class TPPController extends Controller
{
    public function __construct(private TPPService $tpp) {}

    public function index(Request $request): JsonResponse
    {
        $this->authorize('payroll.view-all');

        $query = TPPBulanan::with('pegawai:id,nip,nama,unit_kerja,jabatan,eselon', 'kelas')
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
        $record  = $this->tpp->hitungTPP($pegawai, $data['bulan'], $data['tahun']);

        ActivityLog::record(
            action: 'CREATE',
            targetType: 'TPPBulanan',
            targetId: $record->id,
            targetLabel: 'TPP ' . $pegawai->nama . ' - ' . $data['bulan'] . '/' . $data['tahun'],
            description: 'Generate TPP pegawai.',
            request: $request,
        );

        return response()->json(['status' => 'success', 'data' => $record->load('kelas')], 201);
    }

    public function bulkGenerate(Request $request): JsonResponse
    {
        $this->authorize('payroll.generate');

        $data = $request->validate([
            'bulan' => 'required|integer|between:1,12',
            'tahun' => 'required|integer|min:2020|max:2100',
        ]);

        $result = $this->tpp->bulkHitung($data['bulan'], $data['tahun']);

        ActivityLog::record(
            action: 'CREATE',
            targetType: 'TPPBulanan',
            targetLabel: 'Bulk TPP ' . $data['bulan'] . '/' . $data['tahun'],
            description: 'Bulk generate TPP: ' . $result['success'] . ' berhasil, ' . $result['failed'] . ' gagal.',
            request: $request,
        );

        return response()->json(['status' => 'success', ...$result]);
    }

    public function approve(Request $request, TPPBulanan $tpp): JsonResponse
    {
        $this->authorize('payroll.generate');
        abort_if($tpp->status !== 'Draft', 422, 'Hanya TPP berstatus Draft yang dapat disetujui.');

        $tpp->update(['status' => 'Approved']);

        ActivityLog::record(
            action: 'UPDATE',
            targetType: 'TPPBulanan',
            targetId: $tpp->id,
            targetLabel: 'Approve TPP #' . $tpp->id,
            description: 'TPP disetujui.',
            request: $request,
        );

        return response()->json(['status' => 'success', 'message' => 'TPP disetujui.']);
    }

    public function bayar(Request $request, TPPBulanan $tpp): JsonResponse
    {
        $this->authorize('payroll.generate');
        abort_if($tpp->status !== 'Approved', 422, 'Hanya TPP berstatus Approved yang dapat ditandai dibayarkan.');

        $tpp->update(['status' => 'Dibayarkan']);

        ActivityLog::record(
            action: 'UPDATE',
            targetType: 'TPPBulanan',
            targetId: $tpp->id,
            targetLabel: 'Bayar TPP #' . $tpp->id,
            description: 'TPP ditandai dibayarkan.',
            request: $request,
        );

        return response()->json(['status' => 'success', 'message' => 'TPP ditandai dibayarkan.']);
    }

    public function kelas(): JsonResponse
    {
        return response()->json(['status' => 'success', 'data' => TPPKelas::orderBy('nilai_dasar', 'desc')->get()]);
    }

    public function storeKelas(Request $request): JsonResponse
    {
        $this->authorize('payroll.generate');

        $data = $request->validate([
            'id'          => 'nullable|exists:t_tpp_kelas,id',
            'nama_kelas'  => 'required|string|max:50',
            'eselon'      => 'nullable|string|max:20',
            'nilai_dasar' => 'required|numeric|min:0',
            'keterangan'  => 'nullable|string',
        ]);

        $kelas = isset($data['id'])
            ? tap(TPPKelas::findOrFail($data['id']))->update($data)
            : TPPKelas::create($data);

        return response()->json(['status' => 'success', 'data' => $kelas], 201);
    }

    public function destroyKelas(Request $request, TPPKelas $kelas): JsonResponse
    {
        $this->authorize('payroll.generate');
        $kelas->delete();

        return response()->json(['status' => 'success', 'message' => 'Kelas TPP dihapus.']);
    }

    public function export(Request $request)
    {
        $data = $request->validate([
            'bulan' => 'required|integer|between:1,12',
            'tahun' => 'required|integer|min:2020|max:2100',
        ]);

        $rows = TPPBulanan::with('pegawai:id,nip,nama,unit_kerja,jabatan', 'kelas')
            ->where('bulan', $data['bulan'])->where('tahun', $data['tahun'])
            ->orderBy('id')->get();

        $export = new class($rows) implements FromCollection, WithHeadings {
            public function __construct(private $rows) {}
            public function collection() { return $this->rows->map(fn($r) => [
                $r->pegawai?->nip         ?? '',
                $r->pegawai?->nama        ?? '',
                $r->pegawai?->jabatan     ?? '',
                $r->pegawai?->unit_kerja  ?? '',
                $r->kelas?->nama_kelas    ?? '',
                $r->nilai_dasar,
                $r->persen_kehadiran,
                $r->persen_kinerja,
                $r->komponen_kehadiran,
                $r->komponen_kinerja,
                $r->potongan_alpha,
                $r->total_tpp,
                $r->status,
            ]); }
            public function headings(): array { return [
                'NIP', 'Nama', 'Jabatan', 'Unit Kerja', 'Kelas TPP',
                'Nilai Dasar', 'Kehadiran %', 'Kinerja %',
                'Komponen Kehadiran', 'Komponen Kinerja', 'Potongan Alpha',
                'Total TPP', 'Status',
            ]; }
        };

        $filename = 'tpp-' . $data['bulan'] . '-' . $data['tahun'] . '.xlsx';
        return Excel::download($export, $filename);
    }
}
