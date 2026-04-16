import { NextRequest, NextResponse } from 'next/server';

// GET: Return which platforms have tokens (without exposing the tokens themselves)
export async function GET(request: NextRequest) {
  const metaToken = request.cookies.get('meta_access_token')?.value;
  const googleToken = request.cookies.get('google_access_token')?.value;

  return NextResponse.json({
    meta: !!metaToken,
    google: !!googleToken,
  });
}
