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
  priceUsd?: string;
  marketCap?: number;
  fdv?: number;
  liquidity?: { usd?: number };
  volume?: { h24?: number };
  txns?: { h24?: { buys?: number; sells?: number } };
};

const fmtUsd = (n?: number) =>
  typeof n === "number" ? `$${n.toLocaleString(undefined, { maximumFractionDigits: 2 })}` : "—";

const fmtNum = (n?: number, d = 2) =>
  typeof n === "number" ? n.toFixed(d) : "—";

export default async function Page() {
  const mint = process.env.IVG_MINT!;
  const wallet = process.env.IVG_WALLET!;
  const apiKey = process.env.SOLANA_TRACKER_API_KEY!;

  // ── SolanaTracker ───────────────────────────
  let walletPnl: WalletPnl = {};
  try {
    const r = await fetch(`https://data.solanatracker.io/pnl/${wallet}`, {
      headers: { "x-api-key": apiKey },
      cache: "no-store"
    });
    if (r.ok) walletPnl = await r.json();
  } catch {}

  // ── Dexscreener (FIXED) ─────────────────────
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
    <main className="min-h-screen px-6 py-12">
      <div className="mx-auto max-w-6xl space-y-10">

        {/* HEADER */}
        <header className="border border-ivg-border bg-ivg-card p-6 rounded-xl">
          <div className="text-xs text-ivg-dim tracking-widest">INFINITE VOLUME GLITCH</div>
          <div className="text-4xl font-bold">
            <span className="text-ivg-neon">$IVG</span>{" "}
            <span className="text-ivg-cyan">ON-CHAIN TERMINAL</span>
          </div>
          <div className="mt-2 text-sm text-ivg-dim">
            mint: {mint.slice(0, 6)}…{mint.slice(-4)} | wallet: {wallet.slice(0, 6)}…{wallet.slice(-4)}
          </div>
        </header>

        {/* STATS */}
        <section className="grid gap-6 md:grid-cols-3">
          <Panel title="Wallet PnL">
            <Stat label="Total Invested" value={fmtUsd(walletPnl.summary?.totalInvested)} />
            <Stat label="Token Holding" value={fmtNum(mintRow?.holding, 4)} />
            <Stat label="Current Value" value={fmtUsd(mintRow?.current_value)} />
          </Panel>

          <Panel title="Token Market" className="md:col-span-2">
            {!best ? (
              <div className="text-ivg-dim">Awaiting liquidity signal…</div>
            ) : (
              <>
                <Stat label="DEX" value={best.dexId} />
                <Stat label="Price" value={fmtUsd(Number(best.priceUsd))} />
                <Stat label="Liquidity" value={fmtUsd(best.liquidity?.usd)} />
                <Stat label="24h Volume" value={fmtUsd(best.volume?.h24)} />
                <a
                  href={best.url}
                  target="_blank"
                  className="inline-block mt-4 text-ivg-neon hover:underline"
                >
                  View on Dexscreener →
                </a>
              </>
            )}
          </Panel>
        </section>

        {/* DOCS */}
        <section className="grid gap-6 md:grid-cols-3">
          <Doc
            title="What is IVG?"
            text="IVG is an autonomous, self-balancing on-chain execution system designed to operate continuously on Solana."
            href="https://ivg-infinite-volume-glitch.gitbook.io/usdivg-infinite-volume-glitch/"
          />
          <Doc
            title="Market Maker Logic"
            text="IVG maintains a target SOL/token balance, executing split, delayed trades only when imbalance thresholds are crossed."
            href="https://ivg-infinite-volume-glitch.gitbook.io/usdivg-infinite-volume-glitch/getting-started/quickstart"
          />
          <Doc
            title="Architecture"
            text="Built on Solana RPC + SolanaTracker data feeds with autonomous execution logic and strict exposure control."
            href="https://ivg-infinite-volume-glitch.gitbook.io/usdivg-infinite-volume-glitch/getting-started/publish-your-docs"
          />
        </section>

      </div>
    </main>
  );
}

function Panel({ title, children, className }: any) {
  return (
    <div className={`border border-ivg-border bg-ivg-card p-6 rounded-xl ${className ?? ""}`}>
      <div className="text-lg font-bold text-ivg-cyan mb-4">{title}</div>
      <div className="space-y-2">{children}</div>
    </div>
  );
}

function Stat({ label, value }: any) {
  return (
    <div className="flex justify-between text-sm">
      <span className="text-ivg-dim">{label}</span>
      <span className="text-ivg-green font-semibold">{value}</span>
    </div>
  );
}

function Doc({ title, text, href }: any) {
  return (
    <a
      href={href}
      target="_blank"
      className="border border-ivg-border bg-ivg-card p-6 rounded-xl hover:border-ivg-neon transition"
    >
      <div className="text-ivg-neon font-bold">{title}</div>
      <p className="mt-2 text-sm text-ivg-dim">{text}</p>
      <div className="mt-4 text-ivg-cyan text-xs">Read docs →</div>
    </a>
  );
}
