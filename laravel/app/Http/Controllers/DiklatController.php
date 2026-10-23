<?php

namespace App\Http\Controllers;

use App\Models\ActivityLog;
use App\Models\Diklat;
use App\Models\Pegawai;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;

class DiklatController extends Controller
{
    private const JENIS_ENUM = ['Teknis', 'Fungsional', 'Kepemimpinan', 'Orientasi', 'Seminar', 'Workshop', 'Webinar', 'Magang'];
    private const STATUS_ENUM = ['Direncanakan', 'Sedang Berjalan', 'Selesai', 'Batal'];
    private const METODE_ENUM = ['Klasikal', 'Online', 'Blended'];

    public function index(Request $request)
    {
        $user = auth()->user();
        $canViewAll = $user->can('pegawai.view');

        $query = Diklat::with(['pegawai:id,nip,nama,unit_kerja'])
            ->latest('tanggal_mulai');

        if (!$canViewAll) {
            // own data only
            $query->where('pegawai_id', $user->id);
        } elseif ($pid = $request->input('pegawai_id')) {
            $query->where('pegawai_id', $pid);
        }

        if ($tahun = $request->input('tahun')) {
            $query->tahun((int) $tahun);
        }
        if ($jenis = $request->input('jenis')) {
            $query->where('jenis', $jenis);
        }
        if ($status = $request->input('status')) {
            $query->where('status', $status);
        }

        return response()->json([
            'status' => 'success',
            'data'   => $query->paginate(20),
        ]);
    }

    public function store(Request $request)
    {
        $user = auth()->user();
        $canEditAll = $user->can('pegawai.edit');

        $validated = $request->validate([
            'pegawai_id'       => 'required|exists:m_pegawai,id',
            'nama_diklat'      => 'required|string|max:255',
            'penyelenggara'    => 'required|string|max:150',
            'jenis'            => 'required|in:' . implode(',', self::JENIS_ENUM),
            'metode'           => 'nullable|in:' . implode(',', self::METODE_ENUM),
            'tanggal_mulai'    => 'required|date',
            'tanggal_selesai'  => 'required|date|after_or_equal:tanggal_mulai',
            'jumlah_jam'       => 'required|integer|min:1',
            'tempat'           => 'nullable|string|max:150',
            'nomor_sertifikat' => 'nullable|string|max:100',
            'file_sertifikat'  => 'nullable|url',
            'status'           => 'nullable|in:' . implode(',', self::STATUS_ENUM),
            'biaya'            => 'nullable|numeric|min:0',
            'keterangan'       => 'nullable|string',
        ]);

        if (!$canEditAll && (int) $validated['pegawai_id'] !== $user->id) {
            abort(403);
        }

        $diklat = Diklat::create($validated);

        ActivityLog::record(
            action: 'CREATE',
            targetType: 'Diklat',
            targetLabel: $validated['nama_diklat'],
            description: "Diklat baru ditambahkan untuk pegawai ID {$validated['pegawai_id']}",
            request: $request,
        );

        return response()->json(['status' => 'success', 'data' => $diklat], 201);
    }

    public function show(Diklat $diklat)
    {
        $user = auth()->user();
        if (!$user->can('pegawai.view') && $diklat->pegawai_id !== $user->id) {
            abort(403);
        }
        return response()->json(['status' => 'success', 'data' => $diklat->load('pegawai:id,nip,nama,unit_kerja')]);
    }

    public function update(Request $request, Diklat $diklat)
    {
        $user = auth()->user();
        if (!$user->can('pegawai.edit') && $diklat->pegawai_id !== $user->id) {
            abort(403);
        }

        $validated = $request->validate([
            'pegawai_id'       => 'sometimes|exists:m_pegawai,id',
            'nama_diklat'      => 'sometimes|required|string|max:255',
            'penyelenggara'    => 'sometimes|required|string|max:150',
            'jenis'            => 'sometimes|required|in:' . implode(',', self::JENIS_ENUM),
            'metode'           => 'nullable|in:' . implode(',', self::METODE_ENUM),
            'tanggal_mulai'    => 'sometimes|required|date',
            'tanggal_selesai'  => 'sometimes|required|date|after_or_equal:tanggal_mulai',
            'jumlah_jam'       => 'sometimes|required|integer|min:1',
            'tempat'           => 'nullable|string|max:150',
            'nomor_sertifikat' => 'nullable|string|max:100',
            'file_sertifikat'  => 'nullable|url',
            'status'           => 'nullable|in:' . implode(',', self::STATUS_ENUM),
            'biaya'            => 'nullable|numeric|min:0',
            'keterangan'       => 'nullable|string',
        ]);

        $diklat->update($validated);

        ActivityLog::record(
            action: 'UPDATE',
            targetType: 'Diklat',
            targetLabel: $diklat->nama_diklat,
            description: "Data diklat ID {$diklat->id} diperbarui",
            request: $request,
        );

        return response()->json(['status' => 'success', 'data' => $diklat]);
    }

    public function destroy(Request $request, Diklat $diklat)
    {
        $user = auth()->user();
        if (!$user->can('pegawai.edit') && $diklat->pegawai_id !== $user->id) {
            abort(403);
        }

        $label = $diklat->nama_diklat;
        $diklat->delete();

        ActivityLog::record(
            action: 'DELETE',
            targetType: 'Diklat',
            targetLabel: $label,
            description: "Data diklat dihapus",
            request: $request,
        );

        return response()->json(['status' => 'success', 'message' => 'Diklat dihapus']);
    }

    public function rekap(Request $request)
    {
        $request->validate(['tahun' => 'nullable|integer|min:2000|max:2100']);
        $tahun = (int) ($request->input('tahun', now()->year));

        $rows = DB::table('m_pegawai as p')
            ->where('p.status_aktif', 'Aktif')
            ->leftJoin('t_rencana_diklat as r', function ($j) use ($tahun) {
                $j->on('r.pegawai_id', '=', 'p.id')->where('r.tahun', '=', $tahun);
            })
            ->leftJoin(
                DB::raw("(SELECT pegawai_id, SUM(jumlah_jam) as total_jam, COUNT(*) as jumlah_diklat
                          FROM t_diklat_pegawai
                          WHERE status = 'Selesai' AND tahun = {$tahun}
                          GROUP BY pegawai_id) as d"),
                'd.pegawai_id', '=', 'p.id'
            )
            ->select(
                'p.id', 'p.nip', 'p.nama', 'p.unit_kerja', 'p.jabatan',
                DB::raw('COALESCE(r.target_jam, 40) as target_jam'),
                DB::raw('COALESCE(d.total_jam, 0) as realisasi_jam'),
                DB::raw('COALESCE(d.jumlah_diklat, 0) as jumlah_diklat'),
                DB::raw('COALESCE(r.target_jam, 40) - COALESCE(d.total_jam, 0) as gap')
            )
            ->orderBy('p.unit_kerja')
            ->orderBy('p.nama')
            ->get();

        return response()->json([
            'status' => 'success',
            'tahun'  => $tahun,
            'data'   => $rows,
        ]);
    }

    public function uploadSertifikat(Request $request, Diklat $diklat)
    {
        $user = auth()->user();
        if (!$user->can('pegawai.edit') && $diklat->pegawai_id !== $user->id) {
            abort(403);
        }

        $request->validate([
            'file' => 'required|file|mimes:pdf,jpg,jpeg,png|max:5120',
        ]);

        $file = $request->file('file');
        $filename = $diklat->id . '_' . $file->getClientOriginalName();
        $path = $file->storeAs('sertifikat_diklat', $filename, 'public');

        $diklat->update(['file_sertifikat' => $path]);

        return response()->json([
            'status' => 'success',
            'path'   => $path,
            'url'    => Storage::url($path),
        ]);
    }
}
