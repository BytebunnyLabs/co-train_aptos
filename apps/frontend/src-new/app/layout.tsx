import type { Metadata } from 'next';
import { Inter, JetBrains_Mono } from 'next/font/google';
import { Providers } from '@/components/layout/providers';
import { MainLayout } from '@/components/layout/main-layout';
import './globals.css';

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ['latin'],
  variable: '--font-jetbrains-mono',
});

export const metadata: Metadata = {
  title: {
    default: 'CoTrain - Distributed AI Training Platform',
    template: '%s | CoTrain',
  },
  description: 'Join the decentralized AI training network. Contribute your computing power and earn rewards while helping train next-generation AI models on Aptos blockchain.',
  keywords: [
    'AI training',
    'distributed computing',
    'blockchain',
    'Aptos',
    'machine learning',
    'decentralized',
    'rewards',
    'cryptocurrency',
  ],
  authors: [{ name: 'CoTrain Team' }],
  creator: 'CoTrain',
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: 'https://cotrain.ai',
    title: 'CoTrain - Distributed AI Training Platform',
    description: 'Join the decentralized AI training network and earn rewards for contributing computing power.',
    siteName: 'CoTrain',
    images: [
      {
        url: '/og-image.png',
        width: 1200,
        height: 630,
        alt: 'CoTrain - Distributed AI Training Platform',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'CoTrain - Distributed AI Training Platform',
    description: 'Join the decentralized AI training network and earn rewards for contributing computing power.',
    images: ['/og-image.png'],
    creator: '@cotrain_ai',
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  icons: {
    icon: '/favicon.ico',
    shortcut: '/favicon-16x16.png',
    apple: '/apple-touch-icon.png',
  },
  manifest: '/site.webmanifest',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html 
      lang="en" 
      className={`${inter.variable} ${jetbrainsMono.variable}`}
      suppressHydrationWarning
    >
      <body className="min-h-screen bg-background font-sans antialiased">
        <Providers>
          <MainLayout>
            {children}
          </MainLayout>
        </Providers>
      </body>
    </html>
  );
}