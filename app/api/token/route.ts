import { NextResponse } from "next/server";

export async function GET() {
  const mint = process.env.IVG_MINT;
  if (!mint) return NextResponse.json({ error: "Missing IVG_MINT" }, { status: 500 });

  const res = await fetch(`https://api.dexscreener.com/token-pairs/v1/solana/${mint}`, {
    next: { revalidate: 20 }
  });

  if (!res.ok) {
    const text = await res.text();
    return NextResponse.json({ error: "Dexscreener error", details: text }, { status: 502 });
  }

  const pairs = await res.json();
  return NextResponse.json({ pairs });
}