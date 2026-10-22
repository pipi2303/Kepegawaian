<?php

namespace App\Http\Controllers\Web;

use App\Http\Controllers\Controller;
use App\Models\ActivityLog;
use App\Models\Pegawai;
use App\Http\Requests\StorePegawaiRequest;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;
use Illuminate\Http\RedirectResponse;

class PegawaiWebController extends Controller
{
    public function index(Request $request): Response
    {
        $this->authorize('pegawai.view');

        $query = Pegawai::query();

        if ($search = $request->input('search')) {
            $query->where(function ($q) use ($search) {
                $q->where('nama', 'like', "%{$search}%")
                  ->orWhere('nip', 'like', "%{$search}%")
                  ->orWhere('jabatan', 'like', "%{$search}%");
            });
        }
        if ($unit = $request->input('unit_kerja')) {
            $query->where('unit_kerja', $unit);
        }
        if ($status = $request->input('status_pegawai')) {
            $query->where('status_pegawai', $status);
        }

        return Inertia::render('DataPegawai', [
            'pegawaiList'  => $query->orderBy('nama')->paginate(12)->withQueryString(),
            'unitKerjaList' => Pegawai::select('unit_kerja')->distinct()->pluck('unit_kerja'),
            'filters'      => $request->only(['search', 'unit_kerja', 'status_pegawai']),
        ]);
    }

    public function show(Pegawai $pegawai): Response
    {
        $this->authorize('pegawai.view');

        $pegawai->load([
            'keluarga', 'dokumen', 'strList', 'sipList', 'credentialings',
            'jadwalShifts' => fn($q) => $q->whereBetween('tanggal', [now()->startOfWeek(), now()->endOfWeek()]),
        ]);

        return Inertia::render('DetailPegawai', [
            'pegawai'  => $pegawai,
            'sisaCuti' => $pegawai->sisa_cuti_tahunan,
        ]);
    }

    // store/update — authorize() sudah di StorePegawaiRequest::authorize()
    public function store(StorePegawaiRequest $request): RedirectResponse
    {
        Pegawai::create($request->validated());
        return redirect()->route('pegawai.index')->with('success', 'Data pegawai baru berhasil ditambahkan.');
    }

    public function update(StorePegawaiRequest $request, Pegawai $pegawai): RedirectResponse
    {
        $pegawai->update($request->validated());
        return redirect()->back()->with('success', 'Perubahan data pegawai berhasil disimpan.');
    }

    public function destroy(Request $request, Pegawai $pegawai): RedirectResponse
    {
        $this->authorize('pegawai.delete');

        $label = $pegawai->nama . ' (NIP. ' . $pegawai->nip . ')';
        $pegawai->delete();

        ActivityLog::record(
            action: 'DELETE',
            severity: 'critical',
            targetType: 'Pegawai',
            targetId: $pegawai->id,
            targetLabel: $label,
            description: 'Penonaktifan pegawai via Web Portal.',
            changes: ['status_aktif' => ['old' => $pegawai->status_aktif, 'new' => 'Diberhentikan']],
            request: $request,
        );

        return redirect()->route('pegawai.index')->with('success', 'Pegawai berhasil dinonaktifkan.');
    }
}
