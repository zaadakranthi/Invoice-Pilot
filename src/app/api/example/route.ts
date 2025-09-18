
import { NextRequest, NextResponse } from 'next/server';
import { handleCors, options } from '@/lib/cors';
import { getAuth } from 'firebase-admin/auth';
import { adminApp } from '@/lib/firebase-admin'; // Assuming you have this file

export { options };

export async function GET(req: NextRequest) {
  let response: NextResponse;
  try {
    const authToken = req.headers.get('authorization')?.split('Bearer ')[1];
    if (!authToken) {
      response = new NextResponse(JSON.stringify({ error: 'Unauthorized' }), { status: 401 });
      return handleCors(req, response);
    }

    const decodedToken = await getAuth(adminApp).verifyIdToken(authToken);
    // Your logic here

    response = new NextResponse(JSON.stringify({ message: 'GET request successful', user: decodedToken }), { status: 200 });
  } catch (error) {
    console.error('Error verifying token:', error);
    response = new NextResponse(JSON.stringify({ error: 'Internal Server Error' }), { status: 500 });
  }

  return handleCors(req, response);
}

export async function POST(req: NextRequest) {
  let response: NextResponse;
  try {
    const authToken = req.headers.get('authorization')?.split('Bearer ')[1];
    if (!authToken) {
      response = new NextResponse(JSON.stringify({ error: 'Unauthorized' }), { status: 401 });
      return handleCors(req, response);
    }

    const decodedToken = await getAuth(adminApp).verifyIdToken(authToken);
    const body = await req.json();
    // Your logic here

    response = new NextResponse(JSON.stringify({ message: 'POST request successful', user: decodedToken, data: body }), { status: 200 });
  } catch (error) {
    console.error('Error verifying token:', error);
    response = new NextResponse(JSON.stringify({ error: 'Internal Server Error' }), { status: 500 });
  }

  return handleCors(req, response);
}
