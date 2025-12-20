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
  chainId?: string;
  dexId?: string;
  url?: string;
  pairAddress?: string;
  baseToken?: { symbol?: string; name?: string; address?: string };
  quoteToken?: { symbol?: string; name?: string; address?: string };
  priceUsd?: string;
  marketCap?: number;
  fdv?: number;
  liquidity?: { usd?: number; base?: number; quote?: number };
  volume?: { h24?: number; h6?: number; h1?: number; m5?: number };
  priceChange?: { h24?: number; h6?: number; h1?: number; m5?: number };
  txns?: { h24?: { buys?: number; sells?: number } };
};

function fmtUsd(n: number) {
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 2 }).format(n);
}
function fmtNum(n: number, digits = 2) {
  return new Intl.NumberFormat("en-US", { maximumFractionDigits: digits }).format(n);
}
function fmtPct(n: number) {
  const sign = n > 0 ? "+" : "";
  return `${sign}${fmtNum(n, 2)}%`;
}

export default async function Page() {
  const mint = process.env.IVG_MINT!;
  const wallet = process.env.IVG_WALLET!;
  const apiKey = process.env.SOLANA_TRACKER_API_KEY!;

  // ─────────────────────────────────────────────
  // SolanaTracker (direct fetch, NO /api call)
  // ─────────────────────────────────────────────
  const pnlRes = await fetch(
    `https://data.solanatracker.io/pnl/${wallet}`,
    {
      headers: { "x-api-key": apiKey },
      cache: "no-store"
    }
  );

  if (!pnlRes.ok) {
    throw new Error("Failed to fetch SolanaTracker PnL");
  }

  const walletPnl: WalletPnl = await pnlRes.json();

  // ─────────────────────────────────────────────
  // Dexscreener (direct fetch)
  // ─────────────────────────────────────────────
  const dexRes = await fetch(
    `https://api.dexscreener.com/token-pairs/v1/solana/${mint}`,
    { cache: "no-store" }
  );

  if (!dexRes.ok) {
    throw new Error("Failed to fetch Dexscreener data");
  }

  const { pairs }: { pairs: DexPair[] } = await dexRes.json();

  // ─────────────────────────────────────────────
  // Existing logic (unchanged)
  // ─────────────────────────────────────────────
  const mintRow = walletPnl.tokens?.[mint];
  const totalInvested = walletPnl.summary?.totalInvested ?? 0;

  const best = [...pairs].sort(
    (a, b) => (b.liquidity?.usd ?? 0) - (a.liquidity?.usd ?? 0)
  )[0];

  return (
    <main className="min-h-screen px-6 py-10">
      <div className="mx-auto max-w-6xl">
        {/* Header */}
        <div className="rounded-2xl border border-ivg-border bg-ivg-card p-6">
          <div className="text-xs text-ivg-dim tracking-widest">INFINITE VOLUME GLITCH</div>
          <div className="mt-2 text-3xl font-semibold tracking-tight">
            <span className="text-ivg-neon">$IVG</span>{" "}
            <span className="text-ivg-cyan">Terminal Dashboard</span>
          </div>
          <div className="mt-3 text-sm text-white/80">
            <div><span className="text-ivg-dim">Mint:</span> {mint}</div>
            <div><span className="text-ivg-dim">Wallet:</span> {wallet}</div>
          </div>
        </div>

        {/* Top grid */}
        <div className="mt-6 grid gap-6 md:grid-cols-3">
          <Panel title="Wallet PnL" subtitle="SolanaTracker /pnl/{wallet}">
            <Row label="Total Invested" value={fmtUsd(totalInvested)} accent="text-ivg-cyan" />
            <Row label="IVG Holding" value={mintRow?.holding != null ? fmtNum(mintRow.holding, 4) : "—"} accent="text-ivg-neon" />
            <Row label="Current Value" value={mintRow?.current_value != null ? fmtUsd(mintRow.current_value) : "—"} accent="text-ivg-green" />
          </Panel>

          <Panel title="Token Market" subtitle="Dexscreener best pool (by liquidity)" className="md:col-span-2">
            {!best ? (
              <div className="text-sm text-white/80">No Dexscreener pairs returned.</div>
            ) : (
              <>
                <Row label="DEX" value={best.dexId ?? "—"} />
                <Row label="Price" value={best.priceUsd ? fmtUsd(Number(best.priceUsd)) : "—"} />
                <Row label="Liquidity" value={best.liquidity?.usd != null ? fmtUsd(best.liquidity.usd) : "—"} />
              </>
            )}
          </Panel>
        </div>
      </div>
    </main>
  );
}

// ─────────────────────────────────────────────
// Components (unchanged)
// ─────────────────────────────────────────────
function Panel({ title, subtitle, children, className }: any) {
  return (
    <section className={`rounded-2xl border border-ivg-border bg-ivg-card p-6 ${className ?? ""}`}>
      <div className="flex items-baseline justify-between">
        <div className="text-lg font-semibold text-ivg-cyan">{title}</div>
        <div className="text-xs text-ivg-dim">{subtitle}</div>
      </div>
      <div className="mt-4">{children}</div>
    </section>
  );
}

function Row({ label, value, accent }: any) {
  return (
    <div className="flex justify-between">
      <div className="text-sm text-ivg-dim">{label}</div>
      <div className={`text-sm font-semibold ${accent ?? ""}`}>{value}</div>
    </div>
  );
}
