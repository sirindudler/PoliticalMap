import './globals.css'

export const metadata = {
  title: 'Political World Map',
  description: 'Interactive world map showing political regimes, civil freedoms, and income levels across 179 countries.',
  icons: {
    icon: "data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'><text y='.9em' font-size='90'>🌍</text></svg>",
  },
}

export const viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
}

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>
        {children}
        <script dangerouslySetInnerHTML={{ __html: `
          document.addEventListener('wheel', function(e) {
            if (e.ctrlKey || e.metaKey) e.preventDefault();
          }, { passive: false });
          document.addEventListener('keydown', function(e) {
            if ((e.ctrlKey || e.metaKey) && (e.key === '+' || e.key === '-' || e.key === '=' || e.key === '0')) {
              e.preventDefault();
            }
          });
        `}} />
      </body>
    </html>
  )
}
