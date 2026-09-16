import type { Metadata, Viewport } from "next";
import { Inter, Newsreader } from "next/font/google";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  display: "swap"
});

const newsreader = Newsreader({
  variable: "--font-newsreader",
  subsets: ["latin"],
  display: "swap"
});

const siteUrl = "https://ofmrmatte.vercel.app";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: "Matheus Ferreira Folgado | Sistemas, Automação com IA e Engenharia de Software",
  description:
    "Portfólio profissional de Matheus Ferreira Folgado: requisitos, sistemas, automação com IA e Engenharia de Software aplicados a operações reais.",
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
    title: "Matheus Ferreira Folgado | Sistemas, Automação com IA e Engenharia de Software",
    description:
      "Negócio, requisitos, sistemas e automação com IA conectados para resolver problemas operacionais reais.",
    url: siteUrl,
    siteName: "Matheus Ferreira Folgado",
    locale: "pt_BR",
    type: "website",
    images: [
      {
        url: "/og.svg",
        width: 1200,
        height: 630,
        alt: "Matheus Ferreira Folgado - Sistemas, Automação com IA e Engenharia de Software"
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
  themeColor: "#ffffff"
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="pt-BR" className={`${inter.variable} ${newsreader.variable}`} data-scroll-behavior="smooth">
      <body>{children}</body>
    </html>
  );
}
