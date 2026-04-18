import type { Metadata } from 'next';
import { Bebas_Neue, Rajdhani, Space_Mono } from 'next/font/google';
import './globals.css';
import { TeamProvider } from '@/context/TeamContext';
import { Nav } from '@/components/Nav';

const bebas = Bebas_Neue({
  weight: '400',
  variable: '--font-bebas',
  subsets: ['latin'],
});

const rajdhani = Rajdhani({
  weight: ['400', '500', '600', '700'],
  variable: '--font-rajdhani',
  subsets: ['latin'],
});

const spaceMono = Space_Mono({
  weight: ['400', '700'],
  variable: '--font-space-mono',
  subsets: ['latin'],
});

export const metadata: Metadata = {
  title: 'Pokédex Helper',
  description: 'Look up Pokémon stats, types, abilities, and build your team.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${bebas.variable} ${rajdhani.variable} ${spaceMono.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col">
        <TeamProvider>
          <Nav />
          <main className="flex-1">{children}</main>
        </TeamProvider>
      </body>
    </html>
  );
}
