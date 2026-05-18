import { useEffect, useRef, useState } from 'react'

/**
 * Custom searchable dropdown for selecting a product.
 * Replaces the separate <select> + search <input> combo.
 *
 * Props:
 *   products  - full product array [{ id, name, barcode, ... }]
 *   value     - currently selected product id (string)
 *   onChange  - (productId: string) => void
 *   error     - error message string (or falsy)
 */
export default function ProductSearchSelect({ products = [], value, onChange, error }) {
  const [inputText, setInputText] = useState('')
  const [open, setOpen] = useState(false)
  const containerRef = useRef(null)

  // Sync display text whenever the external value or products list changes
  useEffect(() => {
    if (!value) {
      setInputText('')
      return
    }
    const found = products.find((p) => p.id === value)
    if (found) setInputText(found.name)
  }, [value, products])

  const filtered = products.filter((p) =>
    p.name.toLowerCase().includes(inputText.toLowerCase()) ||
    (p.barcode || '').toLowerCase().includes(inputText.toLowerCase())
  )

  const handleSelect = (product) => {
    onChange(product.id)
    setInputText(product.name)
    setOpen(false)
  }

  const handleInputChange = (e) => {
    setInputText(e.target.value)
    setOpen(true)
    // If user clears the text, clear selection too
    if (!e.target.value.trim()) onChange('')
  }

  const handleBlur = () => {
    // Delay so mousedown on an option fires first
    setTimeout(() => {
      if (!containerRef.current?.contains(document.activeElement)) {
        setOpen(false)
        // Restore display text to selected product name (or clear)
        if (value) {
          const found = products.find((p) => p.id === value)
          setInputText(found ? found.name : '')
        } else {
          setInputText('')
        }
      }
    }, 150)
  }

  return (
    <div ref={containerRef} className="relative">
      <input
        type="text"
        value={inputText}
        onChange={handleInputChange}
        onFocus={() => setOpen(true)}
        onBlur={handleBlur}
        placeholder="Cari nama atau barcode produk..."
        className={`mt-2 w-full rounded-xl border ${
          error
            ? 'border-red-500 focus:ring-red-300'
            : 'border-orange-200 focus:ring-orange-300'
        } bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2`}
      />
      {open && (
        <div className="absolute z-20 mt-1 max-h-52 w-full overflow-y-auto rounded-xl border border-orange-200 bg-white shadow-lg">
          {filtered.length === 0 ? (
            <div className="px-3 py-2.5 text-sm text-gray-400">
              Produk tidak ditemukan.
            </div>
          ) : (
            filtered.map((p) => (
              <button
                key={p.id}
                type="button"
                onMouseDown={() => handleSelect(p)}
                className={`flex w-full items-center gap-2 px-3 py-2 text-left text-sm transition hover:bg-orange-50 ${
                  value === p.id
                    ? 'bg-orange-50 font-semibold text-orange-700'
                    : 'text-gray-700'
                }`}
              >
                {p.barcode && (
                  <span className="shrink-0 font-mono text-[11px] text-gray-400">
                    {p.barcode}
                  </span>
                )}
                <span className="truncate">{p.name}</span>
              </button>
            ))
          )}
        </div>
      )}
    </div>
  )
}
