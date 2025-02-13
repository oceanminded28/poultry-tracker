import { Quicksand } from 'next/font/google';
import './globals.css'

const quicksand = Quicksand({ subsets: ['latin'], weight: ['400'] });

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className={quicksand.className}>{children}</body>
    </html>
  );
}