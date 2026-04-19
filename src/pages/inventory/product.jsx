import { useEffect, useState } from "react";
import { formatRupiah } from "../../utils/format";
import { createProduct, searchProduct } from "../../services/productService";
import { toast } from "react-toastify";
import { validateBarcode } from "../../utils/utils";
import { useSearchParams } from "react-router-dom";
import PaginationTableNoLink from "../../components/globals/pagination";

const DEMO_PRODUCTS = [
  {
    id: 1,
    sku: "SHF-001",
    barcode: "899256633154667",
    name: "Indomie Goreng",
    category: "Mie Instan",
    stock: 200,
    price: 3500,
  },
  {
    id: 2,
    sku: "SHF-002",
    barcode: "899256633154668",
    name: "Aqua 600ml",
    category: "Minuman",
    stock: 300,
    price: 4000,
  },
  {
    id: 3,
    sku: "SHF-003",
    barcode: "899256633154669",
    name: "Teh Botol Sosro",
    category: "Minuman",
    stock: 150,
    price: 5500,
  },
  {
    id: 4,
    sku: "SHF-004",
    barcode: "899256633154670",
    name: "Beras 5kg",
    category: "Sembako",
    stock: 50,
    price: 75000,
  },
  {
    id: 5,
    sku: "SHF-005",
    barcode: "899256633154671",
    name: "Pocari Sweat 500ml",
    category: "Minuman",
    stock: 120,
    price: 8500,
  },
  {
    id: 6,
    sku: "SHF-006",
    barcode: "899256633154672",
    name: "Sprite 390ml",
    category: "Minuman",
    stock: 100,
    price: 7000,
  },
];

export default function ProductPage() {
  const searchParams = useSearchParams();
  const page = searchParams[0].get("page") || 1;
  const code = searchParams[0].get("code") || undefined;
  const barcode = searchParams[0].get("barcode") || undefined;
  const [selectedItem, setSelectedItem] = useState(null);
  const [products, setProducts] = useState([]);
  const [selectedItemAction, setSelectedItemAction] = useState("");

  const [currentPage, setCurrentPage] = useState(parseInt(page));
  const [totalPages, setTotalPages] = useState(1);
  const [error, setError] = useState({});
  const [infoMessage, setInfoMessage] = useState(
    "Klik produk atau laporan untuk melihat demo informasi inventory.",
  );
  const [newProduct, setNewProduct] = useState({
    barcode: "",
    name: "",
    category: "Sembako",
    price: 0,
  });
  const [productMessage, setProductMessage] = useState("");
  const handleItemClick = (item) => {
    setSelectedItem(item);
    setSelectedItemAction("");
    setInfoMessage(
      `Demo produk: ${item.name}. Gunakan tombol restock atau retur untuk melihat simulasi.`,
    );
  };

  const checkError = () => {
    const tempError = {};
    if (!validateBarcode(newProduct.barcode)) {
      tempError.barcode =
        "Barcode harus berupa angka dengan 13 digit sesuai format EAN-13.";
    }
    setError(tempError);
    return Object.keys(tempError).length === 0;
  };

  const loadData = async () => {
    console.log("Loading data with params:", { page, code, barcode });
    const { data, totalPages, error } = await searchProduct({
      page,
      code,
      barcode,
    });
    if (error.length > 0) {
      toast.error(error);
    } else {
      setTotalPages(totalPages);
      setProducts(data);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleCreateProduct = async () => {
    const { data, error } = await createProduct(newProduct);
    if (error.length > 0) {
      toast.error(error);
    } else {
      loadData();
    }
  };

  return (
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
        <div className="overflow-x-auto rounded-[32px] border border-orange-100 bg-white">
          <table className="w-full min-w-[520px] text-left text-sm text-gray-600">
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
                  <td className="px-4 py-3">{formatRupiah(item.price)}</td>
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
                      {formatRupiah(selectedItem.price)}
                    </p>
                  </div>
                </div>
                <div className="grid gap-2 sm:grid-cols-3">
                  <button
                    type="button"
                    onClick={() => handleInventoryAction("Restock")}
                    className="rounded-full bg-orange-500 px-3 py-2 text-sm font-semibold text-white hover:bg-orange-600"
                  >
                    Restock
                  </button>
                  <button
                    type="button"
                    onClick={() => handleInventoryAction("Retur")}
                    className="rounded-full border border-orange-200 bg-white px-3 py-2 text-sm font-semibold text-orange-700 hover:bg-orange-50"
                  >
                    Retur
                  </button>
                  <button
                    type="button"
                    onClick={() => handleInventoryAction("Audit")}
                    className="rounded-full border border-orange-200 bg-white px-3 py-2 text-sm font-semibold text-orange-700 hover:bg-orange-50"
                  >
                    Audit
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
                  defaultValue={newProduct.name}
                  onChange={(e) =>
                    setNewProduct({
                      ...newProduct,
                      name: e.target.value,
                    })
                  }
                  className="mt-2 w-full rounded-xl border border-orange-200 bg-orange-50 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-orange-300"
                />
              </label>
              <label className="block">
                <span className="text-gray-600">Kategori</span>
                <input
                  defaultValue={newProduct.category}
                  onChange={(e) =>
                    setNewProduct({
                      ...newProduct,
                      category: e.target.value,
                    })
                  }
                  className="mt-2 w-full rounded-xl border border-orange-200 bg-orange-50 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-orange-300"
                />
              </label>
              <label className="block">
                <span className="text-gray-600">Harga</span>
                <input
                  type="number"
                  min="0"
                  defaultValue={newProduct.price}
                  onChange={(e) =>
                    setNewProduct({
                      ...newProduct,
                      price: e.target.value,
                    })
                  }
                  className="mt-2 w-full rounded-xl border border-orange-200 bg-orange-50 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-orange-300"
                />
              </label>
              <label className="block">
                <span className="text-gray-600">Barcode</span>
                <input
                  defaultValue={newProduct.barcode}
                  onChange={(e) => {
                    setError((prev) => {
                      if (prev["barcode"]) delete prev["barcode"];
                      return { ...prev };
                    });
                    setNewProduct({
                      ...newProduct,
                      barcode: e.target.value,
                    });
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
  );
}
