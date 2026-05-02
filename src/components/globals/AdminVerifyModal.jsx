import { useEffect, useRef, useState } from 'react'
import { ShieldAlert, X } from 'lucide-react'
import { verifyAdminApi } from '../../services/auth'

export default function AdminVerifyModal({
  title = 'Verifikasi Admin',
  description = 'Masukkan kredensial admin untuk melanjutkan.',
  confirmLabel = 'Verifikasi',
  tone = 'red',
  onCancel,
  onVerified,
}) {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const userRef = useRef(null)

  useEffect(() => {
    const t = setTimeout(() => userRef.current?.focus(), 50)
    return () => clearTimeout(t)
  }, [])

  const submit = async (e) => {
    e?.preventDefault?.()
    if (!username || !password) {
      setError('Username dan password wajib diisi.')
      return
    }
    setLoading(true)
    setError('')
    const { data, error: err } = await verifyAdminApi(username, password)
    setLoading(false)
    if (err || !data?.ok) {
      setError(err || 'Verifikasi gagal.')
      return
    }
    onVerified?.({ username, password })
  }

  // Esc untuk batal
  useEffect(() => {
    const onKey = (e) => {
      if (e.key === 'Escape') {
        e.preventDefault()
        e.stopPropagation()
        if (!loading) onCancel?.()
      }
    }
    window.addEventListener('keydown', onKey, true)
    return () => window.removeEventListener('keydown', onKey, true)
  }, [loading, onCancel])

  const accent = tone === 'red'
    ? 'bg-red-600 hover:bg-red-700'
    : 'bg-orange-600 hover:bg-orange-700'
  const iconBg = tone === 'red' ? 'bg-red-100 text-red-600' : 'bg-orange-100 text-orange-600'

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-sm rounded-2xl bg-white shadow-2xl">
        <div className="flex items-start justify-between px-5 pt-5">
          <div className="flex items-center gap-3">
            <div className={`flex h-10 w-10 items-center justify-center rounded-full ${iconBg}`}>
              <ShieldAlert size={20} />
            </div>
            <div>
              <h3 className="text-base font-bold text-gray-800">{title}</h3>
              <p className="mt-0.5 text-xs text-gray-500">{description}</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onCancel}
            disabled={loading}
            className="text-gray-400 hover:text-gray-600 disabled:opacity-40"
          >
            <X size={18} />
          </button>
        </div>
        <form onSubmit={submit} className="px-5 pb-5 pt-4 space-y-3">
          <div>
            <label className="text-xs font-medium text-gray-600 mb-1 block">Username Admin</label>
            <input
              ref={userRef}
              type="text"
              autoComplete="off"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-300"
            />
          </div>
          <div>
            <label className="text-xs font-medium text-gray-600 mb-1 block">Password</label>
            <input
              type="password"
              autoComplete="off"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-300"
            />
          </div>
          {error && <p className="text-xs text-red-500">{error}</p>}
          <div className="flex gap-2 pt-1">
            <button
              type="button"
              onClick={onCancel}
              disabled={loading}
              className="flex-1 rounded-lg border border-gray-200 py-2 text-sm font-medium text-gray-600 hover:bg-gray-50 disabled:opacity-40"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={loading}
              className={`flex-1 rounded-lg py-2 text-sm font-semibold text-white disabled:opacity-50 ${accent}`}
            >
              {loading ? 'Memverifikasi...' : confirmLabel}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
