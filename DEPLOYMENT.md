# SellerDesk — Production Deployment Guide

This guide covers three production deployment strategies for **SellerDesk**:
- **Method 1**: Cloud PaaS Deployment (Render / Railway) — Zero-devops 1-click cloud hosting.
- **Method 2**: Standard Linux VPS (Ubuntu/Debian) with Node.js, systemd, and Nginx.
- **Method 3**: Docker & Docker Compose containerized deployment.

---

## Deployment Strategy 1: Cloud PaaS (Render Web Service)

Render provides free or low-cost automated hosting with native Git integration, automated HTTPS, and zero server maintenance.

### Option A: 1-Click Blueprint (Recommended)
1. In the Render Dashboard, click **New +** -> **Blueprint**.
2. Connect your GitHub repository (`sellerdesk`).
3. Render reads `render.yaml` automatically and configures:
   - **Service Type**: Web Service
   - **Runtime**: Node
   - **Build Command**: `npm install && npm run build`
   - **Start Command**: `npm start`
   - **Health Check Path**: `/api/health`
4. Click **Apply**. Render will automatically install dependencies across both workspaces, compile the Vite frontend, run database migrations, seed demo data, and expose the live application over HTTPS.

### Option B: Manual Web Service Setup
1. In the Render Dashboard, click **New +** -> **Web Service**.
2. Select your repository.
3. Configure the following fields:
   - **Name**: `sellerdesk` (or your choice)
   - **Region**: Oregon (or closest to your users)
   - **Branch**: `main`
   - **Root Directory**: *(leave blank for root)*
   - **Runtime**: `Node`
   - **Build Command**: `npm install && npm run build`
   - **Start Command**: `npm start`
   - **Instance Type**: `Free`
4. Expand **Advanced** -> **Environment Variables** and add:
   - `NODE_ENV`: `production`
   - `PORT`: `5001`
   - `AUTO_SEED`: `true` (automatically initializes tables and demo accounts on start)
   - `DB_CLIENT`: `sqlite` (or `mysql` if using external MySQL)
   - `SQLITE_FILE`: `./database/sellerdesk.sqlite`
   - `JWT_SECRET`: *(Generate a random 32+ character string)*
   - `JWT_EXPIRES_IN`: `7d`
5. Under **Health Check Path**, enter `/api/health`.
6. Click **Deploy Web Service**.

---

## Deployment Strategy 2: Linux VPS (Nginx + systemd + SSL)

This method provides optimal performance and direct system control on a cloud server (DigitalOcean, Linode, AWS EC2, Hetzner, etc.).

### 1. Prerequisites
- Clean Ubuntu 22.04 or 24.04 LTS server.
- Non-root user with `sudo` privileges.
- Registered domain name (e.g., `app.yourstore.com`) pointed to your server IP.

### 2. Install Node.js 20 LTS & Nginx
```bash
# Update system packages
sudo apt update && sudo apt upgrade -y

# Install Node.js 20 LTS
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs nginx git certbot python3-certbot-nginx

# Verify versions
node -v   # Should be v20.x
npm -v    # Should be v10.x
```

### 3. Clone Repository & Setup SellerDesk
```bash
# Clone to /var/www
sudo mkdir -p /var/www
sudo chown -R $USER:$USER /var/www
cd /var/www
git clone <your-repository-url> sellerdesk
cd sellerdesk

# Run zero-config automated setup (Installs deps, migrates SQLite DB, seeds initial data)
npm install
npm run setup

# Build client assets for production
npm run build
```

### 4. Configure Production Environment Variables
Edit `/var/www/sellerdesk/.env`:
```ini
NODE_ENV=production
PORT=5001

# IMPORTANT: Generate a secure 64-character random string for production
# You can generate one with: openssl rand -base64 32
JWT_SECRET=put_your_secure_randomly_generated_64_character_key_here
JWT_EXPIRES_IN=7d

# Database Configuration (SQLite zero-config mode)
DB_CLIENT=sqlite
SQLITE_FILE=/var/www/sellerdesk/database/sellerdesk.sqlite

# CORS & Uploads
CORS_ORIGIN=https://app.yourstore.com
UPLOAD_DIR=/var/www/sellerdesk/uploads
```

Ensure the database directory is writable by the app:
```bash
chmod 750 /var/www/sellerdesk/database
chmod 640 /var/www/sellerdesk/database/sellerdesk.sqlite*
```

### 5. Create systemd Service Unit
Create `/etc/systemd/system/sellerdesk.service`:
```ini
[Unit]
Description=SellerDesk Production Application Service
After=network.target

[Service]
Type=simple
User=www-data
WorkingDirectory=/var/www/sellerdesk
ExecStart=/usr/bin/node /var/www/sellerdesk/server/index.js
Restart=always
RestartSec=10
StandardOutput=syslog
StandardError=syslog
SyslogIdentifier=sellerdesk
Environment=NODE_ENV=production

[Install]
WantedBy=multi-user.target
```

Enable and start the service:
```bash
sudo chown -R www-data:www-data /var/www/sellerdesk
sudo systemctl daemon-reload
sudo systemctl enable sellerdesk
sudo systemctl start sellerdesk
sudo systemctl status sellerdesk
```

### 6. Configure Nginx Reverse Proxy
Create `/etc/nginx/sites-available/sellerdesk`:
```nginx
server {
    listen 80;
    server_name app.yourstore.com;

    # Client-side bundle caching
    location /assets/ {
        alias /var/www/sellerdesk/client/dist/assets/;
        expires 1y;
        add_header Cache-Control "public, no-transform";
    }

    # API and dynamic requests
    location / {
        proxy_pass http://127.0.0.1:5001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}
```

Enable site and acquire SSL:
```bash
sudo ln -s /etc/nginx/sites-available/sellerdesk /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx

# Issue free Let's Encrypt SSL certificate
sudo certbot --nginx -d app.yourstore.com
```

---

## Deployment Strategy 3: Docker & Docker Compose

Docker containerization packages the entire runtime, frontend build, and backend into an isolated, self-contained container.

### 1. Prerequisites
- Server with **Docker Engine** (`24.x+`) and **Docker Compose** (`v2.x+`).

### 2. Deployment Steps
```bash
# Clone the repository
git clone <your-repository-url> sellerdesk
cd sellerdesk

# Copy production environment configuration
cp .env.example .env
```

Edit `.env` and set your production values:
```ini
NODE_ENV=production
PORT=5001
JWT_SECRET=replace_with_a_secure_random_string_using_openssl
CORS_ORIGIN=https://app.yourstore.com
```

### 3. Launch with Docker Compose
```bash
# Build and start container in detached mode
docker compose up -d --build

# Verify container status and logs
docker compose ps
docker compose logs -f
```

The container automatically:
1. Runs a multi-stage build compiling client assets via Vite.
2. Serves static files and the API from Express on port `5001`.
3. Persists the SQLite database in the Docker named volume `sellerdesk-data`.
4. Executes continuous health checks on `/api/health`.

### 4. Running Migrations in Docker
On first launch, initialize the container database:
```bash
docker compose exec sellerdesk node database/migrate.js
docker compose exec sellerdesk node database/seed.js
```

---

## 3. Database Backup & Disaster Recovery

### Backing up SQLite Database
Because SQLite runs in Write-Ahead Logging (WAL) mode, backup is clean and instantaneous:
```bash
# Manual or cron snapshot
sqlite3 /var/www/sellerdesk/database/sellerdesk.sqlite ".backup '/var/backups/sellerdesk-$(date +%Y%m%d_%H%M%S).sqlite'"
```

Add a daily automated backup via cron (`crontab -e`):
```cron
0 2 * * * sqlite3 /var/www/sellerdesk/database/sellerdesk.sqlite ".backup '/var/backups/sellerdesk-$(date +\%Y\%m\%d).sqlite'" && find /var/backups/sellerdesk-*.sqlite -mtime +14 -delete
```

### Backing up MySQL (If using MySQL mode)
```bash
mysqldump -u sellerdesk -p sellerdesk --single-transaction --quick > /var/backups/sellerdesk-mysql-$(date +%Y%m%d).sql
```
