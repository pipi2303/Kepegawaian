<?php

return [
    'dsn' => env('SENTRY_DSN', ''),
    'traces_sample_rate' => env('SENTRY_TRACES_SAMPLE_RATE', 0.1),
    'profiles_sample_rate' => env('SENTRY_PROFILES_SAMPLE_RATE', 0.1),
    'send_default_pii' => false,  // HIPAA: no PII in error reports
    'environment' => env('APP_ENV', 'production'),
    'release' => env('APP_VERSION', '1.0.0'),
    'ignore_exceptions' => [
        \Illuminate\Auth\AuthenticationException::class,
        \Illuminate\Validation\ValidationException::class,
    ],
];
