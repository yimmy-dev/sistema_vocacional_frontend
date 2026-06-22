import React from 'react';
import './BottomBar.css';

/**
 * Barra inferior institucional reutilizable.
 * Props:
 *  - year?: number (default: año actual)
 */
export default function BottomBar({ year }) {
  const displayYear = year || new Date().getFullYear();

  return (
    <footer className="bb-footer">
      {/* Decoración esquina derecha — sin ola, solo el acento rojo y línea */}
      <svg className="bb-deco" viewBox="0 0 420 70" preserveAspectRatio="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
        <path d="M 420 70 L 420 0 L 170 0 C 215 14 242 34 265 52 C 292 68 332 74 365 70 Z" fill="#A01C2B" />
        <path d="M 170 0 C 215 14 242 34 265 52 C 292 68 332 74 365 70" fill="none" stroke="#fff" strokeWidth="4" strokeLinecap="round" />
      </svg>

      <div className="bb-content">
        <div className="bb-left">
          <span className="bb-icon" aria-hidden="true">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
              <path d="M12 3 1 8l11 5 9-4.1V17h2V8L12 3Z" fill="#fff" />
              <path d="M5 10.5V16c0 1.7 3.1 4 7 4s7-2.3 7-4v-5.5l-7 3.2-7-3.2Z" fill="#fff" opacity="0.85" />
            </svg>
          </span>
          <span className="bb-divider" aria-hidden="true" />
          <span className="bb-label">Ciencia, Cultura y Humanismo</span>
        </div>

        <div className="bb-right">
          <span className="bb-copy">© {displayYear} FIVC — UAGRM</span>
        </div>
      </div>
    </footer>
  );
}