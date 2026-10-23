<?php

namespace App\Http\Controllers;

use App\Models\InsidenK3RS;
use App\Models\VaksinasiPegawai;
use App\Models\MCUPegawai;
use App\Models\Pegawai;
use App\Models\ActivityLog;
use App\Services\WhatsAppService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class K3RSController extends Controller
{
    // ─── INSIDEN ────────────────────────────────────────────────────────────────

    public function indexInsiden(Request $request)
    {
        $q = InsidenK3RS::with('pelapor:id,nama')
            ->latest('tanggal_insiden');

        if ($tahun = $request->tahun) {
            $q->whereYear('tanggal_insiden', $tahun);
        }
        if ($keparahan = $request->tingkat_keparahan) {
            $q->where('tingkat_keparahan', $keparahan);
        }
        if ($status = $request->status_investigasi) {
            $q->where('status_investigasi', $status);
        }

        return response()->json(['status' => 'success', 'data' => $q->paginate(20)]);
    }

    public function storeInsiden(Request $request)
    {
        $data = $request->validate([
            'pegawai_id'        => 'nullable|exists:m_pegawai,id',
            'tanggal_insiden'   => 'required|date',
            'jam_insiden'       => 'required',
            'lokasi'            => 'required|string',
            'jenis_insiden'     => 'required|string',
            'kronologi'         => 'required|string',
            'tingkat_keparahan' => 'required|in:Ringan,Sedang,Berat,Fatal',
            'korban_jiwa'       => 'boolean',
            'penanganan_awal'   => 'required|string',
        ]);

        $data['status_investigasi'] = 'Dilaporkan';
        $data['pelapor_id']         = auth()->id();
        $data['korban_jiwa']        = $request->boolean('korban_jiwa');

        $insiden = InsidenK3RS::create($data);

        // WA alert for severe incidents
        if (in_array($data['tingkat_keparahan'], ['Fatal', 'Berat'])) {
            $admin = Pegawai::where('status_aktif', 'Aktif')->whereHas('roles', fn($r) => $r->where('name', 'admin'))->first();
            if ($admin?->no_telp) {
                $prefix  = $data['tingkat_keparahan'] === 'Fatal' ? '🚨 FATAL' : '🚨 BERAT';
                WhatsAppService::send($admin->no_telp, "{$prefix}: Insiden K3RS baru dilaporkan — {$data['jenis_insiden']} di {$data['lokasi']} ({$data['tanggal_insiden']})");
            }
        }

        $severity = $data['tingkat_keparahan'] === 'Fatal' ? 'critical' : 'warning';
        ActivityLog::record(
            action: 'CREATE',
            severity: $severity,
            targetType: 'InsidenK3RS',
            targetId: $insiden->id,
            targetLabel: $data['jenis_insiden'],
            description: "Laporan insiden K3RS: {$data['jenis_insiden']} di {$data['lokasi']}",
            request: $request,
        );

        return response()->json(['status' => 'success', 'data' => $insiden], 201);
    }

    public function updateInsiden(Request $request, InsidenK3RS $insiden)
    {
        $data = $request->validate([
            'status_investigasi' => 'required|in:Dilaporkan,Sedang Diinvestigasi,Selesai,Ditutup',
            'penanganan_awal'    => 'nullable|string',
        ]);

        $insiden->update($data);

        ActivityLog::record(
            action: 'UPDATE',
            targetType: 'InsidenK3RS',
            targetId: $insiden->id,
            targetLabel: $insiden->jenis_insiden,
            description: "Status investigasi diperbarui: {$data['status_investigasi']}",
            request: $request,
        );

        return response()->json(['status' => 'success', 'data' => $insiden]);
    }

    public function statsInsiden()
    {
        $tahun     = now()->year;
        $lastTahun = $tahun - 1;

        $perKeparahan = InsidenK3RS::whereYear('tanggal_insiden', $tahun)
            ->selectRaw('tingkat_keparahan, COUNT(*) as jumlah')
            ->groupBy('tingkat_keparahan')
            ->pluck('jumlah', 'tingkat_keparahan');

        $trendBulan = InsidenK3RS::selectRaw("DATE_FORMAT(tanggal_insiden, '%Y-%m') as bulan, COUNT(*) as jumlah")
            ->where('tanggal_insiden', '>=', now()->subMonths(12)->startOfMonth())
            ->groupBy('bulan')
            ->orderBy('bulan')
            ->get();

        $totalTahunIni  = InsidenK3RS::whereYear('tanggal_insiden', $tahun)->count();
        $totalTahunLalu = InsidenK3RS::whereYear('tanggal_insiden', $lastTahun)->count();

        return response()->json([
            'status' => 'success',
            'data'   => [
                'tahun'           => $tahun,
                'total_tahun_ini' => $totalTahunIni,
                'total_tahun_lalu'=> $totalTahunLalu,
                'per_keparahan'   => $perKeparahan,
                'trend_bulan'     => $trendBulan,
            ],
        ]);
    }

    // ─── VAKSINASI ───────────────────────────────────────────────────────────────

    public function indexVaksinasi(Request $request)
    {
        $q = VaksinasiPegawai::with('pegawai:id,nip,nama,unit_kerja')
            ->latest('tanggal_vaksinasi');

        if ($pegawaiId = $request->pegawai_id)  $q->where('pegawai_id', $pegawaiId);
        if ($namaVaksin = $request->nama_vaksin) $q->where('nama_vaksin', $namaVaksin);
        if ($status = $request->status)          $q->where('status', $status);
        if ($tahun = $request->tahun)            $q->whereYear('tanggal_vaksinasi', $tahun);

        return response()->json(['status' => 'success', 'data' => $q->paginate(20)]);
    }

    public function storeVaksinasi(Request $request)
    {
        $data = $request->validate([
            'pegawai_id'        => 'required|exists:m_pegawai,id',
            'nama_vaksin'       => 'required|string',
            'tanggal_vaksinasi' => 'required|date',
            'dosis'             => 'required|integer|min:1',
            'nomor_batch'       => 'nullable|string',
            'pemberi_vaksin'    => 'nullable|string',
            'lokasi_vaksinasi'  => 'nullable|string',
            'status'            => 'required|in:Dijadwalkan,Selesai,Ditunda',
        ]);

        $vak = VaksinasiPegawai::create($data);

        ActivityLog::record(
            action: 'CREATE',
            targetType: 'VaksinasiPegawai',
            targetId: $vak->id,
            targetLabel: $data['nama_vaksin'],
            description: "Vaksinasi {$data['nama_vaksin']} dicatat untuk pegawai ID {$data['pegawai_id']}",
            request: $request,
        );

        return response()->json(['status' => 'success', 'data' => $vak], 201);
    }

    public function updateVaksinasi(Request $request, VaksinasiPegawai $vaksinasi)
    {
        $data = $request->validate([
            'nama_vaksin'       => 'sometimes|string',
            'tanggal_vaksinasi' => 'sometimes|date',
            'dosis'             => 'sometimes|integer|min:1',
            'nomor_batch'       => 'nullable|string',
            'pemberi_vaksin'    => 'nullable|string',
            'lokasi_vaksinasi'  => 'nullable|string',
            'status'            => 'sometimes|in:Dijadwalkan,Selesai,Ditunda',
        ]);

        $vaksinasi->update($data);

        return response()->json(['status' => 'success', 'data' => $vaksinasi]);
    }

    public function destroyVaksinasi(VaksinasiPegawai $vaksinasi)
    {
        $vaksinasi->delete();
        return response()->json(['status' => 'success']);
    }

    public function coverage()
    {
        $totalAktif = Pegawai::where('status_aktif', 'Aktif')->count();

        $data = VaksinasiPegawai::selectRaw("
                nama_vaksin,
                SUM(status = 'Selesai') as selesai,
                SUM(status = 'Dijadwalkan') as dijadwalkan,
                COUNT(DISTINCT pegawai_id) as total_pegawai
            ")
            ->groupBy('nama_vaksin')
            ->orderBy('nama_vaksin')
            ->get()
            ->map(fn($r) => [
                'nama_vaksin'   => $r->nama_vaksin,
                'selesai'       => (int) $r->selesai,
                'dijadwalkan'   => (int) $r->dijadwalkan,
                'total_pegawai' => (int) $r->total_pegawai,
                'persen'        => $totalAktif > 0 ? round(($r->selesai / $totalAktif) * 100, 1) : 0,
            ]);

        return response()->json(['status' => 'success', 'data' => $data, 'total_aktif' => $totalAktif]);
    }

    // ─── MCU ─────────────────────────────────────────────────────────────────────

    public function indexMCU(Request $request)
    {
        $q = MCUPegawai::with('pegawai:id,nip,nama,unit_kerja,jabatan')
            ->latest('tanggal_mcu');

        if ($pegawaiId = $request->pegawai_id) $q->where('pegawai_id', $pegawaiId);
        if ($tahun = $request->tahun)           $q->whereYear('tanggal_mcu', $tahun);
        if ($hasil = $request->hasil_umum)      $q->where('hasil_umum', $hasil);

        return response()->json(['status' => 'success', 'data' => $q->paginate(20)]);
    }

    public function storeMCU(Request $request)
    {
        $data = $request->validate([
            'pegawai_id'          => 'required|exists:m_pegawai,id',
            'tanggal_mcu'         => 'required|date',
            'fasilitas_kesehatan' => 'nullable|string',
            'hasil_umum'          => 'required|in:Sehat,Perlu Tindak Lanjut,Tidak Sehat',
            'catatan_dokter'      => 'nullable|string',
            'file_hasil'          => 'nullable|string',
        ]);

        $mcu = MCUPegawai::create($data);

        ActivityLog::record(
            action: 'CREATE',
            targetType: 'MCUPegawai',
            targetId: $mcu->id,
            targetLabel: "MCU {$data['tanggal_mcu']}",
            description: "MCU dicatat — hasil: {$data['hasil_umum']}",
            request: $request,
        );

        return response()->json(['status' => 'success', 'data' => $mcu], 201);
    }

    public function updateMCU(Request $request, MCUPegawai $mcu)
    {
        $data = $request->validate([
            'tanggal_mcu'         => 'sometimes|date',
            'fasilitas_kesehatan' => 'nullable|string',
            'hasil_umum'          => 'sometimes|in:Sehat,Perlu Tindak Lanjut,Tidak Sehat',
            'catatan_dokter'      => 'nullable|string',
            'file_hasil'          => 'nullable|string',
        ]);

        $mcu->update($data);

        return response()->json(['status' => 'success', 'data' => $mcu]);
    }

    public function destroyMCU(MCUPegawai $mcu)
    {
        $mcu->delete();
        return response()->json(['status' => 'success']);
    }

    public function mcuSummary()
    {
        $totalAktif  = Pegawai::where('status_aktif', 'Aktif')->count();
        $cutoff      = now()->subMonths(12)->toDateString();

        $hasMCU = MCUPegawai::where('tanggal_mcu', '>=', $cutoff)
            ->distinct('pegawai_id')
            ->count('pegawai_id');

        $breakdownHasil = MCUPegawai::where('tanggal_mcu', '>=', $cutoff)
            ->selectRaw('hasil_umum, COUNT(*) as jumlah')
            ->groupBy('hasil_umum')
            ->pluck('jumlah', 'hasil_umum');

        // Pegawai without MCU in last 12 months
        $pegawaiDenganMCU = MCUPegawai::where('tanggal_mcu', '>=', $cutoff)
            ->pluck('pegawai_id');

        $tanpaMCU = Pegawai::where('status_aktif', 'Aktif')
            ->whereNotIn('id', $pegawaiDenganMCU)
            ->select('id', 'nip', 'nama', 'unit_kerja', 'jabatan')
            ->limit(20)
            ->get();

        return response()->json([
            'status' => 'success',
            'data'   => [
                'total_aktif'     => $totalAktif,
                'sudah_mcu'       => $hasMCU,
                'belum_mcu'       => $totalAktif - $hasMCU,
                'coverage_persen' => $totalAktif > 0 ? round(($hasMCU / $totalAktif) * 100, 1) : 0,
                'breakdown_hasil' => $breakdownHasil,
                'tanpa_mcu'       => $tanpaMCU,
            ],
        ]);
    }
}
