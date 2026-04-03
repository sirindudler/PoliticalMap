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
      <body>{children}</body>
    </html>
  )
}
