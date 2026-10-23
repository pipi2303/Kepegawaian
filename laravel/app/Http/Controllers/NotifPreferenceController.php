<?php

namespace App\Http\Controllers;

use App\Models\NotifPreference;
use Illuminate\Http\Request;

class NotifPreferenceController extends Controller
{
    public function get()
    {
        return response()->json([
            'status' => 'success',
            'data'   => NotifPreference::forPegawai(auth()->id()),
        ]);
    }

    public function update(Request $request)
    {
        $data = $request->validate([
            'notif_cuti_email'        => 'nullable|boolean',
            'notif_cuti_wa'           => 'nullable|boolean',
            'notif_str_expiry_email'  => 'nullable|boolean',
            'notif_str_expiry_wa'     => 'nullable|boolean',
            'notif_slip_gaji_wa'      => 'nullable|boolean',
            'notif_kontrak_expiry_wa' => 'nullable|boolean',
            'notif_pensiun_wa'        => 'nullable|boolean',
            'notif_kgb_wa'            => 'nullable|boolean',
        ]);

        $pref = NotifPreference::forPegawai(auth()->id());
        $pref->update(array_filter($data, fn($v) => $v !== null));

        return response()->json(['status' => 'success', 'data' => $pref->fresh()]);
    }

    public function adminGet(Request $request)
    {
        abort_unless(auth()->user()->hasRole('admin'), 403);
        $request->validate(['pegawai_id' => 'required|integer|exists:m_pegawai,id']);

        return response()->json([
            'status' => 'success',
            'data'   => NotifPreference::forPegawai((int) $request->pegawai_id),
        ]);
    }
}
