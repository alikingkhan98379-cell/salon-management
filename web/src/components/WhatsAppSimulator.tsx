import React, { useState, useRef, useEffect } from 'react';
import { 
  Send, 
  CheckCheck, 
  Scissors, 
  Phone, 
  Video, 
  MoreVertical, 
  Sparkles,
  RefreshCw,
  Car
} from 'lucide-react';
import { salonStore } from '../lib/mockStore';

interface Message {
  id: string;
  sender: 'bot' | 'user';
  text: string;
  timestamp: string;
  quickReplies?: string[];
}

export const WhatsAppSimulator: React.FC = () => {
  const [inputMessage, setInputMessage] = useState('');
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      sender: 'bot',
      text: `👑 *Welcome to Western Boys Salon!* ✂️💈\n_Premium Men's Grooming & Barbering_\n\nHow can we help you today? Please choose an option:`,
      timestamp: '10:00 AM',
      quickReplies: [
        '1️⃣ Book In-Salon Visit',
        '2️⃣ Book Home Service 🚗',
        '3️⃣ Check Live Queue Status',
        '4️⃣ View Price Menu',
      ],
    },
  ]);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSendMessage = (textToSend?: string) => {
    const text = (textToSend || inputMessage).trim();
    if (!text) return;

    const userTime = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const userMsg: Message = {
      id: Date.now().toString(),
      sender: 'user',
      text,
      timestamp: userTime,
    };

    setMessages(prev => [...prev, userMsg]);
    setInputMessage('');

    // Bot Response Logic
    setTimeout(() => {
      const lower = text.toLowerCase();
      let botReply = '';
      let replies: string[] | undefined = undefined;

      if (lower.includes('1') || lower.includes('book in') || lower.includes('salon')) {
        botReply = `✂️ *Select a Service for In-Salon Visit:*\n\nA. Signature Fade & Cut (₹250)\nB. Royal Beard Sculpt & Steam (₹180)\nC. Gentlemen Combo - Hair + Beard (₹380)\nD. Activated Charcoal Facial (₹550)`;
        replies = ['A. Haircut (₹250)', 'B. Beard Sculpt (₹180)', 'C. Combo (₹380)', 'D. Facial (₹550)'];
      } else if (lower.includes('2') || lower.includes('home')) {
        botReply = `🚗 *Western Boys Home Grooming Service:*\nOur barber brings sterilized tools to your doorstep!\n\nH1. Gentlemen Combo at Home (₹650)\nH2. Signature Cut at Home (₹450)\nH3. Royal Beard Sculpt at Home (₹320)`;
        replies = ['H1. Combo Home (₹650)', 'H2. Cut Home (₹450)', 'H3. Beard Home (₹320)'];
      } else if (lower.includes('3') || lower.includes('queue') || lower.includes('token') || lower.includes('status')) {
        const currentlyServing = salonStore.getCurrentlyServingToken();
        const waitingTokens = salonStore.getWaitingTokens();
        botReply = `🔢 *Live Queue Status Check:*\n\nCurrently Serving: *${currentlyServing ? '#' + currentlyServing.token_code : 'None in chair'}*\nTokens Waiting Ahead: *${waitingTokens.length}*\nEstimated Wait Time: *~${waitingTokens.length * 20} mins*\n\nReply with *TOKEN <code >* (e.g. *TOKEN WBS-02*) to check your exact spot.`;
        replies = ['TOKEN WBS-01', 'TOKEN WBS-02', 'TOKEN WBS-03'];
      } else if (lower.startsWith('token')) {
        const code = lower.split(' ')[1]?.toUpperCase() || 'WBS-02';
        const tok = salonStore.getTokens().find(t => t.token_code === code);
        if (tok) {
          botReply = `🎫 *Token Details (#${tok.token_code}):*\nStatus: *${tok.status.toUpperCase()}*\nCustomer: *${tok.customer_name}*\nBarber: *${tok.staff_name || 'Assigned Barber'}*\nEst. Wait: *~${tok.estimated_wait_minutes} mins*\n\n📍 Shop 14, Royal Heritage Arcade, Vaishali Nagar`;
        } else {
          botReply = `Token ${code} was not found. Please verify your token number.`;
        }
      } else if (lower.includes('4') || lower.includes('price') || lower.includes('menu')) {
        botReply = `📋 *Western Boys Salon - Dual Price Menu:*\n\n💇‍♂️ Haircut & Style: ₹250 (Home: ₹450)\n🧔 Royal Beard Sculpt: ₹180 (Home: ₹320)\n👑 Hair + Beard Combo: ₹380 (Home: ₹650)\n💆 Ayurvedic Scalp Spa: ₹350 (Home: ₹550)\n✨ Charcoal Facial: ₹550 (Home: ₹850)\n\nReply *1* to book in-salon or *2* for doorstep service!`;
        replies = ['1️⃣ Book In-Salon', '2️⃣ Book Home Service'];
      } else if (['a', 'b', 'c', 'd', 'h1', 'h2', 'h3'].some(opt => lower.includes(opt.toLowerCase()))) {
        botReply = `⏰ *Select your preferred time slot for Today:*`;
        replies = ['12:30 PM', '02:00 PM', '03:30 PM', '05:00 PM'];
      } else if (['12:30 pm', '02:00 pm', '03:30 pm', '05:00 pm', '11:00 am', '04:00 pm'].some(s => lower.includes(s.toLowerCase()))) {
        // ACTUAL BOOKING CREATION IN THE STORE!
        const isHome = messages.some(m => m.text.toLowerCase().includes('home'));
        const service = salonStore.getServices()[isHome ? 2 : 0];

        const { token } = salonStore.addAppointmentAndToken({
          customer_name: 'WhatsApp Guest',
          customer_phone: '+91 98290 88776',
          service_id: service.id,
          service_type: isHome ? 'home_service' : 'in_salon',
          appointment_date: new Date().toISOString().split('T')[0],
          time_slot: text,
          booking_channel: 'whatsapp',
          payment_status: 'pending',
          payment_gateway: 'mock_razorpay',
        });

        botReply = `🎉 *Booking Confirmed via WhatsApp!*\n\n🎫 *Your Live Token: #${token.token_code}*\nService: *${service.name}*\nSlot: *${text}*\nAmount: *₹${isHome ? service.home_service_price : service.in_salon_price}*\n\nLive Queue Tracking:\nhttps://westernboyssalon.com/track?token=${token.token_code}\n\n_We will notify you here when your turn is next!_`;
        replies = ['3️⃣ Check Live Queue Status', 'MENU'];
      } else {
        botReply = `Thank you for contacting Western Boys Salon! Reply with *MENU* to see all options or call our desk at +91 98765 43210.`;
        replies = ['MENU', '1️⃣ Book Appointment', '3️⃣ Queue Status'];
      }

      const botTime = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      setMessages(prev => [
        ...prev,
        {
          id: (Date.now() + 1).toString(),
          sender: 'bot',
          text: botReply,
          timestamp: botTime,
          quickReplies: replies,
        },
      ]);
    }, 600);
  };

  const handleResetChat = () => {
    setMessages([
      {
        id: '1',
        sender: 'bot',
        text: `👑 *Welcome to Western Boys Salon!* ✂️💈\n_Premium Men's Grooming & Barbering_\n\nHow can we help you today? Please choose an option:`,
        timestamp: '10:00 AM',
        quickReplies: [
          '1️⃣ Book In-Salon Visit',
          '2️⃣ Book Home Service 🚗',
          '3️⃣ Check Live Queue Status',
          '4️⃣ View Price Menu',
        ],
      },
    ]);
  };

  return (
    <div className="max-w-md mx-auto">
      
      {/* Smartphone Shell Frame */}
      <div className="bg-[#0b141a] rounded-[40px] border-4 border-slate-700 shadow-2xl overflow-hidden flex flex-col h-[650px] relative">
        
        {/* Top Notch / Status Bar */}
        <div className="bg-[#1f2c34] px-6 py-2 flex items-center justify-between text-[11px] text-slate-300 select-none">
          <span className="font-mono">11:30</span>
          <div className="w-20 h-4 bg-black rounded-full mx-auto"></div>
          <div className="flex items-center space-x-1 font-mono">
            <span>5G</span>
            <span>100%</span>
          </div>
        </div>

        {/* WhatsApp Header Bar */}
        <div className="bg-[#1f2c34] px-4 py-3 flex items-center justify-between border-b border-slate-800 text-white select-none">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-amber-500 to-amber-600 flex items-center justify-center font-bold text-slate-950 shadow-md">
              <Scissors className="w-5 h-5 -rotate-45" />
            </div>
            <div>
              <div className="flex items-center space-x-1.5">
                <h3 className="font-semibold text-sm leading-tight">Western Boys Salon</h3>
                <span className="w-3.5 h-3.5 bg-emerald-500 rounded-full flex items-center justify-center text-[9px]">✓</span>
              </div>
              <p className="text-[11px] text-emerald-400">Official WhatsApp Business Bot</p>
            </div>
          </div>

          <div className="flex items-center space-x-3 text-slate-300">
            <button onClick={handleResetChat} title="Reset Chat" className="p-1 hover:text-white">
              <RefreshCw className="w-4 h-4" />
            </button>
            <Phone className="w-4 h-4 cursor-pointer" />
            <Video className="w-4 h-4 cursor-pointer" />
            <MoreVertical className="w-4 h-4 cursor-pointer" />
          </div>
        </div>

        {/* Chat Messages Area (WhatsApp Wallpaper Dark) */}
        <div 
          className="flex-1 overflow-y-auto p-4 space-y-3"
          style={{
            backgroundColor: '#0b141a',
            backgroundImage: `radial-gradient(#1f2c34 1px, transparent 1px)`,
            backgroundSize: '20px 20px'
          }}
        >
          {/* Encryption Notice */}
          <div className="bg-[#182229] border border-amber-500/20 text-amber-200/80 text-[10px] text-center p-2 rounded-xl max-w-xs mx-auto shadow-sm">
            🔒 Messages with Western Boys Salon are secured with end-to-end encryption.
          </div>

          {messages.map(msg => {
            const isBot = msg.sender === 'bot';
            return (
              <div
                key={msg.id}
                className={`flex flex-col ${isBot ? 'items-start' : 'items-end'}`}
              >
                <div
                  className={`max-w-[85%] rounded-2xl px-3.5 py-2.5 shadow-md text-xs leading-relaxed ${
                    isBot
                      ? 'bg-[#1f2c34] text-slate-100 rounded-tl-none border border-slate-700/50'
                      : 'bg-[#005c4b] text-white rounded-tr-none'
                  }`}
                >
                  <div className="whitespace-pre-line">{msg.text}</div>
                  <div className="flex items-center justify-end space-x-1 mt-1 text-[9px] text-slate-400">
                    <span>{msg.timestamp}</span>
                    {!isBot && <CheckCheck className="w-3.5 h-3.5 text-blue-400" />}
                  </div>
                </div>

                {/* Quick Reply Chips if present */}
                {isBot && msg.quickReplies && (
                  <div className="flex flex-wrap gap-1.5 mt-2 max-w-[85%]">
                    {msg.quickReplies.map((reply, i) => (
                      <button
                        key={i}
                        type="button"
                        onClick={() => handleSendMessage(reply)}
                        className="bg-[#202c33] hover:bg-[#2a3942] text-emerald-400 border border-emerald-500/30 text-[11px] font-medium px-2.5 py-1 rounded-full transition shadow-sm"
                      >
                        {reply}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
          <div ref={messagesEndRef} />
        </div>

        {/* Input Bar */}
        <div className="bg-[#1f2c34] p-3 flex items-center space-x-2 border-t border-slate-800">
          <input
            type="text"
            placeholder="Type a message or number..."
            value={inputMessage}
            onChange={(e) => setInputMessage(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') handleSendMessage();
            }}
            className="flex-1 bg-[#2a3942] text-white text-xs placeholder-slate-400 rounded-full px-4 py-2.5 focus:outline-none focus:ring-1 focus:ring-emerald-500"
          />
          <button
            type="button"
            onClick={() => handleSendMessage()}
            className="w-9 h-9 rounded-full bg-[#00a884] hover:bg-[#008f6f] text-slate-950 flex items-center justify-center transition shadow-md"
          >
            <Send className="w-4 h-4" />
          </button>
        </div>

      </div>

      <div className="text-center mt-3 text-xs text-slate-400">
        <Sparkles className="w-3.5 h-3.5 text-emerald-400 inline mr-1" />
        Interactive WhatsApp Booking Bot • Any booking made here reflects live on the Salon Dashboard &amp; TV Display!
      </div>

    </div>
  );
};
