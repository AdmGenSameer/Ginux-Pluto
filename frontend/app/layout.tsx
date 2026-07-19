import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { Providers } from '@/components/Providers';
import { Toaster } from '@/components/ui/sonner';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'CloudDeploy',
  description: 'Deploy applications in one click.',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body className={`${inter.className} bg-[#09090B] text-[#FFFFFF] antialiased`}>
        <Providers>
          {children}
          <Toaster theme="dark" />
        </Providers>
      </body>
    </html>
  );
}
