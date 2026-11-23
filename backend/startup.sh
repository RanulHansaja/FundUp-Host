#!/bin/bash
# FundUp Custom Startup: Configures Nginx & PHP upload limits to 25MB
echo "Configuring Nginx & PHP limits..."

# 1. Update Nginx configuration if present
for conf in /etc/nginx/sites-enabled/default /etc/nginx/sites-available/default /etc/nginx/nginx.conf; do
    if [ -f "$conf" ]; then
        if grep -q "client_max_body_size" "$conf"; then
            sed -i 's/client_max_body_size.*/client_max_body_size 25M;/g' "$conf"
        else
            sed -i '/server {/a \    client_max_body_size 25M;' "$conf" 2>/dev/null || true
        fi
    fi
done

# Reload Nginx without crashing if not running yet
service nginx reload 2>/dev/null || nginx -s reload 2>/dev/null || true

# 2. Add PHP custom configuration for upload limits
if [ -d /usr/local/etc/php/conf.d ]; then
    cat << 'EOF' > /usr/local/etc/php/conf.d/uploads.ini
upload_max_filesize = 25M
post_max_size = 30M
memory_limit = 256M
max_execution_time = 120
EOF
fi

echo "FundUp Custom Startup completed successfully."
