import { useEffect, useState } from 'react'
import axios from 'axios'

function App() {
  const [message, setMessage] = useState('Chargement...')

  useEffect(() => {
    axios
      .get('http://localhost:8000/hello')
      .then((response) => setMessage(response.data.message))
      .catch(() => setMessage('Erreur : API injoignable'))
  }, [])

  return (
    <div style={{ fontFamily: 'monospace', fontSize: '1.2rem', padding: '2rem' }}>
      {message}
    </div>
  )
}

export default App
