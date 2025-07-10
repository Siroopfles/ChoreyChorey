

import { PT_Sans, Roboto_Mono, Source_Sans_3 } from 'next/font/google';
import { cn } from '@/lib/utils/utils';
import { AuthProvider } from '@/contexts/user/auth-context';
import { ThemeProvider } from '@/components/core/theme-provider';
import { Toaster } from '@/components/ui/toaster';
import '@/app/globals.css';
import { DebugProvider } from '@/contexts/system/debug-context';
import { UIPreferencesProvider } from '@/contexts/user/ui-preferences-context';

const ptSans = PT_Sans({
  subsets: ['latin'],
  weight: ['400', '700'],
  variable: '--font-pt-sans',
  display: 'swap',
});

const robotoMono = Roboto_Mono({
  subsets: ['latin'],
  weight: ['400', '700'],
  variable: '--font-roboto-mono',
  display: 'swap',
})

const sourceSans3 = Source_Sans_3({
  subsets: ['latin'],
  weight: ['400', '700'],
  variable: '--font-source-sans-3',
  display: 'swap',
});


export const metadata = {
  title: 'Chorey',
  description: 'The intelligent task management system to streamline your workflows.',
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'Chorey',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" suppressHydrationWarning>
       <head>
        <meta name="theme-color" content="#3b82f6" />
      </head>
      <body className={cn(
        'min-h-screen bg-background font-sans antialiased', 
        ptSans.variable, 
        robotoMono.variable,
        sourceSans3.variable
      )}>
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <DebugProvider>
            <AuthProvider>
              <UIPreferencesProvider>
                  {children}
                  <Toaster />
              </UIPreferencesProvider>
            </AuthProvider>
          </DebugProvider>
        </ThemeProvider>
      </body>
    </html>
  )
}
