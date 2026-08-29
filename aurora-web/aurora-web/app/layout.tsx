import type { Metadata } from 'next';
import Navigation from '../components/Navigation';
import DiscordSDKProvider from '../components/DiscordSDKProvider';
import GlobalMiniPlayer from '../components/GlobalMiniPlayer';
import { getSiteSettings } from '../lib/settings';
import '../styles/globals.css';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function generateMetadata(): Promise<Metadata> {
  const settings = await getSiteSettings();
  const title = settings.siteName ? `${settings.siteName} - Discord Music Bot Dashboard` : 'Tussi Music - Discord Music Bot Dashboard';
  const description = settings.siteDescription || 'Control your Discord music bot from the web';
  const ogImage = settings.metaImageUrl || settings.navbarIconUrl || '/tussi-logo.png';
  const favicon = settings.faviconUrl || '/favicon.ico';
  const keywords = settings.metaKeywords || 'tussi music, discord music bot, music dashboard, discord bot';

  const defaultUrl = process.env.NEXT_PUBLIC_APP_URL || process.env.VERCEL_URL || 'http://localhost:3000';
  const metadataBase = new URL(defaultUrl.startsWith('http') ? defaultUrl : `https://${defaultUrl}`);

  return {
    metadataBase,
    title,
    description,
    keywords,
    icons: {
      icon: favicon,
      shortcut: favicon,
      apple: favicon,
    },
    openGraph: {
      title,
      description,
      siteName: settings.siteName || 'Tussi Music',
      images: [
        {
          url: ogImage,
          width: 1200,
          height: 630,
          alt: title,
        },
      ],
      type: 'website',
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: [ogImage],
    },
  };
}

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const settings = await getSiteSettings();
  const name = settings.siteName || 'Tussi Music';
  const title = settings.siteName ? `${settings.siteName} - Discord Music Bot Dashboard` : 'Tussi Music - Discord Music Bot Dashboard';
  const description = settings.siteDescription || 'Control your Discord music bot from the web';
  const ogImage = settings.metaImageUrl || settings.navbarIconUrl || '/tussi-logo.png';
  const favicon = settings.faviconUrl || '/favicon.ico';

  return (
    <html lang="en">
      <head>
        <title>{title}</title>
        <link rel="icon" href={favicon} />
        <meta name="description" content={description} />
        <meta property="og:site_name" content={name} />
        <meta property="og:title" content={title} />
        <meta property="og:description" content={description} />
        <meta property="og:image" content={ogImage} />
        <meta property="twitter:card" content="summary_large_image" />
        <meta property="twitter:title" content={title} />
        <meta property="twitter:description" content={description} />
        <meta property="twitter:image" content={ogImage} />
        <style dangerouslySetInnerHTML={{ __html: `
          .aurora-theme-active, :root {
            --glow-pink: ${settings.primaryColor} !important;
            --glow-green: ${settings.primaryColor} !important;
            --aurora-green: ${settings.primaryColor} !important;
            --tussi-pink: ${settings.primaryColor} !important;
          }
        `}} />
      </head>
      <body>
        <DiscordSDKProvider>
          <Navigation initialSettings={{ siteName: settings.siteName, navbarIconUrl: settings.navbarIconUrl }} />
          {children}
          <GlobalMiniPlayer />
        </DiscordSDKProvider>
      </body>
    </html>
  );
}
