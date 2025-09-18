
import { NextRequest, NextResponse } from 'next/server';

const getCorsHeaders = (origin: string) => {
  const headers = {
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS, PUT, DELETE',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Allow-Origin': origin,
    'Access-Control-Allow-Credentials': 'true',
  };
  return headers;
};

export const handleCors = (
  req: NextRequest,
  res: NextResponse
) => {
  const origin = req.headers.get('origin') || '';
  const headers = getCorsHeaders(origin);

  Object.entries(headers).forEach(([key, value]) => {
    res.headers.set(key, value);
  });

  return res;
};

export const options = async (req: NextRequest) => {
    const origin = req.headers.get('origin') || '';
    const headers = getCorsHeaders(origin);
    return new NextResponse(null, { status: 204, headers });
  };
  