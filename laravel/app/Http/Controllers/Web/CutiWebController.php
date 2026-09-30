<?php

namespace App\Http\Controllers\Web;

use App\Http\Controllers\Controller;
use App\Models\Cuti;
use App\Models\Pegawai;
use App\Services\CutiService;
use App\Http\Requests\StoreCutiRequest;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;
use Illuminate\Http\RedirectResponse;

class CutiWebController extends Controller
{
    protected CutiService $cutiService;

    public function __construct(CutiService $cutiService)
    {
        $this->cutiService = $cutiService;
    }

    /**
     * Halaman Manajemen Cuti (Inertia View)
     */
    public function index(Request $request): Response
    {
        $user = $request->user();
        $isHR = $user ? $user->hasRole(['admin', 'direktur', 'kepala_unit']) : true;

        $query = Cuti::with(['pegawai:id,nip,nama,jabatan,unit_kerja,foto', 'approvals']);

        if (!$isHR && $user && $user->pegawai_id) {
            $query->where('pegawai_id', $user->pegawai_id);
        }

        if ($status = $request->input('status')) {
            $query->where('status', $status);
        }

        if ($jenis = $request->input('jenis_cuti')) {
            $query->where('jenis_cuti', $jenis);
        }

        $cutiList = $query->latest('tanggal_pengajuan')->paginate(10)->withQueryString();
        $pegawais = Pegawai::where('status_aktif', 'Aktif')->select('id', 'nip', 'nama', 'jabatan', 'unit_kerja')->get();

        return Inertia::render('Cuti', [
            'cutiList' => $cutiList,
            'pegawaiList' => $pegawais,
            'filters' => $request->only(['status', 'jenis_cuti', 'search']),
            'sisaCutiUser' => $user?->pegawai?->sisa_cuti_tahunan ?? 12,
            'canApprove' => $isHR,
        ]);
    }

    /**
     * Simpan Pengajuan Cuti
     */
    public function store(StoreCutiRequest $request): RedirectResponse
    {
        $pegawai = Pegawai::findOrFail($request->input('pegawai_id'));
        $this->cutiService->ajukanCuti($pegawai, $request->validated());

        return redirect()->back()->with('success', 'Permohonan cuti berhasil diajukan dan sedang diproses.');
    }

    /**
     * Setujui Cuti (Approve)
     */
    public function approve(Request $request, Cuti $cuti): RedirectResponse
    {
        $approver = $request->user()?->pegawai ?: Pegawai::first();
        $this->cutiService->approve($cuti, $approver, $request->input('catatan'));

        return redirect()->back()->with('success', 'Pengajuan cuti berhasil disetujui.');
    }

    /**
     * Tolak Cuti (Reject)
     */
    public function reject(Request $request, Cuti $cuti): RedirectResponse
    {
        $request->validate(['alasan' => 'required|string|max:500']);
        $approver = $request->user()?->pegawai ?: Pegawai::first();
        $this->cutiService->reject($cuti, $approver, $request->input('alasan'));

        return redirect()->back()->with('warning', 'Pengajuan cuti telah ditolak.');
    }
}
