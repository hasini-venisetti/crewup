import './globals.css';
import { Providers } from './providers';

/**
 * Root layout — server component (required for metadata).
 * Delegates all client-side context (AuthProvider, Toaster) to <Providers>.
 */
export const metadata = {
  title: 'CREWUPFILMS — Find Your Creative Team',
  description:
    'CREWUPFILMS connects filmmakers, actors, editors, writers, and all creative professionals into project-based teams.',
  keywords: ['filmmaking', 'collaboration', 'creators', 'film crew', 'creative projects'],
  openGraph: {
    title:       'CREWUPFILMS — Find Your Creative Team',
    description: 'Post a project. Find collaborators. Create together.',
    type:        'website',
  },
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        {/* Inter — body font */}
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800;900&display=swap"
          rel="stylesheet"
        />
        {/* Playfair Display — heading / brand font */}
        <link
          href="https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,400;0,500;0,600;0,700;1,400;1,600&display=swap"
          rel="stylesheet"
        />
      </head>
      <body>
        {/*
          Providers wraps the ENTIRE app — every page and layout nested below
          this point has access to AuthContext and the toast system.
          No need for per-page AuthProvider wraps.
        */}
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
