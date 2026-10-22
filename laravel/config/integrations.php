<?php

return [
    'satusehat' => [
        'base_url'      => env('SATUSEHAT_BASE_URL', 'https://api-satusehat.kemkes.go.id'),
        'auth_url'      => env('SATUSEHAT_AUTH_URL', 'https://api-satusehat.kemkes.go.id/oauth2/v1/accesstoken'),
        'client_id'     => env('SATUSEHAT_CLIENT_ID', ''),
        'client_secret' => env('SATUSEHAT_CLIENT_SECRET', ''),
        'org_id'        => env('SATUSEHAT_ORG_ID', ''),      // Organization ID dari Kemenkes
        'timeout'       => 30,
        'retry'         => 3,
    ],
    'siasn' => [
        'base_url'      => env('SIASN_BASE_URL', 'https://apimws.bkn.go.id:8243'),
        'sso_url'       => env('SIASN_SSO_URL', 'https://sso.bkn.go.id/authenticationendpoint/login.do'),
        'client_id'     => env('SIASN_CLIENT_ID', ''),
        'client_secret' => env('SIASN_CLIENT_SECRET', ''),
        'timeout'       => 30,
    ],
];
