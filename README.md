# Kabayan Shop Saudi - Frontend Client

This is the customer-facing e-commerce storefront and admin control operations panel.

---

## 📦 Key Dependencies
* **Core**: `React` (v19), `React DOM` (v19)
* **Styling**: `Tailwind CSS` (Utility-first CSS), `PostCSS`, `Autoprefixer`
* **Icons**: `Lucide React`
* **Interactive Maps**: `Leaflet` (used for selecting GPS delivery pins)
* **Optimization**: `React.lazy` and `React.Suspense` code splitting to keep page loading times <2 seconds.
* **Pixel Tracking**: Facebook/Meta Pixel script helper configuration.

---

## ⚡ Development & Scripts

### Environment Variables (`client/.env`)
Create a `.env` file in the `/client` directory:
```env
NEXT_PUBLIC_API_URL=http://localhost:5000
```

### Run Locally
Install dependencies and launch the Vite development server:
```bash
npm install
npm run dev
```

### Production Build
Compile and minify code for production:
```bash
npm run build
```
This output is saved to the `/client/dist` directory.

---

## ☁️ Vercel Deployment Settings
This client uses the Vite Framework Preset for seamless client-side SPA routing:
1. **Root Directory**: `client`
2. **Framework Preset**: `Vite`
3. **Output Directory**: `dist` (overridden by `vercel.json` rewrite rules)
4. **Environment Variables**:
   * Add `NEXT_PUBLIC_API_URL` pointing to your production Express server domain (e.g., `https://kabayan-shop-api.onrender.com`).
