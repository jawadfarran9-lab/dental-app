# DentalFlow - Running the App

## Quick Start (Manual)

### 1. Start Expo Development Server

Open a **Command Prompt (CMD)** terminal and run:

```cmd
cd "c:\Users\jawad\AppData\Local\SquadGame\Saved\SaveGames\dental-app"
npx expo start --lan --clear
```

Or if you're already in the project directory:

```cmd
npx expo start --lan --clear
```

### 2. Connect Your Phone

1. Install **Expo Go** from App Store (iOS) or Play Store (Android)
2. Make sure your phone is on the **same Wi-Fi network** as your PC
3. Scan the QR code displayed in the terminal with Expo Go app

### 3. Firewall (Windows)

If your phone can't connect, allow Node.js through Windows Firewall:

1. Open Windows Security → Firewall & network protection
2. Click "Allow an app through firewall"
3. Find "Node.js" and check both Private and Public
4. Or manually add: `C:\Program Files\nodejs\node.exe`

## Testing Flow

1. **Home** → Tap "أنا طبيب / عيادة" (I'm a dentist)
2. **Subscribe** → Tap "Start Subscription"
3. **Signup** → Fill form (email required, select country)
4. **Login** → Sign in with your credentials
5. **Dashboard** → Create new patient
6. **Patient Login** → Use generated code

## Firebase Configuration

- **Project ID**: dental-jawad
- **Project Number**: 256500365668
- **Mode**: Client-side only (NO Cloud Functions)
- **Rules**: Dev mode (open access for testing)

## Troubleshooting

### "Could not connect to server"
- Verify both devices on same Wi-Fi
- Check Windows Firewall allows Node.js
- Try `npx expo start --tunnel` instead of `--lan`

### "auth/configuration-not-found"
- This is now fixed in `firebaseConfig.ts`
- Real credentials configured

### Port 8081 in use
```cmd
taskkill /F /IM node.exe
npx expo start --lan --clear
```

## Development Notes

- No PowerShell scripts needed
- No automated tasks
- Manual start only (prevents VS Code crashes)
- All changes auto-reload with Fast Refresh
