import { useEffect, useState } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import {
  productService,
  updateProduct,
} from "../../../services/productService";
import { toast } from "react-toastify";
import { validateBarcode } from "../../../utils/utils";

export default function EditProductPage() {
  const { id } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const product = location.state?.product;

  const [name, setName] = useState("");
  const [category, setCategory] = useState("");
  const [prices, setPrices] = useState([]);
  const [barcode, setBarcode] = useState("");
  // const [form, setForm] = useState({
  //   name: "",
  //   barcode: "",
  //   category: "",
  //   price: "",
  //   pricesText: "",
  // });
  const [error, setError] = useState({});

  useEffect(() => {
    if (!product) return;
    setName(product.name || "");
    setCategory(product.category || "");
    setBarcode(product.barcode || "");
    const mainPrice = product.price || 0;
    const additionalPrices = product.prices || [];
    setPrices(
      product.prices.map((price) => ({
        name: price.name,
        price: price.price,
      })) || [],
    );
  }, [product]);

  const checkError = () => {
    const tempError = {};
    if (!name.trim()) tempError.name = "Nama produk harus diisi.";
    if (!category.trim()) tempError.category = "Kategori produk harus diisi.";
    if (!validateBarcode(barcode))
      tempError.barcode =
        "Barcode harus berupa angka dengan 13 digit sesuai format EAN-13.";
    if (prices.length <= 0)
      tempError.prices = "Setidaknya harus ada satu harga.";
    prices.forEach((priceOption, index) => {
      if (!priceOption.name) {
        tempError[`price.${index}.name`] = "Nama harga tidak boleh kosong.";
      }
      if (priceOption.price <= 0 || Number.isNaN(priceOption.price)) {
        tempError[`price.${index}.price`] = "Harga harus berupa angka positif.";
      }
    });
    setError(tempError);
    return Object.keys(tempError).length === 0;
  };

  const handleSave = async () => {
    if (!checkError()) return;

      const {data, error} = await updateProduct({
        id: id,
        name,
        barcode,
        category,
        ...(prices ? { prices } : {}),
      });
      if (error.length > 0) {
        console.log(error)
        toast.error(error);
        return;
      }
      toast.success("Data produk berhasil diperbarui.");
      navigate("/inventory/products");
  };

  useEffect(() => {
    console.log(prices);
  }, [prices]);

  if (!product) {
    return (
      <div className="mx-auto max-w-4xl p-6 text-gray-700">
        <h2 className="text-xl font-semibold text-gray-900">
          Produk tidak ditemukan
        </h2>
        <p className="mt-2 text-sm text-gray-600">
          Silakan pilih produk dari daftar terlebih dahulu.
        </p>
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
            <p className="text-sm uppercase tracking-[0.2em] text-orange-500">
              Edit Produk
            </p>
            <h2 className="mt-2 text-2xl font-semibold text-gray-900">
              {product.name}
            </h2>
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
            <span className="text-sm font-semibold text-gray-700">
              Nama Produk
            </span>
            <input
              defaultValue={name}
              onChange={(e) => setName(e.target.value)}
              className="mt-2 w-full rounded-3xl border border-orange-200 bg-orange-50 px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-orange-300"
            />
            {error.name && (
              <p className="mt-2 text-xs text-red-500">{error.name}</p>
            )}
          </label>

          <label className="block">
            <span className="text-sm font-semibold text-gray-700">Barcode</span>
            <input
              defaultValue={barcode}
              onChange={(e) => setBarcode(e.target.value)}
              className="mt-2 w-full rounded-3xl border border-orange-200 bg-orange-50 px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-orange-300"
            />
            {error.barcode && (
              <p className="mt-2 text-xs text-red-500">{error.barcode}</p>
            )}
          </label>

          <label className="block">
            <span className="text-sm font-semibold text-gray-700">
              Kategori
            </span>
            <input
              defaultValue={category}
              onChange={(e) => setCategory(e.target.value)}
              className="mt-2 w-full rounded-3xl border border-orange-200 bg-orange-50 px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-orange-300"
            />
            {error.category && (
              <p className="mt-2 text-xs text-red-500">{error.category}</p>
            )}
          </label>
          <div className="flex justify-end">
            <button
              className="rounded-full cursor-pointer border border-orange-500 px-4 py-2 text-sm font-semibold text-orange-500 hover:text-white hover:bg-orange-600"
              type="button"
              onClick={() => {
                if (prices.length >= 5) return;
                setPrices((prev) => [...prices, { name: "", price: 0 }]);
              }}
            >
              Tambah Harga
            </button>
          </div>
          {error.prices && (
            <p className="mt-2 text-xs text-red-500">{error.prices}</p>
          )}
          <div key={prices}>
            {prices.map((price, index) => (
              <div
                key={index}
                className="grid-cols-1 grid sm:grid-cols-2 gap-4"
              >
                <label className="block">
                  <span className="text-gray-600">Nama Harga</span>
                  <input
                    type="text"
                    defaultValue={price.name}
                    onChange={(e) => {
                      setError((prev) => {
                        if (prev[`price.${index}.name`])
                          delete prev[`price.${index}.name`];
                        return { ...prev };
                      });
                      setPrices((prev) => {
                        const newPrices = [...prev];
                        newPrices[index].name = e.target.value;
                        return newPrices;
                      });
                    }}
                    className={`mt-2 w-full rounded-xl border ${error[`price.${index}.name`] ? "border-red-500 focus:ring-red-300" : "focus:ring-orange-300 border-orange-200"} bg-orange-50 px-3 py-2 focus:outline-none focus:ring-2`}
                  />
                  {error[`price.${index}.name`] && (
                    <p className="mt-1 text-xs text-red-500">
                      {error[`price.${index}.name`]}
                    </p>
                  )}
                </label>
                <label className="block">
                  <span className="text-gray-600">Harga</span>
                  <input
                    type="number"
                    min="0"
                    defaultValue={price.price}
                    onChange={(e) => {
                      setError((prev) => {
                        if (prev[`price.${index}.price`])
                          delete prev[`price.${index}.price`];
                        return { ...prev };
                      });
                      setPrices((prev) => {
                        const newPrices = [...prev];
                        newPrices[index].price = Number(e.target.value);
                        return newPrices;
                      });
                    }}
                    className={`mt-2 w-full rounded-xl border ${error[`price.${index}.price`] ? "border-red-500 focus:ring-red-300" : "focus:ring-orange-300 border-orange-200"} bg-orange-50 px-3 py-2 focus:outline-none focus:ring-2`}
                  />
                  {error[`price.${index}.price`] && (
                    <p className="mt-1 text-xs text-red-500">
                      {error[`price.${index}.price`]}
                    </p>
                  )}
                </label>
                <div className="flex items-center">
                  <button
                    type="button"
                    onClick={() => {
                      setPrices((prev) => prices.filter((_, i) => i !== index));
                    }}
                    className="mt-4 rounded-full border border-red-500 px-4 py-2 text-sm font-semibold text-red-500 hover:text-white hover:bg-red-600"
                  >
                    Hapus Harga
                  </button>
                </div>
              </div>
            ))}
          </div>

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
