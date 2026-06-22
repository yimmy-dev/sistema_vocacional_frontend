import React from 'react';
import entradaImg from '../assets/entrada.jpg';
import './IntroPanel.css';

/**
 * Panel introductorio reutilizable: badge + título "Descubre tu camino
 * profesional" + descripción + imagen institucional con bordes
 * desvanecidos.
 *
 * Se usa en Welcome y en InterestTest con el mismo tamaño, para que
 * ambas pantallas comparten exactamente el mismo layout de dos columnas
 * (panel introductorio a la izquierda, formulario/pregunta a la derecha).
 */
export default function IntroPanel({
  compact,
  image,
  imageMaxWidth,
  badge = 'Evaluación Vocacional',
  titleLine1 = 'Descubre tu',
  titleEm = 'camino profesional',
  description = 'Esta prueba te ayudará a identificar qué carrera se adapta mejor a tus ' +
    'intereses y habilidades. Consta de dos etapas: un cuestionario de intereses ' +
    'y pruebas de aptitud académica.',
}) {
  return (
    <div className={`ip-panel${compact ? ' ip-panel--compact' : ''}`}>
      <div className="ip-heading">
        <div className="ip-badge">{badge}</div>
        <h1 className="ip-title">
          {titleLine1}<br />
          <em>{titleEm}</em>
        </h1>
      </div>
      <p className="ip-desc">{description}</p>
      <img
        src={image || entradaImg}
        alt={badge}
        className="ip-image"
        style={imageMaxWidth ? { '--ip-image-max': imageMaxWidth } : undefined}
      />
    </div>
  );
}