export default function Home() {
  return (
    <div style={{
      minHeight: '100vh',
      background: '#080808',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 24,
      fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
      textAlign: 'center',
      padding: 24,
    }}>
      <div style={{
        width: 56, height: 56,
        background: '#4F46E5',
        borderRadius: 16,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        marginBottom: 8,
        boxShadow: '0 0 0 1px rgba(79,70,229,0.3), 0 8px 32px rgba(79,70,229,0.3)',
      }}>
        <svg width="28" height="28" viewBox="0 0 16 16" fill="none">
          <path d="M3 5L8 2L13 5V11L8 14L3 11V5Z" stroke="white" strokeWidth="1.5" strokeLinejoin="round"/>
          <circle cx="8" cy="8" r="2" fill="white"/>
        </svg>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        <h1 style={{
          color: '#FAFAFA',
          fontSize: 32,
          fontWeight: 800,
          letterSpacing: '-0.05em',
          lineHeight: 1,
        }}>
          DemoFlow
        </h1>
        <p style={{
          color: 'rgba(255,255,255,0.4)',
          fontSize: 15,
          lineHeight: 1.6,
          maxWidth: 360,
        }}>
          Créez des démonstrations produit interactives en quelques clics.<br/>
          Installez l'extension Chrome pour commencer.
        </p>
      </div>

      <div style={{
        background: 'rgba(255,255,255,0.04)',
        border: '1px solid rgba(255,255,255,0.08)',
        borderRadius: 12,
        padding: '16px 24px',
        display: 'flex',
        flexDirection: 'column',
        gap: 10,
        maxWidth: 380,
        width: '100%',
        textAlign: 'left',
      }}>
        {[
          ['1', 'Installe l\'extension Chrome'],
          ['2', 'Ouvre ton produit et clique "Enregistrer"'],
          ['3', 'Capture tes écrans clés'],
          ['4', 'Ajoute des tooltips dans l\'éditeur'],
          ['5', 'Publie et partage le lien'],
        ].map(([num, text]) => (
          <div key={num} style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <span style={{
              width: 22, height: 22,
              background: '#4F46E5',
              borderRadius: 6,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 11, fontWeight: 700, color: '#fff',
              flexShrink: 0,
            }}>{num}</span>
            <span style={{ color: 'rgba(255,255,255,0.6)', fontSize: 13 }}>{text}</span>
          </div>
        ))}
      </div>

      <p style={{ color: 'rgba(255,255,255,0.15)', fontSize: 11, marginTop: 16 }}>
        Les liens de démo ont le format /demo/[id]
      </p>
    </div>
  )
}
