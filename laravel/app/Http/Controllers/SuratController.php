<?php

namespace App\Http\Controllers;

use App\Models\ActivityLog;
use App\Models\Cuti;
use App\Models\Pegawai;
use App\Models\Pengaturan;
use Barryvdh\DomPDF\Facade\Pdf;
use Illuminate\Http\Request;
use Illuminate\Http\Response;

class SuratController extends Controller
{
    private function rs(): array
    {
        return collect(Pengaturan::all_rs())
            ->mapWithKeys(fn($k) => [$k => Pengaturan::get($k)])
            ->all();
    }

    public function keteranganBekerja(Request $request): Response
    {
        $validated = $request->validate([
            'pegawai_id' => 'required|integer|exists:m_pegawai,id',
            'tujuan'     => 'required|string|max:500',
        ]);

        $pegawai    = Pegawai::findOrFail($validated['pegawai_id']);
        $pengaturan = $this->rs();
        $nomorSurat = 'SKB/' . $pegawai->nip . '/' . now()->year . '/' . now()->month;

        $pdf = Pdf::loadView('pdf.surat.keterangan_bekerja', compact('pegawai', 'pengaturan', 'nomorSurat') + ['tujuan' => $validated['tujuan']]);
        $pdf->setPaper('A4');

        ActivityLog::record(
            action: 'EXPORT',
            targetType: 'Surat',
            targetLabel: 'SKB - ' . $pegawai->nama,
            description: 'Generate Surat Keterangan Bekerja untuk ' . $pegawai->nama,
            request: $request,
        );

        return $pdf->download("SKB-{$pegawai->nip}-" . now()->format('Ymd') . '.pdf');
    }

    public function suratTugas(Request $request): Response
    {
        $validated = $request->validate([
            'pegawai_id'      => 'required|integer|exists:m_pegawai,id',
            'tugas'           => 'required|string|max:500',
            'tempat'          => 'required|string|max:255',
            'tanggal_mulai'   => 'required|date',
            'tanggal_selesai' => 'required|date|after_or_equal:tanggal_mulai',
        ]);

        $pegawai    = Pegawai::findOrFail($validated['pegawai_id']);
        $pengaturan = $this->rs();
        $nomorSurat = 'ST/' . $pegawai->nip . '/' . now()->year . '/' . now()->month;

        $pdf = Pdf::loadView('pdf.surat.surat_tugas', [
            'pegawai'         => $pegawai,
            'pengaturan'      => $pengaturan,
            'nomorSurat'      => $nomorSurat,
            'tugas'           => $validated['tugas'],
            'tempat'          => $validated['tempat'],
            'tanggal_mulai'   => $validated['tanggal_mulai'],
            'tanggal_selesai' => $validated['tanggal_selesai'],
        ]);
        $pdf->setPaper('A4');

        ActivityLog::record(
            action: 'EXPORT',
            targetType: 'Surat',
            targetLabel: 'ST - ' . $pegawai->nama,
            description: 'Generate Surat Tugas untuk ' . $pegawai->nama,
            request: $request,
        );

        return $pdf->download("ST-{$pegawai->nip}-" . now()->format('Ymd') . '.pdf');
    }

    public function suratCuti(Request $request): Response
    {
        $validated = $request->validate([
            'cuti_id' => 'required|integer|exists:t_cuti,id',
        ]);

        $cuti       = Cuti::with('pegawai')->findOrFail($validated['cuti_id']);
        $pengaturan = $this->rs();
        $nomorSurat = 'SC/' . $cuti->pegawai->nip . '/' . now()->year . '/' . now()->month;

        $pdf = Pdf::loadView('pdf.surat.surat_cuti', compact('cuti', 'pengaturan', 'nomorSurat'));
        $pdf->setPaper('A4');

        ActivityLog::record(
            action: 'EXPORT',
            targetType: 'Surat',
            targetLabel: 'SC - ' . $cuti->pegawai->nama,
            description: 'Generate Surat Cuti untuk ' . $cuti->pegawai->nama,
            request: $request,
        );

        return $pdf->download("SC-{$cuti->pegawai->nip}-" . now()->format('Ymd') . '.pdf');
    }

    public function kontrakPPPK(Request $request): Response
    {
        $validated = $request->validate([
            'pegawai_id' => 'required|integer|exists:m_pegawai,id',
        ]);

        $pegawai = Pegawai::findOrFail($validated['pegawai_id']);

        if (!in_array($pegawai->status_pegawai, ['PPPK', 'Honorer'])) {
            abort(422, 'Kontrak PPPK hanya untuk pegawai berstatus PPPK atau Honorer.');
        }

        $kontrak = \DB::table('t_kontrak_pegawai')
            ->where('pegawai_id', $pegawai->id)
            ->where('status', 'Aktif')
            ->orderByDesc('tanggal_mulai')
            ->first();

        $pengaturan = $this->rs();
        $nomorSurat = 'PK-PPPK/' . $pegawai->nip . '/' . now()->year;

        $pdf = Pdf::loadView('pdf.surat.kontrak_pppk', compact('pegawai', 'pengaturan', 'nomorSurat', 'kontrak'));
        $pdf->setPaper('A4');

        ActivityLog::record(
            action: 'EXPORT',
            targetType: 'Surat',
            targetLabel: 'Kontrak PPPK - ' . $pegawai->nama,
            description: 'Generate Kontrak PPPK untuk ' . $pegawai->nama,
            request: $request,
        );

        return $pdf->download("Kontrak-PPPK-{$pegawai->nip}-" . now()->format('Ymd') . '.pdf');
    }
}
