export const metadata = {
  title: 'DemoFlow',
  description: 'Démonstrations produit interactives',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fr">
      <head>
        <style>{`
          *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
          html, body { height: 100%; }
          body {
            background: #080808;
            color: #FAFAFA;
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
            -webkit-font-smoothing: antialiased;
          }
          button { cursor: pointer; }
        `}</style>
      </head>
      <body>{children}</body>
    </html>
  )
}
