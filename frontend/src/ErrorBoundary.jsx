// Garde-fou : capture toute erreur de rendu React et l'affiche en clair
// au lieu de laisser un écran vide/sombre. Outil de diagnostic ; à retirer
// une fois la cause corrigée.
import { Component } from 'react'

class ErrorBoundary extends Component {
  constructor(props) {
    super(props)
    this.state = { error: null }
  }

  static getDerivedStateFromError(error) {
    return { error }
  }

  componentDidCatch(error, info) {
    // Je logge aussi dans la console pour garder la pile complète.
    console.error('[ErrorBoundary]', error, info)
  }

  render() {
    if (this.state.error) {
      return (
        <div
          style={{
            minHeight: '100vh',
            background: '#fff',
            color: '#b00020',
            padding: 32,
            fontFamily: 'monospace',
            fontSize: 14,
            whiteSpace: 'pre-wrap',
            overflow: 'auto',
          }}
        >
          <h1 style={{ fontSize: 18, marginBottom: 12 }}>
            Erreur de rendu — copie ce message et renvoie-le :
          </h1>
          <pre style={{ whiteSpace: 'pre-wrap' }}>
            {this.state.error?.message}
            {'\n\n'}
            {this.state.error?.stack}
          </pre>
        </div>
      )
    }
    return this.props.children
  }
}

export default ErrorBoundary
