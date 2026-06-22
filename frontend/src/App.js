import React from "react";
import "@/App.css";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { Toaster } from "sonner";

import { AuthProvider } from "@/contexts/AuthContext";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import ProtectedRoute from "@/components/ProtectedRoute";

import Home from "@/pages/Home";
import Marketplace from "@/pages/Marketplace";
import AssetDetail from "@/pages/AssetDetail";
import Login from "@/pages/Login";
import Register from "@/pages/Register";
import Pricing from "@/pages/Pricing";
import PaymentSuccess from "@/pages/PaymentSuccess";
import UserDashboard from "@/pages/UserDashboard";
import CreatorDashboard from "@/pages/CreatorDashboard";
import Commission from "@/pages/Commission";
import Community from "@/pages/Community";
import Blog from "@/pages/Blog";
import CreatorProfile from "@/pages/CreatorProfile";

function App() {
  return (
    <div className="App min-h-screen flex flex-col">
      <BrowserRouter>
        <AuthProvider>
          <Navbar />
          <main className="flex-1">
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/marketplace" element={<Marketplace />} />
              <Route path="/assets/:id" element={<AssetDetail />} />
              <Route path="/creators/:id" element={<CreatorProfile />} />
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />
              <Route path="/pricing" element={<Pricing />} />
              <Route path="/commission" element={<Commission />} />
              <Route path="/community" element={<Community />} />
              <Route path="/blog" element={<Blog />} />
              <Route path="/payment/success" element={<PaymentSuccess />} />
              <Route path="/dashboard" element={<ProtectedRoute><UserDashboard /></ProtectedRoute>} />
              <Route path="/dashboard/creator" element={<ProtectedRoute><CreatorDashboard /></ProtectedRoute>} />
            </Routes>
          </main>
          <Footer />
          <Toaster theme="dark" position="top-right" />
        </AuthProvider>
      </BrowserRouter>
    </div>
  );
}

export default App;
