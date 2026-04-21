import { useEffect, useState } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import { productService } from "../../../services/productService";
import { toast } from "react-toastify";
import { validateBarcode } from "../../../utils/utils";

export default function EditProductPage() {
  const { id } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const product = location.state?.product;

  const [form, setForm] = useState({
    name: "",
    barcode: "",
    category: "",
    price: "",
    pricesText: "",
  });
  const [error, setError] = useState({});

  useEffect(() => {
    if (!product) return;
    setForm({
      name: product.name || "",
      barcode: product.barcode || "",
      category: product.category || "",
      price: product.price || product.prices?.[0]?.price || "",
      pricesText: product.prices?.slice(1).map((item) => item.price).join(", ") || "",
    });
  }, [product]);

  const parsePriceOptions = (basePrice, listText) => {
    const parsedBase = Number(basePrice);
    const extras = listText
      .split(",")
      .map((value) => Number(value.trim()))
      .filter((value) => !Number.isNaN(value) && value > 0);

    if (extras.length === 0) return undefined;
    return [
      { label: "Harga Utama", price: Number(parsedBase) },
      ...extras.map((price, index) => ({
        label: `Harga Tambahan ${index + 1}`,
        price,
      })),
    ];
  };

  const checkError = () => {
    const tempError = {};
    if (!form.name.trim()) tempError.name = "Nama produk harus diisi.";
    if (!validateBarcode(form.barcode)) tempError.barcode = "Barcode harus berupa angka dengan 13 digit sesuai format EAN-13.";
    if (!form.price || Number(form.price) <= 0) tempError.price = "Harga harus lebih besar dari 0.";
    setError(tempError);
    return Object.keys(tempError).length === 0;
  };

  const handleSave = async () => {
    if (!checkError()) return;
    const prices = parsePriceOptions(form.price, form.pricesText);

    try {
      await productService.update(id, {
        name: form.name,
        barcode: form.barcode,
        category: form.category,
        price: Number(form.price),
        ...(prices ? { prices } : {}),
      });
      toast.success("Data produk berhasil diperbarui.");
      navigate("/inventory/products");
    } catch (err) {
      toast.error("Gagal menyimpan perubahan produk.");
    }
  };

  if (!product) {
    return (
      <div className="mx-auto max-w-4xl p-6 text-gray-700">
        <h2 className="text-xl font-semibold text-gray-900">Produk tidak ditemukan</h2>
        <p className="mt-2 text-sm text-gray-600">Silakan pilih produk dari daftar terlebih dahulu.</p>
        <button
          type="button"
          onClick={() => navigate("/inventory/products")}
          className="mt-4 rounded-full bg-orange-500 px-4 py-2 text-sm font-semibold text-white hover:bg-orange-600"
        >
          Kembali ke Daftar Produk
        </button>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-4xl p-6">
      <div className="rounded-[32px] border border-orange-100 bg-white p-6 shadow-sm">
        <div className="mb-6 flex items-center justify-between">
          <div>
            <p className="text-sm uppercase tracking-[0.2em] text-orange-500">Edit Produk</p>
            <h2 className="mt-2 text-2xl font-semibold text-gray-900">{product.name}</h2>
          </div>
          <button
            type="button"
            onClick={() => navigate("/inventory/products")}
            className="rounded-full border border-orange-200 bg-white px-4 py-2 text-sm font-semibold text-orange-700 hover:bg-orange-50"
          >
            Kembali
          </button>
        </div>

        <div className="space-y-6">
          <label className="block">
            <span className="text-sm font-semibold text-gray-700">Nama Produk</span>
            <input
              value={form.name}
              onChange={(e) => setForm((prev) => ({ ...prev, name: e.target.value }))}
              className="mt-2 w-full rounded-3xl border border-orange-200 bg-orange-50 px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-orange-300"
            />
            {error.name && <p className="mt-2 text-xs text-red-500">{error.name}</p>}
          </label>

          <label className="block">
            <span className="text-sm font-semibold text-gray-700">Barcode</span>
            <input
              value={form.barcode}
              onChange={(e) => setForm((prev) => ({ ...prev, barcode: e.target.value }))}
              className="mt-2 w-full rounded-3xl border border-orange-200 bg-orange-50 px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-orange-300"
            />
            {error.barcode && <p className="mt-2 text-xs text-red-500">{error.barcode}</p>}
          </label>

          <label className="block">
            <span className="text-sm font-semibold text-gray-700">Kategori</span>
            <input
              value={form.category}
              onChange={(e) => setForm((prev) => ({ ...prev, category: e.target.value }))}
              className="mt-2 w-full rounded-3xl border border-orange-200 bg-orange-50 px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-orange-300"
            />
          </label>

          <label className="block">
            <span className="text-sm font-semibold text-gray-700">Harga Utama</span>
            <input
              type="number"
              min="0"
              value={form.price}
              onChange={(e) => setForm((prev) => ({ ...prev, price: e.target.value }))}
              className="mt-2 w-full rounded-3xl border border-orange-200 bg-orange-50 px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-orange-300"
            />
            {error.price && <p className="mt-2 text-xs text-red-500">{error.price}</p>}
          </label>

          <label className="block">
            <span className="text-sm font-semibold text-gray-700">Harga Tambahan (pisahkan koma)</span>
            <input
              type="text"
              value={form.pricesText}
              onChange={(e) => setForm((prev) => ({ ...prev, pricesText: e.target.value }))}
              placeholder="e.g. 3200, 3000"
              className="mt-2 w-full rounded-3xl border border-orange-200 bg-orange-50 px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-orange-300"
            />
            <p className="mt-2 text-sm text-gray-500">
              Masukkan harga alternatif jika produk ini punya lebih dari satu harga.
            </p>
          </label>

          <div className="flex flex-col gap-3 sm:flex-row sm:justify-end">
            <button
              type="button"
              onClick={() => navigate("/inventory/products")}
              className="rounded-full border border-orange-200 bg-white px-5 py-3 text-sm font-semibold text-orange-700 hover:bg-orange-50"
            >
              Batal
            </button>
            <button
              type="button"
              onClick={handleSave}
              className="rounded-full bg-orange-500 px-5 py-3 text-sm font-semibold text-white hover:bg-orange-600"
            >
              Simpan Perubahan
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
