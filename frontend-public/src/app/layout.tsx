import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';

const inter = Inter({ subsets: ['latin'], variable: '--font-inter' });

export const metadata: Metadata = {
  title: 'Fantasy La Liga Pro - Análisis y Consejos Expertos',
  description: 'Análisis profesional, estadísticas en tiempo real y consejos de expertos para dominar La Liga Fantasy. Descubre chollos, predicciones y estrategias ganadoras.',
  keywords: 'fantasy la liga, la liga fantasy, fantasy football españa, estadísticas la liga, chollos fantasy',
  authors: [{ name: 'Fantasy La Liga Pro' }],
  openGraph: {
    title: 'Fantasy La Liga Pro',
    description: 'Análisis profesional y consejos expertos para La Liga Fantasy',
    type: 'website',
    locale: 'es_ES',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="es" suppressHydrationWarning>
      <body className={inter.variable}>{children}</body>
    </html>
  );
}
