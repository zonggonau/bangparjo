import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { messages } = body;

    const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
    if (!GEMINI_API_KEY) {
      console.error('Chat API Error: GEMINI_API_KEY is not defined in .env');
      return NextResponse.json({ success: false, message: 'Gemini API Key missing' }, { status: 500 });
    }

    console.log(`Using API Key: ${GEMINI_API_KEY.substring(0, 5)}...${GEMINI_API_KEY.slice(-5)}`);

    // Format history for Gemini API
    // Gemini roles are 'user' and 'model'
    const contents = messages.map((m: any) => ({
      role: m.role === 'ai' ? 'model' : 'user',
      parts: [{ text: m.content }]
    }));

    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent`, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'x-goog-api-key': GEMINI_API_KEY.trim() 
      },
      body: JSON.stringify({
        system_instruction: {
          parts: [{
            text: `You are Parjo AI, a professional e-commerce assistant for bangparjo.shop. 
            You help users find products, track orders, and answer shopping queries. 
            The store sells global products via BangParjo e-commerce to the global market.
            Keep responses helpful, polite, and use English.
            Current date: ${new Date().toLocaleDateString()}.`
          }]
        },
        contents: contents
      }),
    });

    const data = await response.json();
    
    if (!response.ok) {
      console.error('Gemini API Error:', data);
      throw new Error(data.error?.message || 'Failed to fetch from Gemini');
    }

    const aiText = data.candidates?.[0]?.content?.parts?.[0]?.text || "I'm sorry, I am experiencing technical difficulties. Please try again later.";

    return NextResponse.json({ success: true, text: aiText });
  } catch (error: any) {
    console.error('Chat API Error:', error);
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}
