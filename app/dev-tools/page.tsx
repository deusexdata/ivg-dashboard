import Link from "next/link";

const TELEGRAM_BOT_URL = "https://t.me/IVG_AUTH_BOT";

export default function BotPage() {
  return (
    <main className="relative z-10 min-h-screen px-8 py-14">
      <div className="mx-auto max-w-5xl space-y-12">

        {/* HEADER */}
        <section className="panel p-8">
          <div className="scanline" />
          <div className="text-xs tracking-widest text-slate-400">
            [ IVG :: TELEGRAM BOT ]
          </div>
          <div className="mt-2 text-4xl font-bold neon">
            <span className="text-cyan-300">$IVG</span>{" "}
            <span className="text-sky-400">AUTONOMOUS ENGINE</span>
          </div>
          <div className="mt-3 text-sm text-slate-400 leading-relaxed">
            Autoburn and Market Maker modules are live in the Telegram bot.
            Dev Tools is a dedicated space for creator/operator workflows with
            more modules rolling out over time.
          </div>

          <div className="mt-6 flex flex-wrap gap-3">
            <Link
              href="/"
              className="inline-flex items-center gap-2 rounded-md border border-slate-400/40 bg-slate-900/50 px-4 py-2 text-sm text-slate-200 hover:border-slate-300 hover:bg-slate-900 transition"
            >
              ← back_to_terminal
            </Link>
            <Link
              href="/dev-tools"
              className="inline-flex items-center gap-2 rounded-md border border-sky-400/50 bg-slate-900/50 px-4 py-2 text-sm text-sky-200 hover:border-sky-300 hover:bg-slate-900 transition"
            >
              dev_tools_overview →
            </Link>
            <a
              href={TELEGRAM_BOT_URL}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-2 rounded-md border border-cyan-400/50 bg-slate-900/50 px-4 py-2 text-sm text-cyan-200 hover:border-cyan-300 hover:bg-slate-900 transition"
            >
              open_telegram_bot →
            </a>
          </div>
        </section>

        {/* SUMMARY */}
        <section className="panel p-8">
          <div className="scanline" />
          <div className="text-sm font-bold text-sky-400 neon mb-6">
            [ bot.summary ]
          </div>

          <div className="space-y-4 text-sm text-slate-300 leading-relaxed">
            <p>
              <span className="text-cyan-300 font-semibold">
                🚀 $IVG Autonomous On-Chain Engine
              </span>{" "}
              — Autoburn and MM modules live on Telegram (updated on
              Dexscreener).
            </p>

            <div className="rounded-md border border-cyan-400/20 bg-slate-950/30 p-5">
              <div className="text-cyan-300 font-semibold mb-2">
                🔥 AutoBurn Module
              </div>
              <ul className="list-disc pl-5 space-y-1">
                <li>Auto-claims creator fees on schedule</li>
                <li>Preserves treasury balance (never drained)</li>
                <li>Uses excess SOL for buybacks</li>
                <li>Burns 100% of acquired tokens → supply reduction</li>
              </ul>
            </div>

            <div className="rounded-md border border-cyan-400/20 bg-slate-950/30 p-5">
              <div className="text-cyan-300 font-semibold mb-2">
                🤖 Market Maker Module
              </div>
              <ul className="list-disc pl-5 space-y-1">
                <li>Listens to live gRPC trades (real-time price)</li>
                <li>
                  Inventory-based buy/sell execution (dynamic target bands)
                </li>
                <li>Continuous organic volume & liquidity flow</li>
                <li>All trades signed locally (no custodial risk)</li>
              </ul>
            </div>

            <div className="rounded-md border border-cyan-400/20 bg-slate-950/30 p-5">
              <div className="text-cyan-300 font-semibold mb-2">
                🧰 Dev Tools Space
              </div>
              <div className="text-slate-300">
                A dedicated menu for creator/operator workflows. Current and
                planned modules include:
              </div>
              <ul className="mt-2 list-disc pl-5 space-y-1">
                <li>Claim — claim only, returns a clear execution summary</li>
                <li>
                  Buy & Burn — claim, preserve a SOL buffer, buy the mint, burn
                  100%
                </li>
                <li>
                  Airdrop SOL — claim, compute SOL distribution by holder share
                  (coming)
                </li>
                <li>
                  Airdrop Token — claim, buy with excess SOL, distribute by
                  holder share (coming)
                </li>
              </ul>
            </div>
          </div>
        </section>

        {/* WHY IT MATTERS */}
        <section className="panel p-8">
          <div className="scanline" />
          <div className="text-sm font-bold text-sky-400 neon mb-6">
            [ why.telegram ]
          </div>

          <div className="space-y-4 text-sm text-slate-300 leading-relaxed">
            <p>
              The Telegram bot is the public control surface for IVG execution.
              Users can access Autoburn/MM runs while the system preserves
              execution constraints (rate limits, caps, cooldowns) to behave like
              a long-term market participant.
            </p>
            <p>
              Dev Tools is intentionally separated: it is meant for deployers and
              creators who need claim/burn/airdrop primitives without disrupting
              the main runtime flows.
            </p>
          </div>
        </section>

        {/* CTA */}
        <section className="panel p-6">
          <div className="scanline" />
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="text-sm text-slate-300">
              Ready to run IVG from Telegram?
            </div>
            <a
              href={TELEGRAM_BOT_URL}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-2 rounded-md border border-cyan-400/50 bg-slate-900/50 px-5 py-2 text-sm text-cyan-200 hover:border-cyan-300 hover:bg-slate-900 transition neon"
            >
              launch_bot →
            </a>
          </div>
        </section>
      </div>
    </main>
  );
}
