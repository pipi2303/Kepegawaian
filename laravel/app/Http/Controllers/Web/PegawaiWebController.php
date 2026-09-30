<?php

namespace App\Http\Controllers\Web;

use App\Http\Controllers\Controller;
use App\Models\Pegawai;
use App\Http\Requests\StorePegawaiRequest;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;
use Illuminate\Http\RedirectResponse;

class PegawaiWebController extends Controller
{
    /**
     * Halaman Data Pegawai (Inertia View)
     */
    public function index(Request $request): Response
    {
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

        $pegawais = $query->orderBy('nama', 'asc')->paginate(12)->withQueryString();
        $unitKerjas = Pegawai::select('unit_kerja')->distinct()->pluck('unit_kerja');

        return Inertia::render('DataPegawai', [
            'pegawaiList' => $pegawais,
            'unitKerjaList' => $unitKerjas,
            'filters' => $request->only(['search', 'unit_kerja', 'status_pegawai']),
        ]);
    }

    /**
     * Halaman Detail Profil Pegawai
     */
    public function show(Pegawai $pegawai): Response
    {
        $pegawai->load([
            'keluarga',
            'dokumen',
            'strList',
            'sipList',
            'credentialings',
            'jadwalShifts' => fn ($q) => $q->whereBetween('tanggal', [now()->startOfWeek(), now()->endOfWeek()]),
        ]);

        return Inertia::render('DetailPegawai', [
            'pegawai' => $pegawai,
            'sisaCuti' => $pegawai->sisa_cuti_tahunan,
        ]);
    }

    /**
     * Simpan Pegawai Baru
     */
    public function store(StorePegawaiRequest $request): RedirectResponse
    {
        Pegawai::create($request->validated());
        return redirect()->route('pegawai.index')->with('success', 'Data pegawai baru berhasil ditambahkan.');
    }

    /**
     * Update Data Pegawai
     */
    public function update(StorePegawaiRequest $request, Pegawai $pegawai): RedirectResponse
    {
        $pegawai->update($request->validated());
        return redirect()->back()->with('success', 'Perubahan data pegawai berhasil disimpan.');
    }
}
