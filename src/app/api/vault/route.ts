import { del, get, put } from '@vercel/blob';
import { NextResponse } from 'next/server';

const VAULT_PATH = 'vault/notes.json';

export async function GET() {
  const result = await get(VAULT_PATH, { access: 'private', useCache: false });

  if (!result) {
    return NextResponse.json({ tree: null });
  }

  try {
    return NextResponse.json(JSON.parse(await new Response(result.stream).text()));
  } catch {
    return NextResponse.json({ error: 'The saved vault could not be read.' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const body = await request.json();

  if (!Array.isArray(body.tree)) {
    return NextResponse.json({ error: 'Invalid vault data.' }, { status: 400 });
  }

  await put(VAULT_PATH, JSON.stringify({ tree: body.tree }), {
    access: 'private',
    allowOverwrite: true,
    contentType: 'application/json',
    cacheControlMaxAge: 60,
  });

  return NextResponse.json({ success: true });
}

export async function DELETE() {
  await del(VAULT_PATH);
  return NextResponse.json({ success: true });
}
