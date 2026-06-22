import React, { useState } from 'react';
import Layout from '../components/Layout';
import IntroPanel from '../components/IntroPanel';
import './Welcome.css';

export default function Welcome({ onStart, onAdminClick }) {
  const [form, setForm] = useState({ nombre: '', ci: '', colegio: '', carrera: '' });
  const [errors, setErrors] = useState({});

  const carreras = [
    { value: '', label: 'Sin preferencia' },
    { value: 'SIS', label: 'Ingeniería de Sistemas' },
    { value: 'CON', label: 'Contaduría Pública' },
    { value: 'ALI', label: 'Industrialización de Alimentos' },
    { value: 'AGR', label: 'Agropecuaria' },
  ];

  const validate = () => {
    const e = {};
    if (!form.nombre.trim()) e.nombre = 'Por favor ingresa tu nombre completo.';
    if (!form.ci.trim()) e.ci = 'Por favor ingresa tu número de C.I.';
    else if (!/^\d{6,10}$/.test(form.ci.trim())) e.ci = 'La C.I. debe tener entre 6 y 10 dígitos.';
    if (!form.colegio.trim()) e.colegio = 'Por favor ingresa el nombre de tu colegio.';
    return e;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length > 0) { setErrors(errs); return; }
    onStart(form);
  };

  return (
    <Layout contentMaxWidth="1200px">
      <div className="welcome">
        <IntroPanel />

        <form className="welcome-form" onSubmit={handleSubmit} noValidate>
          <div className="welcome-steps">
            <div className="welcome-step">
              <span className="welcome-step-num">1</span>
              <span>Cuestionario de intereses — respuestas Sí / No</span>
            </div>
            <div className="welcome-step">
              <span className="welcome-step-num">2</span>
              <span>Pruebas de aptitud académica — opción múltiple</span>
            </div>
            <div className="welcome-step">
              <span className="welcome-step-num">3</span>
              <span>Informe de resultados descargable en PDF</span>
            </div>
          </div>

          <div className="welcome-form-header">
            <h2 className="welcome-form-title">Ingrese sus datos</h2>
            <div className="welcome-form-divider"></div>
          </div>

          <div className="field">
            <label className="field-label" htmlFor="nombre">Nombre completo</label>
            <input
              id="nombre"
              className={`field-input${errors.nombre ? ' field-input--error' : ''}`}
              type="text"
              placeholder="Ej: María Fernanda López"
              value={form.nombre}
              onChange={e => { setForm({...form, nombre: e.target.value}); setErrors({...errors, nombre: ''}); }}
            />
            {errors.nombre && <span className="field-error">{errors.nombre}</span>}
          </div>

          <div className="field">
            <label className="field-label" htmlFor="ci">Cédula de Identidad</label>
            <input
              id="ci"
              className={`field-input${errors.ci ? ' field-input--error' : ''}`}
              type="text"
              placeholder="Ej: 12345678"
              value={form.ci}
              onChange={e => { setForm({...form, ci: e.target.value}); setErrors({...errors, ci: ''}); }}
            />
            {errors.ci && <span className="field-error">{errors.ci}</span>}
          </div>

          {/* ── NUEVO: Campo Colegio ──────────────────────────────────────── */}
          <div className="field">
            <label className="field-label" htmlFor="colegio">Colegio de procedencia</label>
            <input
              id="colegio"
              className={`field-input${errors.colegio ? ' field-input--error' : ''}`}
              type="text"
              placeholder="Ej: Unidad Educativa San Simón"
              value={form.colegio}
              onChange={e => { setForm({...form, colegio: e.target.value}); setErrors({...errors, colegio: ''}); }}
            />
            {errors.colegio && <span className="field-error">{errors.colegio}</span>}
          </div>

          <div className="field">
            <label className="field-label" htmlFor="carrera">
              Carrera de preferencia <span className="field-optional">(opcional)</span>
            </label>
            <select
              id="carrera"
              className="field-input field-select"
              value={form.carrera}
              onChange={e => setForm({...form, carrera: e.target.value})}
            >
              {carreras.map(c => (
                <option key={c.value} value={c.value}>{c.label}</option>
              ))}
            </select>
          </div>

          <button className="btn-primary btn-full" type="submit">
            Comenzar evaluación →
          </button>
          <div className="welcome-admin-link">
  <button type="button" onClick={onAdminClick}>Acceso administrador</button>
</div>
        </form>
      </div>
    </Layout>
  );
}