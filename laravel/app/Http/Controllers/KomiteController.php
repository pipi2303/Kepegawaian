<?php

namespace App\Http\Controllers;

use App\Models\{KomiteRS, AnggotaKomite, KegiatanKomite, ActivityLog};
use Illuminate\Http\Request;

class KomiteController extends Controller
{
    // ── Komite ────────────────────────────────────────────────────────────────

    public function indexKomite()
    {
        $data = KomiteRS::with(['ketua:id,nama'])
            ->withCount(['anggota as jumlah_anggota_aktif' => fn($q) => $q->where('status', 'Aktif')])
            ->withCount('kegiatan')
            ->get();

        return response()->json(['status' => 'success', 'data' => $data]);
    }

    public function storeKomite(Request $request)
    {
        $data = $request->validate([
            'nama_komite'        => 'required|string|max:150',
            'singkatan'          => 'nullable|string|max:50',
            'ketua_pegawai_id'   => 'nullable|exists:m_pegawai,id',
            'nomor_sk_pendirian' => 'nullable|string|max:100',
            'tanggal_sk'         => 'nullable|date',
            'deskripsi_tugas'    => 'nullable|string',
        ]);

        $komite = KomiteRS::create($data);

        ActivityLog::record(
            action: 'CREATE',
            targetType: 'KomiteRS',
            targetLabel: $data['nama_komite'],
            description: 'Komite RS baru dibuat',
            targetId: $komite->id,
            request: $request,
        );

        return response()->json(['status' => 'success', 'data' => $komite], 201);
    }

    public function updateKomite(Request $request, KomiteRS $komite)
    {
        $data = $request->validate([
            'nama_komite'        => 'sometimes|string|max:150',
            'singkatan'          => 'nullable|string|max:50',
            'ketua_pegawai_id'   => 'nullable|exists:m_pegawai,id',
            'nomor_sk_pendirian' => 'nullable|string|max:100',
            'tanggal_sk'         => 'nullable|date',
            'deskripsi_tugas'    => 'nullable|string',
        ]);

        $komite->update($data);

        ActivityLog::record(
            action: 'UPDATE',
            targetType: 'KomiteRS',
            targetLabel: $komite->nama_komite,
            description: 'Komite RS diperbarui',
            targetId: $komite->id,
            request: $request,
        );

        return response()->json(['status' => 'success', 'data' => $komite]);
    }

    public function destroyKomite(KomiteRS $komite)
    {
        if ($komite->anggota()->where('status', 'Aktif')->exists()) {
            return response()->json([
                'status'  => 'error',
                'message' => 'Komite masih memiliki anggota aktif. Nonaktifkan anggota terlebih dahulu.',
            ], 422);
        }

        $label = $komite->nama_komite;
        $komite->delete();

        ActivityLog::record(
            action: 'DELETE',
            targetType: 'KomiteRS',
            targetLabel: $label,
            description: 'Komite RS dihapus',
        );

        return response()->json(['status' => 'success', 'message' => 'Komite dihapus']);
    }

    // ── Anggota ───────────────────────────────────────────────────────────────

    public function indexAnggota(Request $request)
    {
        $query = AnggotaKomite::with([
            'pegawai:id,nip,nama,jabatan,unit_kerja',
            'komite:id,nama_komite',
        ]);

        if ($kid = $request->input('komite_id')) {
            $query->where('komite_id', $kid);
        }
        if ($status = $request->input('status')) {
            $query->where('status', $status);
        }

        return response()->json(['status' => 'success', 'data' => $query->get()]);
    }

    public function storeAnggota(Request $request)
    {
        $data = $request->validate([
            'komite_id'        => 'required|exists:m_komite_rs,id',
            'pegawai_id'       => 'required|exists:m_pegawai,id',
            'jabatan_di_komite'=> 'required|string|max:100',
            'tanggal_bergabung'=> 'required|date',
            'tanggal_berakhir' => 'nullable|date|after_or_equal:tanggal_bergabung',
            'status'           => 'nullable|in:Aktif,Nonaktif',
        ]);
        $data['status'] = $data['status'] ?? 'Aktif';

        $anggota = AnggotaKomite::create($data);

        ActivityLog::record(
            action: 'CREATE',
            targetType: 'AnggotaKomite',
            targetLabel: "Anggota komite #{$data['komite_id']} — pegawai #{$data['pegawai_id']}",
            description: 'Anggota komite baru ditambahkan',
            targetId: $anggota->id,
            request: $request,
        );

        return response()->json(['status' => 'success', 'data' => $anggota->load(['pegawai:id,nama', 'komite:id,nama_komite'])], 201);
    }

    public function updateAnggota(Request $request, AnggotaKomite $anggota)
    {
        $data = $request->validate([
            'komite_id'        => 'sometimes|exists:m_komite_rs,id',
            'pegawai_id'       => 'sometimes|exists:m_pegawai,id',
            'jabatan_di_komite'=> 'sometimes|string|max:100',
            'tanggal_bergabung'=> 'sometimes|date',
            'tanggal_berakhir' => 'nullable|date',
            'status'           => 'nullable|in:Aktif,Nonaktif',
        ]);

        $anggota->update($data);

        ActivityLog::record(
            action: 'UPDATE',
            targetType: 'AnggotaKomite',
            targetLabel: "Anggota #{$anggota->id}",
            description: 'Data anggota komite diperbarui',
            targetId: $anggota->id,
            request: $request,
        );

        return response()->json(['status' => 'success', 'data' => $anggota]);
    }

    public function destroyAnggota(AnggotaKomite $anggota)
    {
        $id = $anggota->id;
        $anggota->delete();

        ActivityLog::record(
            action: 'DELETE',
            targetType: 'AnggotaKomite',
            targetLabel: "Anggota #{$id}",
            description: 'Anggota komite dihapus',
        );

        return response()->json(['status' => 'success', 'message' => 'Anggota dihapus']);
    }

    // ── Kegiatan ──────────────────────────────────────────────────────────────

    public function indexKegiatan(Request $request)
    {
        $query = KegiatanKomite::with(['komite:id,nama_komite']);

        if ($kid = $request->input('komite_id')) {
            $query->where('komite_id', $kid);
        }
        if ($tahun = $request->input('tahun')) {
            $query->whereYear('tanggal_kegiatan', $tahun);
        }

        return response()->json(['status' => 'success', 'data' => $query->orderByDesc('tanggal_kegiatan')->get()]);
    }

    public function storeKegiatan(Request $request)
    {
        $data = $request->validate([
            'komite_id'       => 'required|exists:m_komite_rs,id',
            'judul_kegiatan'  => 'required|string|max:255',
            'tanggal_kegiatan'=> 'required|date',
            'jam_mulai'       => 'nullable',
            'jam_selesai'     => 'nullable',
            'tempat'          => 'required|string|max:150',
            'agenda'          => 'required|string',
            'notulensi'       => 'nullable|string',
        ]);

        $kegiatan = KegiatanKomite::create($data);

        ActivityLog::record(
            action: 'CREATE',
            targetType: 'KegiatanKomite',
            targetLabel: $data['judul_kegiatan'],
            description: 'Kegiatan komite baru dijadwalkan',
            targetId: $kegiatan->id,
            request: $request,
        );

        return response()->json(['status' => 'success', 'data' => $kegiatan->load('komite:id,nama_komite')], 201);
    }

    public function updateKegiatan(Request $request, KegiatanKomite $kegiatan)
    {
        $data = $request->validate([
            'komite_id'       => 'sometimes|exists:m_komite_rs,id',
            'judul_kegiatan'  => 'sometimes|string|max:255',
            'tanggal_kegiatan'=> 'sometimes|date',
            'jam_mulai'       => 'nullable',
            'jam_selesai'     => 'nullable',
            'tempat'          => 'sometimes|string|max:150',
            'agenda'          => 'sometimes|string',
            'notulensi'       => 'nullable|string',
        ]);

        $kegiatan->update($data);

        ActivityLog::record(
            action: 'UPDATE',
            targetType: 'KegiatanKomite',
            targetLabel: $kegiatan->judul_kegiatan,
            description: 'Kegiatan komite diperbarui',
            targetId: $kegiatan->id,
            request: $request,
        );

        return response()->json(['status' => 'success', 'data' => $kegiatan]);
    }

    public function destroyKegiatan(KegiatanKomite $kegiatan)
    {
        $label = $kegiatan->judul_kegiatan;
        $kegiatan->delete();

        ActivityLog::record(
            action: 'DELETE',
            targetType: 'KegiatanKomite',
            targetLabel: $label,
            description: 'Kegiatan komite dihapus',
        );

        return response()->json(['status' => 'success', 'message' => 'Kegiatan dihapus']);
    }
}
