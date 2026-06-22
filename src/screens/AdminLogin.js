import React, { useState } from 'react';
import { useMutation } from '@apollo/client';
import { ADMIN_LOGIN } from '../graphql/queries';
import BottomBar from '../components/BottomBar';
import logo from '../assets/logo.png';
import './AdminLogin.css';

export default function AdminLogin({ onSuccess, onBack }) {
  const [form,  setForm]  = useState({ username: '', password: '' });
  const [error, setError] = useState('');

  const [adminLogin, { loading }] = useMutation(ADMIN_LOGIN);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (!form.username || !form.password) {
      setError('Completa todos los campos.');
      return;
    }
    try {
      const result = await adminLogin({ variables: form });
      const { success, error: serverError } = result.data.adminLogin;
      if (success) {
        onSuccess();
      } else {
        setError(serverError || 'Error al iniciar sesión.');
      }
    } catch (err) {
      setError('No se pudo conectar con el servidor.');
    }
  };

  return (
    <div className="al-page">
      <div className="al-page-center">
      <div className="al-card">
        {/* Logo / encabezado */}
        <div className="al-header">
          <img src={logo} alt="Escudo FIVC" className="al-logo" />
          <h1 className="al-title">Panel Administrativo</h1>
          <p className="al-subtitle">Orientación Vocacional</p>
        </div>

        <form className="al-form" onSubmit={handleSubmit} noValidate>
          <div className="al-field">
            <label htmlFor="username">Usuario</label>
            <input
              id="username"
              type="text"
              placeholder="Nombre de usuario"
              value={form.username}
              autoComplete="username"
              onChange={e => setForm({ ...form, username: e.target.value })}
            />
          </div>

          <div className="al-field">
            <label htmlFor="password">Contraseña</label>
            <input
              id="password"
              type="password"
              placeholder="••••••••"
              value={form.password}
              autoComplete="current-password"
              onChange={e => setForm({ ...form, password: e.target.value })}
            />
          </div>

          {error && <div className="al-error">{error}</div>}

          <button className="al-btn-submit" type="submit" disabled={loading}>
            {loading ? <span className="al-spinner" /> : 'Ingresar al panel'}
          </button>
        </form>

        <button className="al-btn-back" onClick={onBack}>
          ← Volver al inicio
        </button>
      </div>
      </div>
      <BottomBar />
    </div>
  );
}
