import { useEffect, useState } from "react";
import { formatRupiah } from "../../../utils/format";
import { createProduct, searchProduct } from "../../../services/productService";
import { toast } from "react-toastify";
import { validateBarcode } from "../../../utils/utils";
import { useNavigate, useSearchParams } from "react-router-dom";
import PaginationTableNoLink from "../../../components/globals/pagination";

export default function ProductPage() {
  const navigate = useNavigate()
  const searchParams = useSearchParams();
  const page = searchParams[0].get("page") || 1;
  const code = searchParams[0].get("code") || undefined;
  const barcodeParams = searchParams[0].get("barcode") || undefined;
  const [selectedItem, setSelectedItem] = useState(null);
  const [products, setProducts] = useState([]);
  const [selectedItemAction, setSelectedItemAction] = useState("");
  const [name, setName] = useState("");
  const [barcode, setBarcode] = useState("");
  const [category, setCategory] = useState("");
  const [price, setPrice] = useState("");
  const [priceListText, setPriceListText] = useState("");

  const [currentPage, setCurrentPage] = useState(parseInt(page));
  const [totalPages, setTotalPages] = useState(1);
  const [error, setError] = useState({});
  const [infoMessage, setInfoMessage] = useState(
    "Klik produk atau laporan untuk melihat demo informasi inventory.",
  );
  const [productMessage, setProductMessage] = useState("");
  const handleItemClick = (item) => {
    setSelectedItem(item);
    setSelectedItemAction("");
    setInfoMessage(
      `Demo produk: ${item.name}. Gunakan tombol restock atau retur untuk melihat simulasi.`,
    );
  };
  const handleInventoryAction = (action) => {
    setSelectedItemAction(`Aksi ${action} dijalankan pada ${selectedItem?.name ?? "produk"}.`);
    setTimeout(() => setSelectedItemAction(""), 2500);
  };

  const parsePriceOptions = (basePrice, listText) => {
    const parsedBase = Number(basePrice)
    const extras = listText
      .split(",")
      .map((value) => Number(value.trim()))
      .filter((value) => !Number.isNaN(value) && value > 0)

    if (extras.length === 0) {
      return undefined
    }

    return [
      { label: "Harga Utama", price: parsedBase },
      ...extras.map((price, index) => ({
        label: `Harga Tambahan ${index + 1}`,
        price,
      })),
    ]
  }

  const checkError = () => {
    const tempError = {};
    if (!validateBarcode(barcode)) {
      tempError.barcode =
        "Barcode harus berupa angka dengan 13 digit sesuai format EAN-13.";
    }
    setError(tempError);
    return Object.keys(tempError).length === 0;
  };

  const loadData = async () => {
    const { data, totalPages, error } = await searchProduct({
      page,
      code,
      barcode: barcodeParams,
    });
    if (error.length > 0) {
      toast.error(error);
    } else {
      // setTotalPages(totalPages);
      setProducts(data);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleCreateProduct = async () => {
    const parsedPrices = parsePriceOptions(price, priceListText)
    const { data, error } = await createProduct({
      name,
      barcode,
      price,
      category,
      prices: parsedPrices,
    })
    if (error.length > 0) {
      toast.error(error);
    } else {
      setPriceListText("")
      loadData();
    }
  };

  return (
    <>
      <section className="rounded-[40px] border border-orange-100 bg-white p-6 shadow-sm">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <p className="text-sm uppercase tracking-[0.2em] text-orange-500">
              Master Item
            </p>
            <h3 className="mt-2 text-xl font-semibold text-gray-900">
              Daftar Produk
            </h3>
          </div>
          <button
            className="rounded-full bg-orange-500 px-4 py-2 text-sm font-semibold text-white hover:bg-orange-600"
            type="button"
          >
            Tambah Item
          </button>
        </div>
        <div className="mt-6 grid gap-6 lg:grid-cols-[1fr_360px]">
          <div>
            <table className="w-full min-w-130 text-left text-sm text-gray-600 overflow-x-auto rounded-4xl border border-orange-100 bg-white">
              <thead>
                <tr className="border-b border-orange-100 text-gray-500">
                  <th className="px-4 py-3">Barcode</th>
                  <th className="px-4 py-3">Item</th>
                  <th className="px-4 py-3">Harga</th>
                  <th className="px-4 py-3">Stok</th>
                </tr>
              </thead>
              <tbody>
                {products.map((item) => (
                  <tr
                    key={item.id}
                    role="button"
                    onClick={() => handleItemClick(item)}
                    className={`border-b border-orange-50 hover:bg-orange-50/50 transition duration-150 ${
                      selectedItem?.id === item.id ? "bg-orange-50" : ""
                    } cursor-pointer`}
                  >
                    <td className="px-4 py-3">{item.barcode}</td>
                    <td className="px-4 py-3">{item.name}</td>
                    <td className="px-4 py-3">
                      {formatRupiah(item.price || item.prices?.[0]?.price)}
                      {item.prices?.length > 1 && (
                        <span className="ml-2 rounded-full bg-orange-100 px-2 py-0.5 text-[11px] font-semibold text-orange-700">
                          Multi Harga
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3">{item.stock}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            <PaginationTableNoLink
              currentPage={currentPage}
              setCurrentPage={setCurrentPage}
              totalPages={totalPages}
            />
          </div>

          <div className="space-y-4">
            <div className="rounded-[32px] border border-orange-100 bg-orange-50 p-5">
              <p className="text-sm uppercase tracking-[0.2em] text-orange-500">
                Demo Inventory
              </p>
              <p className="mt-3 text-sm text-gray-600">{infoMessage}</p>
            </div>

            <div className="rounded-[32px] border border-orange-100 bg-white p-5 shadow-sm">
              <p className="text-sm uppercase tracking-[0.2em] text-orange-500">
                Detail Produk
              </p>
              {selectedItem ? (
                <div className="mt-4 space-y-3 text-sm text-gray-700">
                  <div>
                    <p className="font-semibold text-gray-900">
                      {selectedItem.name}
                    </p>
                    <p className="text-gray-500">
                      Barcode: {selectedItem.barcode}
                    </p>
                  </div>
                  <div className="grid gap-2 sm:grid-cols-2">
                    <div className="rounded-3xl bg-orange-50 p-3">
                      <p className="text-xs uppercase tracking-[0.2em] text-orange-500">
                        Stok
                      </p>
                      <p className="mt-2 font-semibold text-gray-900">
                        {selectedItem.stock}
                      </p>
                    </div>
                    <div className="rounded-3xl bg-orange-50 p-3">
                      <p className="text-xs uppercase tracking-[0.2em] text-orange-500">
                        Harga
                      </p>
                      <p className="mt-2 font-semibold text-gray-900">
                        {formatRupiah(selectedItem.price || selectedItem.prices?.[0]?.price)}
                      </p>
                    </div>
                  </div>
                  {selectedItem.prices?.length > 1 && (
                    <div className="mt-4 rounded-3xl bg-orange-50 p-4">
                      <p className="text-xs uppercase tracking-[0.2em] text-orange-500">
                        Daftar Harga Alternatif
                      </p>
                      <ul className="mt-3 space-y-2 text-sm text-gray-700">
                        {selectedItem.prices.map((priceOption) => (
                          <li key={priceOption.label}>
                            <span className="font-semibold">{priceOption.label}:</span>{' '}
                            {formatRupiah(priceOption.price)}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                  <div className="grid gap-2 sm:grid-cols-4">
                    <button
                      type="button"
                      onClick={() => handleInventoryAction("Restock")}
                      className="rounded-full bg-orange-500 px-3 py-2 text-sm font-semibold text-white hover:bg-orange-600"
                    >
                      Restock
                    </button>
                    <button
                      type="button"
                      onClick={() => navigate(`/inventory/products/edit/${selectedItem.id}`, { state: { product: selectedItem } })}
                      className="rounded-full cursor-pointer border border-orange-200 bg-white px-3 py-2 text-sm font-semibold text-orange-700 hover:bg-orange-50"
                    >
                      Edit
                    </button>
                    <button
                      type="button"
                      className="rounded-full border border-orange-200 bg-white px-3 py-2 text-sm font-semibold text-orange-700 hover:bg-orange-50"
                    >
                      Return
                    </button>
                  </div>
                  {selectedItemAction && (
                    <p className="mt-2 text-sm text-green-700">
                      {selectedItemAction}
                    </p>
                  )}
                </div>
              ) : (
                <p className="mt-4 text-sm text-gray-500">
                  Pilih produk untuk melihat demo detail dan aksi inventory.
                </p>
              )}
            </div>

            <div className="rounded-[32px] border border-orange-100 bg-white p-5 shadow-sm">
              <p className="text-sm uppercase tracking-[0.2em] text-orange-500">
                Tambah Produk
              </p>
              <div className="mt-4 space-y-4 text-sm text-gray-700">
                <label className="block">
                  <span className="text-gray-600">Nama Produk</span>
                  <input
                    defaultValue={name}
                    onChange={(e) => {
                      setError((prev) => {
                        if (prev["nameP"]) delete prev["nameP"];
                        return { ...prev };
                      });
                      setName(e.target.value);
                    }}
                    className="mt-2 w-full rounded-xl border border-orange-200 bg-orange-50 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-orange-300"
                  />
                </label>
                <label className="block">
                  <span className="text-gray-600">Kategori</span>
                  <input
                    defaultValue={category}
                    onChange={(e) => {
                      setError((prev) => {
                        if (prev["category"]) delete prev["category"];
                        return { ...prev };
                      });
                      setCategory(e.target.value);
                    }}
                    className="mt-2 w-full rounded-xl border border-orange-200 bg-orange-50 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-orange-300"
                  />
                </label>
                <label className="block">
                  <span className="text-gray-600">Harga</span>
                  <input
                    type="number"
                    min="0"
                    defaultValue={price}
                    onChange={(e) => {
                      setError((prev) => {
                        if (prev["price"]) delete prev["price"];
                        return { ...prev };
                      });
                      setPrice(e.target.value);
                    }}
                    className="mt-2 w-full rounded-xl border border-orange-200 bg-orange-50 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-orange-300"
                  />
                </label>
                <label className="block">
                  <span className="text-gray-600">Barcode</span>
                  <input
                    defaultValue={barcode}
                    onChange={(e) => {
                      setError((prev) => {
                        if (prev["barcode"]) delete prev["barcode"];
                        return { ...prev };
                      });
                      setBarcode(e.target.value);
                    }}
                    className={`mt-2 w-full rounded-xl border  bg-orange-50 px-3 py-2 focus:outline-none focus:ring-2  ${error.barcode ? "border-red-500 focus:ring-red-300" : "focus:ring-orange-300 border-orange-200"}`}
                  />
                  {error.barcode && (
                    <p className="mt-1 text-xs text-red-500">{error.barcode}</p>
                  )}
                </label>
                <button
                  type="button"
                  onClick={() => {
                    if (checkError()) {
                      handleCreateProduct();
                    }
                  }}
                  className="w-full rounded-full bg-orange-500 px-4 py-3 text-sm font-semibold text-white hover:bg-orange-600"
                >
                  Tambah Produk Baru
                </button>
                {productMessage && (
                  <p className="text-sm text-green-700">{productMessage}</p>
                )}
              </div>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
