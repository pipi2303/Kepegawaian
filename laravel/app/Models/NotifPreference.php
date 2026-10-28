<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class NotifPreference extends Model
{
    protected $table = 'notif_preferences';

    protected $fillable = [
        'pegawai_id',
        'notif_cuti_email',
        'notif_cuti_wa',
        'notif_str_expiry_email',
        'notif_str_expiry_wa',
        'notif_sip_expiry_email',
        'notif_sip_expiry_wa',
        'notif_slip_gaji_wa',
        'notif_kontrak_expiry_wa',
        'notif_pensiun_wa',
        'notif_kgb_wa',
    ];

    protected $casts = [
        'notif_cuti_email'        => 'boolean',
        'notif_cuti_wa'           => 'boolean',
        'notif_str_expiry_email'  => 'boolean',
        'notif_str_expiry_wa'     => 'boolean',
        'notif_sip_expiry_email'  => 'boolean',
        'notif_sip_expiry_wa'     => 'boolean',
        'notif_slip_gaji_wa'      => 'boolean',
        'notif_kontrak_expiry_wa' => 'boolean',
        'notif_pensiun_wa'        => 'boolean',
        'notif_kgb_wa'            => 'boolean',
    ];

    public function pegawai()
    {
        return $this->belongsTo(Pegawai::class);
    }

    public static function forPegawai(int $id): self
    {
        return static::firstOrCreate(['pegawai_id' => $id]);
    }
}
