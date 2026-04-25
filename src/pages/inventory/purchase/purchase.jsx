import { useEffect, useState } from "react";
import { formatRupiah } from "../../../utils/format";
import { createPurchase, getVendors } from "../../../services/purchaseService";
import { getProducts } from "../../../services/productService";
import { toast } from "react-toastify";

export default function PurchasePage() {
  const [vendors, setVendors] = useState([]);
  const [products, setProducts] = useState([]);
  const [vendorId, setVendorId] = useState("");
  const [productId, setProductId] = useState("");
  const [qty, setQty] = useState(1);
  const [purchaseDate, setPurchaseDate] = useState("");
  const [error, setError] = useState({});
  const [refresh, setRefresh] = useState("");
  const loadData = async () => {
    const { data, error } = await getVendors();
    if (error.length > 0) {
      toast.error(error);
    } else {
      setVendors(data);
    }

    const { data: products, error: productError } = await getProducts();
    if (productError.length > 0) {
      toast.error(productError);
    } else {
      setProducts(products);
    }
  };

  const handleCreatePurchase = async () => {
    const { data, error } = await createPurchase({
      productId,
      vendorId,
      qty,
      purchaseDate,
    });
    if (error.length > 0) {
      toast.error(error);
    } else {
      toast.success("Purchase demo berhasil dibuat!");
      // Reset form
      setVendorId("");
      setProductId("");
      setQty(1);
      setPurchaseDate("");
      setRefresh(new Date().toISOString());
    }
  };

  const checkError = () => {
    const tempError = {};
    if (!vendorId) tempError.vendorId = "Vendor harus dipilih.";
    if (!productId) tempError.productId = "Produk harus dipilih.";
    if (qty <= 0 || Number.isNaN(qty))
      tempError.qty = "Qty harus berupa angka positif.";
    if (!purchaseDate)
      tempError.purchaseDate = "Tanggal pembelian harus diisi.";
    setError(tempError);
    return Object.keys(tempError).length === 0;
  };

  useEffect(() => {
    loadData();
  }, []);
  return (
    <section
      key={refresh}
      className="rounded-[40px] border border-orange-100 bg-white p-6 shadow-sm"
    >
      <div>
        <p className="text-sm uppercase tracking-[0.2em] text-orange-500">
          Pembelian
        </p>
        <h3 className="mt-2 text-xl font-semibold text-gray-900">
          Beli ke Vendor
        </h3>
      </div>
      <div className="mt-6 grid gap-4 lg:grid-cols-3">
        <div className="rounded-3xl border border-orange-100 bg-orange-50 p-5">
          <p className="text-xs uppercase tracking-[0.2em] text-orange-500">
            Penjualan POS
          </p>
          <p className="mt-3 text-3xl font-semibold text-gray-900">
            {/* {formatRupiah(totalSales)} */}
          </p>
          <p className="mt-2 text-sm text-gray-600">
            Total pendapatan dari demo penjualan POS.
          </p>
        </div>
        <div className="rounded-3xl border border-orange-100 bg-orange-50 p-5">
          <p className="text-xs uppercase tracking-[0.2em] text-orange-500">
            Total Purchase
          </p>
          <p className="mt-3 text-3xl font-semibold text-gray-900">
            {/* {purchaseOrders.length} */}
          </p>
          <p className="mt-2 text-sm text-gray-600">
            Order pembelian vendor yang tersedia.
          </p>
        </div>
        <div className="rounded-3xl border border-orange-100 bg-orange-50 p-5">
          <p className="text-xs uppercase tracking-[0.2em] text-orange-500">
            Stok Rendah
          </p>
          <p className="mt-3 text-3xl font-semibold text-gray-900">
            {/* {lowStockItems.length} */}
          </p>
          <p className="mt-2 text-sm text-gray-600">
            Produk yang perlu restock berdasarkan demo stok.
          </p>
        </div>
      </div>
      <div className="mt-6 rounded-[32px] border border-orange-100 bg-orange-50 p-5">
        <p className="text-sm uppercase tracking-[0.2em] text-orange-500">
          Form Demo Pembelian
        </p>
        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          <label className="block text-sm text-gray-600">
            Produk
            <select
              defaultValue={productId}
              onChange={(e) => {
                setError((prev) => {
                  if (prev[`productId`]) delete prev[`productId`];
                  return { ...prev };
                });
                setProductId(e.target.value);
              }}
              className={`mt-2 w-full rounded-xl border ${error[`productId`] ? "border-red-500 focus:ring-red-300" : "focus:ring-orange-300 border-orange-200"} bg-orange-50 px-3 py-2 focus:outline-none focus:ring-2`}
            >
              <option value="">Pilih Produk</option>
              {products.map((product) => (
                <option key={product.id} value={product.id}>
                  {product.name}
                </option>
              ))}
            </select>
            {error[`productId`] && (
              <p className="mt-1 text-xs text-red-500">{error[`productId`]}</p>
            )}
          </label>
          <label className="block text-sm text-gray-600">
            Vendor
            <select
              onChange={(e) => {
                setError((prev) => {
                  if (prev[`vendorId`]) delete prev[`vendorId`];
                  return { ...prev };
                });
                setVendorId(e.target.value);
              }}
              className={`mt-2 w-full rounded-xl border ${error[`vendorId`] ? "border-red-500 focus:ring-red-300" : "focus:ring-orange-300 border-orange-200"} bg-orange-50 px-3 py-2 focus:outline-none focus:ring-2`}
            >
              <option value="">Pilih Vendor</option>
              {vendors.map((vendor) => (
                <option key={vendor.id} value={vendor.id}>
                  {vendor.name}
                </option>
              ))}
            </select>
            {error[`vendorId`] && (
              <p className="mt-1 text-xs text-red-500">{error[`vendorId`]}</p>
            )}
          </label>
          <label className="block text-sm text-gray-600">
            Qty
            <input
              type="number"
              min="1"
              value={qty}
              onChange={(e) => {
                setError((prev) => {
                  if (prev[`qty`]) delete prev[`qty`];
                  return { ...prev };
                });
                setQty(Number(e.target.value));
              }}
              className={`mt-2 w-full rounded-xl border ${error[`qty`] ? "border-red-500 focus:ring-red-300" : "focus:ring-orange-300 border-orange-200"} bg-orange-50 px-3 py-2 focus:outline-none focus:ring-2`}
            />
            {error[`qty`] && (
              <p className="mt-1 text-xs text-red-500">{error[`qty`]}</p>
            )}
          </label>

          <label className="block text-sm text-gray-600">
            Tanggal
            <input
              type="datetime-local"
              value={purchaseDate}
              onChange={(e) => {
                setError((prev) => {
                  if (prev[`purchaseDate`]) delete prev[`purchaseDate`];
                  return { ...prev };
                });
                setPurchaseDate(e.target.value);
              }}
              className={`mt-2 w-full rounded-xl border ${error[`purchaseDate`] ? "border-red-500 focus:ring-red-300" : "focus:ring-orange-300 border-orange-200"} bg-orange-50 px-3 py-2 text-sm focus:outline-none focus:ring-2`}
            />
            {error[`purchaseDate`] && (
              <p className="mt-1 text-xs text-red-500">
                {error[`purchaseDate`]}
              </p>
            )}
          </label>
        </div>
        <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center">
          <button
            type="button"
            onClick={() => {
              if (checkError()) {
                handleCreatePurchase();
              }
            }}
            className="rounded-full bg-orange-500 px-4 py-3 text-sm font-semibold text-white hover:bg-orange-600"
          >
            Buat Pembelian
          </button>
        </div>
      </div>
      <div className="mt-6 space-y-4">
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
                    {formatRupiah(item.prices?.[0]?.price)}
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
          {/* <PaginationTableNoLink
            currentPage={currentPage}
            setCurrentPage={setCurrentPage}
            totalPages={totalPages}
          /> */}
        </div>
        {/* {purchaseOrders.map((order) => (
          <div
            key={order.id}
            className="rounded-3xl border border-orange-100 bg-orange-50 p-5"
          >
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="text-sm text-gray-500">Vendor</p>
                <p className="mt-1 font-semibold text-gray-900">
                  {order.vendor}
                </p>
                <p className="mt-2 text-xs text-gray-500">
                  Produk: {order.product}
                </p>
              </div>
              <div className="text-right">
                <p className="text-sm text-gray-500">Total</p>
                <p className="mt-1 font-semibold text-gray-900">
                  {formatRupiah(order.total)}
                </p>
              </div>
            </div>
            <p className="mt-3 text-sm text-gray-600">
              Status: <span className="font-semibold">{order.status}</span>
            </p>
            <div className="mt-4 flex flex-wrap gap-2">
              {order.status === "Proses" && (
                <>
                  <button
                    type="button"
                    onClick={() =>
                      handleUpdatePurchaseStatus(order.id, "Diterima")
                    }
                    className="rounded-full bg-green-500 px-3 py-2 text-sm font-semibold text-white hover:bg-green-600"
                  >
                    Diterima
                  </button>
                  <button
                    type="button"
                    onClick={() =>
                      handleUpdatePurchaseStatus(order.id, "Dibatalkan")
                    }
                    className="rounded-full border border-red-500 bg-white px-3 py-2 text-sm font-semibold text-red-600 hover:bg-red-50"
                  >
                    Batalkan
                  </button>
                </>
              )}
              {order.status === "Diterima" && (
                <button
                  type="button"
                  onClick={() =>
                    handleUpdatePurchaseStatus(order.id, "Dibatalkan")
                  }
                  className="rounded-full border border-red-500 bg-white px-3 py-2 text-sm font-semibold text-red-600 hover:bg-red-50"
                >
                  Batalkan
                </button>
              )}
            </div>
          </div>
        ))} */}
      </div>
    </section>
  );
}
