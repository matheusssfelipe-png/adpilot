import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "AdPilot — Gerenciador de Anúncios",
  description: "Sistema inteligente para gerenciar campanhas no Meta Ads e Google Ads com IA",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR">
      <body>{children}</body>
    </html>
  );
}
