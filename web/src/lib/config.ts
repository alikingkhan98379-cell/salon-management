// Configuration and Environment Variables Loader
// Safe against null/undefined, never exposes server-side secrets

export const CONFIG = {
  SUPABASE_URL: import.meta.env.VITE_SUPABASE_URL || '',
  SUPABASE_ANON_KEY: import.meta.env.VITE_SUPABASE_ANON_KEY || '',
  GOOGLE_CLIENT_ID: import.meta.env.VITE_GOOGLE_CLIENT_ID || '',
  RAZORPAY_KEY_ID: import.meta.env.VITE_RAZORPAY_KEY_ID || 'rzp_test_wbs_client_key_123',
  DEFAULT_SALON_SLUG: import.meta.env.VITE_DEFAULT_SALON_SLUG || 'western-boys-salon',
  
  // App Meta
  APP_NAME: 'Western Boys Salon',
  TAGLINE: "Premium Men's Grooming & Barbering SaaS",
  FLAGSHIP_SALON_ID: 'a1b2c3d4-e5f6-4a5b-8c9d-0e1f2a3b4c5d',
  
  // Subscription Tiers per Prompt:
  // Base plan: ₹49/month
  // 6-month plan: 15% discount
  // 1-year plan: 20% discount
  SUBSCRIPTIONS: {
    MONTHLY: { id: 'base_monthly', label: 'Monthly Base', price: 49, discount: 0, period: '1 Month' },
    HALF_YEARLY: { id: 'half_yearly', label: '6-Month Plan', price: Math.round(49 * 6 * 0.85), originalPrice: 49 * 6, discount: 15, period: '6 Months' },
    YEARLY: { id: 'yearly', label: '1-Year Premium', price: Math.round(49 * 12 * 0.80), originalPrice: 49 * 12, discount: 20, period: '12 Months' },
  }
};
