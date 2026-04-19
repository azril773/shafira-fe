import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import MainLayout from "./components/layout/MainLayout";
import POSPage from "./pages/pos/POSPage";
import ProductsPage from "./pages/products/ProductsPage";
import TransactionsPage from "./pages/transactions/TransactionsPage";
import DashboardPage from "./pages/dashboard/DashboardPage";
import InventoryPage from "./pages/inventory/InventoryPage";
import LoginPage from "./pages/auth/LoginPage";
import { useAuthStore } from "./store/authStore";
import { CASHIER } from "./constants/user";

function PrivateRoute({ children }) {
  const { isAuthenticated } = useAuthStore();
  return isAuthenticated ? children : <Navigate to="/login" replace />;
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
      <Route index element={<PosRedirect />} />
      <Route path="kasir" element={<POSPage />} />
      <Route path="products" element={<ProductsPage />} />
      <Route path="transactions" element={<TransactionsPage />} />
      <Route path="dashboard" element={<DashboardPage />} />
    </Routes>
  );
}

function InventoryRoutes() {
  const { user } = useAuthStore();
  if (user.role === CASHIER) return <Navigate to="/pos" replace />;
  return (
    <Routes>
      <Route index element={<InventoryPage />} />
    </Routes>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route
          path="/"
          element={
            <PrivateRoute>
              <MainLayout />
            </PrivateRoute>
          }
        >
          <Route index element={<HomeRedirect />} />
          <Route path="pos/*" element={<PosRoutes />} />
          <Route path="inventory/*" element={<InventoryRoutes />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}
