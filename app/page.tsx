export const dynamic = "force-dynamic";

type WalletPnl = {
  tokens?: Record<string, any>;
  summary?: {
    totalInvested?: number;
    realized?: number;
    unrealized?: number;
    total?: number;
    winPercentage?: number;
  };
};

type DexPair = {
  dexId?: string;
  url?: string;
  pairAddress?: string;
  marketCap?: number;
  fdv?: number;
  liquidity?: { usd?: number };
  volume?: { h24?: number };
};

const fmtUsd = (n?: number) =>
  typeof n === "number"
    ? `$${n.toLocaleString(undefined, { maximumFractionDigits: 2 })}`
    : "—";

const fmtNum = (n?: number, d = 2) =>
  typeof n === "number" ? n.toFixed(d) : "—";

export default async function Page() {
  const mint = process.env.IVG_MINT!;
  const wallet = process.env.IVG_WALLET!;
  const apiKey = process.env.SOLANA_TRACKER_API_KEY!;

  let walletPnl: WalletPnl = {};
  try {
    const r = await fetch(`https://data.solanatracker.io/pnl/${wallet}`, {
      headers: { "x-api-key": apiKey },
      cache: "no-store"
    });
    if (r.ok) walletPnl = await r.json();
  } catch {}

  let pairs: DexPair[] = [];
  try {
    const r = await fetch(
      `https://api.dexscreener.com/token-pairs/v1/solana/${mint}`,
      { cache: "no-store" }
    );
    if (r.ok) {
      const j = await r.json();
      if (Array.isArray(j)) pairs = j;
    }
  } catch {}

  const mintRow = walletPnl.tokens?.[mint];
  const best = pairs
    .filter(p => typeof p.liquidity?.usd === "number")
    .sort((a, b) => b.liquidity!.usd! - a.liquidity!.usd!)[0];

  return (
    <main className="relative z-10 min-h-screen px-8 py-14 terminal">
      <div className="mx-auto max-w-7xl space-y-12">

        {/* HEADER / TERMINAL BOOT */}
        <section className="panel p-8">
          <div className="scanline" />

          <div className="text-xs text-slate-400 prompt">
            booting ivg terminal…
          </div>

          <div className="mt-2 text-5xl font-bold neon">
            <span className="text-[#39ff14]">$IVG</span>{" "}
            <span className="text-[#22d3ee]">ON-CHAIN TERMINAL</span>
          </div>

          <div className="divider" />

          <div className="space-y-1 text-sm text-slate-400">
            <div
              className="copy prompt"
              onClick={() => navigator.clipboard.writeText(mint)}
            >
              mint: {mint}
            </div>
            <div
              className="copy prompt"
              onClick={() => navigator.clipboard.writeText(wallet)}
            >
              wallet: {wallet}
            </div>
          </div>
        </section>

        {/* PANELS */}
        <section className="grid gap-8 lg:grid-cols-3">

          {/* WALLET */}
          <div className="panel p-6">
            <div className="scanline" />
            <div className="text-xl font-bold text-[#22d3ee] neon mb-4 prompt">
              wallet.pnl
            </div>

            <div className="stat-row">
              <span className="stat-label">total_invested</span>
              <span className="stat-value">
                {fmtUsd(walletPnl.summary?.totalInvested)}
              </span>
            </div>

            <div className="stat-row">
              <span className="stat-label">token_holding</span>
              <span className="stat-value">
                {fmtNum(mintRow?.holding, 4)}
              </span>
            </div>

            <div className="stat-row">
              <span className="stat-label">current_value</span>
              <span className="stat-value stat-highlight neon">
                {fmtUsd(mintRow?.current_value)}
              </span>
            </div>
          </div>

          {/* MARKET */}
          <div className="panel p-6 lg:col-span-2">
            <div className="scanline" />
            <div className="text-xl font-bold text-[#22d3ee] neon mb-4 prompt">
              market.status
            </div>

            {!best ? (
              <div className="text-slate-400 prompt">
                awaiting_liquidity_signal…
              </div>
            ) : (
              <>
                <div className="stat-row">
                  <span className="stat-label">dex</span>
                  <span className="stat-value">{best.dexId}</span>
                </div>

                <div className="stat-row">
                  <span className="stat-label">market_cap</span>
                  <span className="stat-value stat-highlight neon">
                    {fmtUsd(best.marketCap ?? best.fdv)}
                  </span>
                </div>

                <div className="stat-row">
                  <span className="stat-label">liquidity_usd</span>
                  <span className="stat-value">
                    {fmtUsd(best.liquidity?.usd)}
                  </span>
                </div>

                <div className="stat-row">
                  <span className="stat-label">volume_24h</span>
                  <span className="stat-value">
                    {fmtUsd(best.volume?.h24)}
                  </span>
                </div>

                <a
                  href={best.url}
                  target="_blank"
                  className="inline-block mt-6 text-[#39ff14] neon hover:underline prompt"
                >
                  open_dexscreener →
                </a>
              </>
            )}
          </div>
        </section>

      </div>
    </main>
  );
}
