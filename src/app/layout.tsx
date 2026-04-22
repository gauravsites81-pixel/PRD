import type { Metadata } from 'next';
import { Poppins } from 'next/font/google';
import '@/styles/globals.css';
import { Toaster } from 'react-hot-toast';
import { Providers } from '@/components/providers';

const poppins = Poppins({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700', '800'],
  variable: '--font-poppins',
});

export const metadata: Metadata = {
  title: 'GolfHeroes - Golf Draw Platform',
  description:
    'Join our monthly golf draw. Supporting charities through Stableford scores. Win prizes while making a difference.',
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL || 'https://golftrak.vercel.app'),
  openGraph: {
    title: 'GolfHeroes - Golf Draw Platform',
    description: 'Join our monthly golf draw. Supporting charities through Stableford scores.',
    url: '/',
    type: 'website',
    images: [
      {
        url: '/og-image.png',
        width: 1200,
        height: 630,
        alt: 'GolfHeroes',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'GolfHeroes - Golf Draw Platform',
    description: 'Join our monthly golf draw. Supporting charities through Stableford scores.',
    images: ['/og-image.png'],
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={poppins.variable}>
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <meta charSet="utf-8" />
      </head>
      <body>
        <Providers>
          {children}
          <Toaster position="top-right" />
        </Providers>
      </body>
    </html>
  );
}
