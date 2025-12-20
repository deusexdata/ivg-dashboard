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
  pnl_since?: number;
};

type DexPair = {
  dexId?: string;
  url?: string;
  pairAddress?: string;
  priceUsd?: string;
  marketCap?: number;
  fdv?: number;
  liquidity?: { usd?: number };
  volume?: { h24?: number };
  txns?: { h24?: { buys?: number; sells?: number } };
};

function fmtUsd(n?: number) {
  if (typeof n !== "number" || !isFinite(n)) return "—";
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(n);
}

function fmtNum(n?: number, digits = 2) {
  if (typeof n !== "number" || !isFinite(n)) return "—";
  return n.toFixed(digits);
}

export default async function Page() {
  const mint = process.env.IVG_MINT;
  const wallet = process.env.IVG_WALLET;
  const apiKey = process.env.SOLANA_TRACKER_API_KEY;

  if (!mint || !wallet || !apiKey) {
    return (
      <pre style={{ color: "red", padding: 20 }}>
        ENV VAR MISSING
        {"\n"}IVG_MINT={String(mint)}
        {"\n"}IVG_WALLET={String(wallet)}
        {"\n"}SOLANA_TRACKER_API_KEY={apiKey ? "SET" : "MISSING"}
      </pre>
    );
  }

  // ─────────────────────────────────────────────
  // Fetch SolanaTracker (SAFE)
  // ─────────────────────────────────────────────
  let walletPnl: WalletPnl = {};
  try {
    const r = await fetch(
      `https://data.solanatracker.io/pnl/${wallet}`,
      { headers: { "x-api-key": apiKey }, cache: "no-store" }
    );
    if (r.ok) walletPnl = await r.json();
  } catch {}

  // ─────────────────────────────────────────────
  // Fetch Dexscreener (SAFE)
  // ─────────────────────────────────────────────
  let pairs: DexPair[] = [];
  try {
    const r = await fetch(
      `https://api.dexscreener.com/token-pairs/v1/solana/${mint}`,
      { cache: "no-store" }
    );
    if (r.ok) {
      const j = await r.json();
      if (Array.isArray(j?.pairs)) pairs = j.pairs;
    }
  } catch {}

  const mintRow = walletPnl.tokens?.[mint];
  const best = pairs
    .filter(p => typeof p.liquidity?.usd === "number")
    .sort((a, b) => (b.liquidity!.usd! - a.liquidity!.usd!))[0];

  return (
    <main className="min-h-screen px-6 py-10">
      <div className="mx-auto max-w-6xl space-y-6">

        <section className="rounded-2xl border border-ivg-border bg-ivg-card p-6">
          <div className="text-xs text-ivg-dim">INFINITE VOLUME GLITCH</div>
          <div className="text-3xl font-semibold">
            <span className="text-ivg-neon">$IVG</span>{" "}
            <span className="text-ivg-cyan">Dashboard</span>
          </div>
        </section>

        <section className="grid gap-6 md:grid-cols-3">
          <Panel title="Wallet PnL">
            <Row label="Total Invested" value={fmtUsd(walletPnl.summary?.totalInvested)} />
            <Row label="Holding" value={fmtNum(mintRow?.holding, 4)} />
            <Row label="Current Value" value={fmtUsd(mintRow?.current_value)} />
          </Panel>

          <Panel title="Token Market" className="md:col-span-2">
            {!best ? (
              <div className="text-sm text-ivg-dim">No market data available</div>
            ) : (
              <>
                <Row label="DEX" value={best.dexId} />
                <Row label="Price" value={fmtUsd(Number(best.priceUsd))} />
                <Row label="Liquidity" value={fmtUsd(best.liquidity?.usd)} />
              </>
            )}
          </Panel>
        </section>

      </div>
    </main>
  );
}

function Panel({ title, children, className }: any) {
  return (
    <section className={`rounded-2xl border border-ivg-border bg-ivg-card p-6 ${className ?? ""}`}>
      <div className="text-lg font-semibold text-ivg-cyan">{title}</div>
      <div className="mt-4 space-y-2">{children}</div>
    </section>
  );
}

function Row({ label, value }: any) {
  return (
    <div className="flex justify-between text-sm">
      <span className="text-ivg-dim">{label}</span>
      <span>{value ?? "—"}</span>
    </div>
  );
}
