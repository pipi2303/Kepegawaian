<?php

namespace App\Http\Controllers;

use App\Models\ActivityLog;
use App\Models\Formasi;
use App\Models\Lamaran;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Maatwebsite\Excel\Concerns\FromCollection;
use Maatwebsite\Excel\Concerns\WithHeadings;
use Maatwebsite\Excel\Facades\Excel;

class RekrutmenController extends Controller
{
    // ── Formasi ──────────────────────────────────────────────────────────────

    public function indexFormasi(Request $request): JsonResponse
    {
        $this->authorize('pegawai.view');

        $q = Formasi::withCount('lamaran')->latest('id');
        if ($s = $request->input('status')) $q->where('status', $s);

        return response()->json(['status' => 'success', 'data' => $q->paginate(15)]);
    }

    public function storeFormasi(Request $request): JsonResponse
    {
        $this->authorize('pegawai.create');

        $data = $request->validate([
            'jabatan'                => 'required|string|max:150',
            'unit_kerja'             => 'required|string|max:150',
            'kualifikasi_pendidikan' => 'required|string|max:100',
            'jurusan_dibutuhkan'     => 'nullable|string|max:255',
            'jumlah_formasi'         => 'required|integer|min:1',
            'gaji_min'               => 'nullable|numeric|min:0',
            'gaji_max'               => 'nullable|numeric|min:0',
            'status_pegawai_target'  => 'required|in:PPPK,Honorer',
            'persyaratan_khusus'     => 'nullable|string',
            'batas_usia_min'         => 'nullable|integer|min:17',
            'batas_usia_max'         => 'nullable|integer|max:65',
            'tanggal_buka'           => 'required|date',
            'tanggal_tutup'          => 'required|date|after:tanggal_buka',
        ]);

        $formasi = Formasi::create($data);

        ActivityLog::record('CREATE', 'Formasi', $formasi->jabatan, "Formasi baru dibuka: {$formasi->jabatan} ({$formasi->unit_kerja})", request: $request);

        return response()->json(['status' => 'success', 'data' => $formasi], 201);
    }

    public function updateFormasi(Request $request, Formasi $formasi): JsonResponse
    {
        $this->authorize('pegawai.create');

        $data = $request->validate([
            'jabatan'                => 'sometimes|string|max:150',
            'unit_kerja'             => 'sometimes|string|max:150',
            'kualifikasi_pendidikan' => 'sometimes|string|max:100',
            'jurusan_dibutuhkan'     => 'nullable|string|max:255',
            'jumlah_formasi'         => 'sometimes|integer|min:1',
            'gaji_min'               => 'nullable|numeric|min:0',
            'gaji_max'               => 'nullable|numeric|min:0',
            'status_pegawai_target'  => 'sometimes|in:PPPK,Honorer',
            'persyaratan_khusus'     => 'nullable|string',
            'batas_usia_min'         => 'nullable|integer|min:17',
            'batas_usia_max'         => 'nullable|integer|max:65',
            'tanggal_buka'           => 'sometimes|date',
            'tanggal_tutup'          => 'sometimes|date',
        ]);

        $formasi->update($data);

        return response()->json(['status' => 'success', 'data' => $formasi]);
    }

    public function activateFormasi(Formasi $formasi): JsonResponse
    {
        $this->authorize('pegawai.create');
        $formasi->update(['status' => 'Aktif']);
        return response()->json(['status' => 'success', 'message' => 'Formasi diaktifkan']);
    }

    public function closeFormasi(Formasi $formasi): JsonResponse
    {
        $this->authorize('pegawai.create');
        $formasi->update(['status' => 'Ditutup']);
        return response()->json(['status' => 'success', 'message' => 'Formasi ditutup']);
    }

    // ── Lamaran ───────────────────────────────────────────────────────────────

    public function indexLamaran(Request $request): JsonResponse
    {
        $this->authorize('pegawai.view');

        $q = Lamaran::with('formasi:id,jabatan,unit_kerja')->latest('id');
        if ($fid = $request->integer('formasi_id')) $q->where('formasi_id', $fid);
        if ($s   = $request->input('status'))        $q->where('status', $s);

        return response()->json(['status' => 'success', 'data' => $q->paginate(20)]);
    }

    public function showLamaran(Lamaran $lamaran): JsonResponse
    {
        $this->authorize('pegawai.view');
        return response()->json(['status' => 'success', 'data' => $lamaran->load('formasi')]);
    }

    public function updateStatus(Request $request, Lamaran $lamaran): JsonResponse
    {
        $this->authorize('pegawai.create');

        $data = $request->validate([
            'status'        => 'required|in:Diterima,Review,Tes,Wawancara,Lolos,Tidak Lolos,Cadangan',
            'catatan_admin' => 'nullable|string',
            'nilai_tes'     => 'nullable|numeric|min:0|max:100',
        ]);

        $old = $lamaran->status;
        $lamaran->update($data);

        ActivityLog::record(
            'UPDATE', 'Lamaran', $lamaran->nama_lengkap,
            "Status lamaran diubah: {$old} → {$lamaran->status}",
            changes: ['status' => [$old, $lamaran->status]],
            request: $request,
        );

        return response()->json(['status' => 'success', 'data' => $lamaran]);
    }

    public function exportLamaran(Request $request)
    {
        $this->authorize('pegawai.view');

        $request->validate(['formasi_id' => 'required|exists:t_formasi_jabatan,id']);

        $formasi = Formasi::findOrFail($request->integer('formasi_id'));
        $rows    = Lamaran::where('formasi_id', $formasi->id)->get();

        $export = new class($rows) implements FromCollection, WithHeadings {
            public function __construct(private $rows) {}
            public function collection() { return $this->rows->map(fn($l) => [
                $l->id, $l->nama_lengkap, $l->nip_lama, $l->tempat_lahir,
                $l->tanggal_lahir?->format('d/m/Y'), $l->jenis_kelamin, $l->agama,
                $l->no_hp, $l->email, $l->pendidikan_terakhir, $l->jurusan,
                $l->institusi, $l->ipk, $l->status, $l->nilai_tes, $l->catatan_admin,
            ]); }
            public function headings(): array { return [
                'ID', 'Nama Lengkap', 'NIP Lama', 'Tempat Lahir', 'Tanggal Lahir',
                'JK', 'Agama', 'No HP', 'Email', 'Pendidikan', 'Jurusan',
                'Institusi', 'IPK', 'Status', 'Nilai Tes', 'Catatan Admin',
            ]; }
        };

        $filename = 'lamaran_' . str($formasi->jabatan)->slug() . '_' . now()->format('Ymd') . '.xlsx';

        return Excel::download($export, $filename);
    }
}
