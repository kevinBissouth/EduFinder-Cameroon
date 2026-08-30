import { useRef, useEffect, useState } from 'react'
import { Eye, EyeOff, ArrowRight, GraduationCap, AlertCircle } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'

import {
  requestLogin,
  fetchAuthenticatedProfile,
} from '../utils/auth'

// Fusion de classes utilitaire : évite d'installer clsx pour deux usages.
const cn = (...classes) => classes.filter(Boolean).join(' ')

// Carte du monde en points avec trajets animés : je garde la mécanique du
// composant d'origine mais je passe la palette en vert EduFinder et j'oriente
// les trajets vers Douala/Yaoundé (cœur du réseau scolaire du pays).
const DotMap = () => {
  const canvasRef = useRef(null)
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 })

  const routes = [
    { start: { x: 100, y: 150, delay: 0 }, end: { x: 200, y: 80, delay: 2 }, color: '#0d7a4f' },
    { start: { x: 200, y: 80, delay: 2 }, end: { x: 260, y: 120, delay: 4 }, color: '#0d7a4f' },
    { start: { x: 50, y: 50, delay: 1 }, end: { x: 150, y: 180, delay: 3 }, color: '#0a5e3d' },
    { start: { x: 280, y: 60, delay: 0.5 }, end: { x: 180, y: 180, delay: 2.5 }, color: '#0d7a4f' },
  ]

  const generateDots = (width, height) => {
    const dots = []
    const gap = 12
    const dotRadius = 1

    for (let x = 0; x < width; x += gap) {
      for (let y = 0; y < height; y += gap) {
        // Silhouette stylisée du Cameroun (bande centrale + extrémités).
        const isInMapShape =
          ((x > width * 0.35 && x < width * 0.62) && (y > height * 0.15 && y < height * 0.85)) ||
          ((x >= width * 0.62 && x < width * 0.78) && (y > height * 0.25 && y < height * 0.6)) ||
          ((x > width * 0.18 && x <= width * 0.35) && (y > height * 0.3 && y < height * 0.7))

        if (isInMapShape && Math.random() > 0.3) {
          dots.push({
            x,
            y,
            radius: dotRadius,
            opacity: Math.random() * 0.5 + 0.2,
          })
        }
      }
    }
    return dots
  }

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return undefined

    const resizeObserver = new ResizeObserver((entries) => {
      const { width, height } = entries[0].contentRect
      setDimensions({ width, height })
      canvas.width = width
      canvas.height = height
    })

    resizeObserver.observe(canvas.parentElement)
    return () => resizeObserver.disconnect()
  }, [])

  useEffect(() => {
    if (!dimensions.width || !dimensions.height) return undefined

    const canvas = canvasRef.current
    const ctx = canvas.getContext('2d')
    if (!ctx) return undefined

    const dots = generateDots(dimensions.width, dimensions.height)
    let animationFrameId = 0
    let startTime = Date.now()

    function drawDots() {
      ctx.clearRect(0, 0, dimensions.width, dimensions.height)
      dots.forEach((dot) => {
        ctx.beginPath()
        ctx.arc(dot.x, dot.y, dot.radius, 0, Math.PI * 2)
        ctx.fillStyle = `rgba(13, 122, 79, ${dot.opacity})`
        ctx.fill()
      })
    }

    function drawRoutes() {
      const currentTime = (Date.now() - startTime) / 1000

      routes.forEach((route) => {
        const elapsed = currentTime - route.start.delay
        if (elapsed <= 0) return

        const duration = 3
        const progress = Math.min(elapsed / duration, 1)

        const x = route.start.x + (route.end.x - route.start.x) * progress
        const y = route.start.y + (route.end.y - route.start.y) * progress

        ctx.beginPath()
        ctx.moveTo(route.start.x, route.start.y)
        ctx.lineTo(x, y)
        ctx.strokeStyle = route.color
        ctx.lineWidth = 1.5
        ctx.stroke()

        ctx.beginPath()
        ctx.arc(route.start.x, route.start.y, 3, 0, Math.PI * 2)
        ctx.fillStyle = route.color
        ctx.fill()

        ctx.beginPath()
        ctx.arc(x, y, 6, 0, Math.PI * 2)
        ctx.fillStyle = 'rgba(255, 176, 32, 0.45)'
        ctx.fill()

        ctx.beginPath()
        ctx.arc(x, y, 3, 0, Math.PI * 2)
        ctx.fillStyle = '#ffb020'
        ctx.fill()

        if (progress === 1) {
          ctx.beginPath()
          ctx.arc(route.end.x, route.end.y, 3, 0, Math.PI * 2)
          ctx.fillStyle = route.color
          ctx.fill()
        }
      })
    }

    function animate() {
      drawDots()
      drawRoutes()

      const currentTime = (Date.now() - startTime) / 1000
      if (currentTime > 15) {
        startTime = Date.now()
      }

      animationFrameId = requestAnimationFrame(animate)
    }

    animate()

    return () => cancelAnimationFrame(animationFrameId)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dimensions])

  return (
    <div className="relative h-full w-full overflow-hidden">
      <canvas ref={canvasRef} className="absolute inset-0 h-full w-full" />
    </div>
  )
}

function LoginPage({ onAuthenticated }) {
  const [isPasswordVisible, setIsPasswordVisible] = useState(false)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [isHovered, setIsHovered] = useState(false)
  const [submitStatus, setSubmitStatus] = useState('idle') // idle | submitting | error
  const [errorMessage, setErrorMessage] = useState('')

  async function handleSubmit(event) {
    event.preventDefault()
    if (submitStatus === 'submitting') return

    setSubmitStatus('submitting')
    setErrorMessage('')
    try {
      // Le cookie httpOnly est posé par la réponse du serveur ; on récupère
      // ensuite le profil pour router l'utilisateur selon son rôle.
      await requestLogin(email, password)
      const profile = await fetchAuthenticatedProfile()
      onAuthenticated(profile)
    } catch (error) {
      // Le serveur renvoie volontairement le même message pour email inconnu
      // et mot de passe erroné : on l'affiche tel quel, sans en dire plus.
      const apiDetail = error?.response?.data?.detail
      setErrorMessage(apiDetail || 'Unable to sign in right now. Please try again.')
      setSubmitStatus('error')
    }
  }

  return (
    <div className="flex min-h-screen w-full items-center justify-center bg-gradient-to-br from-[#e5f3ec] via-[#f7f8fc] to-[#dcebe3] p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5 }}
        className="flex w-full max-w-4xl overflow-hidden rounded-2xl bg-white shadow-xl"
      >
        {/* Panneau gauche : carte animée + marque */}
        <div className="relative hidden h-[600px] w-1/2 overflow-hidden border-r border-[#dcebe3] md:block">
          <div className="absolute inset-0 bg-gradient-to-br from-[#e5f3ec] to-[#cfe7db]">
            <DotMap />

            <div className="absolute inset-0 z-10 flex flex-col items-center justify-center p-8">
              <motion.div
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.6, duration: 0.5 }}
                className="mb-6"
              >
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-br from-[#0d7a4f] to-[#0a5e3d] shadow-lg shadow-emerald-200">
                  <GraduationCap className="h-6 w-6 text-white" />
                </div>
              </motion.div>
              <motion.h2
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.7, duration: 0.5 }}
                className="font-display mb-2 bg-gradient-to-r from-[#0d7a4f] to-[#0a5e3d] bg-clip-text text-center text-3xl font-bold text-transparent"
              >
                EduFinder Cameroon
              </motion.h2>
              <motion.p
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.8, duration: 0.5 }}
                className="max-w-xs text-center text-sm text-[#4b5566]"
              >
                Sign in to manage your school information and help families find
                the right institution across Cameroon.
              </motion.p>
            </div>
          </div>
        </div>

        {/* Panneau droit : formulaire */}
        <div className="flex w-full flex-col justify-center bg-white p-8 md:w-1/2 md:p-10">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <h1 className="mb-1 font-display text-2xl font-bold text-[#081220] md:text-3xl">
              Welcome back
            </h1>
            <p className="mb-8 text-[#4b5566]">
              Access reserved for school managers and administrators.
            </p>

            <AnimatePresence>
              {submitStatus === 'error' && (
                <motion.div
                  initial={{ opacity: 0, height: 0, marginBottom: 0 }}
                  animate={{ opacity: 1, height: 'auto', marginBottom: 24 }}
                  exit={{ opacity: 0, height: 0, marginBottom: 0 }}
                  transition={{ duration: 0.3 }}
                  className="overflow-hidden"
                >
                  <div className="flex items-start gap-2 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
                    <AlertCircle size={18} className="mt-0.5 shrink-0" />
                    <span>{errorMessage}</span>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            <form className="space-y-5" onSubmit={handleSubmit}>
              <div>
                <label htmlFor="email" className="mb-1 block text-sm font-medium text-[#343a44]">
                  Email <span className="text-[#0d7a4f]">*</span>
                </label>
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  placeholder="Enter your email address"
                  required
                  autoComplete="off"
                  className="flex h-10 w-full rounded-md border border-[#dcebe3] bg-[#f7f8fc] px-3 py-2 text-sm text-[#081220] placeholder:text-gray-400 focus:border-[#0d7a4f] focus:outline-none focus:ring-2 focus:ring-[#0d7a4f]/30 disabled:cursor-not-allowed disabled:opacity-50"
                />
              </div>

              <div>
                <label htmlFor="password" className="mb-1 block text-sm font-medium text-[#343a44]">
                  Password <span className="text-[#0d7a4f]">*</span>
                </label>
                <div className="relative">
                  <input
                    id="password"
                    type={isPasswordVisible ? 'text' : 'password'}
                    value={password}
                    onChange={(event) => setPassword(event.target.value)}
                    placeholder="Enter your password"
                    required
                    autoComplete="new-password"
                    className="flex h-10 w-full rounded-md border border-[#dcebe3] bg-[#f7f8fc] px-3 py-2 pr-10 text-sm text-[#081220] placeholder:text-gray-400 focus:border-[#0d7a4f] focus:outline-none focus:ring-2 focus:ring-[#0d7a4f]/30 disabled:cursor-not-allowed disabled:opacity-50"
                  />
                  <button
                    type="button"
                    className="absolute inset-y-0 right-0 flex items-center pr-3 text-gray-500 hover:text-gray-700"
                    onClick={() => setIsPasswordVisible(!isPasswordVisible)}
                    aria-label={isPasswordVisible ? 'Hide password' : 'Show password'}
                  >
                    {isPasswordVisible ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>

              <motion.div
                whileHover={{ scale: 1.01 }}
                whileTap={{ scale: 0.98 }}
                onHoverStart={() => setIsHovered(true)}
                onHoverEnd={() => setIsHovered(false)}
                className="pt-2"
              >
                <button
                  type="submit"
                  disabled={submitStatus === 'submitting'}
                  className={cn(
                    'relative w-full overflow-hidden rounded-lg bg-gradient-to-r from-[#0d7a4f] to-[#0a5e3d] py-2 text-white transition-all duration-300 hover:from-[#0a5e3d] hover:to-[#081220] disabled:pointer-events-none disabled:opacity-60',
                    isHovered ? 'shadow-lg shadow-emerald-200' : ''
                  )}
                >
                  <span className="flex items-center justify-center">
                    {submitStatus === 'submitting' ? 'Signing in…' : 'Sign in'}
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </span>
                  {isHovered && submitStatus !== 'submitting' && (
                    <motion.span
                      initial={{ left: '-100%' }}
                      animate={{ left: '100%' }}
                      transition={{ duration: 1, ease: 'easeInOut' }}
                      className="absolute bottom-0 left-0 top-0 w-20 bg-gradient-to-r from-transparent via-white/30 to-transparent"
                      style={{ filter: 'blur(8px)' }}
                    />
                  )}
                </button>
              </motion.div>
            </form>

            <p className="mt-6 text-center text-xs text-gray-400">
              EduFinder never claims a school is “the best” — it helps each
              family find the one that matches its own criteria.
            </p>

            <a
              href="#/"
              className="mt-4 flex items-center justify-center gap-1.5 text-xs font-semibold text-[#0d7a4f] transition-colors hover:text-[#0a5e3d]"
            >
              Back to EduFinder search
            </a>
          </motion.div>
        </div>
      </motion.div>
    </div>
  )
}

export default LoginPage
