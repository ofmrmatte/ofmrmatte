import type { Metadata, Viewport } from "next";
import { Inter, Space_Grotesk } from "next/font/google";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  display: "swap"
});

const spaceGrotesk = Space_Grotesk({
  variable: "--font-space-grotesk",
  subsets: ["latin"],
  display: "swap"
});

const siteUrl = "https://matheus-ferreira-portfolio.vercel.app";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: "Matheus Ferreira Folgado | Administração, Sistemas e Automação",
  description:
    "Portfólio profissional de Matheus Ferreira Folgado: gestão, tecnologia e automação aplicadas a operações reais.",
  alternates: {
    canonical: "/"
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-image-preview": "large",
      "max-snippet": -1
    }
  },
  openGraph: {
    title: "Matheus Ferreira Folgado | Administração, Sistemas e Automação",
    description:
      "Administrador em Ribeirão Preto/SP com foco em análise operacional, sistemas, dashboards e automação.",
    url: siteUrl,
    siteName: "Matheus Ferreira Folgado",
    locale: "pt_BR",
    type: "website",
    images: [
      {
        url: "/og.svg",
        width: 1200,
        height: 630,
        alt: "Matheus Ferreira Folgado - Administração, Sistemas e Automação"
      }
    ]
  },
  icons: {
    icon: "/favicon.svg"
  }
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#070b0f"
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="pt-BR" className={`${inter.variable} ${spaceGrotesk.variable}`} data-scroll-behavior="smooth">
      <body>{children}</body>
    </html>
  );
}
