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
  { id: "vendors", label: "Vendor", href: "/inventory/vendors" },
  { id: "uoms", label: "UoM", href: "/inventory/uoms" },
  { id: "purchases", label: "Pembelian", href: "/inventory/purchases" },
  { id: "purchase-returns", label: "Retur Pembelian", href: "/inventory/purchase-returns" },
  { id: "transactions", label: "Transaksi", href: "/inventory/transactions" },
  { id: "users", label: "User", href: "/inventory/users" },
  { id: "audit-logs", label: "Audit Log", href: "/inventory/audit-logs" },
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
                  onClick={() => navigate(item.href)}
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
        <div className="mt-8">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
