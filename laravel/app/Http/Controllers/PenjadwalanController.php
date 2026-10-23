<?php

namespace App\Http\Controllers;

use App\Models\JadwalShift;
use App\Models\ActivityLog;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class PenjadwalanController extends Controller
{
    public function index(Request $request)
    {
        $bulan = $request->integer('bulan', now()->month);
        $tahun = $request->integer('tahun', now()->year);

        $query = JadwalShift::with(['pegawai:id,nip,nama,jabatan,unit_kerja'])
            ->whereMonth('tanggal', $bulan)
            ->whereYear('tanggal', $tahun)
            ->orderBy('tanggal')
            ->orderBy('jam_mulai');

        if ($unit = $request->input('unit_kerja')) {
            $query->where('unit_kerja', $unit);
        }
        if ($pid = $request->input('pegawai_id')) {
            $query->where('pegawai_id', $pid);
        }

        return response()->json([
            'status' => 'success',
            'data'   => $query->paginate(50),
        ]);
    }

    public function store(Request $request)
    {
        $data = $request->validate([
            'pegawai_id'      => 'required|exists:m_pegawai,id',
            'tanggal'         => 'required|date',
            'jenis_shift'     => 'required|in:Pagi,Sore,Malam,Non-Shift,Libur,On-Call',
            'jam_mulai'       => 'required',
            'jam_selesai'     => 'required',
            'unit_kerja'      => 'required|string|max:150',
            'ruangan'         => 'nullable|string|max:150',
            'catatan'         => 'nullable|string',
            'status_kehadiran'=> 'nullable|in:Terjadwal,Hadir,Tukar Shift,Tidak Hadir',
        ]);

        $exists = JadwalShift::where('pegawai_id', $data['pegawai_id'])
            ->whereDate('tanggal', $data['tanggal'])
            ->where('jenis_shift', $data['jenis_shift'])
            ->exists();

        if ($exists) {
            return response()->json([
                'status'  => 'error',
                'message' => 'Jadwal dengan kombinasi pegawai, tanggal, dan jenis shift ini sudah ada.',
            ], 422);
        }

        $data['status_kehadiran'] = $data['status_kehadiran'] ?? 'Terjadwal';
        $jadwal = JadwalShift::create($data);

        ActivityLog::record(
            action: 'CREATE',
            targetType: 'JadwalShift',
            targetLabel: "Jadwal {$data['jenis_shift']} pegawai #{$data['pegawai_id']} tgl {$data['tanggal']}",
            description: 'Jadwal shift baru dibuat',
            request: $request,
        );

        return response()->json(['status' => 'success', 'data' => $jadwal], 201);
    }

    public function bulkStore(Request $request)
    {
        $request->validate([
            'shifts'                  => 'required|array|min:1',
            'shifts.*.pegawai_id'     => 'required|exists:m_pegawai,id',
            'shifts.*.tanggal'        => 'required|date',
            'shifts.*.jenis_shift'    => 'required|in:Pagi,Sore,Malam,Non-Shift,Libur,On-Call',
            'shifts.*.jam_mulai'      => 'required',
            'shifts.*.jam_selesai'    => 'required',
            'shifts.*.unit_kerja'     => 'required|string|max:150',
            'shifts.*.catatan'        => 'nullable|string',
        ]);

        $created = 0;
        $skipped = 0;

        DB::transaction(function () use ($request, &$created, &$skipped) {
            foreach ($request->input('shifts') as $row) {
                $exists = JadwalShift::where('pegawai_id', $row['pegawai_id'])
                    ->whereDate('tanggal', $row['tanggal'])
                    ->where('jenis_shift', $row['jenis_shift'])
                    ->exists();

                if ($exists) { $skipped++; continue; }

                JadwalShift::create(array_merge($row, ['status_kehadiran' => 'Terjadwal']));
                $created++;
            }
        });

        ActivityLog::record(
            action: 'CREATE',
            targetType: 'JadwalShift',
            targetLabel: 'Bulk jadwal shift',
            description: "Bulk create: {$created} dibuat, {$skipped} dilewati",
            request: $request,
        );

        return response()->json(['status' => 'success', 'data' => ['created' => $created, 'skipped' => $skipped]]);
    }

    public function update(Request $request, JadwalShift $jadwal)
    {
        $data = $request->validate([
            'pegawai_id'      => 'sometimes|exists:m_pegawai,id',
            'tanggal'         => 'sometimes|date',
            'jenis_shift'     => 'sometimes|in:Pagi,Sore,Malam,Non-Shift,Libur,On-Call',
            'jam_mulai'       => 'sometimes',
            'jam_selesai'     => 'sometimes',
            'unit_kerja'      => 'sometimes|string|max:150',
            'ruangan'         => 'nullable|string|max:150',
            'catatan'         => 'nullable|string',
            'status_kehadiran'=> 'nullable|in:Terjadwal,Hadir,Tukar Shift,Tidak Hadir',
        ]);

        $jadwal->update($data);

        ActivityLog::record(
            action: 'UPDATE',
            targetType: 'JadwalShift',
            targetLabel: "Jadwal #{$jadwal->id}",
            description: 'Jadwal shift diperbarui',
            targetId: $jadwal->id,
            request: $request,
        );

        return response()->json(['status' => 'success', 'data' => $jadwal]);
    }

    public function destroy(JadwalShift $jadwal)
    {
        $label = "Jadwal #{$jadwal->id}";
        $jadwal->delete();

        ActivityLog::record(
            action: 'DELETE',
            targetType: 'JadwalShift',
            targetLabel: $label,
            description: 'Jadwal shift dihapus',
        );

        return response()->json(['status' => 'success', 'message' => 'Jadwal dihapus']);
    }

    public function swap(Request $request)
    {
        $request->validate([
            'jadwal_a_id' => 'required|exists:t_jadwal_shift,id',
            'jadwal_b_id' => 'required|exists:t_jadwal_shift,id',
        ]);

        DB::transaction(function () use ($request) {
            $a = JadwalShift::findOrFail($request->jadwal_a_id);
            $b = JadwalShift::findOrFail($request->jadwal_b_id);

            [$a->pegawai_id, $b->pegawai_id] = [$b->pegawai_id, $a->pegawai_id];
            $a->status_kehadiran = 'Tukar Shift';
            $b->status_kehadiran = 'Tukar Shift';
            $a->save();
            $b->save();
        });

        ActivityLog::record(
            action: 'UPDATE',
            targetType: 'JadwalShift',
            targetLabel: "Tukar shift #{$request->jadwal_a_id} ↔ #{$request->jadwal_b_id}",
            description: 'Tukar shift antara 2 pegawai',
            request: $request,
        );

        return response()->json(['status' => 'success', 'message' => 'Shift berhasil ditukar']);
    }

    public function rekap(Request $request)
    {
        $request->validate([
            'bulan'     => 'required|integer|between:1,12',
            'tahun'     => 'required|integer',
            'unit_kerja'=> 'nullable|string',
        ]);

        $query = DB::table('t_jadwal_shift as j')
            ->join('m_pegawai as p', 'p.id', '=', 'j.pegawai_id')
            ->whereMonth('j.tanggal', $request->bulan)
            ->whereYear('j.tanggal', $request->tahun)
            ->select([
                'j.pegawai_id',
                'p.nama',
                'p.unit_kerja',
                DB::raw('COUNT(*) as total_shift'),
                DB::raw("SUM(j.jenis_shift = 'Pagi') as shift_pagi"),
                DB::raw("SUM(j.jenis_shift = 'Sore') as shift_sore"),
                DB::raw("SUM(j.jenis_shift = 'Malam') as shift_malam"),
                DB::raw("SUM(j.jenis_shift = 'Non-Shift') as non_shift"),
                DB::raw("SUM(j.jenis_shift = 'Libur') as shift_libur"),
                DB::raw("SUM(j.jenis_shift = 'On-Call') as on_call"),
                DB::raw("SEC_TO_TIME(SUM(TIME_TO_SEC(j.jam_selesai) - TIME_TO_SEC(j.jam_mulai))) as total_jam"),
            ])
            ->groupBy('j.pegawai_id', 'p.nama', 'p.unit_kerja')
            ->orderBy('p.nama');

        if ($unit = $request->input('unit_kerja')) {
            $query->where('j.unit_kerja', $unit);
        }

        return response()->json(['status' => 'success', 'data' => $query->get()]);
    }
}
