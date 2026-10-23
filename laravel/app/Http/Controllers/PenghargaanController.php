<?php

namespace App\Http\Controllers;

use App\Models\{Penghargaan, ActivityLog};
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;

class PenghargaanController extends Controller
{
    public function index(Request $request)
    {
        $this->authorize('pegawai.view');

        $rows = Penghargaan::with('pegawai:id,nip,nama,jabatan,unit_kerja')
            ->when($request->pegawai_id, fn($q, $v) => $q->where('pegawai_id', $v))
            ->when($request->jenis,      fn($q, $v) => $q->where('jenis', $v))
            ->when($request->level,      fn($q, $v) => $q->where('level', $v))
            ->when($request->tahun,      fn($q, $v) => $q->where('tahun', $v))
            ->latest('tanggal')
            ->paginate(20);

        return response()->json(['status' => 'success', 'data' => $rows]);
    }

    public function store(Request $request)
    {
        $this->authorize('pegawai.edit');

        $data = $request->validate([
            'pegawai_id'      => 'required|exists:m_pegawai,id',
            'nama_penghargaan'=> 'required|string|max:255',
            'jenis'           => 'required|in:Pegawai Teladan,Inovasi,Dedikasi,Masa Kerja,Kehadiran,Lainnya',
            'pemberi'         => 'nullable|string|max:150',
            'level'           => 'required|in:Internal,Kabupaten/Kota,Provinsi,Nasional',
            'tanggal'         => 'required|date',
            'deskripsi'       => 'nullable|string',
        ]);

        $penghargaan = Penghargaan::create($data);

        ActivityLog::record(
            action: 'CREATE',
            severity: 'info',
            targetType: 'Penghargaan',
            targetId: $penghargaan->id,
            targetLabel: $data['nama_penghargaan'],
            description: 'Penghargaan pegawai dicatat: ' . $data['jenis'] . ' (' . $data['level'] . ').',
            request: $request,
        );

        return response()->json(['status' => 'success', 'message' => 'Penghargaan berhasil ditambahkan.', 'data' => $penghargaan], 201);
    }

    public function update(Request $request, Penghargaan $penghargaan)
    {
        $this->authorize('pegawai.edit');

        $data = $request->validate([
            'pegawai_id'      => 'sometimes|exists:m_pegawai,id',
            'nama_penghargaan'=> 'sometimes|string|max:255',
            'jenis'           => 'sometimes|in:Pegawai Teladan,Inovasi,Dedikasi,Masa Kerja,Kehadiran,Lainnya',
            'pemberi'         => 'nullable|string|max:150',
            'level'           => 'sometimes|in:Internal,Kabupaten/Kota,Provinsi,Nasional',
            'tanggal'         => 'sometimes|date',
            'deskripsi'       => 'nullable|string',
        ]);

        $penghargaan->update($data);

        ActivityLog::record(
            action: 'UPDATE',
            severity: 'info',
            targetType: 'Penghargaan',
            targetId: $penghargaan->id,
            targetLabel: $penghargaan->nama_penghargaan,
            description: 'Data penghargaan diperbarui.',
            request: $request,
        );

        return response()->json(['status' => 'success', 'data' => $penghargaan]);
    }

    public function destroy(Request $request, Penghargaan $penghargaan)
    {
        $this->authorize('pegawai.edit');

        $label = $penghargaan->nama_penghargaan;
        $penghargaan->delete();

        ActivityLog::record(
            action: 'DELETE',
            severity: 'warning',
            targetType: 'Penghargaan',
            targetLabel: $label,
            description: 'Data penghargaan dihapus.',
            request: $request,
        );

        return response()->json(['status' => 'success', 'message' => 'Data penghargaan dihapus.']);
    }

    public function stats()
    {
        $byJenis = DB::table('t_penghargaan_pegawai')
            ->selectRaw('jenis, COUNT(*) as total')
            ->groupBy('jenis')
            ->pluck('total', 'jenis');

        $byLevel = DB::table('t_penghargaan_pegawai')
            ->selectRaw('level, COUNT(*) as total')
            ->groupBy('level')
            ->pluck('total', 'level');

        $perTahun = DB::table('t_penghargaan_pegawai')
            ->selectRaw('tahun, COUNT(*) as total')
            ->groupBy('tahun')
            ->orderBy('tahun')
            ->get();

        $topUnit = DB::table('t_penghargaan_pegawai as ph')
            ->join('m_pegawai as p', 'p.id', '=', 'ph.pegawai_id')
            ->selectRaw('p.unit_kerja, COUNT(*) as total')
            ->groupBy('p.unit_kerja')
            ->orderByDesc('total')
            ->limit(10)
            ->get();

        return response()->json([
            'status' => 'success',
            'data'   => [
                'by_jenis'  => $byJenis,
                'by_level'  => $byLevel,
                'per_tahun' => $perTahun,
                'top_unit'  => $topUnit,
            ],
        ]);
    }

    public function uploadSertifikat(Request $request, Penghargaan $penghargaan)
    {
        $this->authorize('pegawai.edit');

        $request->validate([
            'file' => 'required|file|mimes:pdf,jpg,jpeg,png|max:5120',
        ]);

        $file     = $request->file('file');
        $filename = $penghargaan->id . '_' . $file->getClientOriginalName();
        $path     = $file->storeAs('penghargaan', $filename, 'public');

        $penghargaan->update(['file_sertifikat' => $path]);

        ActivityLog::record(
            action: 'UPDATE',
            severity: 'info',
            targetType: 'Penghargaan',
            targetId: $penghargaan->id,
            targetLabel: $penghargaan->nama_penghargaan,
            description: 'Sertifikat penghargaan diunggah: ' . $filename,
            request: $request,
        );

        return response()->json([
            'status' => 'success',
            'message' => 'Sertifikat berhasil diunggah.',
            'path' => Storage::url($path),
        ]);
    }
}
