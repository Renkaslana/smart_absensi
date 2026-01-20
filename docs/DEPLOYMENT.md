# Deployment Guide - FahrenCenter

Panduan deployment **FahrenCenter Smart Attendance System** ke production environment.

---

## 📋 Table of Contents

1. [Pre-deployment Checklist](#pre-deployment-checklist)
2. [Server Requirements](#server-requirements)
3. [Backend Deployment](#backend-deployment)
4. [Frontend Deployment](#frontend-deployment)
5. [SSL/HTTPS Setup](#sslhttps-setup)
6. [Reverse Proxy (Nginx)](#reverse-proxy-nginx)
7. [Process Management (PM2)](#process-management-pm2)
8. [Database Migration](#database-migration)
9. [Monitoring & Logging](#monitoring--logging)
10. [Backup Strategy](#backup-strategy)
11. [Security Hardening](#security-hardening)

---

## ✅ Pre-deployment Checklist

### Code Preparation
- [ ] All features tested dan working di local
- [ ] Code reviewed dan merged ke `main` branch
- [ ] Dependencies updated (no security vulnerabilities)
- [ ] Environment variables configured
- [ ] Secrets generated dan secure

### Documentation
- [ ] API documentation updated
- [ ] Deployment procedure documented
- [ ] Rollback plan prepared
- [ ] Monitoring setup documented

### Infrastructure
- [ ] Server provisioned
- [ ] Domain registered
- [ ] DNS configured
- [ ] SSL certificate ready
- [ ] Backup system configured

---

## 🖥️ Server Requirements

### Minimum Requirements (< 100 users)

```yaml
Server Specs:
  CPU: 2 cores @ 2.4 GHz
  RAM: 2 GB
  Storage: 20 GB SSD
  OS: Ubuntu 20.04 LTS atau 22.04 LTS

Network:
  Bandwidth: 10 Mbps (shared)
  Port 80 (HTTP): Open
  Port 443 (HTTPS): Open
  Port 22 (SSH): Open (restricted)
```

### Recommended Requirements (100-200 users)

```yaml
Server Specs:
  CPU: 4 cores @ 3.0 GHz
  RAM: 4 GB
  Storage: 40 GB SSD
  OS: Ubuntu 22.04 LTS

Network:
  Bandwidth: 50 Mbps (dedicated)
  Same ports as minimum
```

### Software Requirements

```bash
# Required
- Python 3.10+
- Node.js 18+ atau 20+
- Nginx 1.18+
- Git
- PM2 (untuk process management)

# Optional but Recommended
- PostgreSQL 14+ (untuk scale > 200 users)
- Redis (untuk caching)
- Fail2ban (security)
- UFW (firewall)
```

---

## 🐍 Backend Deployment

### 1. Server Setup (Ubuntu)

```bash
# Update system
sudo apt update && sudo apt upgrade -y

# Install Python 3.10
sudo apt install -y python3.10 python3.10-venv python3-pip

# Install build dependencies (untuk dlib & face_recognition)
sudo apt install -y build-essential cmake pkg-config
sudo apt install -y libx11-dev libatlas-base-dev
sudo apt install -y libgtk-3-dev libboost-all-dev

# Install Git
sudo apt install -y git

# Create application user
sudo adduser --system --group fahrencenter
sudo usermod -aG sudo fahrencenter  # Optional: for admin tasks
```

### 2. Clone Repository

```bash
# Switch to app user
sudo su - fahrencenter

# Clone repository
git clone https://github.com/YOUR_USERNAME/smart_absensi.git
cd smart_absensi/backend
```

### 3. Setup Python Environment

```bash
# Create virtual environment
python3.10 -m venv venv

# Activate virtual environment
source venv/bin/activate

# Upgrade pip
pip install --upgrade pip

# Install dependencies
pip install -r requirements.txt

# Install dlib (might take 5-10 minutes)
pip install dlib

# Install face_recognition
pip install face-recognition
```

**Note:** Jika `dlib` compilation failed, gunakan pre-built wheel atau install via conda.

### 4. Configure Environment Variables

```bash
# Create .env file
nano .env
```

**Production .env:**
```env
# Security (MUST CHANGE!)
SECRET_KEY=your-very-secure-secret-key-min-32-chars-abcdef1234567890
JWT_SECRET_KEY=your-jwt-secret-key-min-32-chars-xyz9876543210

# JWT Settings
ACCESS_TOKEN_EXPIRE_MINUTES=30
REFRESH_TOKEN_EXPIRE_DAYS=7

# Database (SQLite for now)
DATABASE_URL=sqlite:///./database/absensi.db

# Face Recognition Settings
FACE_DISTANCE_THRESHOLD=0.55
MAX_FACE_ENCODINGS=5

# CORS (Update with your frontend domain)
ALLOWED_ORIGINS=["https://fahrencenter.com", "https://www.fahrencenter.com"]

# Storage
FACE_IMAGE_PATH=./database/wajah_siswa

# Logging
LOG_LEVEL=INFO
LOG_FILE=./logs/app.log
```

**Generate Secure Keys:**
```bash
# Generate SECRET_KEY
python3 -c "import secrets; print(secrets.token_urlsafe(32))"

# Generate JWT_SECRET_KEY
python3 -c "import secrets; print(secrets.token_urlsafe(32))"
```

### 5. Initialize Database

```bash
# Create database directory
mkdir -p database/wajah_siswa
mkdir -p logs

# Run database initialization
python -m app.db.init_db

# Verify database created
ls -lh database/absensi.db
```

### 6. Test Backend

```bash
# Run development server (test only)
python run.py

# Test API
curl http://localhost:8001/docs

# Stop server (Ctrl+C)
```

### 7. Setup Gunicorn (Production WSGI Server)

```bash
# Install Gunicorn
pip install gunicorn

# Create Gunicorn config
nano gunicorn_config.py
```

**gunicorn_config.py:**
```python
import multiprocessing

# Server socket
bind = "127.0.0.1:8001"
backlog = 2048

# Worker processes
workers = multiprocessing.cpu_count() * 2 + 1
worker_class = "uvicorn.workers.UvicornWorker"
worker_connections = 1000
timeout = 120
keepalive = 5

# Logging
accesslog = "./logs/gunicorn_access.log"
errorlog = "./logs/gunicorn_error.log"
loglevel = "info"

# Process naming
proc_name = "fahrencenter_backend"

# Server mechanics
daemon = False
pidfile = "./gunicorn.pid"
user = "fahrencenter"
group = "fahrencenter"
umask = 0o007

# SSL (optional, jika tidak pakai Nginx reverse proxy)
# keyfile = "/path/to/key.pem"
# certfile = "/path/to/cert.pem"
```

**Test Gunicorn:**
```bash
gunicorn -c gunicorn_config.py app.main:app

# Test
curl http://localhost:8001/docs

# Stop (Ctrl+C)
```

---

## ⚛️ Frontend Deployment

### Option A: Static Hosting (Vercel - Recommended)

**Vercel** adalah cara termudah untuk deploy Vite app.

#### 1. Install Vercel CLI
```bash
npm install -g vercel
```

#### 2. Configure Vercel
```bash
cd frontend

# Login ke Vercel
vercel login

# Deploy
vercel --prod
```

#### 3. Environment Variables (Vercel Dashboard)
```
VITE_API_BASE_URL=https://api.fahrencenter.com/api/v1
VITE_APP_NAME=FahrenCenter
VITE_FACE_CONFIDENCE_THRESHOLD=0.55
```

#### 4. Custom Domain (Optional)
- Vercel Dashboard → Settings → Domains
- Add: `fahrencenter.com` dan `www.fahrencenter.com`
- Update DNS records di domain registrar

---

### Option B: Self-Hosted (Nginx)

#### 1. Build Frontend
```bash
cd frontend

# Install dependencies
npm install

# Build for production
npm run build

# Output di folder: dist/
```

#### 2. Copy Build ke Server
```bash
# Dari local machine
scp -r dist/* fahrencenter@your-server:/var/www/fahrencenter/

# Atau di server, clone & build
cd /var/www/
sudo mkdir -p fahrencenter
sudo chown fahrencenter:fahrencenter fahrencenter

cd fahrencenter
git clone https://github.com/YOUR_USERNAME/smart_absensi.git .
cd frontend
npm install
npm run build
sudo cp -r dist/* /var/www/fahrencenter/
```

#### 3. Set Permissions
```bash
sudo chown -R www-data:www-data /var/www/fahrencenter
sudo chmod -R 755 /var/www/fahrencenter
```

---

## 🔒 SSL/HTTPS Setup

**CRITICAL:** Webcam API butuh **HTTPS** di production (bukan localhost).

### Using Let's Encrypt (Free SSL)

#### 1. Install Certbot
```bash
sudo apt install -y certbot python3-certbot-nginx
```

#### 2. Obtain Certificate
```bash
# Stop Nginx temporarily
sudo systemctl stop nginx

# Get certificate
sudo certbot certonly --standalone -d fahrencenter.com -d www.fahrencenter.com

# Certificates akan tersimpan di:
# /etc/letsencrypt/live/fahrencenter.com/fullchain.pem
# /etc/letsencrypt/live/fahrencenter.com/privkey.pem
```

#### 3. Auto-Renewal Setup
```bash
# Test renewal
sudo certbot renew --dry-run

# Auto-renewal via cron (sudah otomatis di Ubuntu)
sudo systemctl status certbot.timer
```

---

## 🌐 Reverse Proxy (Nginx)

### 1. Install Nginx

```bash
sudo apt install -y nginx
```

### 2. Configure Nginx

```bash
# Create config file
sudo nano /etc/nginx/sites-available/fahrencenter
```

**fahrencenter (Nginx config):**
```nginx
# Redirect HTTP to HTTPS
server {
    listen 80;
    listen [::]:80;
    server_name fahrencenter.com www.fahrencenter.com;
    
    return 301 https://$server_name$request_uri;
}

# HTTPS - Frontend
server {
    listen 443 ssl http2;
    listen [::]:443 ssl http2;
    server_name fahrencenter.com www.fahrencenter.com;
    
    # SSL Certificates
    ssl_certificate /etc/letsencrypt/live/fahrencenter.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/fahrencenter.com/privkey.pem;
    
    # SSL Configuration (Mozilla Intermediate)
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers 'ECDHE-ECDSA-AES128-GCM-SHA256:ECDHE-RSA-AES128-GCM-SHA256:ECDHE-ECDSA-AES256-GCM-SHA384:ECDHE-RSA-AES256-GCM-SHA384';
    ssl_prefer_server_ciphers off;
    ssl_session_cache shared:SSL:10m;
    ssl_session_timeout 10m;
    
    # Security Headers
    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-XSS-Protection "1; mode=block" always;
    
    # Frontend (React SPA)
    root /var/www/fahrencenter;
    index index.html;
    
    location / {
        try_files $uri $uri/ /index.html;
        
        # Cache static assets
        location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$ {
            expires 1y;
            add_header Cache-Control "public, immutable";
        }
    }
    
    # Gzip Compression
    gzip on;
    gzip_vary on;
    gzip_min_length 1024;
    gzip_types text/plain text/css text/xml text/javascript application/x-javascript application/xml+rss application/javascript application/json image/svg+xml;
}

# HTTPS - Backend API
server {
    listen 443 ssl http2;
    listen [::]:443 ssl http2;
    server_name api.fahrencenter.com;
    
    # SSL Certificates (same as above)
    ssl_certificate /etc/letsencrypt/live/fahrencenter.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/fahrencenter.com/privkey.pem;
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers 'ECDHE-ECDSA-AES128-GCM-SHA256:ECDHE-RSA-AES128-GCM-SHA256';
    ssl_prefer_server_ciphers off;
    
    # Security Headers
    add_header Strict-Transport-Security "max-age=31536000" always;
    
    # Proxy to Backend
    location / {
        proxy_pass http://127.0.0.1:8001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
        
        # Timeout settings
        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;
    }
    
    # Increase upload size (untuk face images)
    client_max_body_size 10M;
}
```

### 3. Enable Site

```bash
# Create symlink
sudo ln -s /etc/nginx/sites-available/fahrencenter /etc/nginx/sites-enabled/

# Test configuration
sudo nginx -t

# Reload Nginx
sudo systemctl reload nginx
```

### 4. DNS Configuration

**Add DNS records di domain registrar:**

```
Type    Name    Value                   TTL
A       @       your-server-ip          3600
A       www     your-server-ip          3600
A       api     your-server-ip          3600
```

**Verifikasi DNS:**
```bash
nslookup fahrencenter.com
nslookup api.fahrencenter.com
```

---

## 🔄 Process Management (PM2)

**PM2** untuk keep backend process alive dan auto-restart.

### 1. Install PM2

```bash
# Install Node.js (jika belum)
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs

# Install PM2 globally
sudo npm install -g pm2
```

### 2. Create PM2 Ecosystem File

```bash
cd /home/fahrencenter/smart_absensi/backend
nano ecosystem.config.js
```

**ecosystem.config.js:**
```javascript
module.exports = {
  apps: [{
    name: 'fahrencenter-backend',
    script: 'venv/bin/gunicorn',
    args: '-c gunicorn_config.py app.main:app',
    cwd: '/home/fahrencenter/smart_absensi/backend',
    interpreter: 'none',  // Use gunicorn directly
    instances: 1,
    autorestart: true,
    watch: false,
    max_memory_restart: '1G',
    env: {
      NODE_ENV: 'production',
      PYTHON_ENV: 'production'
    },
    error_file: './logs/pm2_error.log',
    out_file: './logs/pm2_out.log',
    log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
    merge_logs: true
  }]
};
```

### 3. Start Backend with PM2

```bash
# Start
pm2 start ecosystem.config.js

# Check status
pm2 status

# View logs
pm2 logs fahrencenter-backend

# Monitor
pm2 monit
```

### 4. Setup PM2 Startup

```bash
# Generate startup script
pm2 startup systemd -u fahrencenter --hp /home/fahrencenter

# Save current process list
pm2 save

# PM2 akan auto-start after server reboot
```

### 5. PM2 Commands

```bash
# Restart
pm2 restart fahrencenter-backend

# Stop
pm2 stop fahrencenter-backend

# Delete
pm2 delete fahrencenter-backend

# View logs
pm2 logs fahrencenter-backend --lines 100

# Flush logs
pm2 flush
```

---

## 🗄️ Database Migration

### Migrate SQLite → PostgreSQL (untuk scale > 200 users)

#### 1. Install PostgreSQL

```bash
sudo apt install -y postgresql postgresql-contrib
```

#### 2. Create Database

```bash
# Switch to postgres user
sudo -i -u postgres

# Create database & user
psql
CREATE DATABASE fahrencenter;
CREATE USER fahrencenter_user WITH PASSWORD 'secure_password_here';
GRANT ALL PRIVILEGES ON DATABASE fahrencenter TO fahrencenter_user;
\q

exit
```

#### 3. Backup SQLite Data

```bash
cd backend

# Export SQLite to SQL
sqlite3 database/absensi.db .dump > backup_sqlite.sql

# Backup face images
tar -czf backup_faces.tar.gz database/wajah_siswa/
```

#### 4. Update Backend Config

```bash
# Install PostgreSQL adapter
source venv/bin/activate
pip install psycopg2-binary

# Update .env
nano .env
```

```env
# Change from SQLite to PostgreSQL
DATABASE_URL=postgresql://fahrencenter_user:secure_password_here@localhost/fahrencenter
```

#### 5. Migrate Data

```python
# backend/migrate_sqlite_to_postgres.py
from sqlalchemy import create_engine
from app.db.base import Base
from app.models.user import User
from app.models.face_encoding import FaceEncoding
# ... import other models

# Create PostgreSQL tables
pg_engine = create_engine("postgresql://fahrencenter_user:password@localhost/fahrencenter")
Base.metadata.create_all(bind=pg_engine)

# Migrate data (manual script)
# ... copy data from SQLite to PostgreSQL
```

---

## 📊 Monitoring & Logging

### 1. Application Logs

**Backend Logs:**
```bash
# View logs
tail -f backend/logs/app.log
tail -f backend/logs/gunicorn_access.log
tail -f backend/logs/gunicorn_error.log

# PM2 logs
pm2 logs fahrencenter-backend
```

**Nginx Logs:**
```bash
sudo tail -f /var/log/nginx/access.log
sudo tail -f /var/log/nginx/error.log
```

### 2. System Monitoring

```bash
# Install htop
sudo apt install -y htop

# Monitor resources
htop

# Disk usage
df -h

# Memory usage
free -m
```

### 3. Setup Log Rotation

```bash
# Create logrotate config
sudo nano /etc/logrotate.d/fahrencenter
```

**fahrencenter (logrotate config):**
```
/home/fahrencenter/smart_absensi/backend/logs/*.log {
    daily
    missingok
    rotate 14
    compress
    delaycompress
    notifempty
    create 0640 fahrencenter fahrencenter
    sharedscripts
    postrotate
        pm2 reloadLogs
    endscript
}
```

---

## 💾 Backup Strategy

### 1. Database Backup

**Automated Backup Script:**
```bash
# Create backup script
nano /home/fahrencenter/backup_db.sh
```

**backup_db.sh:**
```bash
#!/bin/bash

BACKUP_DIR="/home/fahrencenter/backups"
DATE=$(date +%Y%m%d_%H%M%S)
DB_FILE="/home/fahrencenter/smart_absensi/backend/database/absensi.db"
FACES_DIR="/home/fahrencenter/smart_absensi/backend/database/wajah_siswa"

# Create backup directory
mkdir -p $BACKUP_DIR

# Backup database
cp $DB_FILE "$BACKUP_DIR/absensi_$DATE.db"

# Backup face images
tar -czf "$BACKUP_DIR/faces_$DATE.tar.gz" $FACES_DIR

# Delete backups older than 30 days
find $BACKUP_DIR -name "absensi_*.db" -mtime +30 -delete
find $BACKUP_DIR -name "faces_*.tar.gz" -mtime +30 -delete

echo "Backup completed: $DATE"
```

**Make executable & schedule:**
```bash
chmod +x /home/fahrencenter/backup_db.sh

# Add to crontab (daily at 2 AM)
crontab -e
```

```cron
0 2 * * * /home/fahrencenter/backup_db.sh >> /home/fahrencenter/backup.log 2>&1
```

### 2. Offsite Backup (Optional)

```bash
# Upload ke cloud storage (example: AWS S3)
aws s3 sync /home/fahrencenter/backups/ s3://fahrencenter-backups/
```

---

## 🛡️ Security Hardening

### 1. Firewall (UFW)

```bash
# Install UFW
sudo apt install -y ufw

# Allow SSH (IMPORTANT: do this first!)
sudo ufw allow 22/tcp

# Allow HTTP & HTTPS
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp

# Enable firewall
sudo ufw enable

# Check status
sudo ufw status
```

### 2. Fail2Ban (Brute-force Protection)

```bash
# Install Fail2Ban
sudo apt install -y fail2ban

# Create local config
sudo cp /etc/fail2ban/jail.conf /etc/fail2ban/jail.local
sudo nano /etc/fail2ban/jail.local
```

**jail.local (relevant sections):**
```ini
[DEFAULT]
bantime = 3600
findtime = 600
maxretry = 5

[sshd]
enabled = true

[nginx-http-auth]
enabled = true

[nginx-limit-req]
enabled = true
```

```bash
# Restart Fail2Ban
sudo systemctl restart fail2ban

# Check status
sudo fail2ban-client status
```

### 3. Disable Root Login

```bash
sudo nano /etc/ssh/sshd_config
```

```
PermitRootLogin no
PasswordAuthentication no  # Use SSH keys only
```

```bash
sudo systemctl restart sshd
```

### 4. Keep System Updated

```bash
# Enable automatic security updates
sudo apt install -y unattended-upgrades
sudo dpkg-reconfigure --priority=low unattended-upgrades
```

---

## 🚀 Deployment Checklist (Final)

### Pre-Production
- [ ] Code tested & reviewed
- [ ] Environment variables configured
- [ ] Secrets rotated (new SECRET_KEY, JWT_SECRET_KEY)
- [ ] Database initialized
- [ ] SSL certificate obtained
- [ ] DNS configured
- [ ] Backup system configured

### Production Deployment
- [ ] Backend running via PM2
- [ ] Frontend deployed (Vercel atau Nginx)
- [ ] Nginx reverse proxy configured
- [ ] HTTPS working (test dengan browser)
- [ ] Webcam access working (test face registration)
- [ ] Face recognition working (test attendance)
- [ ] Admin dashboard accessible
- [ ] Logs configured & monitoring enabled

### Post-Deployment
- [ ] Smoke tests passed
- [ ] Performance testing
- [ ] Load testing (optional)
- [ ] Monitoring alerts configured
- [ ] Backup tested (restore test)
- [ ] Documentation updated
- [ ] Team notified

---

## 🔄 Rollback Plan

Jika deployment gagal:

```bash
# 1. Restore database dari backup
cp /home/fahrencenter/backups/absensi_LATEST.db backend/database/absensi.db

# 2. Restore face images
tar -xzf /home/fahrencenter/backups/faces_LATEST.tar.gz -C backend/database/

# 3. Checkout ke previous working version
git checkout previous-working-commit

# 4. Restart backend
pm2 restart fahrencenter-backend

# 5. Rebuild & redeploy frontend (jika perlu)
cd frontend
git checkout previous-working-commit
npm run build
sudo cp -r dist/* /var/www/fahrencenter/
```

---

## 📞 Support & Maintenance

### Regular Maintenance Tasks

**Daily:**
- Check PM2 status: `pm2 status`
- Check logs: `pm2 logs --lines 50`

**Weekly:**
- Check disk space: `df -h`
- Check database size: `ls -lh backend/database/absensi.db`
- Review error logs

**Monthly:**
- Update system packages: `sudo apt update && sudo apt upgrade`
- Review backup integrity
- Check SSL certificate expiry: `sudo certbot certificates`

### Getting Help

- **Documentation:** Check [docs/](../docs/) folder
- **Logs:** Review application & system logs
- **Community:** GitHub Issues
- **Emergency:** Have rollback plan ready

---

**Dibuat dengan 💙 oleh Lycus (Affif)**  
**FahrenCenter** - *"Attendance Made Smart"*  
**Version:** 1.0.0