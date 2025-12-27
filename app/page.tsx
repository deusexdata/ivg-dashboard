import Link from "next/link";

export const dynamic = "force-dynamic";

const TELEGRAM_BOT_URL = "https://t.me/IVG_AUTH_BOT";

// Solana token program IDs (legacy SPL + Token-2022)
const TOKEN_PROGRAM_ID = "TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA";
const TOKEN_2022_PROGRAM_ID = "TokenzQdBNbLqP5VEhdkAS6EPFLC1PHnBqCXEpPxuEb";

type RpcResp<T> = { jsonrpc: "2.0"; id: number; result?: T; error?: any };

async function rpcCall<T>(rpcUrl: string, method: string, params: any[]): Promise<T> {
  const res = await fetch(rpcUrl, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ jsonrpc: "2.0", id: 1, method, params }),
    // Allow Next to cache lightly if you later switch away from force-dynamic.
    cache: "no-store"
  });

  const data = (await res.json()) as RpcResp<T>;
  if (!res.ok || data.error) {
    throw new Error(
      `RPC ${method} failed: ${data.error?.message ?? res.statusText}`
    );
  }
  if (data.result === undefined) throw new Error(`RPC ${method} returned no result`);
  return data.result;
}

function formatUiAmount(raw: bigint, decimals: number): string {
  if (decimals <= 0) return raw.toString();
  const s = raw.toString().padStart(decimals + 1, "0");
  const i = s.slice(0, -decimals);
  const f = s.slice(-decimals).replace(/0+$/, "");
  return f ? `${i}.${f}` : i;
}

async function getOnchainTokenHolding(opts: {
  rpcUrl: string;
  owner: string;
  mint: string;
}): Promise<{ raw: bigint; decimals: number; uiString: string; uiNumber: number }>
{
  // Query both programs and sum any accounts for the mint.
  const fetchByProgram = async (programId: string) =>
    rpcCall<any>(opts.rpcUrl, "getTokenAccountsByOwner", [
      opts.owner,
      { programId },
      { encoding: "jsonParsed" }
    ]);

  const [legacy, t22] = await Promise.all([
    fetchByProgram(TOKEN_PROGRAM_ID).catch(() => null),
    fetchByProgram(TOKEN_2022_PROGRAM_ID).catch(() => null)
  ]);

  const values: any[] = [
    ...(legacy?.value ?? []),
    ...(t22?.value ?? [])
  ];

  let raw = 0n;
  let decimals = 0;

  for (const v of values) {
    const info = v?.account?.data?.parsed?.info;
    if (!info || info.mint !== opts.mint) continue;
    const amountStr = info?.tokenAmount?.amount;
    const dec = info?.tokenAmount?.decimals;
    if (typeof amountStr !== "string" || typeof dec !== "number") continue;
    raw += BigInt(amountStr);
    decimals = dec; // same across accounts for a mint
  }

  const uiString = formatUiAmount(raw, decimals);
  const uiNumber = Number.parseFloat(uiString);
  return { raw, decimals, uiString, uiNumber };
}

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
const fmtCompact = (n?: number, digits = 2) => {
  if (typeof n !== "number" || !isFinite(n)) return "—";

  const abs = Math.abs(n);
  if (abs >= 1e9) return `${(n / 1e9).toFixed(digits)}B`;
  if (abs >= 1e6) return `${(n / 1e6).toFixed(digits)}M`;
  if (abs >= 1e3) return `${(n / 1e3).toFixed(digits)}K`;

  return n.toFixed(digits);
};
export default async function Page() {
  const mint = process.env.IVG_MINT!;
  const wallet = process.env.IVG_WALLET!;
  const apiKey = process.env.SOLANA_TRACKER_API_KEY!;
  const rpcUrl = process.env.RPC_URL ?? "https://mainnet.helius-rpc.com/?api-key=eb6ac1f9-c70a-4d76-bc04-5fb3e38fd84f";

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

  // IMPORTANT: SolanaTracker PnL "holding" is an accounting metric (buys - sells)
  // and can be wrong when tokens are burned or transferred. For the true balance,
  // pull the on-chain SPL token accounts for this wallet + mint.
  let onchainHoldingUi: number | undefined;
  try {
    const h = await getOnchainTokenHolding({ rpcUrl, owner: wallet, mint });
    onchainHoldingUi = h.uiNumber;
  } catch {
    onchainHoldingUi = undefined;
  }

  return (
    <main className="relative z-10 min-h-screen px-8 py-14">
      <div className="mx-auto max-w-7xl space-y-12">

        {/* TERMINAL HEADER */}
        <section className="panel p-8">
          <div className="scanline" />
          <div className="text-xs tracking-widest text-slate-400">
            [ IVG :: SYSTEM TERMINAL ]
          </div>
          <div className="mt-2 text-5xl font-bold neon">
            <span className="text-cyan-300">$IVG</span>{" "}
            <span className="text-sky-400">ON-CHAIN INTERFACE</span>
          </div>
          <div className="mt-3 text-sm text-slate-400">
            mint: {mint.slice(0, 6)}…{mint.slice(-4)} | wallet:{" "}
            {wallet.slice(0, 6)}…{wallet.slice(-4)}
          </div>

          {/* QUICK NAV */}
          <div className="mt-6 flex flex-wrap gap-3">
            <a
              href={TELEGRAM_BOT_URL}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-2 rounded-md border border-cyan-400/50 bg-slate-900/50 px-4 py-2 text-sm text-cyan-200 hover:border-cyan-300 hover:bg-slate-900 transition"
            >
              open_telegram_bot →
            </a>

            <Link
              href="/bot"
              className="inline-flex items-center gap-2 rounded-md border border-sky-400/50 bg-slate-900/50 px-4 py-2 text-sm text-sky-200 hover:border-sky-300 hover:bg-slate-900 transition"
            >
              read_bot_modules →
            </Link>

            <Link
              href="/dev-tools"
              className="inline-flex items-center gap-2 rounded-md border border-slate-400/40 bg-slate-900/50 px-4 py-2 text-sm text-slate-200 hover:border-slate-300 hover:bg-slate-900 transition"
            >
              dev_tools_overview →
            </Link>
          </div>
        </section>

        {/* TERMINAL PANELS */}
        <section className="grid gap-8 lg:grid-cols-3">

{/* WALLET */}
<div className="panel p-6">
  <div className="scanline" />
  <div className="text-sm font-bold text-sky-400 neon mb-4">
    [ wallet.pnl ]
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
    {fmtCompact(onchainHoldingUi, 2)}
  </span>
</div>

  <div className="stat-row">
    <span className="stat-label">current_value</span>
    <span className="stat-value stat-highlight neon">
      {fmtUsd(mintRow?.current_value)}
    </span>
  </div>

  {/* EXECUTION COUNTERS */}
  <div className="stat-row">
    <span className="stat-label">buy_transactions</span>
    <span className="stat-value">
      {fmtNum(mintRow?.buy_transactions, 0)}
    </span>
  </div>

  <div className="stat-row">
    <span className="stat-label">sell_transactions</span>
    <span className="stat-value">
      {fmtNum(mintRow?.sell_transactions, 0)}
    </span>
  </div>

  <div className="stat-row">
    <span className="stat-label">total_transactions</span>
    <span className="stat-value stat-highlight neon">
      {fmtNum(mintRow?.total_transactions, 0)}
    </span>
  </div>
</div>

          {/* MARKET */}
          <div className="panel p-6 lg:col-span-2">
            <div className="scanline" />
            <div className="text-sm font-bold text-sky-400 neon mb-4">
              [ market.status ]
            </div>

            {!best ? (
              <div className="text-slate-400">
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
                  className="inline-block mt-6 text-sky-400 neon hover:underline"
                >
                  open_dexscreener →
                </a>
              </>
            )}
          </div>
        </section>


        {/* TELEGRAM BOT MODULES */}
        <section className="panel p-8">
          <div className="scanline" />
          <div className="text-sm font-bold text-sky-400 neon mb-6">
            [ telegram.modules ]
          </div>

          <div className="grid gap-6 lg:grid-cols-3 text-sm text-slate-300 leading-relaxed">
            <div className="rounded-md border border-cyan-400/20 bg-slate-950/30 p-5">
              <div className="text-cyan-300 font-semibold mb-2">AutoBurn</div>
              <div className="text-slate-300">
                Scheduled creator-fee claims, treasury preservation, buybacks
                with excess SOL, and 100% burn of acquired tokens.
              </div>
            </div>

            <div className="rounded-md border border-cyan-400/20 bg-slate-950/30 p-5">
              <div className="text-cyan-300 font-semibold mb-2">Market Maker</div>
              <div className="text-slate-300">
                Real-time gRPC price feed + inventory-based execution using
                target bands to maintain organic flow and long-horizon behavior.
              </div>
            </div>

            <div className="rounded-md border border-cyan-400/20 bg-slate-950/30 p-5">
              <div className="text-cyan-300 font-semibold mb-2">Dev Tools</div>
              <div className="text-slate-300">
                Separate operator workspace (Claim, Buy &amp; Burn, Airdrop modules
                and more coming).
              </div>
            </div>
          </div>

          <div className="mt-6 flex flex-wrap gap-3">
            <a
              href={TELEGRAM_BOT_URL}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-2 rounded-md border border-cyan-400/50 bg-slate-900/50 px-4 py-2 text-sm text-cyan-200 hover:border-cyan-300 hover:bg-slate-900 transition"
            >
              open_telegram_bot →
            </a>
            <Link
              href="/bot"
              className="inline-flex items-center gap-2 rounded-md border border-sky-400/50 bg-slate-900/50 px-4 py-2 text-sm text-sky-200 hover:border-sky-300 hover:bg-slate-900 transition"
            >
              read_full_bot_overview →
            </Link>
          </div>
        </section>


        {/* IVG PROTOCOL OVERVIEW */}
<section className="panel p-8">
  <div className="scanline" />
  <div className="text-sm font-bold text-sky-400 neon mb-6">
    [ ivg.protocol ]
  </div>

  <div className="space-y-6 text-sm text-slate-300 leading-relaxed">

    <div>
      <div className="text-cyan-300 font-semibold mb-2">
        What is IVG?
      </div>
      <p>
        IVG (Infinite Volume Glitch) is an autonomous on-chain execution and
        market-making system built for Solana.  
        Its goal is not to “pump” a token, but to maintain continuous market
        activity, controlled liquidity exposure, and predictable execution
        behavior over long periods of time.
      </p>
    </div>

    <div>
      <div className="text-cyan-300 font-semibold mb-2">
        How IVG Works
      </div>
      <p>
        IVG operates by monitoring token inventory, SOL exposure, liquidity
        depth, and execution timing.  
        Trades are split into small units, delayed in time, and only triggered
        when predefined imbalance thresholds are reached.
      </p>
      <p className="mt-2">
        This prevents sudden liquidity shocks, reduces sandwich risk, and keeps
        volume organic and distributed instead of concentrated in short bursts.
      </p>
    </div>

    <div>
      <div className="text-cyan-300 font-semibold mb-2">
        Execution Model
      </div>
      <p>
        Unlike traditional bots, IVG does not chase price.  
        It enforces a target SOL/token balance and uses execution constraints
        (rate limits, size caps, and cooldowns) to behave like a long-term market
        participant rather than a speculator.
      </p>
    </div>

    <div>
      <div className="text-cyan-300 font-semibold mb-2">
        Why This Is Sustainable
      </div>
      <p>
        Sustainable tokens are built on consistent liquidity, predictable
        execution, and confidence in market structure.  
        IVG reduces volatility extremes, avoids dead markets, and creates a
        smoother growth curve that attracts longer-term participants instead of
        short-term extractors.
      </p>
      <p className="mt-2">
        As IVG scales across multiple deployments, execution data, volume
        behavior, and liquidity patterns compound — turning IVG into
        infrastructure rather than a single-token experiment.
      </p>
    </div>

  </div>
</section>
{/* IVG LINKS */}
<section className="panel p-6">
  <div className="scanline" />
  <div className="text-sm font-bold text-sky-400 neon mb-4">
    [ ivg.links ]
  </div>

  <div className="space-y-3 text-sm font-mono">
    <div>
      <span className="text-slate-400">docs:</span>{" "}
      <a
        href="https://ivg-infinite-volume-glitch.gitbook.io/usdivg-infinite-volume-glitch/"
        target="_blank"
        className="text-cyan-300 hover:underline neon"
      >
        gitbook.ivg
      </a>
    </div>

    <div>
      <span className="text-slate-400">dex:</span>{" "}
      <a
        href={best?.url ?? `https://dexscreener.com/solana/${mint}`}
        target="_blank"
        className="text-cyan-300 hover:underline neon"
      >
        dexscreener
      </a>
    </div>

    <div>
      <span className="text-slate-400">telegram:</span>{" "}
      <a
        href={TELEGRAM_BOT_URL}
        target="_blank"
        className="text-cyan-300 hover:underline neon"
      >
        @IVG_AUTH_BOT
      </a>
    </div>

    <div>
      <span className="text-slate-400">bot:</span>{" "}
      <Link href="/bot" className="text-cyan-300 hover:underline neon">
        modules_overview
      </Link>
    </div>

    <div>
      <span className="text-slate-400">dev_tools:</span>{" "}
      <Link href="/dev-tools" className="text-cyan-300 hover:underline neon">
        operator_workspace
      </Link>
    </div>

    <div>
      <span className="text-slate-400">x:</span>{" "}
      <a
        href="https://x.com/i/communities/2002093610800722308"
        target="_blank"
        className="text-cyan-300 hover:underline neon"
      >
        @IVG
      </a>
    </div>
  </div>
</section>


      </div>
    </main>
  );
}