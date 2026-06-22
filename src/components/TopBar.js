import React from 'react';
import logo from '../assets/logo.png';
import './TopBar.css';

/**
 * Barra superior institucional reutilizable.
 *
 * Props:
 *  - stepLabel?: string   → texto del badge central, ej. "Paso 1 de 3"
 *  - userName?: string    → si se pasa, muestra "{userName}" con avatar en vez de "Bienvenido"
 *  - progress?: number    → 0–100, si se pasa dibuja una barra de progreso debajo del header
 *  - progressColor?: string
 */
export default function TopBar({ stepLabel, userName, progress, progressColor }) {
  return (
    <header className="tb-header">
      <svg className="tb-curve" viewBox="0 0 1536 150" preserveAspectRatio="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
        {/* Fondo azul principal */}
        <rect x="0" y="0" width="1536" height="130" fill="#0F2A52" />
        {/* Rojo esquina derecha */}
        <path d="M 1536 0 L 1536 130 L 1230 130 C 1290 112 1320 88 1340 65 C 1365 35 1410 8 1536 0 Z" fill="#A01C2B" />
        {/* Línea blanca decorativa */}
        <path d="M 1536 0 C 1410 8 1365 35 1340 65 C 1320 88 1290 112 1230 130" fill="none" stroke="#fff" strokeWidth="5" />
        {/* Ola de transición suave hacia el fondo de la página */}
        <path d="M 0 115 C 200 130 400 148 768 140 C 1100 132 1350 118 1536 128 L 1536 150 L 0 150 Z" style={{ fill: 'var(--color-bg)' }} />
      </svg>

      <div className="tb-content">
        <div className="tb-brand">
          <img src={logo} alt="Escudo FIVC" className="tb-logo" />
          <div className="tb-titles">
            <h1 className="tb-title">
              ORIENTACIÓN VOCACIONAL <span className="tb-sep">|</span> <span className="tb-fivc">FIVC</span>
            </h1>
            <p className="tb-subtitle">Facultad Integral de los Valles Cruceños</p>
          </div>
        </div>

        <div className="tb-right">
          {stepLabel && <div className="tb-step">{stepLabel}</div>}
          <div className="tb-user">
            <span className="tb-avatar">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                <circle cx="12" cy="8" r="4" fill="#fff" />
                <path d="M4 20c0-4.4 3.6-7 8-7s8 2.6 8 7" fill="#fff" />
              </svg>
            </span>
            <span>{userName || 'Bienvenido'}</span>
          </div>
        </div>
      </div>
    </header>
  );
}