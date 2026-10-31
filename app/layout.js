export const metadata = {
  title: 'Morgane Faoli Nail Style',
  description: 'Agende seu horário online',
}

// viewport-fit=cover: o app pinta de ponta a ponta e afasta o conteúdo
// do notch/barra de gestos com env(safe-area-inset-*). Zoom continua liberado.
export const viewport = {
  width: 'device-width',
  initialScale: 1,
  viewportFit: 'cover',
}

export default function RootLayout({ children }) {
  return (
    <html lang="pt-BR">
      <body>{children}</body>
    </html>
  )
}
