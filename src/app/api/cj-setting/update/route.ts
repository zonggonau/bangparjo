import { NextResponse } from 'next/server';

const CJ_API_URL = 'https://developers.cjdropshipping.com/api2.0';
const API_KEY = 'CJ162155@api@4f459e8914b74fe794b3352b90d48ee8';

export async function PATCH(req: Request) {
  try {
    const { openName, openEmail } = await req.json();

    const tokenRes = await fetch(`${CJ_API_URL}/v1/authentication/getAccessToken`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ apiKey: API_KEY }),
    });

    const tokenData = await tokenRes.json();
    if (!tokenData.result) {
      return NextResponse.json({ error: 'Failed to get CJ access token' }, { status: 500 });
    }
    const accessToken = tokenData.data.accessToken;

    const updateRes = await fetch(`${CJ_API_URL}/v1/setting/account/set`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        'CJ-Access-Token': accessToken,
      },
      body: JSON.stringify({ openName, openEmail })
    });

    const updateData = await updateRes.json();
    return NextResponse.json(updateData);
  } catch (error) {
    console.error('CJ Settings Update Error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
