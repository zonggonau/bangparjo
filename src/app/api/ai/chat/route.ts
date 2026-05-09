import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  const body = await request.json();
  const { messages } = body;

  const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
  if (!GEMINI_API_KEY) {
    return NextResponse.json({ success: false, message: 'Gemini API Key missing' }, { status: 500 });
  }

  try {
    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${GEMINI_API_KEY}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{
          parts: [{
            text: `You are Parjo AI, a professional e-commerce assistant for bangparjo.shop. 
            You help users find products, track orders, and answer shopping queries. 
            The store uses CJ Dropshipping for fulfillment. 
            Current date: ${new Date().toLocaleDateString()}. 
            User history: ${JSON.stringify(messages)}`
          }]
        }]
      }),
    });

    const data = await response.json();
    const aiText = data.candidates?.[0]?.content?.parts?.[0]?.text || "I'm sorry, I'm having trouble thinking right now.";

    return NextResponse.json({ success: true, text: aiText });
  } catch (error: any) {
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}
