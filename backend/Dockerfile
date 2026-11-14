# 1. Use official PHP 8.2 with Apache web server
FROM php:8.2-apache

# 2. Install Linux packages required for PHP extensions and Composer
RUN apt-get update && apt-get install -y \
    libpng-dev \
    libjpeg-dev \
    libfreetype6-dev \
    zip \
    unzip \
    git \
    curl \
    && docker-php-ext-configure gd --with-freetype --with-jpeg \
    && docker-php-ext-install -j$(nproc) mysqli pdo_mysql fileinfo gd \
    && a2enmod rewrite headers \
    && apt-get clean && rm -rf /var/lib/apt/lists/*

# 3. Copy Composer from the official composer image
COPY --from=composer:latest /usr/bin/composer /usr/bin/composer

# 4. Set the working folder inside the container
WORKDIR /var/www/html

# 5. Copy the backend files into the container
COPY . /var/www/html/

# 6. Install PHP packages (PHPMailer)
RUN composer install --no-interaction --prefer-dist --optimize-autoloader

# 7. Create a compatibility link so both /api and legacy /FundUp-Host/backend/api work
RUN mkdir -p /var/www/html/FundUp-Host && ln -s /var/www/html /var/www/html/FundUp-Host/backend

# 8. Set write permissions for uploads folder
RUN chown -R www-data:www-data /var/www/html/uploads \
    && chmod -R 775 /var/www/html/uploads

# 9. Apache listens on port 80
EXPOSE 80
