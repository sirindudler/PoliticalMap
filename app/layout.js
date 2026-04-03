import './globals.css'

export const metadata = {
  title: 'World Political Map',
  description: 'Interactive world political map showing all countries',
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
