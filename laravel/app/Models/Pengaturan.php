<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Facades\Cache;

class Pengaturan extends Model
{
    protected $table = 'pengaturan';

    protected $fillable = ['key', 'value', 'keterangan'];

    public static function get(string $key, mixed $default = null): mixed
    {
        return Cache::remember('pengaturan.' . $key, 3600, fn() => static::where('key', $key)->value('value')) ?? $default;
    }

    public static function set(string $key, mixed $value): void
    {
        static::updateOrCreate(['key' => $key], ['value' => $value]);
        Cache::forget('pengaturan.' . $key);
    }

    /** @return string[] */
    public static function all_rs(): array
    {
        return ['nama_rs', 'kota_rs', 'kelas_rs', 'akreditasi_rs', 'logo_rs', 'alamat_rs', 'no_telp_rs', 'email_rs', 'direktur_rs'];
    }
}
