import { useEffect } from 'react'

/**
 * Tutup modal saat tombol ESC ditekan.
 * @param {() => void} onClose
 * @param {boolean} [enabled=true] - non-aktifkan ketika modal sedang loading/submit.
 */
export function useEscClose(onClose, enabled = true) {
  useEffect(() => {
    if (!enabled || typeof onClose !== 'function') return
    const handler = (e) => {
      if (e.key === 'Escape') {
        e.preventDefault()
        onClose()
      }
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [onClose, enabled])
}

/**
 * Helper untuk handler onMouseDown pada elemen backdrop modal.
 * Memastikan modal hanya tertutup ketika klik berasal dari backdrop itu sendiri
 * (bukan dari konten modal di dalamnya).
 *
 * Pakai onMouseDown (bukan onClick) supaya seleksi teks yang dimulai di dalam
 * modal lalu di-release di luar tidak ikut menutup modal.
 *
 * @param {() => void} onClose
 * @param {boolean} [enabled=true]
 */
export function backdropMouseDown(onClose, enabled = true) {
  return (e) => {
    if (!enabled || typeof onClose !== 'function') return
    if (e.target === e.currentTarget) onClose()
  }
}
