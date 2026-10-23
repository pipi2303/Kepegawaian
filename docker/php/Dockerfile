FROM php:8.2-fpm

RUN apt-get update && apt-get install -y \
    libpng-dev \
    libonig-dev \
    libxml2-dev \
    libzip-dev \
    libicu-dev \
    unzip \
    git \
    default-mysql-client \
    && docker-php-ext-install \
        pdo_mysql \
        mbstring \
        xml \
        zip \
        bcmath \
        gd \
        intl \
        opcache \
    && apt-get clean && rm -rf /var/lib/apt/lists/*

# Use latest Composer 2.8+ which supports policy.advisories.ignore-id
COPY --from=composer:latest /usr/bin/composer /usr/bin/composer

WORKDIR /var/www/html

COPY laravel/ .

# Install dependencies — security advisories ignored via composer.json policy section
RUN composer install \
    --no-dev --optimize-autoloader --no-interaction \
    && chown -R www-data:www-data storage bootstrap/cache

COPY docker/php/entrypoint.sh /entrypoint.sh
RUN chmod +x /entrypoint.sh

ENTRYPOINT ["/entrypoint.sh"]
CMD ["php-fpm"]
