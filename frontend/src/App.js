import "@/App.css";
import { useState, useEffect } from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { Toaster } from "sonner";
import { supabase } from "@/lib/supabase";
import { Auth } from "@/components/Auth";
import FinanceApp from "@/pages/FinanceApp";

function App() {
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // 1. Obtener la sesión actual al cargar la app
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setLoading(false);
    });

    // 2. Escuchar cambios de sesión (login / logout)
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  // Pantalla de carga mientras verifica si hay usuario
  if (loading) {
    return (
      <div style={{ display: "flex", justifyContent: "center", alignItems: "center", height: "100vh" }}>
        <p>Cargando aplicación...</p>
      </div>
    );
  }

  // Si no hay sesión iniciada, muestra la pantalla de Login / Registro
  if (!session) {
    return (
      <div className="App">
        <Toaster position="top-right" richColors />
        <Auth />
      </div>
    );
  }

  // Si el usuario está autenticado, muestra las rutas de la app con la barra de sesión
  return (
    <div className="App">
      <Toaster position="top-right" richColors />

      {/* Barra superior de sesión */}
      <header
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          padding: "10px 20px",
          backgroundColor: "#f4f4f5",
          borderBottom: "1px solid #e4e4e7",
          fontSize: "14px",
        }}
      >
        <span>
          Sesión activa: <strong>{session.user.email}</strong>
        </span>
        <button
          onClick={() => supabase.auth.signOut()}
          style={{
            padding: "6px 12px",
            borderRadius: "6px",
            border: "1px solid #d4d4d8",
            backgroundColor: "#ffffff",
            cursor: "pointer",
            fontWeight: "500",
          }}
        >
          Cerrar Sesión
        </button>
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