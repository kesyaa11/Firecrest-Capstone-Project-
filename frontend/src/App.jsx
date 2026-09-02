import "./App.css";
import Header from "./components/Header";
import Footer from "./components/Footer";

import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import UserManagement from "./pages/UserManagement";
import Schedule from "./pages/Schedule";
import Payroll from "./pages/Payroll";
import HandoffManagement from "./pages/HandoffManagement";

import { BrowserRouter, Routes, Route } from "react-router-dom";
import Users from "./components/Users";

export default function App() {
  return (
    <BrowserRouter>
      <div className="d-flex flex-column min-vh-100">
        <Header />

        <div className="flex-fill">
          <Routes>
            <Route path="/" element={<Login />} />
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/users" element={<UserManagement />} />
            <Route path="/schedule" element={<Schedule />} />
            <Route path="/payroll" element={<Payroll />} />
            <Route path="/handoff" element={<HandoffManagement />} />
            <Route path="/users" element={<Users />} />
          </Routes>
        </div>

        <Footer />
      </div>
    </BrowserRouter>
  );
}
