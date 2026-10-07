import { useState } from 'react'

import { readApiErrorMessage } from '../../../utils/apiError'
import { authedRequest } from '../../../utils/auth'

// Envoi d'un fichier avant la soumission : le serveur le stocke et renvoie son
// adresse, que la proposition cite ensuite. Renvoie null en cas d'échec.
export function useFileUpload() {
  const [isUploading, setIsUploading] = useState(false)
  const [uploadError, setUploadError] = useState('')

  async function uploadFile(file) {
    const formData = new FormData()
    formData.append('file', file)
    setIsUploading(true)
    setUploadError('')
    try {
      const storedFile = await authedRequest('post', '/my/uploads/media', formData)
      return storedFile.url
    } catch (error) {
      setUploadError(readApiErrorMessage(error))
      return null
    } finally {
      setIsUploading(false)
    }
  }

  return { isUploading, uploadError, uploadFile }
}
