import "@/App.css";
import { useState, useEffect, useRef } from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { Toaster } from "sonner";
import { supabase } from "@/lib/supabase";
import { Auth } from "@/components/Auth";
import FinanceApp from "@/pages/FinanceApp";

function App() {
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const menuRef = useRef(null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setLoading(false);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  // Cerrar el menú desplegable al hacer clic fuera de él
  useEffect(() => {
    function handleClickOutside(event) {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setShowProfileMenu(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  if (loading) {
    return (
      <div style={{ display: "flex", justifyContent: "center", alignItems: "center", height: "100vh" }}>
        <p>Cargando aplicación...</p>
      </div>
    );
  }

  if (!session) {
    return (
      <div className="App">
        <Toaster position="top-right" richColors />
        <Auth />
      </div>
    );
  }

  // Extraer inicial del correo para el avatar
  const userEmail = session.user.email;
  const userInitial = userEmail ? userEmail.charAt(0).toUpperCase() : "U";

  return (
    <div className="App" style={{ minHeight: "100vh", backgroundColor: "#f8fafc" }}>
      <Toaster position="top-right" richColors />

      {/* Header minimalista con botón de perfil */}
      <header
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          padding: "12px 24px",
          backgroundColor: "#ffffff",
          borderBottom: "1px solid #e2e8f0",
        }}
      >
        <div style={{ fontWeight: "bold", fontSize: "18px", color: "#0f172a" }}>
          Mis Finanzas
        </div>

        {/* Menú desplegable de Perfil */}
        <div style={{ position: "relative" }} ref={menuRef}>
          <button
            onClick={() => setShowProfileMenu(!showProfileMenu)}
            style={{
              width: "38px",
              height: "38px",
              borderRadius: "50%",
              backgroundColor: "#2563eb",
              color: "#ffffff",
              border: "none",
              fontWeight: "bold",
              fontSize: "15px",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              boxShadow: "0 2px 4px rgba(0,0,0,0.1)",
            }}
          >
            {userInitial}
          </button>

          {showProfileMenu && (
            <div
              style={{
                position: "absolute",
                right: 0,
                top: "48px",
                width: "240px",
                backgroundColor: "#ffffff",
                borderRadius: "12px",
                boxShadow: "0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1)",
                border: "1px solid #e2e8f0",
                padding: "12px",
                zIndex: 1000,
              }}
            >
              <div style={{ paddingBottom: "8px", marginBottom: "8px", borderBottom: "1px solid #f1f5f9" }}>
                <p style={{ margin: 0, fontSize: "12px", color: "#64748b" }}>Sesión iniciada como</p>
                <p style={{ margin: "2px 0 0", fontSize: "13px", fontWeight: "600", color: "#0f172a", wordBreak: "break-all" }}>
                  {userEmail}
                </p>
              </div>

              <button
                onClick={() => supabase.auth.signOut()}
                style={{
                  width: "100%",
                  padding: "8px 12px",
                  borderRadius: "6px",
                  border: "none",
                  backgroundColor: "#fef2f2",
                  color: "#dc2626",
                  cursor: "pointer",
                  fontWeight: "500",
                  fontSize: "13px",
                  textAlign: "left",
                }}
              >
                🚪 Cerrar Sesión
              </button>
            </div>
          )}
        </div>
      </header>

      <BrowserRouter>
        <Routes>
          <Route path="/" element={<FinanceApp />} />
        </Routes>
      </BrowserRouter>
    </div>
  );
}

export default App;