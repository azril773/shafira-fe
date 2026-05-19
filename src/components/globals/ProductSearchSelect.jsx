import { useEffect, useRef, useState } from 'react'

/**
 * Custom searchable dropdown for selecting a product.
 *
 * Props:
 *   products    - full product array (sync mode)
 *   value       - currently selected product id
 *   valueName   - display name for the selected value (async mode)
 *   onChange    - (productId: string, product?) => void
 *   onSearch    - async (q: string) => Product[]  (enables async/server-side mode)
 *   error       - error message string (or falsy)
 */
export default function ProductSearchSelect({ products = [], value, valueName, onChange, onSearch, error }) {
  const [inputText, setInputText] = useState('')
  const [open, setOpen] = useState(false)
  const [asyncResults, setAsyncResults] = useState([])
  const [searching, setSearching] = useState(false)
  const containerRef = useRef(null)
  const inputRef = useRef(null)
  const debounceRef = useRef(null)

  // Sync display text only when value/valueName changes externally
  // NOTE: 'products' intentionally excluded from deps — its default [] creates
  // a new reference every parent render, which would reset inputText while typing.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => {
    if (!value) {
      setInputText('')
      return
    }
    if (onSearch) {
      if (valueName) setInputText(valueName)
    } else {
      const found = products.find((p) => p.id === value)
      if (found) setInputText(found.name)
    }
  }, [value, valueName])

  // Sync mode: filter locally
  const filtered = !onSearch && inputText.trim()
    ? products.filter((p) =>
        p.name.toLowerCase().includes(inputText.toLowerCase()) ||
        (p.barcode || '').toLowerCase().includes(inputText.toLowerCase())
      )
    : []

  const displayItems = onSearch ? asyncResults : filtered

  const handleSelect = (product) => {
    onChange(product.id, product)
    setInputText(product.name)
    setOpen(false)
    if (onSearch) setAsyncResults([])
  }

  const handleInputChange = (e) => {
    const text = e.target.value
    setInputText(text)
    setOpen(true)
    if (!text.trim()) {
      onChange('', null)
      if (onSearch) {
        clearTimeout(debounceRef.current)
        setAsyncResults([])
        setSearching(false)
      }
      return
    }
    if (onSearch) {
      clearTimeout(debounceRef.current)
      setSearching(true)
      debounceRef.current = setTimeout(async () => {
        try {
          const results = await onSearch(text)
          setAsyncResults(results || [])
        } catch {
          setAsyncResults([])
        } finally {
          setSearching(false)
        }
      }, 350)
    }
  }

  const handleBlur = () => {
    setTimeout(() => {
      if (!containerRef.current?.contains(document.activeElement)) {
        setOpen(false)
        if (onSearch) {
          setInputText(value ? (valueName || inputText) : '')
          setAsyncResults([])
        } else {
          if (value) {
            const found = products.find((p) => p.id === value)
            setInputText(found ? found.name : '')
          } else {
            setInputText('')
          }
        }
      }
    }, 150)
  }

  return (
    <div ref={containerRef} className="relative">
      <input
        ref={inputRef}
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
      {open && inputText.trim() && (() => {
        const rect = inputRef.current?.getBoundingClientRect()
        const style = rect ? {
          position: 'fixed',
          top: rect.bottom + 4,
          left: rect.left,
          width: rect.width,
          zIndex: 9999,
        } : {}
        return (
        <div style={style} className="max-h-52 overflow-y-auto rounded-xl border border-orange-200 bg-white shadow-lg">
          {searching ? (
            <div className="px-3 py-2.5 text-sm text-gray-400">Mencari...</div>
          ) : displayItems.length === 0 ? (
            <div className="px-3 py-2.5 text-sm text-gray-400">
              Produk tidak ditemukan.
            </div>
          ) : (
            displayItems.map((p) => (
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
        )
      })()}
    </div>
  )
}
