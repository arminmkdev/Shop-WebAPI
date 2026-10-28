import { BrowserRouter, Routes, Route } from "react-router-dom";
import Navbar from "./components/Navbar";
import Store from "./components/Store";
import Cart from "./components/Cart";
import AuthPage from "./components/AuthPage";
import Orders from "./components/Orders";
import OrderDetails from "./components/OrderDetails";
import AdminGate from "./components/Admin/AdminGate";

export default function App() {
  return (
    <BrowserRouter>
      <Navbar />
      <Routes>
        <Route path="/" element={<Store />} />
        <Route path="/cart" element={<Cart />} />
        <Route path="/login" element={<AuthPage />} />
        <Route path="/register" element={<AuthPage register />} />
        <Route path="/orders" element={<Orders />} />
        <Route path="/order-details" element={<OrderDetails />} />
        <Route path="/admin" element={<AdminGate />} />
        <Route path="*" element={<Store />} />
      </Routes>
    </BrowserRouter>
  );
}
