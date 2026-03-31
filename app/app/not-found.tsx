export default function NotFound() {
  return (
    <div style={{
      minHeight: '100vh',
      background: '#080808',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 20,
      fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
      textAlign: 'center',
      padding: 24,
    }}>
      <div style={{
        width: 48, height: 48,
        background: '#4F46E5',
        borderRadius: 14,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        marginBottom: 8,
      }}>
        <svg width="24" height="24" viewBox="0 0 16 16" fill="none">
          <path d="M3 5L8 2L13 5V11L8 14L3 11V5Z" stroke="white" strokeWidth="1.5" strokeLinejoin="round"/>
          <circle cx="8" cy="8" r="2" fill="white"/>
        </svg>
      </div>

      <h1 style={{
        color: '#FAFAFA',
        fontSize: 24,
        fontWeight: 700,
        letterSpacing: '-0.04em',
      }}>
        Démo introuvable
      </h1>

      <p style={{
        color: 'rgba(255,255,255,0.4)',
        fontSize: 14,
        maxWidth: 320,
        lineHeight: 1.6,
      }}>
        Ce lien n'existe pas ou la démo a été supprimée. Vérifie l'URL ou demande un nouveau lien.
      </p>
    </div>
  )
}
