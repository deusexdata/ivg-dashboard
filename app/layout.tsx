import "./globals.css";

export const metadata = {
  title: "IVG | On-Chain Dashboard",
  description: "IVG terminal-style dashboard (Wallet PnL + Token Market + Docs)"
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="ivg-grid">
        {children}
      </body>
    </html>
  );
}