import React, { useState } from 'react';
import { getCarrerasHabilitadas } from '../data/carreras';
import TopBar from '../components/TopBar';
import BottomBar from '../components/BottomBar';
import { SUBJECT_INFO, generatePDF } from '../utils/pdfReport';
import './FinalReport.css';

export default function FinalReport({ postulant, carrera, allEnabledSubjects, carrerasProbadas, aptitudeResults, interestSummary, onStartAnotherCareer, onFinish }) {
  const [expandedFails, setExpandedFails] = useState({});

  const aprobadas    = Object.entries(aptitudeResults).filter(([, r]) => r.total > 0 && r.score / r.total >= 0.6).length;
  const totalMaterias = Object.keys(aptitudeResults).length;
  const aprobaTodo   = aprobadas === totalMaterias && totalMaterias > 0;

  // Materias que no alcanzaron el 60% — solo nombre y porcentaje,
  // nunca el detalle de qué respuestas fueron incorrectas.
  const materiasNoAprobadas = Object.entries(aptitudeResults)
    .map(([code, r]) => {
      const pct = r.total > 0 ? Math.round((r.score / r.total) * 100) : 0;
      return { code, pct, ...SUBJECT_INFO[code] };
    })
    .filter(m => m.pct < 60);

  // Promedio general = suma de los % de cada materia rendida / total de materias rendidas
  const sumaPorcentajes = Object.values(aptitudeResults)
    .reduce((acc, r) => acc + (r.total > 0 ? (r.score / r.total) * 100 : 0), 0);
  const promedioGeneral = totalMaterias > 0 ? Math.round(sumaPorcentajes / totalMaterias) : 0;

  // Otras carreras con las que el postulante también tuvo afinidad en el
  // test de intereses, excluyendo la carrera actual y las que ya rindió
  // antes en esta misma sesión.
  const carrerasHabilitadas = getCarrerasHabilitadas(allEnabledSubjects || []);
  const yaProbadas = carrerasProbadas || [];
  const otrasCarreras = carrerasHabilitadas.filter(
    c => c.code !== carrera?.code && !yaProbadas.includes(c.code)
  );

  return (
    <div className="fr-fullscreen">

      {/* HEADER */}
      <TopBar stepLabel="Paso 3 de 3 — Informe Final" userName={postulant?.nombre || 'Participante'} />

      {/* BODY */}
      <div className="fr-body">

        {/* LEFT COLUMN — mismas tarjetas claras que en Resultados de Intereses */}
        <aside className="fr-left-col">

          {/* Postulante */}
          <div className="fr-card fr-card--postulant">
            <div className="fr-avatar">{(postulant?.nombre || 'P').charAt(0).toUpperCase()}</div>
            <div className="fr-postulant-name">{postulant?.nombre}</div>
            <div className="fr-postulant-ci">C.I. {postulant?.ci}</div>
          </div>

          {/* Carrera evaluada */}
          {carrera && (
            <div className="fr-card fr-card--carrera" style={{ background: carrera.color + '14', boxShadow: `0 4px 16px ${carrera.color}33` }}>
              <div className="fr-card-title">Carrera evaluada</div>
              <div className="fr-carrera-name" style={{ color: carrera.color }}>
                {carrera.icon} {carrera.nombre}
              </div>
            </div>
          )}

          {/* Veredicto */}
          <div className={`fr-card fr-card--verdict${aprobaTodo ? ' fr-card--verdict-ok' : ' fr-card--verdict-fail'}`}>
            <div className="fr-verdict-card-icon">{aprobaTodo ? '🎉' : '📚'}</div>
            <div className="fr-verdict-card-title">
              {aprobaTodo ? 'Perfil apto' : 'Necesita refuerzo'}
            </div>
            <div className="fr-verdict-card-desc">
              {aprobaTodo
                ? `Aprobaste las ${totalMaterias} materias requeridas.`
                : `Aprobaste ${aprobadas} de ${totalMaterias} materias.`}
            </div>
          </div>

          {/* Nota */}
          <div className="fr-card fr-card--note">
            📌 Puntaje mínimo de aprobación: <strong>60%</strong> por materia.
          </div>
        </aside>

        {/* MAIN */}
        <main className="fr-main">
          <div className="fr-main-header">
            <div className="fr-main-icon">📋</div>
            <div>
              <div className="fr-main-title">Resultados de Aptitud Académica</div>
              <div className="fr-main-sub">Evaluación completa por materia</div>
            </div>
          </div>
          <div className="fr-main-divider" />

          {/* Resumen general: umbral de aprobación + promedio obtenido */}
          {totalMaterias > 0 && (
            <div className="fr-need-summary">
              <div className="fr-need-stat">
                <span className="fr-need-stat-icon">✅</span>
                <span className="fr-need-stat-text"><strong>60%</strong> para aprobar cada materia</span>
              </div>
              <div className="fr-need-stat">
                <span className="fr-need-stat-icon">📊</span>
                <span className="fr-need-stat-text">
                  Necesitas mínimo <strong>51</strong> de promedio final para aprobar. Tu promedio es de: <strong>{promedioGeneral}</strong>
                </span>
              </div>
            </div>
          )}

          <div className="fr-subjects">
            {Object.entries(aptitudeResults).map(([code, result]) => {
              const info     = SUBJECT_INFO[code];
              const pct      = result.total > 0 ? Math.round((result.score / result.total) * 100) : 0;
              const approved = pct >= 60;
              return (
                <div key={code} className="fr-subject-card" style={{ background: info?.bg }}>
                  <div className="fr-subject-top">
                    <div className="fr-subject-left">
                      <span className="fr-subject-icon" style={{ color: info?.color }}>{info?.icon}</span>
                      <span className="fr-subject-name" style={{ color: info?.color }}>{info?.label}</span>
                    </div>
                    <span className={`fr-badge${approved ? ' fr-badge--ok' : ' fr-badge--fail'}`}>
                      {approved ? '✓ Aprobado' : '✗ No aprobado'}
                    </span>
                  </div>

                  <div className="fr-subject-score-row">
                    <span className="fr-score-num">{result.score}<span>/{result.total}</span></span>
                    <span className="fr-score-pct" style={{ color: approved ? info?.color : '#c0392b' }}>{pct}%</span>
                  </div>

                  <div className="fr-subject-bar">
                    <div className="fr-subject-fill" style={{ width: `${pct}%`, background: approved ? info?.color : '#c0392b' }} />
                    <div className="fr-subject-threshold" />
                  </div>
                  <div className="fr-subject-hint">
                    {approved ? '✅ Tienes buena base para esta materia.' : '⚠️ Se recomienda reforzar esta área.'}
                  </div>

                  {!approved && (
                    result.failedQuestions?.length > 0 ? (
                      <div className="fr-subject-fails">
                        <button
                          type="button"
                          className="fr-subject-fails-toggle"
                          onClick={() => setExpandedFails(prev => ({ ...prev, [code]: !prev[code] }))}
                        >
                          {expandedFails[code] ? '▲ Ocultar' : '▼ Ver'} preguntas a repasar ({result.failedQuestions.length})
                        </button>
                        {expandedFails[code] && (
                          <ul className="fr-subject-fails-list">
                            {result.failedQuestions.map((q, i) => (
                              <li key={i}>{q}</li>
                            ))}
                          </ul>
                        )}
                      </div>
                    ) : (
                      result.failedQuestions === undefined && (
                        <div className="fr-subject-fails-missing">
                          Vuelve a rendir esta prueba para ver el detalle de las preguntas a repasar.
                        </div>
                      )
                    )
                  )}
                </div>
              );
            })}
          </div>

          {/* Verdict banner */}
          {carrera && (
            <div className={`fr-verdict${aprobaTodo ? ' fr-verdict--ok' : ' fr-verdict--fail'}`}>
              <span className="fr-verdict-icon">{aprobaTodo ? '🎉' : '📚'}</span>
              <div>
                <div className="fr-verdict-title">
                  {aprobaTodo ? `¡Apto para ${carrera.nombre}!` : 'Necesitas reforzar algunas áreas'}
                </div>
                <div className="fr-verdict-desc">
                  {aprobaTodo
                    ? 'Aprobaste todas las pruebas requeridas. Tienes el perfil académico necesario para esta carrera.'
                    : `Se recomienda reforzar ${materiasNoAprobadas.length === 1 ? 'esta área' : 'estas áreas'} antes de postularte: ${materiasNoAprobadas.map(m => `${m.label} (${m.pct}%)`).join(', ')}.`}
                </div>
              </div>
            </div>
          )}

          {otrasCarreras.length > 0 && (
            <div className="fr-other-careers">
              <div className="fr-other-careers-title">
                🎯 También tuviste afinidad con {otrasCarreras.length === 1 ? 'esta carrera' : 'estas carreras'}. Si quieres, puedes rendir su prueba de aptitud también:
              </div>
              <div className="fr-other-careers-list">
                {otrasCarreras.map(c => (
                  <button
                    key={c.code}
                    className="fr-other-career-btn"
                    style={{ borderColor: c.color, color: c.color }}
                    onClick={() => onStartAnotherCareer && onStartAnotherCareer(c)}
                  >
                    {c.icon} Probar aptitud de {c.nombre} →
                  </button>
                ))}
              </div>
            </div>
          )}

          <div className="fr-final-actions">
            <button
              className="fr-download-btn"
              onClick={() => generatePDF(postulant, carrera, aptitudeResults, interestSummary, allEnabledSubjects)}
            >
              ⬇ Descargar informe en PDF
            </button>
            <button
              className="fr-finish-btn"
              onClick={onFinish}
            >
              Finalizar prueba
            </button>
          </div>
        </main>
      </div>

      {/* FOOTER */}
      <BottomBar />
    </div>
  );
}