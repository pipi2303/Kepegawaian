<?php

return [
    'defaults' => [
        'guard' => 'web',
        'passwords' => 'pegawai',
    ],

    'guards' => [
        'web' => [
            'driver' => 'session',
            'provider' => 'pegawai',
        ],
        'api' => [
            'driver' => 'sanctum',
            'provider' => 'pegawai',
        ],
    ],

    'providers' => [
        'pegawai' => [
            'driver' => 'eloquent',
            'model' => App\Models\Pegawai::class,
        ],
    ],

    'passwords' => [
        'pegawai' => [
            'provider' => 'pegawai',
            'table' => 'password_reset_tokens',
            'expire' => 60,
            'throttle' => 60,
        ],
    ],

    'password_timeout' => 10800,
];
