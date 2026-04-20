import { createElement, useState } from "react";
import { useAuthStore } from "../../store/authStore";
import logoSecondary from "../../assets/logo-shafira2.png";
import {
  Box,
  Truck,
  FileChartPie,
  ArrowRight,
  XCircle,
  Slash,
  RotateCcw,
  UserCircle,
} from "lucide-react";
import { toast } from "react-toastify";
// Backend inventory API belum siap, demo data digunakan sementara
// import { productService } from '../../services/productService'
// import { purchaseService } from '../../services/purchaseService'
// import { transactionService } from '../../services/transactionService'
import { exportToExcel, exportToPdf } from "../../utils/export";
import { formatRupiah } from "../../utils/format";
import { createProduct } from "../../services/productService";
import { notification } from "../../utils/toast.jsx";
import { validateBarcode } from "../../utils/utils.js";
import ProductPage from "./products/product.jsx";
import { Outlet, useLocation, useNavigate } from "react-router-dom";

const topNavItems = [
  { id: "products", label: "Product", href: "/inventory/products" },
  { id: "purchases", label: "Pembelian", href: "/inventory/purchases" },
  { id: "reports", label: "Report", href: "/inventory/reports" },
];

const reportItems = [
  { id: "sales", label: "Penjualan", icon: Box },
  { id: "purchase", label: "Pembelian", icon: Truck },
  { id: "stock", label: "Stok", icon: FileChartPie },
  { id: "return", label: "Retur", icon: ArrowRight },
];

const returnActions = [
  {
    id: "abort",
    label: "Abort",
    icon: XCircle,
    description: "Batalkan proses retur",
  },
  {
    id: "void",
    label: "Void",
    icon: Slash,
    description: "Batalkan transaksi retur",
  },
  {
    id: "retur",
    label: "Retur Barang",
    icon: RotateCcw,
    description: "Kembalikan barang ke vendor",
  },
];

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

const DEMO_PURCHASE_ORDERS = [
  {
    id: "PO-001",
    vendor: "CV. Mitra Utama",
    date: "2026-04-08T08:00:00",
    total: 720000,
    status: "Diterima",
    product: "Beras 5kg",
    qty: 10,
  },
  {
    id: "PO-002",
    vendor: "UD. Sumber Makmur",
    date: "2026-04-09T09:20:00",
    total: 540000,
    status: "Proses",
    product: "Minyak Goreng 2L",
    qty: 12,
  },
  {
    id: "PO-003",
    vendor: "PT. Graha Logistik",
    date: "2026-04-10T10:18:00",
    total: 910000,
    status: "Dibatalkan",
    product: "Gula 1kg",
    qty: 25,
  },
];

const DEMO_TRANSACTIONS = [
  {
    id: "TRX-001",
    date: "2026-04-08T08:12:00",
    items: 5,
    total: 42500,
    method: "Tunai",
    status: "Selesai",
    details: [
      { id: 1, name: "Indomie Goreng", qty: 2, price: 3500 },
      { id: 2, name: "Aqua 600ml", qty: 1, price: 4000 },
      { id: 9, name: "Beng-Beng", qty: 2, price: 3000 },
    ],
  },
  {
    id: "TRX-002",
    date: "2026-04-08T08:47:00",
    items: 3,
    total: 97000,
    method: "QRIS",
    status: "Selesai",
    details: [
      { id: 4, name: "Beras 5kg", qty: 1, price: 75000 },
      { id: 5, name: "Pocari Sweat 600ml", qty: 1, price: 8500 },
      { id: 6, name: "Sprite 390ml", qty: 1, price: 7000 },
    ],
  },
  {
    id: "TRX-003",
    date: "2026-04-08T12:45:00",
    items: 1,
    total: 3500,
    method: "Tunai",
    status: "Void",
    details: [{ id: 1, name: "Indomie Goreng", qty: 1, price: 3500 }],
  },
  {
    id: "TRX-004",
    date: "2026-04-08T14:19:00",
    items: 3,
    total: 80000,
    method: "Tunai",
    status: "Abort",
    details: [
      { id: 2, name: "Aqua 600ml", qty: 2, price: 4000 },
      { id: 14, name: "Shampoo Pantene 90ml", qty: 1, price: 12000 },
    ],
  },
];

const DEMO_VENDORS = [
  "CV. Mitra Utama",
  "UD. Sumber Makmur",
  "PT. Graha Logistik",
];

export default function InventoryPage() {
  const navigate = useNavigate();
  const location = useLocation()
  const [activeReport, setActiveReport] = useState("sales");
  const [selectedItem, setSelectedItem] = useState(null);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const { logout, user } = useAuthStore();
  const [selectedItemAction, setSelectedItemAction] = useState("");
  const [activeReturnAction, setActiveReturnAction] = useState("");
  const [infoMessage, setInfoMessage] = useState(
    "Klik produk atau laporan untuk melihat demo informasi inventory.",
  );
  const [error, setError] = useState({});
  const [products, setProducts] = useState(DEMO_PRODUCTS);
  const [purchaseOrders, setPurchaseOrders] = useState(DEMO_PURCHASE_ORDERS);
  const [transactions, setTransactions] = useState(DEMO_TRANSACTIONS);
  const [newPurchase, setNewPurchase] = useState({
    productId: DEMO_PRODUCTS[0].id,
    vendor: DEMO_VENDORS[0],
    qty: 1,
    purchaseDate: new Date().toISOString().slice(0, 16),
  });
  const [purchaseMessage, setPurchaseMessage] = useState("");
  const [newProduct, setNewProduct] = useState({
    barcode: "",
    name: "",
    category: "Sembako",
    price: 0,
  });
  const [productMessage, setProductMessage] = useState("");

  const salesTransactions = transactions.filter(
    (trx) => trx.status === "Selesai",
  );
  const returnTransactions = transactions.filter(
    (trx) => trx.status === "Retur",
  );
  const totalSales = salesTransactions.reduce((sum, trx) => sum + trx.total, 0);
  const totalPurchase = purchaseOrders.reduce(
    (sum, order) => sum + order.total,
    0,
  );
  const lowStockItems = products.filter((product) => product.stock <= 60);
  const bestSeller = salesTransactions
    .flatMap((trx) => trx.details)
    .reduce((acc, item) => {
      acc[item.name] = (acc[item.name] || 0) + item.qty;
      return acc;
    }, {});

  const topSeller =
    Object.entries(bestSeller).sort((a, b) => b[1] - a[1])[0]?.[0] ??
    "Belum ada data";
  const today = new Date().toDateString();
  const todayReturns = returnTransactions.filter(
    (trx) => new Date(trx.date).toDateString() === today,
  ).length;

  const reportDetails = {
    sales: {
      label: "Penjualan",
      summary:
        "Laporan penjualan terhubung langsung ke transaksi POS. Angka ini menggambarkan performa penjualan aktual.",
      metrics: [
        { label: "Total Penjualan", value: formatRupiah(totalSales) },
        { label: "Produk Terlaris", value: topSeller },
        { label: "Transaksi Selesai", value: salesTransactions.length },
      ],
    },
    purchase: {
      label: "Pembelian",
      summary:
        "Laporan pembelian memperlihatkan aliran order supplier dan alokasi biaya terbaru.",
      metrics: [
        { label: "Total Pengeluaran", value: formatRupiah(totalPurchase) },
        {
          label: "Vendor Utama",
          value: purchaseOrders[0]?.vendor ?? "Belum ada vendor",
        },
        { label: "Pesanan Terdaftar", value: purchaseOrders.length },
      ],
    },
    stock: {
      label: "Stok",
      summary:
        "Laporan stok sinkron langsung dengan POS. Setiap checkout menyesuaikan stok produk secara otomatis.",
      metrics: [
        { label: "Jumlah SKU", value: products.length },
        { label: "Item Low Stock", value: lowStockItems.length },
        {
          label: "Reorder Prioritas",
          value:
            lowStockItems
              .slice(0, 3)
              .map((item) => item.name)
              .join(", ") || "Aman",
        },
      ],
    },
    return: {
      label: "Retur",
      summary:
        "Laporan retur mengikuti transaksi retur di POS. Data ini membantu memantau status abort dan void.",
      metrics: [
        { label: "Total Retur", value: returnTransactions.length },
        { label: "Retur Hari Ini", value: todayReturns },
        {
          label: "Status Utama",
          value: `Void: ${transactions.filter((trx) => trx.status === "Void").length}, Abort: ${transactions.filter((trx) => trx.status === "Abort").length}`,
        },
      ],
    },
  };

  const selectedReport = reportDetails[activeReport];

  const reportExportRows = {
    sales: salesTransactions.map((trx) => ({
      ID: trx.id,
      Tanggal: trx.date,
      Item: trx.items,
      Total: formatRupiah(trx.total),
      Metode: trx.method,
      Status: trx.status,
    })),
    purchase: purchaseOrders.map((order) => ({
      ID: order.id,
      Vendor: order.vendor,
      Tanggal: order.date,
      Total: formatRupiah(order.total),
      Status: order.status,
    })),
    stock: products.map((product) => ({
      SKU: product.sku,
      Item: product.name,
      Stok: product.stock,
      Harga: formatRupiah(product.price),
    })),
    return: returnTransactions.map((trx) => ({
      ID: trx.id,
      Tanggal: trx.date,
      Item: trx.items,
      Total: formatRupiah(trx.total),
      Metode: trx.method,
      Status: trx.status,
    })),
  };

  const exportHeaders = {
    sales: ["ID", "Tanggal", "Item", "Total", "Metode", "Status"],
    purchase: ["ID", "Vendor", "Tanggal", "Total", "Status"],
    stock: ["SKU", "Item", "Stok", "Harga"],
    return: ["ID", "Tanggal", "Item", "Total", "Metode", "Status"],
  };

  const reportPreviewRows = reportExportRows[activeReport] || [];

  const handleExportReport = (type) => {
    const headers = exportHeaders[activeReport];
    const rows = reportExportRows[activeReport];
    const title = `${selectedReport.label} - ${type === "excel" ? "Excel" : "PDF"}`;
    if (type === "excel") {
      exportToExcel(
        `${selectedReport.label.replace(/\s/g, "_")}_Report`,
        headers,
        rows,
      );
    } else {
      exportToPdf(`${selectedReport.label} Report`, headers, rows);
    }
  };

  const handleItemClick = (item) => {
    setSelectedItem(item);
    setSelectedItemAction("");
    setInfoMessage(
      `Demo produk: ${item.name}. Gunakan tombol restock atau retur untuk melihat simulasi.`,
    );
  };

  const handleInventoryAction = (action) => {
    if (!selectedItem) {
      setInfoMessage(
        "Pilih produk terlebih dahulu untuk menjalankan demo aksi inventory.",
      );
      return;
    }
    setSelectedItemAction(action);
    setInfoMessage(`Demo '${action}' dijalankan untuk ${selectedItem.name}.`);
  };

  const handleReportClick = (reportId) => {
    setActiveReport(reportId);
    setInfoMessage(reportDetails[reportId].summary);
  };

  const handleReturnAction = (actionId) => {
    setActiveReturnAction(actionId);
    setInfoMessage(
      `Simulasi aksi ${actionId.toUpperCase()} pada laporan retur dijalankan.`,
    );
  };

  const handleCreatePurchase = () => {
    const product = products.find(
      (item) => item.id === Number(newPurchase.productId),
    );
    if (!product) {
      setPurchaseMessage("Pilih produk yang valid untuk purchase.");
      return;
    }

    const id = `PO-${String(purchaseOrders.length + 1).padStart(3, "0")}`;
    const total = product.price * Number(newPurchase.qty);
    setPurchaseOrders([
      ...purchaseOrders,
      {
        id,
        vendor: newPurchase.vendor,
        date: new Date(newPurchase.purchaseDate).toISOString(),
        total,
        status: "Proses",
        product: product.name,
        qty: Number(newPurchase.qty),
      },
    ]);
    setPurchaseMessage(`Purchase demo ${id} berhasil dibuat.`);
  };

  const handleCreateProduct = async () => {
    const { data, error } = await createProduct(newProduct);
    if (error.length > 0) {
      toast.error(error);
    } else {
      setProducts([...products, { ...data, stock: 0 }]);
    }
  };

  const handleUpdatePurchaseStatus = (orderId, targetStatus) => {
    setPurchaseOrders((current) =>
      current.map((order) => {
        if (order.id !== orderId) return order;
        if (order.status === targetStatus) return order;

        const product = products.find((item) => item.name === order.product);
        if (targetStatus === "Diterima" && product) {
          setProducts((currentProducts) =>
            currentProducts.map((item) =>
              item.id === product.id
                ? { ...item, stock: item.stock + order.qty }
                : item,
            ),
          );
        }
        if (
          order.status === "Diterima" &&
          targetStatus === "Dibatalkan" &&
          product
        ) {
          setProducts((currentProducts) =>
            currentProducts.map((item) =>
              item.id === product.id
                ? { ...item, stock: Math.max(0, item.stock - order.qty) }
                : item,
            ),
          );
        }

        return { ...order, status: targetStatus };
      }),
    );
    setPurchaseMessage(
      `Status order ${orderId} diubah menjadi ${targetStatus}.`,
    );
  };

  return (
    <div className="relative min-h-screen overflow-hidden bg-[#fff5ee]">
      <div className="absolute top-0 left-1/2 h-[520px] w-[520px] -translate-x-1/2 rounded-full bg-[#ffd0b2] opacity-70" />
      <div className="absolute -top-[120px] left-0 h-[360px] w-[360px] rounded-full bg-[#ffaf78] opacity-80" />
      <div className="absolute bottom-0 right-0 h-[420px] w-[420px] rounded-full bg-[#ffb980] opacity-70" />

      <header className="relative z-10 w-full">
        <div className="absolute inset-0 bg-orange-500" />
        <div className="absolute left-0 top-0 h-full w-[320px] bg-white rounded-br-[120px]" />

        <div className="relative mx-auto flex max-w-[1440px] items-center px-6 py-4">
          <div className="flex items-center gap-4">
            <div className="relative -left-45">
              <img
                src={logoSecondary}
                alt="ShafiraMart"
                className="h-16 w-auto object-contain"
              />
            </div>
            <div></div>
            <nav className="hidden md:flex items-center gap-8 text-white font-medium">
              {topNavItems.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setActiveModule(item.id)}
                  className={`transition cursor-pointer ${
                    location.pathname.includes(item.href)
                      ? "text-white underline decoration-white/40 underline-offset-4"
                      : "text-orange-100 hover:text-white/90"
                  }`}
                >
                  {item.label}
                </button>
              ))}
            </nav>
          </div>

          <div className="ml-auto flex items-center gap-3">
            <div className="text-right text-white">
              <p className="font-semibold">{user?.name || "Asep"}</p>
              <p className="text-xs opacity-80">Admin</p>
            </div>
            <button
              type="button"
              onClick={() => setIsUserMenuOpen((prev) => !prev)}
              className="flex h-10 w-10 items-center justify-center rounded-full bg-white shadow-md text-orange-500"
            >
              {user?.name ? user.name.charAt(0).toUpperCase() : "A"}
            </button>
            {isUserMenuOpen && (
              <div className="absolute right-6 top-16 z-20 w-40 rounded-xl border border-white/20 bg-white text-gray-900 shadow-xl">
                <button
                  type="button"
                  onClick={() => {
                    logout();
                    setIsUserMenuOpen(false);
                  }}
                  className="w-full px-4 py-3 text-left text-sm transition hover:bg-orange-50"
                >
                  Logout
                </button>
              </div>
            )}
          </div>
        </div>
      </header>

      <main className="relative z-10 mx-auto max-w-[1440px] px-6 pb-12 pt-10">
        <div className="rounded-[40px] border border-white/60 bg-white/90 p-8 shadow-xl shadow-orange-200/20 backdrop-blur-sm">
          <div className="grid gap-6 lg:grid-cols-[1fr_360px]">
            <div className="space-y-6">
              <p className="text-sm uppercase tracking-[0.3em] text-orange-500">
                Inventory
              </p>
              <div>
                <h1 className="text-4xl font-bold text-gray-900">
                  Shafira Mart Inventory
                </h1>
                <p className="mt-3 max-w-2xl text-gray-600">
                  Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed
                  do eiusmod tempor incididunt ut
                </p>
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="rounded-[32px] bg-orange-50 p-5 shadow-sm">
                  <p className="text-xs uppercase tracking-[0.2em] text-orange-500">
                    Master Item
                  </p>
                  <p className="mt-3 text-3xl font-semibold text-gray-900">
                    {products.length}
                  </p>
                  <p className="mt-2 text-sm text-gray-600">
                    Produk tersedia di katalog
                  </p>
                </div>
                <div className="rounded-[32px] bg-orange-50 p-5 shadow-sm">
                  <p className="text-xs uppercase tracking-[0.2em] text-orange-500">
                    Pembelian
                  </p>
                  <p className="mt-3 text-3xl font-semibold text-gray-900">
                    {purchaseOrders.length}
                  </p>
                  <p className="mt-2 text-sm text-gray-600">
                    Order dari vendor dan status pembelian
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-8">
          <Outlet />
          {/* {activeModule === "master" && (
            <ProductPage />
            // <section className="rounded-[40px] border border-orange-100 bg-white p-6 shadow-sm">
            //   <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            //     <div>
            //       <p className="text-sm uppercase tracking-[0.2em] text-orange-500">
            //         Master Item
            //       </p>
            //       <h3 className="mt-2 text-xl font-semibold text-gray-900">
            //         Daftar Produk
            //       </h3>
            //     </div>
            //     <button
            //       className="rounded-full bg-orange-500 px-4 py-2 text-sm font-semibold text-white hover:bg-orange-600"
            //       type="button"
            //     >
            //       Tambah Item
            //     </button>
            //   </div>
            //   <div className="mt-6 grid gap-6 lg:grid-cols-[1fr_360px]">
            //     <div className="overflow-x-auto rounded-[32px] border border-orange-100 bg-white">
            //       <table className="w-full min-w-[520px] text-left text-sm text-gray-600">
            //         <thead>
            //           <tr className="border-b border-orange-100 text-gray-500">
            //             <th className="px-4 py-3">Barcode</th>
            //             <th className="px-4 py-3">Item</th>
            //             <th className="px-4 py-3">Harga</th>
            //             <th className="px-4 py-3">Stok</th>
            //           </tr>
            //         </thead>
            //         <tbody>
            //           {products.map((item) => (
            //             <tr
            //               key={item.id}
            //               role="button"
            //               onClick={() => handleItemClick(item)}
            //               className={`border-b border-orange-50 hover:bg-orange-50/50 transition duration-150 ${
            //                 selectedItem?.id === item.id ? "bg-orange-50" : ""
            //               } cursor-pointer`}
            //             >
            //               <td className="px-4 py-3">{item.barcode}</td>
            //               <td className="px-4 py-3">{item.name}</td>
            //               <td className="px-4 py-3">
            //                 {formatRupiah(item.price)}
            //               </td>
            //               <td className="px-4 py-3">{item.stock}</td>
            //             </tr>
            //           ))}
            //         </tbody>
            //       </table>
            //     </div>

            //     <div className="space-y-4">
            //       <div className="rounded-[32px] border border-orange-100 bg-orange-50 p-5">
            //         <p className="text-sm uppercase tracking-[0.2em] text-orange-500">
            //           Demo Inventory
            //         </p>
            //         <p className="mt-3 text-sm text-gray-600">{infoMessage}</p>
            //       </div>

            //       <div className="rounded-[32px] border border-orange-100 bg-white p-5 shadow-sm">
            //         <p className="text-sm uppercase tracking-[0.2em] text-orange-500">
            //           Detail Produk
            //         </p>
            //         {selectedItem ? (
            //           <div className="mt-4 space-y-3 text-sm text-gray-700">
            //             <div>
            //               <p className="font-semibold text-gray-900">
            //                 {selectedItem.name}
            //               </p>
            //               <p className="text-gray-500">
            //                 Barcode: {selectedItem.barcode}
            //               </p>
            //             </div>
            //             <div className="grid gap-2 sm:grid-cols-2">
            //               <div className="rounded-3xl bg-orange-50 p-3">
            //                 <p className="text-xs uppercase tracking-[0.2em] text-orange-500">
            //                   Stok
            //                 </p>
            //                 <p className="mt-2 font-semibold text-gray-900">
            //                   {selectedItem.stock}
            //                 </p>
            //               </div>
            //               <div className="rounded-3xl bg-orange-50 p-3">
            //                 <p className="text-xs uppercase tracking-[0.2em] text-orange-500">
            //                   Harga
            //                 </p>
            //                 <p className="mt-2 font-semibold text-gray-900">
            //                   {formatRupiah(selectedItem.price)}
            //                 </p>
            //               </div>
            //             </div>
            //             <div className="grid gap-2 sm:grid-cols-3">
            //               <button
            //                 type="button"
            //                 onClick={() => handleInventoryAction("Restock")}
            //                 className="rounded-full bg-orange-500 px-3 py-2 text-sm font-semibold text-white hover:bg-orange-600"
            //               >
            //                 Restock
            //               </button>
            //               <button
            //                 type="button"
            //                 onClick={() => handleInventoryAction("Retur")}
            //                 className="rounded-full border border-orange-200 bg-white px-3 py-2 text-sm font-semibold text-orange-700 hover:bg-orange-50"
            //               >
            //                 Retur
            //               </button>
            //               <button
            //                 type="button"
            //                 onClick={() => handleInventoryAction("Audit")}
            //                 className="rounded-full border border-orange-200 bg-white px-3 py-2 text-sm font-semibold text-orange-700 hover:bg-orange-50"
            //               >
            //                 Audit
            //               </button>
            //             </div>
            //             {selectedItemAction && (
            //               <p className="mt-2 text-sm text-green-700">
            //                 {selectedItemAction}
            //               </p>
            //             )}
            //           </div>
            //         ) : (
            //           <p className="mt-4 text-sm text-gray-500">
            //             Pilih produk untuk melihat demo detail dan aksi
            //             inventory.
            //           </p>
            //         )}
            //       </div>

            //       <div className="rounded-[32px] border border-orange-100 bg-white p-5 shadow-sm">
            //         <p className="text-sm uppercase tracking-[0.2em] text-orange-500">
            //           Tambah Produk
            //         </p>
            //         <div className="mt-4 space-y-4 text-sm text-gray-700">
            //           <label className="block">
            //             <span className="text-gray-600">Nama Produk</span>
            //             <input
            //               defaultValue={newProduct.name}
            //               onChange={(e) =>
            //                 setNewProduct({
            //                   ...newProduct,
            //                   name: e.target.value,
            //                 })
            //               }
            //               className="mt-2 w-full rounded-xl border border-orange-200 bg-orange-50 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-orange-300"
            //             />
            //           </label>
            //           <label className="block">
            //             <span className="text-gray-600">Kategori</span>
            //             <input
            //               defaultValue={newProduct.category}
            //               onChange={(e) =>
            //                 setNewProduct({
            //                   ...newProduct,
            //                   category: e.target.value,
            //                 })
            //               }
            //               className="mt-2 w-full rounded-xl border border-orange-200 bg-orange-50 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-orange-300"
            //             />
            //           </label>
            //           <label className="block">
            //             <span className="text-gray-600">Harga</span>
            //             <input
            //               type="number"
            //               min="0"
            //               defaultValue={newProduct.price}
            //               onChange={(e) =>
            //                 setNewProduct({
            //                   ...newProduct,
            //                   price: e.target.value,
            //                 })
            //               }
            //               className="mt-2 w-full rounded-xl border border-orange-200 bg-orange-50 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-orange-300"
            //             />
            //           </label>
            //           <label className="block">
            //             <span className="text-gray-600">Barcode</span>
            //             <input
            //               defaultValue={newProduct.barcode}
            //               onChange={(e) => {
            //                 setError((prev) => {
            //                   if (prev["barcode"]) delete prev["barcode"];
            //                   return { ...prev };
            //                 });
            //                 setNewProduct({
            //                   ...newProduct,
            //                   barcode: e.target.value,
            //                 });
            //                 console.log(e.target.value);
            //                 console.log(validateBarcode(e.target.value));
            //                 if (!validateBarcode(e.target.value)){
            //                   setError((prev) => ({
            //                     ...prev,
            //                     barcode: "Barcode harus berupa angka dengan 13 digit sesuai format EAN-13.",
            //                   }));
            //                 }
            //               }}
            //               className={`mt-2 w-full rounded-xl border  bg-orange-50 px-3 py-2 focus:outline-none focus:ring-2  ${error.barcode ? "border-red-500 focus:ring-red-300" : "focus:ring-orange-300 border-orange-200"}`}
            //             />
            //             {error.barcode && (
            //               <p className="mt-1 text-xs text-red-500">
            //                 {error.barcode}
            //               </p>
            //             )}
            //           </label>
            //           <button
            //             type="button"
            //             onClick={handleCreateProduct}
            //             className="w-full rounded-full bg-orange-500 px-4 py-3 text-sm font-semibold text-white hover:bg-orange-600"
            //           >
            //             Tambah Produk Baru
            //           </button>
            //           {productMessage && (
            //             <p className="text-sm text-green-700">
            //               {productMessage}
            //             </p>
            //           )}
            //         </div>
            //       </div>
            //     </div>
            //   </div>
            // </section>
          )}

          {activeModule === "purchases" && (
            <section className="rounded-[40px] border border-orange-100 bg-white p-6 shadow-sm">
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
                    {formatRupiah(totalSales)}
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
                    {purchaseOrders.length}
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
                    {lowStockItems.length}
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
                      value={newPurchase.productId}
                      onChange={(e) =>
                        setNewPurchase({
                          ...newPurchase,
                          productId: Number(e.target.value),
                        })
                      }
                      className="mt-2 w-full rounded-xl border border-orange-200 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-300"
                    >
                      {DEMO_PRODUCTS.map((product) => (
                        <option key={product.id} value={product.id}>
                          {product.name}
                        </option>
                      ))}
                    </select>
                  </label>
                  <label className="block text-sm text-gray-600">
                    Vendor
                    <select
                      value={newPurchase.vendor}
                      onChange={(e) =>
                        setNewPurchase({
                          ...newPurchase,
                          vendor: e.target.value,
                        })
                      }
                      className="mt-2 w-full rounded-xl border border-orange-200 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-300"
                    >
                      {DEMO_VENDORS.map((vendor) => (
                        <option key={vendor} value={vendor}>
                          {vendor}
                        </option>
                      ))}
                    </select>
                  </label>
                  <label className="block text-sm text-gray-600">
                    Qty
                    <input
                      type="number"
                      min="1"
                      value={newPurchase.qty}
                      onChange={(e) =>
                        setNewPurchase({
                          ...newPurchase,
                          qty: Number(e.target.value),
                        })
                      }
                      className="mt-2 w-full rounded-xl border border-orange-200 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-300"
                    />
                  </label>
                  <label className="block text-sm text-gray-600">
                    Tanggal
                    <input
                      type="datetime-local"
                      value={newPurchase.purchaseDate}
                      onChange={(e) =>
                        setNewPurchase({
                          ...newPurchase,
                          purchaseDate: e.target.value,
                        })
                      }
                      className="mt-2 w-full rounded-xl border border-orange-200 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-300"
                    />
                  </label>
                </div>
                <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center">
                  <button
                    type="button"
                    onClick={handleCreatePurchase}
                    className="rounded-full bg-orange-500 px-4 py-3 text-sm font-semibold text-white hover:bg-orange-600"
                  >
                    Buat Purchase Demo
                  </button>
                  {purchaseMessage && (
                    <p className="text-sm text-green-700">{purchaseMessage}</p>
                  )}
                </div>
              </div>
              <div className="mt-6 space-y-4">
                {purchaseOrders.map((order) => (
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
                      Status:{" "}
                      <span className="font-semibold">{order.status}</span>
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
                ))}
              </div>
            </section>
          )}

          {activeModule === "reports" && (
            <section className="rounded-[40px] border border-orange-100 bg-white p-6 shadow-sm">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="text-sm uppercase tracking-[0.2em] text-orange-500">
                    Report
                  </p>
                  <h3 className="mt-2 text-xl font-semibold text-gray-900">
                    Laporan Inventaris
                  </h3>
                  <p className="mt-2 text-sm text-gray-600">
                    Akses cepat ke report penjualan, pembelian, stok, dan retur
                    barang.
                  </p>
                </div>
                <div className="flex flex-wrap gap-3">
                  <button
                    type="button"
                    onClick={() => handleExportReport("excel")}
                    className="rounded-full border border-orange-200 bg-white px-4 py-2 text-sm font-semibold text-orange-700 hover:bg-orange-50"
                  >
                    Export Excel
                  </button>
                  <button
                    type="button"
                    onClick={() => handleExportReport("pdf")}
                    className="rounded-full border border-orange-200 bg-white px-4 py-2 text-sm font-semibold text-orange-700 hover:bg-orange-50"
                  >
                    Export PDF
                  </button>
                </div>
              </div>

              <div className="mt-6 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                {reportItems.map((report) => (
                  <button
                    key={report.id}
                    type="button"
                    onClick={() => handleReportClick(report.id)}
                    className={`rounded-3xl border p-4 text-left transition min-h-[150px] ${
                      activeReport === report.id
                        ? "border-orange-300 bg-orange-100 shadow-sm"
                        : "border-orange-100 bg-orange-50 hover:border-orange-200 hover:bg-orange-50"
                    }`}
                  >
                    <div className="flex items-center gap-3 text-orange-600">
                      {createElement(report.icon, { size: 18 })}
                      <p className="font-semibold text-gray-900">
                        {report.label}
                      </p>
                    </div>
                    <p className="mt-2 text-sm text-gray-600">
                      {report.id === "sales" &&
                        "Lihat ringkasan penjualan produk."}
                      {report.id === "purchase" &&
                        "Pantau pembelian dan vendor."}
                      {report.id === "stock" && "Cek stok barang di gudang."}
                      {report.id === "return" &&
                        "Kelola retur dengan opsi abort, void, atau retur barang."}
                    </p>
                  </button>
                ))}
              </div>
              <div className="mt-6 rounded-[32px] border border-orange-100 bg-orange-50 p-5">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <p className="text-sm text-orange-500 uppercase tracking-[0.2em]">
                      Detail Report
                    </p>
                    <h3 className="mt-2 text-xl font-semibold text-gray-900">
                      {selectedReport.label}
                    </h3>
                  </div>
                  <span className="rounded-full bg-white/80 px-4 py-2 text-sm font-semibold text-orange-700 border border-orange-100">
                    Rekomendasi
                  </span>
                </div>
                <p className="mt-4 text-sm text-gray-600">
                  {selectedReport.summary}
                </p>
                <div className="mt-4 grid gap-3 sm:grid-cols-3">
                  {selectedReport.metrics.map((metric) => (
                    <div
                      key={metric.label}
                      className="rounded-3xl border border-orange-100 bg-white p-4 shadow-sm"
                    >
                      <p className="text-xs uppercase tracking-[0.2em] text-orange-500">
                        {metric.label}
                      </p>
                      <p className="mt-2 font-semibold text-gray-900">
                        {metric.value}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
              <div className="mt-6 rounded-[32px] border border-orange-100 bg-white p-4 shadow-sm">
                <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <p className="text-sm uppercase tracking-[0.2em] text-orange-500">
                      Preview {selectedReport.label}
                    </p>
                    <h4 className="mt-2 text-lg font-semibold text-gray-900">
                      Data contoh di web
                    </h4>
                  </div>
                  <span className="text-sm font-semibold text-gray-600">
                    Menampilkan {reportPreviewRows.length} baris
                  </span>
                </div>
                <div className="mt-4 overflow-x-auto rounded-[24px] border border-orange-100">
                  <table className="min-w-full divide-y divide-orange-100 text-left text-sm text-gray-600">
                    <thead className="bg-orange-50 text-gray-500">
                      <tr>
                        {exportHeaders[activeReport].map((header) => (
                          <th
                            key={header}
                            className="px-4 py-3 font-medium uppercase tracking-[0.15em]"
                          >
                            {header}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-orange-100 bg-white">
                      {reportPreviewRows.slice(0, 5).map((row, index) => (
                        <tr
                          key={`${row.ID ?? index}-${index}`}
                          className="hover:bg-orange-50"
                        >
                          {exportHeaders[activeReport].map((header) => (
                            <td key={header} className="px-4 py-3">
                              {row[header] ?? "-"}
                            </td>
                          ))}
                        </tr>
                      ))}
                      {reportPreviewRows.length === 0 && (
                        <tr>
                          <td
                            colSpan={exportHeaders[activeReport].length}
                            className="px-4 py-5 text-center text-sm text-gray-500"
                          >
                            Tidak ada data untuk preview saat ini.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
                {reportPreviewRows.length > 5 && (
                  <p className="mt-3 text-xs text-gray-500">
                    Preview dibatasi 5 baris. Gunakan export untuk melihat
                    seluruh data.
                  </p>
                )}
              </div>
              {activeReport === "return" && (
                <div className="mt-6">
                  <div className="grid gap-4 lg:grid-cols-3">
                    {returnActions.map((action) => (
                      <button
                        key={action.id}
                        type="button"
                        onClick={() => handleReturnAction(action.id)}
                        className={`rounded-3xl border p-5 text-left transition ${
                          activeReturnAction === action.id
                            ? "border-orange-300 bg-orange-100 shadow-sm"
                            : "border-orange-100 bg-orange-50 hover:border-orange-200 hover:bg-orange-50"
                        }`}
                      >
                        <div className="flex items-center gap-3 text-orange-600">
                          {createElement(action.icon, { size: 20 })}
                          <p className="font-semibold text-gray-900">
                            {action.label}
                          </p>
                        </div>
                        <p className="mt-3 text-sm text-gray-600">
                          {action.description}
                        </p>
                      </button>
                    ))}
                  </div>
                  {activeReturnAction && (
                    <div className="mt-4 rounded-3xl border border-orange-100 bg-orange-50 p-4 text-sm text-orange-700">
                      Aksi retur dipilih:{" "}
                      <span className="font-semibold">
                        {activeReturnAction}
                      </span>
                      . Lihat rekomendasi dan status retur di atas.
                    </div>
                  )}
                </div>
              )}
            </section>
          )} */}
        </div>
      </main>
    </div>
  );
}
