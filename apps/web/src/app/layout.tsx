import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import '@ccd/ui/globals.css';

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
});

export const metadata: Metadata = {
  title: 'CCD Suite',
  description: 'Comprehensive business management platform by Crane & Ceeshar Digital',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${inter.variable} font-sans antialiased`}>
        {children}
      </body>
    </html>
  );
}
