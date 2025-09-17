import type { Metadata, Viewport } from 'next';
import { Inter } from 'next/font/google';
import Script from 'next/script';
import './globals.css';
import '../src/styles/performance.css';
import { AuthProvider } from '../src/providers/auth-provider';
import { Navigation } from '../src/components/layout/navigation';

// Optimize font loading
const inter = Inter({ 
  subsets: ['latin'],
  display: 'swap',
  preload: true,
  fallback: ['system-ui', '-apple-system', 'BlinkMacSystemFont', 'sans-serif'],
  adjustFontFallback: true
});

export const metadata: Metadata = {
  title: 'FinFlow Tracker',
  description: 'Personal finance tracker with multi-currency support',
  manifest: '/manifest.json',
  applicationName: 'FinFlow Tracker',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'FinFlow',
  },
  formatDetection: {
    telephone: false,
  },
  openGraph: {
    type: 'website',
    siteName: 'FinFlow Tracker',
    title: 'FinFlow Tracker - Personal Finance Management',
    description: 'Track your finances across multiple currencies and accounts',
  },
  twitter: {
    card: 'summary',
    title: 'FinFlow Tracker',
    description: 'Personal finance tracker with multi-currency support',
  },
};

export const viewport: Viewport = {
  themeColor: '#3b82f6',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
  userScalable: true,
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="scroll-smooth">
      <head>
        <link rel="dns-prefetch" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <meta name="theme-color" content="#3b82f6" />
        <link rel="apple-touch-icon" href="/icon-192x192.png" />
        <link rel="icon" type="image/png" sizes="32x32" href="/icon-32x32.png" />
        <link rel="icon" type="image/png" sizes="16x16" href="/icon-16x16.png" />
      </head>
      <body className={`${inter.className} antialiased`}>
        <AuthProvider>
          <Navigation />
          <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
            {children}
          </div>
        </AuthProvider>
        
        {/* Service Worker Registration */}
        <Script
          id="sw-registration"
          strategy="afterInteractive"
          dangerouslySetInnerHTML={{
            __html: `
              if ('serviceWorker' in navigator) {
                window.addEventListener('load', function() {
                  navigator.serviceWorker.register('/sw.js').then(
                    function(registration) {
                      console.log('ServiceWorker registration successful');
                    },
                    function(err) {
                      console.log('ServiceWorker registration failed: ', err);
                    }
                  );
                });
              }
            `,
          }}
        />
        
        {/* Performance monitoring */}
        <Script
          id="performance-monitor"
          strategy="afterInteractive"
          dangerouslySetInnerHTML={{
            __html: `
              if ('performance' in window && 'PerformanceObserver' in window) {
                // Log long tasks
                const observer = new PerformanceObserver((list) => {
                  for (const entry of list.getEntries()) {
                    if (entry.duration > 50) {
                      console.warn('Long task detected:', entry.duration + 'ms');
                    }
                  }
                });
                observer.observe({ entryTypes: ['longtask'] });
                
                // Log paint timing
                const paintObserver = new PerformanceObserver((list) => {
                  for (const entry of list.getEntries()) {
                    console.log(entry.name + ': ' + entry.startTime + 'ms');
                  }
                });
                paintObserver.observe({ entryTypes: ['paint'] });
              }
            `,
          }}
        />
      </body>
    </html>
  );
}
