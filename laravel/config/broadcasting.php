<?php

return [
    'default' => env('BROADCAST_CONNECTION', 'pusher'),
    'connections' => [
        'pusher' => [
            'driver' => 'pusher',
            'key'    => env('PUSHER_APP_KEY', 'hcms-key'),
            'secret' => env('PUSHER_APP_SECRET', 'hcms-secret-change-me'),
            'app_id' => env('PUSHER_APP_ID', '1'),
            'options' => [
                'host'      => env('PUSHER_HOST', 'soketi'),
                'port'      => env('PUSHER_PORT', 6001),
                'scheme'    => env('PUSHER_SCHEME', 'http'),
                'encrypted' => false,
                'useTLS'    => false,
            ],
            'client_options' => [],
        ],
        'log'  => ['driver' => 'log'],
        'null' => ['driver' => 'null'],
    ],
];
