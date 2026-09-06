// Supabase Edge Function: whatsapp-webhook
// Handles incoming WhatsApp Business Cloud API messages and conversational booking bot

import { serve } from "https://deno.land/std@0.177.0/http/server.ts";

const WHATSAPP_TOKEN = Deno.env.get("WHATSAPP_API_TOKEN") || "mock_whatsapp_token";
const VERIFY_TOKEN = Deno.env.get("WHATSAPP_VERIFY_TOKEN") || "wbs_secret_token_123";

interface WhatsAppMessage {
  from: string;
  id: string;
  text?: { body: string };
  type: string;
}

serve(async (req: Request) => {
  const url = new URL(req.url);

  // 1. Webhook Verification for Meta WhatsApp Cloud API
  if (req.method === "GET") {
    const mode = url.searchParams.get("hub.mode");
    const token = url.searchParams.get("hub.verify_token");
    const challenge = url.searchParams.get("hub.challenge");

    if (mode === "subscribe" && token === VERIFY_TOKEN) {
      return new Response(challenge, { status: 200 });
    }
    return new Response("Forbidden", { status: 403 });
  }

  // 2. Incoming Messages Webhook
  if (req.method === "POST") {
    try {
      const body = await req.json();
      const entry = body.entry?.[0];
      const changes = entry?.changes?.[0];
      const message: WhatsAppMessage | undefined = changes?.value?.messages?.[0];

      if (!message || !message.text) {
        return new Response(JSON.stringify({ status: "ignored" }), {
          headers: { "Content-Type": "application/json" },
        });
      }

      const senderPhone = message.from;
      const text = message.text.body.trim().toLowerCase();

      let replyText = "";

      if (text === "hi" || text === "hello" || text === "menu" || text === "start") {
        replyText = 
`👑 *Welcome to Western Boys Salon* ✂️💈
_Premium Men's Grooming & Barbering_

Please reply with a number:
1️⃣ *Book In-Salon Appointment*
2️⃣ *Book Home Grooming Service* 🚗
3️⃣ *Check Live Token / Queue Status*
4️⃣ *View Services & Pricing Menu*
5️⃣ *Talk to Reception*

_Location: Shop 14, Royal Heritage Arcade, Vaishali Nagar, Jaipur_`;
      } else if (text === "1" || text.includes("book in")) {
        replyText = 
`✂️ *Choose a Service for In-Salon Visit:*
A. Signature Fade & Cut (₹250)
B. Royal Beard Sculpt & Steam (₹180)
C. Gentlemen Combo - Hair + Beard (₹380)
D. Activated Charcoal Facial (₹550)

Reply with *A, B, C, or D* to pick your service.`;
      } else if (text === "2" || text.includes("home")) {
        replyText = 
`🚗 *Western Boys Home Grooming Service:*
Our master barber visits your doorstep with sterilized tools!

Services:
H1. Gentlemen Combo at Home (₹650)
H2. Signature Cut at Home (₹450)
H3. Royal Beard Sculpt at Home (₹320)

Reply with *H1, H2, or H3* to choose, followed by your address.`;
      } else if (text === "3" || text.includes("token") || text.includes("queue") || text.includes("status")) {
        replyText = 
`🔢 *Live Queue Status Check:*
Currently Serving: *Token #WBS-01*
Tokens in Waiting Queue: *2*
Estimated wait time: *~20 minutes*

To check your specific token, reply with:
*TOKEN <your-code>* (e.g. *TOKEN WBS-02*)`;
      } else if (text.startsWith("token")) {
        const parts = text.split(" ");
        const code = parts[1]?.toUpperCase() || "WBS-02";
        replyText = 
`🎫 *Your Token Details (${code}):*
Status: *Waiting (Position #2 in line)*
Estimated Service Time: *11:45 AM*
Barber: *Farhan Akhtar*
Please arrive 5 minutes before your turn. You will receive an alert when you are next!`;
      } else if (text === "4" || text.includes("price") || text.includes("services")) {
        replyText = 
`📋 *Western Boys Salon - Price List:*
💇‍♂️ Haircut & Style: ₹250 (Home: ₹450)
🧔 Royal Beard Sculpting: ₹180 (Home: ₹320)
👑 Hair + Beard Combo: ₹380 (Home: ₹650)
💆 Head Spa & Scalp Therapy: ₹350 (Home: ₹550)
✨ Charcoal Facial Cleanse: ₹550 (Home: ₹850)
☀️ Full Detan Package: ₹450 (Home: ₹700)

Reply *1* to book in-salon or *2* for doorstep service!`;
      } else if (["a", "b", "c", "d", "h1", "h2", "h3"].includes(text)) {
        replyText = 
`⏰ *Select your preferred time slot for Today:*
1. 12:30 PM
2. 01:15 PM
3. 03:00 PM
4. 04:30 PM
5. 06:00 PM

Reply with *SLOT 1* through *SLOT 5* to confirm.`;
      } else if (text.startsWith("slot")) {
        const tokenNum = Math.floor(Math.random() * 5) + 4;
        replyText = 
`✅ *Booking Confirmed!*
Thank you! Your appointment has been booked.

🎫 *Token: #WBS-0${tokenNum}*
📍 Salon: Western Boys Salon, Vaishali Nagar
💰 Total: ₹380 (Pay via UPI/Cash on arrival)
⏱ Est. Wait: 15-25 minutes

Live Token Tracker:
https://westernboyssalon.com/track?token=WBS-0${tokenNum}

_We will alert you on WhatsApp when you are next in line!_`;
      } else {
        replyText = 
`Thank you for contacting Western Boys Salon!
Send *MENU* to see options, or call our desk at +91 98765 43210.`;
      }

      // If live WhatsApp token exists, dispatch via Meta Graph API
      if (WHATSAPP_TOKEN && WHATSAPP_TOKEN !== "mock_whatsapp_token") {
        await fetch(`https://graph.facebook.com/v19.0/messages`, {
          method: "POST",
          headers: {
            "Authorization": `Bearer ${WHATSAPP_TOKEN}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            messaging_product: "whatsapp",
            to: senderPhone,
            type: "text",
            text: { body: replyText },
          }),
        });
      }

      return new Response(JSON.stringify({ status: "success", reply: replyText }), {
        headers: { "Content-Type": "application/json" },
      });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      return new Response(JSON.stringify({ error: msg }), { status: 500 });
    }
  }

  return new Response("Method not allowed", { status: 405 });
});
