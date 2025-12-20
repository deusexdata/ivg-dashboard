import { NextResponse } from "next/server";

export async function GET() {
  const apiKey = process.env.SOLANA_TRACKER_API_KEY;
  const wallet = process.env.IVG_WALLET;

  if (!apiKey) return NextResponse.json({ error: "Missing SOLANA_TRACKER_API_KEY" }, { status: 500 });
  if (!wallet) return NextResponse.json({ error: "Missing IVG_WALLET" }, { status: 500 });

  const res = await fetch(`https://data.solanatracker.io/pnl/${wallet}`, {
    headers: { "x-api-key": apiKey },
    next: { revalidate: 30 }
  });

  if (!res.ok) {
    const text = await res.text();
    return NextResponse.json({ error: "SolanaTracker error", details: text }, { status: 502 });
  }

  const data = await res.json();
  return NextResponse.json(data);
}