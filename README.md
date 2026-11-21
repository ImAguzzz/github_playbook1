# Ruang

Ruang includes a community dashboard, a cross-platform Expo app, and a small
Express API for community posts. Use Node.js 22.13 or newer for the mobile
toolchain.

## Run the API and dashboard

```powershell
cd server
npm install
npm start
```

Open `http://localhost:3000`. Posts are stored in `server/data/ruang.db`.
To use a different database file, set `DATABASE_PATH` before starting the API.

## Run the mobile app

```powershell
cd mobile
npm install
npx expo start
```

Set `EXPO_PUBLIC_API_URL` to the API's reachable URL before starting Expo:

- Android emulator: `http://10.0.2.2:3000/api`
- iOS simulator: `http://localhost:3000/api`
- Physical phone: `http://<computer-LAN-IP>:3000/api`

For example, in PowerShell:

```powershell
$env:EXPO_PUBLIC_API_URL = "http://10.0.2.2:3000/api"
npx expo start
```

This MVP does not have accounts. Each post includes the profile name entered by
the user in the app. Do not expose this unauthenticated API publicly; use HTTPS
and add authentication before a production deployment.

## Test the API

```powershell
cd server
npm test
```
