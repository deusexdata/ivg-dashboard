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
function toDate(ms?: number) {
  if (!ms) return "—";
  return new Date(ms).toLocaleString();
}

async function getJson<T>(path: string): Promise<T> {
  const res = await fetch(path, { cache: "no-store" });
  if (!res.ok) throw new Error(`Failed ${path}`);
  return res.json();
}

export default async function Page() {
  const mint = process.env.IVG_MINT ?? "SET_IVG_MINT_IN_VERCEL";
  const wallet = process.env.IVG_WALLET ?? "SET_IVG_WALLET_IN_VERCEL";

  const walletPnl = await getJson<WalletPnl>("/api/wallet-pnl");
  const tokenData = await getJson<{ pairs: DexPair[] }>("/api/token");

  const mintRow = walletPnl.tokens?.[mint];
  const totalInvested = walletPnl.summary?.totalInvested ?? 0;

  const pairs = tokenData.pairs ?? [];
  const best = [...pairs].sort((a, b) => (b.liquidity?.usd ?? 0) - (a.liquidity?.usd ?? 0))[0];

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
            <div><span className="text-ivg-dim">Mint:</span> <span className="text-white/90">{mint}</span></div>
            <div><span className="text-ivg-dim">Wallet:</span> <span className="text-white/90">{wallet}</span></div>
          </div>
        </div>

        {/* Top grid */}
        <div className="mt-6 grid gap-6 md:grid-cols-3">
          {/* Wallet PnL */}
          <Panel title="Wallet PnL" subtitle="SolanaTracker /pnl/{wallet}">
            <Row label="Total Invested" value={fmtUsd(totalInvested)} accent="text-ivg-cyan" />
            <Row label="IVG Holding" value={mintRow?.holding != null ? fmtNum(mintRow.holding, 4) : "—"} accent="text-ivg-neon" />
            <Row label="Current Value" value={mintRow?.current_value != null ? fmtUsd(mintRow.current_value) : "—"} accent="text-ivg-green" />
            <div className="mt-4 grid grid-cols-2 gap-3 text-sm">
              <Mini label="Realized" value={walletPnl.summary?.realized != null ? fmtUsd(walletPnl.summary.realized) : "—"} />
              <Mini label="Unrealized" value={walletPnl.summary?.unrealized != null ? fmtUsd(walletPnl.summary.unrealized) : "—"} />
              <Mini label="Total PnL" value={walletPnl.summary?.total != null ? fmtUsd(walletPnl.summary.total) : "—"} />
              <Mini label="Win %" value={walletPnl.summary?.winPercentage != null ? fmtPct(walletPnl.summary.winPercentage) : "—"} />
            </div>
            <div className="mt-4 text-xs text-ivg-dim">
              PnL since: <span className="text-white/70">{walletPnl.pnl_since ? new Date(walletPnl.pnl_since).toLocaleDateString() : "—"}</span>
            </div>
          </Panel>

          {/* Best market pair */}
          <Panel title="Token Market" subtitle="Dexscreener best pool (by liquidity)" className="md:col-span-2">
            {!best ? (
              <div className="text-sm text-white/80 mt-2">No Dexscreener pairs returned for this mint.</div>
            ) : (
              <>
                <div className="mt-2 grid gap-4 md:grid-cols-2">
                  <div className="space-y-3">
                    <Row label="DEX" value={best.dexId ?? "—"} accent="text-ivg-cyan" />
                    <Row label="Pair" value={best.pairAddress ?? "—"} />
                    <Row label="Price (USD)" value={best.priceUsd ? fmtUsd(Number(best.priceUsd)) : "—"} accent="text-ivg-neon" />
                    <Row label="Liquidity" value={best.liquidity?.usd != null ? fmtUsd(best.liquidity.usd) : "—"} accent="text-ivg-green" />
                  </div>
                  <div className="space-y-3">
                    <Row label="24h Volume" value={best.volume?.h24 != null ? fmtUsd(best.volume.h24) : "—"} />
                    <Row label="24h Buys/Sells" value={best.txns?.h24 ? `${best.txns.h24.buys ?? 0} / ${best.txns.h24.sells ?? 0}` : "—"} />
                    <Row label="24h Change" value={best.priceChange?.h24 != null ? fmtPct(best.priceChange.h24) : "—"} />
                    <Row label="Market Cap / FDV" value={`${best.marketCap != null ? fmtUsd(best.marketCap) : "—"} / ${best.fdv != null ? fmtUsd(best.fdv) : "—"}`} />
                  </div>
                </div>

                {best.url ? (
                  <a
                    className="mt-5 inline-flex w-full items-center justify-center rounded-xl border border-ivg-border bg-black/20 px-4 py-3 text-sm text-white/90 hover:bg-black/30"
                    href={best.url}
                    target="_blank"
                    rel="noreferrer"
                  >
                    Open on Dexscreener
                  </a>
                ) : null}
              </>
            )}
          </Panel>
        </div>

        {/* Pairs table = “all information” in a usable way */}
        <div className="mt-6 rounded-2xl border border-ivg-border bg-ivg-card p-6">
          <div className="flex items-baseline justify-between gap-4">
            <div>
              <div className="text-lg font-semibold text-ivg-cyan">All Dexscreener Pairs</div>
              <div className="text-xs text-ivg-dim">Sorted by liquidity (USD)</div>
            </div>
            <div className="text-xs text-ivg-dim">
              Returned: <span className="text-white/70">{pairs.length}</span>
            </div>
          </div>

          <div className="mt-4 overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="text-ivg-dim">
                <tr className="[&>th]:py-2 [&>th]:pr-4 text-left border-b border-ivg-border">
                  <th>DEX</th>
                  <th>Pair</th>
                  <th>Price</th>
                  <th>Liquidity</th>
                  <th>Vol 24h</th>
                  <th>Buys/Sells</th>
                  <th>Chg 24h</th>
                </tr>
              </thead>
              <tbody className="text-white/90">
                {[...pairs]
                  .sort((a, b) => (b.liquidity?.usd ?? 0) - (a.liquidity?.usd ?? 0))
                  .slice(0, 20)
                  .map((p) => (
                    <tr key={p.pairAddress} className="border-b border-ivg-border/60">
                      <td className="py-3 pr-4 text-ivg-cyan">{p.dexId ?? "—"}</td>
                      <td className="py-3 pr-4">
                        {p.url ? (
                          <a className="text-ivg-neon hover:underline" href={p.url} target="_blank" rel="noreferrer">
                            {p.pairAddress ?? "—"}
                          </a>
                        ) : (
                          p.pairAddress ?? "—"
                        )}
                      </td>
                      <td className="py-3 pr-4">{p.priceUsd ? fmtUsd(Number(p.priceUsd)) : "—"}</td>
                      <td className="py-3 pr-4">{p.liquidity?.usd != null ? fmtUsd(p.liquidity.usd) : "—"}</td>
                      <td className="py-3 pr-4">{p.volume?.h24 != null ? fmtUsd(p.volume.h24) : "—"}</td>
                      <td className="py-3 pr-4">{p.txns?.h24 ? `${p.txns.h24.buys ?? 0}/${p.txns.h24.sells ?? 0}` : "—"}</td>
                      <td className="py-3 pr-4">{p.priceChange?.h24 != null ? fmtPct(p.priceChange.h24) : "—"}</td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>

          <div className="mt-3 text-xs text-ivg-dim">
            Showing top 20 pairs by liquidity to keep the UI clean.
          </div>
        </div>

        {/* Docs section from GitBook (curated + linked) */}
        <div className="mt-6 grid gap-6 md:grid-cols-3">
          <DocCard
            title="Welcome"
            text="IVG is described as an autonomous execution framework designed to operate continuously on Solana with controlled, measurable interaction with liquidity, inventory, and market conditions."
            href="https://ivg-infinite-volume-glitch.gitbook.io/usdivg-infinite-volume-glitch/"
          />
          <DocCard
            title="$IVG"
            text="The docs define IVG as a self-balancing market maker system that monitors inventory, token price, and liquidity to maintain controlled SOL/token exposure."
            href="https://ivg-infinite-volume-glitch.gitbook.io/usdivg-infinite-volume-glitch/getting-started/quickstart"
          />
          <DocCard
            title="Market Maker Logic"
            text="Core principle: maintain a target SOL/token balance; actions are split into small trades, time-delayed, and only triggered outside a defined imbalance band."
            href="https://ivg-infinite-volume-glitch.gitbook.io/usdivg-infinite-volume-glitch/getting-started/publish-your-docs"
          />
        </div>

        <footer className="mt-10 text-xs text-ivg-dim">
          Built on Vercel + GitHub. Data: SolanaTracker (server-proxied), Dexscreener (server-proxied).
        </footer>
      </div>
    </main>
  );
}

function Panel({
  title,
  subtitle,
  children,
  className
}: {
  title: string;
  subtitle: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <section className={`rounded-2xl border border-ivg-border bg-ivg-card p-6 ${className ?? ""}`}>
      <div className="flex items-baseline justify-between gap-4">
        <div className="text-lg font-semibold text-ivg-cyan">{title}</div>
        <div className="text-xs text-ivg-dim">{subtitle}</div>
      </div>
      <div className="mt-4">{children}</div>
    </section>
  );
}

function Row({ label, value, accent }: { label: string; value: string; accent?: string }) {
  return (
    <div className="flex items-center justify-between gap-4">
      <div className="text-sm text-ivg-dim">{label}</div>
      <div className={`text-sm font-semibold ${accent ?? "text-white/90"}`}>{value}</div>
    </div>
  );
}

function Mini({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-ivg-border bg-black/20 p-3">
      <div className="text-xs text-ivg-dim">{label}</div>
      <div className="mt-1 text-sm font-semibold text-white/90">{value}</div>
    </div>
  );
}

function DocCard({ title, text, href }: { title: string; text: string; href: string }) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noreferrer"
      className="block rounded-2xl border border-ivg-border bg-ivg-card p-6 hover:bg-black/20 transition"
    >
      <div className="text-sm text-ivg-dim">Docs</div>
      <div className="mt-1 text-lg font-semibold text-ivg-neon">{title}</div>
      <p className="mt-3 text-sm text-white/80 leading-relaxed">{text}</p>
      <div className="mt-4 text-xs text-ivg-cyan">Open GitBook →</div>
    </a>
  );
}