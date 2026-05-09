import { NextResponse } from 'next/server';

const CJ_API_URL = 'https://developers.cjdropshipping.com/api2.0';

export async function GET() {
  try {
    // Ideally from an env variable, but we'll use the one from rule.md
    // We fetch a real token first via the token process or just use the API Key.
    // As per rule.md, we need to get the access token first using /v1/authentication/getAccessToken
    const tokenRes = await fetch(`${CJ_API_URL}/v1/authentication/getAccessToken`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        apiKey: 'CJ162155@api@4f459e8914b74fe794b3352b90d48ee8',
      }),
    });

    const tokenData = await tokenRes.json();
    if (!tokenData.result) {
      return NextResponse.json({ error: 'Failed to get CJ access token' }, { status: 500 });
    }

    const accessToken = tokenData.data.accessToken;

    // Now get the settings
    const settingsRes = await fetch(`${CJ_API_URL}/v1/setting/get`, {
      headers: {
        'CJ-Access-Token': accessToken,
      },
      // Next.js caching
      next: { revalidate: 60 } 
    });

    const settingsData = await settingsRes.json();

    return NextResponse.json(settingsData);
  } catch (error) {
    console.error('CJ Settings API Error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
