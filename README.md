# iDew Dashboard

Web dashboard for the iDew condensation monitoring system.

## Deploy to Vercel (easiest — 2 minutes)

### 1. Push to GitHub

```bash
cd idew-dashboard
git init
git add .
git commit -m "iDew dashboard"
```

Create a new repo on GitHub (e.g. `idew-dashboard`), then:

```bash
git remote add origin https://github.com/YOUR_USERNAME/idew-dashboard.git
git branch -M main
git push -u origin main
```

### 2. Deploy on Vercel

1. Go to [vercel.com](https://vercel.com) and sign in with GitHub
2. Click **"Add New Project"**
3. Import your `idew-dashboard` repo
4. Framework preset will auto-detect as **Vite**
5. Click **Deploy**

That's it — you'll get a URL like `https://idew-dashboard.vercel.app`

Every push to `main` auto-deploys.

## Run locally

```bash
npm install
npm run dev
```

Opens at `http://localhost:5173`

## What it does

- Email/password login via Supabase Auth
- Live sensor data (air temp, surface temp, humidity, dew point)
- Time-series charts with 6h / 24h / 7d / 30d ranges
- Temperature, humidity, and dew point analysis views
- Device status (online/offline, firmware version)
- Condensation risk badge
- Auto-refreshes every 60 seconds
- Multi-device support (dropdown selector)
