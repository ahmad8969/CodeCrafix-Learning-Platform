# Installation Guide

## 1. Clone

```bash
git clone <repo-url>
cd CodeCrafters-Learning-Platform
```

## 2. Install dependencies

```bash
npm run setup
```

This installs root, `client/`, and `server/` packages.

## 3. Environment files

```bash
cp client/.env.example client/.env
cp server/.env.example server/.env
```

### Client

```env
VITE_API_URL=http://localhost:5000/api/v1
```

### Server

```env
PORT=5000
MONGO_URI=mongodb://localhost:27017/codecrafters
JWT_SECRET=change_me_in_production
CLIENT_URL=http://localhost:5173
```

## 4. Database

```bash
docker compose up mongo -d
```

Or point `MONGO_URI` at any MongoDB instance.

## 5. Start

```bash
npm run dev
```

Verify:

```bash
curl http://localhost:5000/api/v1/health
```

Expected shape:

```json
{
  "success": true,
  "message": "Server Running",
  "data": { ... }
}
```
