import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { Toaster } from "@/components/ui/toaster";
import { ThemeProvider } from '@/components/theme-provider';
import { AuthProvider } from '@/contexts/auth-context';
import { DebugProvider } from '@/contexts/debug-context';
import { UIPreferencesProvider } from '@/contexts/ui-preferences-context';

const inter = Inter({ 
  subsets: ['latin'],
  variable: '--font-inter',
});

export const metadata: Metadata = {
  title: 'Chorey | AI-Powered Task Management',
  description: 'Het Gecentraliseerde Leefomgeving & Taakbeheer Intelligentie Systeem',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="nl" suppressHydrationWarning>
      <body className={`${inter.variable} font-sans antialiased`}>
        <ThemeProvider
          attribute="class"
          defaultTheme="dark"
          enableSystem
          disableTransitionOnChange
        >
          <UIPreferencesProvider>
            <DebugProvider>
              <AuthProvider>
                {children}
              </AuthProvider>
            </DebugProvider>
          </UIPreferencesProvider>
          <Toaster />
        </ThemeProvider>
      </body>
    </html>
  );
}
