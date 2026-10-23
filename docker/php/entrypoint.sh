#!/bin/sh
set -e

# Generate APP_KEY jika belum ada
if grep -q "^APP_KEY=$" /var/www/html/.env 2>/dev/null; then
    php artisan key:generate --force
fi

# Cache config, routes, views
php artisan config:cache
php artisan route:cache
php artisan view:cache

# Storage link
php artisan storage:link 2>/dev/null || true

# Jalankan migrations
php artisan migrate --force 2>/dev/null || true

exec "$@"
