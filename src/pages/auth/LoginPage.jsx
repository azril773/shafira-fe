import { useState } from 'react'
import { useAuthStore } from '../../store/authStore'
import { useNavigate } from 'react-router-dom'
import logo from '../../assets/logo-shafira.png'

export default function LoginPage() {
  const [form, setForm] = useState({ email: '', password: '' })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const { login } = useAuthStore()
  const navigate = useNavigate()

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      // Ganti dengan API call ke backend
      // const res = await api.post('/auth/login', form)
      // login(res.data.user, res.data.token)

      // Demo login sementara
      if (form.email === 'admin@pos.com' && form.password === 'password') {
        login({ name: 'Admin', email: form.email, role: 'admin' }, 'demo-token')
        navigate('/pos')
      } else {
        setError('Email atau password salah')
      }
    } catch {
      setError('Login gagal. Coba lagi.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-stretch justify-center bg-[#f4d7c7] relative overflow-hidden p-6">
      <div className="absolute w-[560px] h-[560px] bg-[#f1c6af] rounded-full left-[-260px] top-[-240px]" />
      <div className="absolute w-[480px] h-[480px] bg-[#ffe7de] rounded-full left-[-120px] top-20" />
      <div className="absolute w-[520px] h-[520px] bg-[#eab49a] rounded-full right-[-220px] bottom-[-220px]" />

      <div className="relative z-10 flex w-full max-w-6xl flex-col gap-8 lg:flex-row lg:items-center items-stretch">
        <div className="flex-1 hidden lg:flex items-center justify-start pr-60">
          <div className="max-w-sm text-left">
            <div className="mb-6 w-140 h-140 rounded-full bg-white/75 flex items-center justify-center shadow-2xl backdrop-blur-sm">
              <img src={logo} alt="ShafiraMart" className="w-80" />
            </div>
          </div>
        </div>

        <div className="flex-2 flex">
          <div className="bg-orange-600 text-white rounded-[48px] shadow-xl w-full max-w-xl mx-auto min-h-[720px] max-h-[520px] flex items-center justify-center p-10">
            <div className="w-full max-w-sm text-center space-y-6">
              <div>
                <h2 className="text-3xl font-bold tracking-[0.35em] uppercase">User Login</h2>
                <p className="text-sm text-orange-100 mt-3">Please Login to continue</p>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                <input
                  type="email"
                  required
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  placeholder="username"
                  className="w-full p-3 rounded-full text-gray-700 bg-white focus:outline-none focus:ring-2 focus:ring-orange-200"
                />

                <input
                  type="password"
                  required
                  value={form.password}
                  onChange={(e) => setForm({ ...form, password: e.target.value })}
                  placeholder="password"
                  className="w-full p-3 rounded-full text-gray-700 bg-white focus:outline-none focus:ring-2 focus:ring-orange-200"
                />

                {error && <p className="text-sm text-red-100 text-center">{error}</p>}

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-green-500 py-3 rounded-full font-semibold hover:bg-green-600 transition-colors disabled:opacity-70 disabled:cursor-not-allowed"
                >
                  {loading ? 'Memproses...' : 'LOGIN'}
                </button>
              </form>

              <p className="text-center text-xs text-orange-100 mt-6">Demo: admin@pos.com / password</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
