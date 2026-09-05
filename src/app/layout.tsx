import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Private Vault',
  description: 'A private workspace for your notes.',
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className="h-full">
      <body className="min-h-full">{children}</body>
    </html>
  );
}
