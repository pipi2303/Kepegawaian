<?php

return [
    'driver'          => env('SESSION_DRIVER', 'file'),
    'lifetime'        => env('SESSION_LIFETIME', 480), // 8 jam = 1 shift RS
    'expire_on_close' => false,
    'encrypt'         => true,  // enkripsi session di disk
    'files'           => storage_path('framework/sessions'),
    'connection'      => env('SESSION_CONNECTION'),
    'table'           => 'sessions',
    'store'           => env('SESSION_STORE'),
    'lottery'         => [2, 100],
    'cookie'          => env('SESSION_COOKIE', 'hcms_session'),
    'path'            => '/',
    'domain'          => env('SESSION_DOMAIN'),
    'secure'          => env('SESSION_SECURE_COOKIE', true), // HTTPS only di production
    'http_only'       => true,
    'same_site'       => 'lax',
    'partitioned'     => false,

    // Idle timeout — dihandle oleh middleware SessionIdleTimeout
    'idle_timeout'    => env('SESSION_IDLE_TIMEOUT', 30), // menit
];
