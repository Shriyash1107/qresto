# QResto - Dynamic QR Code Management for Restaurants

A full-stack SaaS application for creating and managing dynamic QR codes that can be updated in real-time without regenerating the QR code.

## Features

- 🔐 User authentication (register/login)
- 📱 Dynamic QR code generation
- 🔄 Update QR destinations without regenerating codes
- 📊 Analytics tracking (scans, locations, devices)
- 🎨 Modern, responsive UI with Tailwind CSS
- 🚀 Fast and lightweight

## Tech Stack

**Frontend:**
- React 18
- TypeScript
- Tailwind CSS
- Vite
- Recharts (analytics)

**Backend:**
- Node.js
- Express
- SQLite with better-sqlite3
- JWT authentication
- QRCode library

## Local Development

### Prerequisites
- Node.js 18+ installed
- npm or yarn

### Setup

1. Clone the repository
```bash
git clone <your-repo-url>
cd qr
```

2. Install backend dependencies
```bash
cd server
npm install
```

3. Install frontend dependencies
```bash
cd ../client
npm install
```

4. Create backend .env file
```bash
cd ../server
# Create .env file with:
PORT=5000
CLIENT_URL=http://localhost:5173
BASE_URL=http://localhost:5000
JWT_SECRET=your-secret-key-here
```

5. Create frontend .env file
```bash
cd ../client
# Create .env file with:
VITE_API_URL=http://localhost:5000
```

6. Start backend
```bash
cd server
node server.js
```

7. Start frontend
```bash
cd client
npm run dev
```

8. Open browser to `http://localhost:5173`

## Deployment

See [DEPLOY-TO-CLOUD.md](./DEPLOY-TO-CLOUD.md) for deployment instructions.

### Deploy to Render.com (FREE)

1. Push code to GitHub
2. Sign up at https://render.com
3. Create new Web Service
4. Connect your GitHub repo
5. Configure:
   - Build Command: `cd server && npm install`
   - Start Command: `cd server && node server.js`
   - Add environment variables

### Deploy Frontend to Vercel (FREE)

1. Sign up at https://vercel.com
2. Import your GitHub repo
3. Select `client` folder as root
4. Deploy!

## How It Works

1. User creates a QR code with a destination URL
2. QResto generates a short redirect URL (e.g., `https://your-domain.com/r/abc123`)
3. QR code encodes the short redirect URL
4. When scanned, server redirects to the destination URL
5. User can update destination anytime - same QR code, new destination!

## License

MIT

## Author

Built with ❤️ for restaurants
