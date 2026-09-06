# Western Boys Salon — Multi-Tenant SaaS Platform ✂️💈

A comprehensive multi-tenant SaaS application built for **Western Boys Salon** (first flagship tenant, engineered to onboard unlimited salons). Includes a responsive, mobile-first Web Application, shared React Native mobile codebase (Android & iOS), Supabase database schema with strict Row Level Security (RLS), WhatsApp Cloud API booking bot, live token queue with Reception TV display mode, and drop-in Razorpay integration.

---

## 🌟 Key Features

1. **Multi-Tenant Architecture & Database RLS**:
   - Every table is strictly isolated by `salon_id`.
   - 4 role-based permission tiers:
     - **Super Admin**: Platform-wide tenant management and subscription plans (Monthly ₹49, 6-Month 15% off, 1-Year 20% off).
     - **Salon Owner**: Complete control over salon services, dual pricing, staff, revenue, and reports. Can own multiple salons.
     - **Salon Manager**: Manages daily queue, appointments, walk-ins, and inventory. Restricted from salon-level billing or deletion.
     - **Staff Barber**: Individual schedule view only. Can mark assigned appointments complete. Barred from seeing other staff earnings or salon financials.
2. **Dual-Pricing: In-Salon vs. Doorstep Home Visit 🚗**:
   - Every service supports independent pricing for in-salon appointments and home visits (to cover travel and sterilization).
3. **Live Token Queue & Reception TV Display Screen**:
   - Instant token number generation (e.g., `#WBS-01`, `#WBS-02`).
   - "Call Next Customer" hero action with Web Audio chime sound and automated WhatsApp alert.
   - Dedicated full-screen **Reception TV / Tablet Display Mode** for in-salon customer viewing.
   - Live wait time estimation (`average service duration × customers ahead`).
4. **Interactive WhatsApp Booking Bot & Simulator**:
   - Conversational booking bot for WhatsApp Business Cloud API.
   - 2-3 step interactive booking: Select Service -> In-Salon or Home -> Time Slot -> Instant Token!
   - In-app interactive smartphone simulator to test live conversational booking.
5. **Drop-in Razorpay Payment Gateway**:
   - Realistic Razorpay checkout modal supporting UPI (GPay, PhonePe, Paytm), Cards, NetBanking, and Pay at Salon.
   - Clean architecture ready to swap test keys for live Razorpay credentials without refactoring.
6. **Billing & GST Receipts**:
   - Professional printable / downloadable tax invoice with 18% GST calculation (CGST + SGST) and customized barbershop receipt layout.
7. **Inventory & Stock Alerts**:
   - Stock management for salon consumables (blades, pomades, shampoos, face packs).
   - Automated low-stock warning banners and 1-tap restock.
8. **Customer CRM & Styling Preferences**:
   - Track visit count, lifetime spend, skin allergies, and custom hair/beard haircut notes.

---

## 📁 Project Structure

```
western-boys-salon/
├── supabase/
│   ├── schema.sql                    # Full Postgres DDL with RLS policies & triggers
│   ├── seed.sql                      # Realistic seed data for Western Boys Salon
│   └── functions/
│       ├── whatsapp-webhook/index.ts # Meta WhatsApp Cloud API bot webhook
│       └── razorpay-webhook/index.ts # Razorpay payment capture & signature verifier
├── web/                              # React 18 + Vite + Tailwind CSS Web App
│   ├── src/
│   │   ├── components/               # Dashboard, Queue, TV Display, WhatsApp Bot, CRM
│   │   ├── lib/                      # MockStore, Supabase client, Web Audio chime
│   │   └── types/                    # TypeScript domain definitions
│   ├── .env.example                  # Environment configuration template
│   └── package.json
└── mobile/                           # React Native / Expo shared client (Android & iOS)
    ├── src/screens/                  # Mobile Queue, Booking, Barber agenda
    ├── app.json                      # Expo iOS/Android package identifiers
    └── package.json
```

---

## 🚀 Quick Start Guide

### 1. Web Application (Zero Setup Required)

The web application runs out of the box with realistic seed data:

```bash
cd western-boys-salon/web
npm run dev
```

Open `http://localhost:5173` in your browser.

### 2. Switching Roles & Testing Features

- Use the **Role Switcher** in the top navigation bar to test all 5 perspectives:
  - **Salon Owner**: Full financial analytics, service editor, staff management.
  - **Salon Manager**: Walk-in creation, queue control, inventory restocking.
  - **Staff Barber**: Isolated barber view showing only their assigned clients.
  - **Customer View**: Online booking portal with in-salon vs. home service toggle.
  - **Super Admin**: Platform subscription tiers (₹49/mo, 6-Month 15% off, 1-Year 20% off).
- Click the **TV Display** icon to launch the full-screen Reception Kiosk.
- Click **WhatsApp Bot Simulator** to book appointments through a conversational WhatsApp interface.

---

## 🗄️ Connecting Live Supabase Backend

1. Create a project at [supabase.com](https://supabase.com).
2. Go to the **SQL Editor** and run `supabase/schema.sql` to apply the tables and RLS security policies.
3. Run `supabase/seed.sql` to populate Western Boys Salon flagship data.
4. Copy your project credentials into `western-boys-salon/web/.env`:
   ```env
   VITE_SUPABASE_URL=https://your-project.supabase.co
   VITE_SUPABASE_ANON_KEY=your-anon-key
   VITE_RAZORPAY_KEY_ID=rzp_live_your_key_id
   ```
5. Deploy Supabase Edge Functions:
   ```bash
   supabase functions deploy whatsapp-webhook
   supabase functions deploy razorpay-webhook
   ```

---

## 📱 Mobile App (Android & iOS)

```bash
cd western-boys-salon/mobile
npm install
npx expo start
```
Scan the QR code with the Expo Go app on Android or iOS.

---

## 🔒 Security Architecture

1. **Row Level Security (RLS)**: Enforced at the Postgres database level; tenant queries are automatically filtered by `salon_id = (SELECT salon_id FROM profiles WHERE auth_user_id = auth.uid())`.
2. **Secrets Protection**: `SUPABASE_SERVICE_ROLE_KEY` and payment secrets remain strictly server-side in Edge Functions and are never bundled into the client build.
3. **Resilience**: Client uses graceful degradation and local cache persistence for low-connectivity salon areas.
