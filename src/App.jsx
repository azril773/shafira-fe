import { BrowserRouter, Routes, Route, Navigate, Outlet } from "react-router-dom";
import MainLayout from "./components/layout/MainLayout";
import POSPage from "./pages/pos/POSPage";
import ProductsPage from "./pages/products/ProductsPage";
import TransactionsPage from "./pages/transactions/TransactionsPage";
import DashboardPage from "./pages/dashboard/DashboardPage";
import InventoryPage from "./pages/inventory/InventoryPage";
import LoginPage from "./pages/auth/LoginPage";
import { useAuthStore } from "./store/authStore";
import { CASHIER } from "./constants/user";
import ProductPage from "./pages/inventory/products/product";
import EditProductPage from "./pages/inventory/products/edit";
import PurchasePage from "./pages/inventory/purchase/purchase";
import EditPurchasePage from "./pages/inventory/purchase/edit";
import VendorPage from "./pages/inventory/vendors/vendor";
import EditVendorPage from "./pages/inventory/vendors/edit";

function PrivateRoute() {
  const { isAuthenticated } = useAuthStore();
  return isAuthenticated ? <Outlet /> : <Navigate to="/login" replace />;
}

function HomeRedirect() {
  const { user } = useAuthStore();
  if (!user) return <Navigate to="/login" replace />;
  return user.role === CASHIER ? (
    <Navigate to="/pos" replace />
  ) : (
    <Navigate to="/inventory" replace />
  );
}

function PosRedirect() {
  const { user } = useAuthStore();
  if (user.role !== CASHIER) return <Navigate to="/inventory" replace />;
  return <Navigate to="/pos/kasir" replace />;
}

function PosRoutes() {
  const { user } = useAuthStore();
  if (user.role !== CASHIER) return <Navigate to="/inventory" replace />;
  return (
    <Routes>
      <Route element={<MainLayout />}>
        <Route index element={<PosRedirect />} />
        <Route path="kasir" element={<POSPage />} />
        <Route path="products" element={<ProductsPage />} />
        <Route path="transactions" element={<TransactionsPage />} />
        <Route path="dashboard" element={<DashboardPage />} />
      </Route>
    </Routes>
  );
}

function InventoryRoutes() {
  const { user } = useAuthStore();
  if (user.role === CASHIER) return <Navigate to="/pos" replace />;
  return (
    <Routes>
      <Route element={<InventoryPage />}>
        <Route index element={<Navigate to="products" replace />} />
        <Route path="products" element={<ProductPage />} />
        <Route path="products/edit/:id" element={<EditProductPage />} />
        <Route path="purchases" element={<PurchasePage />} />
        <Route path="purchases/edit/:id" element={<EditPurchasePage />} />
        <Route path="vendors" element={<VendorPage />} /> 
        <Route path="vendors/edit/:id" element={<EditVendorPage />} /> 
      </Route>
    </Routes>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/" element={<PrivateRoute />}>
          <Route index element={<HomeRedirect />} />
          <Route path="pos/*" element={<PosRoutes />} />
          <Route path="inventory/*" element={<InventoryRoutes />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}
