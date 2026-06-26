const Groq = require('groq-sdk');
const dotenv = require('dotenv');
dotenv.config();

// Initialize Groq client
let groq;
try {
    groq = new Groq({
        apiKey: process.env.GROQ_API_KEY
    });
    console.log('✅ Groq AI initialized successfully');
} catch (error) {
    console.error('❌ Failed to initialize Groq:', error.message);
}

// ============================================
// MAIN CHATBOT FUNCTION
// ============================================
exports.chatbot = async (req, res) => {
    const { message } = req.body;
    
    console.log('📝 User message:', message);
    
    // Check if Groq API key is set
    if (!process.env.GROQ_API_KEY) {
        console.warn('⚠️ GROQ_API_KEY not set in .env file!');
        const fallbackReply = getFallbackReply(message);
        return res.json({
            success: true,
            botReply: fallbackReply,
            using: 'fallback (no API key)'
        });
    }
    
    if (!groq) {
        console.warn('⚠️ Groq client not initialized!');
        const fallbackReply = getFallbackReply(message);
        return res.json({
            success: true,
            botReply: fallbackReply,
            using: 'fallback (client error)'
        });
    }
    
    try {
        // ✅ USING SUPPORTED MODEL
        const completion = await groq.chat.completions.create({
            messages: [
                {
                    role: "system",
                    content: `You are TashBot, a friendly and helpful assistant for touchTash Barber Shop.

                    ABOUT touchTash:
                    - Location: Shop 5, Mlazi Plaza, V Section, Mlazi, Durban, 4024
                    - Hours: Monday-Saturday 8am-6pm, Sunday 9am-2pm
                    - Phone: +27 31 000 0000
                    - Email: hello@touchtash.co.za

                    SERVICES & PRICES:
                    - Classic Haircut: R120 (30 min)
                    - Skin Fade: R150 (45 min)
                    - Beard Trim & Shape: R80 (20 min)
                    - Full Groom Package: R220 (75 min)
                    - Kids Cut: R90 (25 min)
                    - Hot Towel Shave: R180 (40 min)

                    BARBERS:
                    - Jordan K. - Fades & Tapers (4.9⭐)
                    - Marcus D. - Classic Cuts (4.8⭐)
                    - Sipho M. - Afro Styles (5.0⭐)
                    - Thabo R. - Beard & Groom (4.7⭐)

                    INSTRUCTIONS:
                    - Be conversational, friendly, and professional
                    - Keep responses short and clear (2-3 sentences max)
                    - If someone asks about services, list them with prices
                    - If someone asks about crazy/wild cuts, mention creative fades, mohawks, and design cuts
                    - If someone asks to book, direct them to the booking page
                    - If you don't know something, offer to connect with a human
                    - Always be helpful and polite`
                },
                {
                    role: "user",
                    content: message
                }
            ],
            model: "llama-3.3-70b-versatile", // ✅ SUPPORTED MODEL
            temperature: 0.7,
            max_tokens: 200,
        });
        
        // Extract the reply
        const reply = completion.choices[0]?.message?.content || 
                     "I'm sorry, I didn't understand that. Could you please rephrase?";
        
        console.log('🤖 AI Reply:', reply);
        
        res.json({
            success: true,
            botReply: reply,
            using: 'groq-ai'
        });
        
    } catch (error) {
        console.error('❌ Chatbot error:', error.message);
        
        // Fallback if Groq API fails
        const fallbackReply = getFallbackReply(message);
        res.json({
            success: true,
            botReply: fallbackReply,
            using: 'fallback (API error)'
        });
    }
};

// ============================================
// FALLBACK RESPONSES (If Groq API is down)
// ============================================
function getFallbackReply(message) {
    const msg = message.toLowerCase();
    
    // Services & Cuts
    if (msg.includes('service') || msg.includes('offer') || msg.includes('what cuts') || msg.includes('cut that you offer') || msg.includes('what do you offer')) {
        return '✂️ We offer: Classic Haircut (R120), Skin Fade (R150), Beard Trim (R80), Full Groom Package (R220), Kids Cut (R90), and Hot Towel Shave (R180). What would you like to book?';
    }
    
    // Wild/Crazy cuts
    if (msg.includes('wild') || msg.includes('crazy') || msg.includes('funny') || msg.includes('strange') || msg.includes('weird') || msg.includes('creative')) {
        return '🔥 We do creative fades, mohawks, design cuts (lines, patterns), and bold colors! Our barbers love getting creative. Come in and let us know what you want! ✂️';
    }
    
    // Prices
    if (msg.includes('price') || msg.includes('cost') || msg.includes('how much')) {
        return '💰 Our prices: Classic Haircut R120, Skin Fade R150, Beard Trim R80, Full Groom R220, Kids Cut R90, Hot Towel Shave R180.';
    }
    
    // Booking
    if (msg.includes('book') || msg.includes('appointment') || msg.includes('schedule') || msg.includes('reserve')) {
        return '📅 You can book on our Booking page! Just click "Book Now" and select your barber, service, and time.';
    }
    
    // Barbers
    if (msg.includes('barber') || msg.includes('stylist') || msg.includes('who cuts')) {
        return '✂️ We have 4 expert barbers: Jordan K. (Fades & Tapers) ⭐4.9, Marcus D. (Classic Cuts) ⭐4.8, Sipho M. (Afro Styles) ⭐5.0, and Thabo R. (Beard & Groom) ⭐4.7. All highly rated!';
    }
    
    // Hours
    if (msg.includes('hour') || msg.includes('open') || msg.includes('time') || msg.includes('when')) {
        return '🕐 We are open Monday to Saturday: 8am - 6pm, Sunday: 9am - 2pm. Closed on public holidays.';
    }
    
    // Location
    if (msg.includes('location') || msg.includes('address') || msg.includes('where') || msg.includes('find')) {
        return '📍 We are at Shop 5, Mlazi Plaza, V Section, Mlazi, Durban, 4024.';
    }
    
    // Contact
    if (msg.includes('contact') || msg.includes('phone') || msg.includes('call') || msg.includes('number')) {
        return '📞 Call us at +27 31 000 0000 or email hello@touchtash.co.za.';
    }
    
    // Greetings
    if (msg.includes('hello') || msg.includes('hi') || msg.includes('hey') || msg.includes('greetings')) {
        return '👋 Hello! Welcome to touchTash Barber. How can I assist you today?';
    }
    
    // Reviews
    if (msg.includes('review') || msg.includes('rating')) {
        return '⭐ Our customers rate us 4.9/5 stars! You can leave a review after your appointment on your dashboard.';
    }
    
    // Thanks
    if (msg.includes('thank') || msg.includes('thanks')) {
        return '🙏 You\'re welcome! Have a great day! 😊';
    }
    
    // Help
    if (msg.includes('help') || msg.includes('support')) {
        return '🆘 I can help with: Services, Prices, Booking, Barbers, Hours, Location, Contact info, and Reviews. Just ask!';
    }
    
    return "🤔 I'm not sure about that. Try asking about services, prices, booking, barbers, hours, or location!";
}