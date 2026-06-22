import React, { useState, useEffect } from 'react';
import { useMutation } from '@apollo/client';
import { SET_CARRERA_ELEGIDA } from '../graphql/queries';
import { SUBJECT_LABELS, getCarrerasHabilitadas } from '../data/carreras';
import TopBar from '../components/TopBar';
import BottomBar from '../components/BottomBar';
import './InterestResults.css';

const TIME_LIMIT = 15 * 60; // 15 minutos para elegir carrera y continuar

export default function InterestResults({ postulant, assessmentId, enabledSubjects, summary, onContinue }) {
  const [setCarreraElegida] = useMutation(SET_CARRERA_ELEGIDA);
  const carrerasHabilitadas = getCarrerasHabilitadas(enabledSubjects);
  const [selectedCarrera, setSelectedCarrera] = useState(null);
  const [timeLeft,        setTimeLeft]        = useState(TIME_LIMIT);

  const formatTime = (secs) => {
    const m = Math.floor(secs / 60).toString().padStart(2, '0');
    const s = (secs % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  };

  // Guarda la carrera elegida y avanza al test de aptitudes.
  const proceed = async (carrera) => {
    if (!carrera) return;
    if (assessmentId) {
      try {
        await setCarreraElegida({ variables: { assessmentId, carreraElegida: carrera.nombre } });
      } catch (err) { console.error('Error guardando carrera:', err); }
    }
    onContinue(carrera.materiasConRaz || carrera.materias, carrera);
  };

  const handleComenzar = () => proceed(selectedCarrera);

  // Cuenta regresiva de 15 minutos — al llegar a 0 se continúa
  // automáticamente con la carrera elegida (o la primera recomendada si
  // el postulante no llegó a seleccionar ninguna).
  useEffect(() => {
    if (timeLeft <= 0) {
      proceed(selectedCarrera || carrerasHabilitadas[0] || null);
      return;
    }
    const t = setTimeout(() => setTimeLeft(s => s - 1), 1000);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [timeLeft]);

  return (
    <div className="ir-fullscreen">

      {/* HEADER */}
      <TopBar stepLabel="Paso 2 de 3" userName={postulant?.nombre || 'Participante'} />

      {/* BODY */}
      <div className="ir-body">

        {/* LEFT COLUMN — mismo estilo de tarjetas que Welcome / InterestTest */}
        <aside className="ir-left-col">
          <div className="ir-card ir-status-card">
            <span className="ir-status-icon">✅</span>
            <div>
              <div className="ir-status-title">Cuestionario completado</div>
              <div className="ir-status-sub">Etapa 1 finalizada</div>
            </div>
          </div>

          <div className="ir-card">
            <div className="ir-card-title">Carreras con afinidad a tu perfil</div>
            <div className="ir-carrera-list">
              {carrerasHabilitadas.map(carrera => (
                <div key={carrera.code} className="ir-carrera-item" style={{ borderColor: carrera.color + '55' }}>
                  <div className="ir-carrera-item-header">
                    <span className="ir-carrera-item-icon">{carrera.icon}</span>
                    <span className="ir-carrera-item-nombre" style={{ color: carrera.color }}>
                      {carrera.nombre}
                    </span>
                  </div>
                  <p className="ir-carrera-item-desc">{carrera.descripcion}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="ir-card ir-info-card">
            <p>Selecciona la carrera que más te interesa para realizar la <strong>prueba de aptitud académica</strong>.</p>
            <p style={{ marginTop: 10 }}>Cada prueba tiene <strong>15 minutos por materia</strong> y evalúa tus habilidades reales.</p>
            <p style={{ marginTop: 10 }}>⏱ Tienes <strong>15 minutos</strong> para elegir. Si el tiempo se agota, se continuará automáticamente con la carrera seleccionada (o la primera recomendada).</p>
          </div>

          {selectedCarrera && (
            <div className="ir-card ir-selected-card" style={{ borderColor: selectedCarrera.color, background: selectedCarrera.color + '0F' }}>
              <div className="ir-selected-label">Seleccionaste:</div>
              <div className="ir-selected-name" style={{ color: selectedCarrera.color }}>
                {selectedCarrera.icon} {selectedCarrera.nombre}
              </div>
              <div className="ir-selected-mats">
                {selectedCarrera.materias.map(m => (
                  <span key={m} className="ir-mat-tag" style={{ background: selectedCarrera.color + '18', color: selectedCarrera.color }}>
                    {SUBJECT_LABELS[m]}
                  </span>
                ))}
              </div>
            </div>
          )}
        </aside>

        {/* RIGHT MAIN */}
        <main className="ir-main">
          <div className="ir-main-header">
            <div className="ir-main-header-left">
              <div className="ir-main-icon">🎓</div>
              <div>
                <div className="ir-main-title">Resultados de Intereses</div>
                <div className="ir-main-sub">Hola <strong>{postulant?.nombre}</strong>. Estas carreras se ajustan a tu perfil:</div>
              </div>
            </div>
            <div className={`ir-timer${timeLeft <= 60 ? ' ir-timer--warning' : ''}`}>
              ⏱ {formatTime(timeLeft)}
            </div>
          </div>
          <div className="ir-main-divider" />

          {carrerasHabilitadas.length === 0 ? (
            <div className="ir-empty">
              No se habilitó ninguna carrera. Por favor consulta al orientador.
            </div>
          ) : (
            <div className="ir-carreras">
              {carrerasHabilitadas.map(carrera => {
                const isSelected = selectedCarrera?.code === carrera.code;
                return (
                  <button
                    key={carrera.code}
                    className={`ir-carrera-card${isSelected ? ' ir-carrera-card--selected' : ''}`}
                    style={{
                      borderColor: carrera.color,
                      background: isSelected ? carrera.color + '14' : '#fff',
                    }}
                    onClick={() => setSelectedCarrera(carrera)}
                  >
                    <div className="ir-carrera-top">
                      <span className="ir-carrera-icon">{carrera.icon}</span>
                      <div className="ir-carrera-info">
                        <div className="ir-carrera-nombre" style={{ color: carrera.color }}>
                          {carrera.nombre}
                        </div>
                        <div className="ir-carrera-desc" style={{ color: isSelected ? '#475569' : '#666' }}>
                          {carrera.descripcion}
                        </div>
                      </div>
                      <div className="ir-carrera-check" style={{ borderColor: carrera.color, background: isSelected ? carrera.color : 'transparent' }}>
                        {isSelected && <span style={{ color: '#fff' }}>✓</span>}
                      </div>
                    </div>
                    <div className="ir-carrera-materias">
                      <span className="ir-carrera-mats-label" style={{ color: isSelected ? carrera.color : '#888' }}>
                        Pruebas:
                      </span>
                      {carrera.materias.map(m => (
                        <span key={m} className="ir-mat-tag"
                          style={{ background: carrera.color + (isSelected ? '22' : '18'), color: carrera.color }}>
                          {SUBJECT_LABELS[m]}
                        </span>
                      ))}
                    </div>
                  </button>
                );
              })}
            </div>
          )}

          <button
            className="ir-cta-btn"
            onClick={handleComenzar}
            disabled={!selectedCarrera}
            style={{ background: selectedCarrera ? selectedCarrera.color : '#ccc' }}
          >
            {selectedCarrera ? `Comenzar prueba de ${selectedCarrera.nombre} →` : 'Selecciona una carrera para continuar'}
          </button>
        </main>
      </div>

      {/* FOOTER */}
      <BottomBar />
    </div>
  );
}