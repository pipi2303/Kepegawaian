<?php

return [
    'provider' => env('WA_PROVIDER', 'fonnte'),
    'fonnte' => [
        'token'   => env('FONNTE_TOKEN', ''),
        'api_url' => 'https://api.fonnte.com/send',
    ],
    'enabled' => env('WA_ENABLED', false),
];
