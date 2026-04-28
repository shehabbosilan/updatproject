# Ngrok Deployment Instructions

Follow these steps to expose your local development server to the internet.

## 1. Prerequisites
Ensure you have `ngrok` installed. If not, install it via npm:
```powershell
npm install -g ngrok
```

## 2. Authentication
Authenticate your local ngrok client (only needs to be done once):
```powershell
ngrok config add-authtoken <YOUR_AUTH_TOKEN>
```
*Get your token from [dashboard.ngrok.com](https://dashboard.ngrok.com/get-started/your-authtoken)*

## 3. Start Tunnels
You need two separate terminal windows to run both tunnels.

### Terminal A: Backend (Port 8081)
```powershell
ngrok http 8081
```
*Note the forwarding URL (e.g., `https://backend-xyz.ngrok-free.app`)*

### Terminal B: Frontend (Port 8082)
```powershell
ngrok http 8082
```
*Note the forwarding URL (e.g., `https://frontend-xyz.ngrok-free.app`)*

## 4. Configuration for External Testing
To test from mobile or externally, you must update the frontend to point to the backend ngrok URL.

1. Open `.env` in the project root.
2. Change `VUE_APP_API_URL` to your **Backend ngrok URL**:
   ```env
   VUE_APP_API_URL=https://backend-xyz.ngrok-free.app
   ```
3. Restart the Vue development server:
   ```powershell
   npm run serve
   ```

## 5. Verify
Open the **Frontend ngrok URL** on your mobile device. You should be able to log in and access all modules (Sales, Reports, Treasury, etc.).
