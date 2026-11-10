# Deploy QResto to Cloud (FREE)

## Why You Need Cloud Hosting

Your current setup only works on your local WiFi (`192.168.1.13`).
To make QR codes work from **anywhere** (any WiFi, mobile data, globally), you need to deploy to the internet.

## Best Free Option: Render.com

Render offers free hosting for Node.js apps with:
- ✅ Free SSL certificate (HTTPS)
- ✅ Global CDN
- ✅ Works from any WiFi/mobile data
- ✅ Auto-deploys from GitHub
- ✅ Free PostgreSQL database (or we'll use SQLite)

## Steps to Deploy

### 1. Create Render Account
1. Go to: https://render.com
2. Sign up with GitHub (free)

### 2. Push Code to GitHub
1. Create GitHub account: https://github.com
2. Create new repository: "qresto"
3. Push your code (I'll help with this)

### 3. Deploy on Render
1. Click "New +" → "Web Service"
2. Connect your GitHub repo
3. Configure:
   - Build Command: `cd server && npm install`
   - Start Command: `cd server && node server.js`
   - Environment: Add variables

### 4. Your App Goes Live!
- You get a URL like: `https://qresto.onrender.com`
- QR codes work from ANYWHERE in the world!
- Scan from any phone, any WiFi, any country

## Alternative: I Can Set Up ngrok (Quick Test)

If you want to test cloud access RIGHT NOW without deploying:
- ngrok creates a temporary public URL
- Works for testing only (URL changes when you restart)
- I can set it up in 2 minutes

## What Do You Prefer?

**Option A**: Deploy to Render (permanent, free, professional)
**Option B**: Quick test with ngrok (temporary, for testing)

Tell me which option and I'll set it up!
