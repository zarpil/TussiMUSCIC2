import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';
export const fetchCache = 'force-no-store';

const BOT_INTERNAL_URL = process.env.INTERNAL_API_URL || 'http://bot:3001';

async function handleSocketRequest(request: NextRequest, { params }: { params: { path?: string[] } }) {
  try {
    const url = new URL(request.url);
    const pathSegments = params.path ? params.path.join('/') : '';
    const targetUrl = `${BOT_INTERNAL_URL}/socket.io/${pathSegments}${url.search}`;

    const headers = new Headers();
    request.headers.forEach((value, key) => {
      if (!['host', 'connection'].includes(key.toLowerCase())) {
        headers.set(key, value);
      }
    });

    const init: RequestInit = {
      method: request.method,
      headers,
      cache: 'no-store',
    };

    if (['POST', 'PUT', 'PATCH'].includes(request.method)) {
      init.body = await request.arrayBuffer();
    }

    const response = await fetch(targetUrl, init);

    const responseHeaders = new Headers();
    response.headers.forEach((value, key) => {
      if (!['content-encoding', 'content-length'].includes(key.toLowerCase())) {
        responseHeaders.set(key, value);
      }
    });

    responseHeaders.set('Access-Control-Allow-Origin', '*');
    responseHeaders.set('Access-Control-Allow-Credentials', 'true');

    const body = await response.arrayBuffer();

    return new NextResponse(body, {
      status: response.status,
      statusText: response.statusText,
      headers: responseHeaders
    });
  } catch (error: any) {
    console.error('[Socket Proxy Route Error]:', error.message);
    return new NextResponse(JSON.stringify({ error: error.message }), {
      status: 502,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}

export async function GET(request: NextRequest, context: { params: { path?: string[] } }) {
  return handleSocketRequest(request, context);
}

export async function POST(request: NextRequest, context: { params: { path?: string[] } }) {
  return handleSocketRequest(request, context);
}

export async function OPTIONS(request: NextRequest) {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-User-Id, Cookie',
      'Access-Control-Allow-Credentials': 'true'
    }
  });
}
