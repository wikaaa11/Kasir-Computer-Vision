<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />
</div>

# Run the app

This contains everything you need to run your app locally.

## Run Locally

**Prerequisites:**  Node.js


1. Install dependencies:
   `npm install`
2. Set `VITE_DETECT_API_URL` in [.env.local](.env.local) if your detect backend does not run on `http://localhost:8000`
3. Set `VITE_CV_API_BASE_URL` in [.env.local](.env.local) to your centralized Node.js backend (`http://localhost:4000` or LAN IP)
4. Run the app:
   `npm run dev`
