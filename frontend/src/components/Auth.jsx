import React, { useState } from 'react';
import { supabase } from '@/lib/supabase';

export function Auth() {
  const [loading, setLoading] = useState(false);
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  const handleAuth = async (e) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg('');

    try {
      if (isSignUp) {
        const { error } = await supabase.auth.signUp({ email, password });
        if (error) throw error;
        alert('¡Registro exitoso! Ya puedes iniciar sesión.');
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
      }
    } catch (error) {
      setErrorMsg(error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)',
      padding: '20px',
      fontFamily: 'system-ui, -apple-system, sans-serif'
    }}>
      <div style={{
        width: '100%',
        maxWidth: '420px',
        backgroundColor: '#1e293b',
        borderRadius: '16px',
        border: '1px solid #334155',
        padding: '32px',
        boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.5), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
        textAlign: 'center'
      }}>
        {/* LOGO DE LA APP */}
        <div style={{
          width: '64px',
          height: '64px',
          backgroundColor: '#2563eb',
          borderRadius: '16px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          margin: '0 auto 16px',
          boxShadow: '0 10px 15px -3px rgba(37, 99, 235, 0.4)'
        }}>
          <span style={{ fontSize: '32px' }}>💰</span>
        </div>

        {/* NOMBRE DE LA APP */}
        <h1 style={{
          color: '#ffffff',
          fontSize: '24px',
          fontWeight: 'bold',
          margin: '0 0 6px 0'
        }}>
          Mis Finanzas
        </h1>
        
        <p style={{
          color: '#94a3b8',
          fontSize: '14px',
          margin: '0 0 24px 0'
        }}>
          {isSignUp ? 'Crea tu cuenta para gestionar tus ingresos y gastos' : 'Inicia sesión para acceder a tu panel'}
        </p>

        {errorMsg && (
          <div style={{
            backgroundColor: 'rgba(239, 68, 68, 0.1)',
            border: '1px solid #ef4444',
            color: '#fca5a5',
            padding: '10px',
            borderRadius: '8px',
            fontSize: '13px',
            marginBottom: '16px'
          }}>
            {errorMsg}
          </div>
        )}

        <form onSubmit={handleAuth} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div style={{ textAlign: 'left' }}>
            <label style={{ display: 'block', color: '#cbd5e1', fontSize: '13px', marginBottom: '6px' }}>
              Correo electrónico
            </label>
            <input
              type="email"
              placeholder="tu@correo.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              style={{
                width: '100%',
                padding: '12px 14px',
                borderRadius: '8px',
                border: '1px solid #475569',
                backgroundColor: '#0f172a',
                color: '#ffffff',
                fontSize: '14px',
                outline: 'none',
                boxSizing: 'border-box'
              }}
            />
          </div>

          <div style={{ textAlign: 'left' }}>
            <label style={{ display: 'block', color: '#cbd5e1', fontSize: '13px', marginBottom: '6px' }}>
              Contraseña
            </label>
            <input
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              style={{
                width: '100%',
                padding: '12px 14px',
                borderRadius: '8px',
                border: '1px solid #475569',
                backgroundColor: '#0f172a',
                color: '#ffffff',
                fontSize: '14px',
                outline: 'none',
                boxSizing: 'border-box'
              }}
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            style={{
              marginTop: '8px',
              width: '100%',
              padding: '12px',
              borderRadius: '8px',
              border: 'none',
              backgroundColor: '#2563eb',
              color: 'white',
              fontWeight: '600',
              fontSize: '15px',
              cursor: 'pointer',
              boxShadow: '0 4px 6px -1px rgba(37, 99, 235, 0.3)'
            }}
          >
            {loading ? 'Procesando...' : isSignUp ? 'Crear Cuenta' : 'Ingresar'}
          </button>
        </form>

        <button
          onClick={() => setIsSignUp(!isSignUp)}
          style={{
            marginTop: '20px',
            background: 'none',
            border: 'none',
            color: '#38bdf8',
            fontSize: '14px',
            cursor: 'pointer',
            fontWeight: '500'
          }}
        >
          {isSignUp ? '¿Ya tienes cuenta? Inicia sesión' : '¿No tienes cuenta? Regístrate gratis'}
        </button>
      </div>
    </div>
  );
}