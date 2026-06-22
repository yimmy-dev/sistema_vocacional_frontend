import React, { useState, useMemo, useEffect } from 'react';
import { useQuery, useMutation } from '@apollo/client';
import { GET_INTEREST_QUESTIONS, START_GUEST_ASSESSMENT, SUBMIT_ANSWERS } from '../graphql/queries';
import TopBar from '../components/TopBar';
import BottomBar from '../components/BottomBar';
import IntroPanel from '../components/IntroPanel';
import './InterestTest.css';

const INTEREST_TEST_TYPE_ID = '1';
const TIME_LIMIT = 15 * 60; // 15 minutos para todo el cuestionario de intereses

// Mezcla aleatoriamente un array (Fisher-Yates) sin modificar el original
function shuffleArray(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

const AREA_COLORS = {
  SIS: '#1B4F8A',
  CON: '#2E7D52',
  ALI: '#C0580A',
  AGR: '#6B3FA0',
};

export default function InterestTest({ postulant, onComplete }) {
  const { data, loading, error } = useQuery(GET_INTEREST_QUESTIONS, {
    variables: { testTypeId: INTEREST_TEST_TYPE_ID },
  });

  const [startGuestAssessment] = useMutation(START_GUEST_ASSESSMENT);
  const [submitAnswers]        = useMutation(SUBMIT_ANSWERS);

  const [answers,     setAnswers]     = useState({});
  const [current,     setCurrent]     = useState(0);
  const [animating,   setAnimating]   = useState(false);
  const [submitting,  setSubmitting]  = useState(false);
  const [submitError, setSubmitError] = useState('');
  const [timeLeft,    setTimeLeft]    = useState(TIME_LIMIT);

  // Mezcla las preguntas una sola vez al cargar (useMemo evita re-mezclar en cada render)
  const questions = useMemo(
    () => shuffleArray(data?.activeTestQuestions || []),
    [data]
  );
  const total    = questions.length;
  const question = questions[current];

  const formatTime = (secs) => {
    const m = Math.floor(secs / 60).toString().padStart(2, '0');
    const s = (secs % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  };

  // Envía las respuestas acumuladas hasta el momento (se usa tanto al
  // terminar normalmente como cuando se acaba el tiempo).
  const finishTest = async (finalAnswers) => {
    setSubmitting(true);
    setSubmitError('');

    try {
      const guestResult = await startGuestAssessment({
        variables: { nombre: postulant.nombre, ci: postulant.ci, colegio: postulant.colegio || '' },
      });
      const assessmentId = guestResult.data.startGuestAssessment.assessmentId;

      const responses = Object.entries(finalAnswers).map(([qId, val]) => ({
        questionId: qId,
        valueBool:  val,
      }));

      const submitResult = await submitAnswers({
        variables: { assessmentId, responses },
      });

      const { enabledSubjects, diagnosisSummary, assessment } =
        submitResult.data.submitAssessmentAnswers;

      onComplete(assessment.id, enabledSubjects, diagnosisSummary);

    } catch (err) {
      console.error('Error al procesar el test:', err);
      setSubmitError(
        'Ocurrió un error al guardar tus respuestas. ' +
        'Verifica que el servidor Django esté activo en el puerto 8000.'
      );
      setSubmitting(false);
    }
  };

  // Cuenta regresiva de 15 minutos — al llegar a 0 se envía el test
  // automáticamente con las respuestas que se hayan dado hasta entonces.
  useEffect(() => {
    if (loading || error || submitting || total === 0) return;
    if (timeLeft <= 0) { finishTest(answers); return; }
    const t = setTimeout(() => setTimeLeft(s => s - 1), 1000);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [timeLeft, loading, error, submitting, total]);

  const goNext = () => {
    setAnimating(true);
    setTimeout(() => {
      setCurrent(c => c + 1);
      setAnimating(false);
    }, 220);
  };

  const handleAnswer = async (value) => {
    if (!question || animating || submitting) return;

    const updated = { ...answers, [question.id]: value };
    setAnswers(updated);

    if (current < total - 1) {
      goNext();
      return;
    }

    finishTest(updated);
  };

  if (loading) return (
    <div className="it-fullscreen">
      <div className="it-loading">
        <div className="it-spinner" />
        <p>Preparando el cuestionario…</p>
      </div>
    </div>
  );

  if (error) return (
    <div className="it-fullscreen">
      <div className="it-loading">
        <p>No se pudo cargar el cuestionario.</p>
        <code>{error.message}</code>
      </div>
    </div>
  );

  const areaCode   = question?.area?.code;
  const areaColor  = AREA_COLORS[areaCode] || '#1B4F8A';
  const answered   = Object.keys(answers).length;
  const progress   = total > 0 ? Math.round((answered / total) * 100) : 0;

  return (
    <div className="it-fullscreen">

      {/* ── HEADER ── */}
      <TopBar stepLabel="Paso 1 de 3" userName={postulant?.nombre || 'Participante'} />

      {/* ── BODY ── */}
      <div className="it-body">

        {/* LEFT COLUMN — mismo panel introductorio que en Welcome */}
        <div className="it-intro-col">
          <IntroPanel />
        </div>

        {/* RIGHT COLUMN – Question */}
        <main className="it-main">

          {/* Progress circle */}
          <div className="it-progress-circle-wrap">
            <div className="it-progress-circle-track">
              <svg className="it-progress-circle" viewBox="0 0 80 80">
                <circle cx="40" cy="40" r="34" fill="none" stroke="rgba(27,79,138,0.15)" strokeWidth="6"/>
                <circle
                  cx="40" cy="40" r="34" fill="none"
                  stroke="#E8B84B" strokeWidth="6"
                  strokeDasharray={`${2 * Math.PI * 34}`}
                  strokeDashoffset={`${2 * Math.PI * 34 * (1 - progress / 100)}`}
                  strokeLinecap="round"
                  style={{ transform: 'rotate(-90deg)', transformOrigin: '50% 50%', transition: 'stroke-dashoffset 0.4s ease' }}
                />
              </svg>
              <div className="it-progress-circle-text">
                <div className="it-progress-pct">{progress}%</div>
                <div className="it-progress-lbl">completado</div>
              </div>
            </div>
            <p className="it-progress-caption">
              Llevas <strong>{answered}</strong> de <strong>{total}</strong> preguntas respondidas.
            </p>
          </div>

          {/* Question counter + timer */}
          <div className="it-counter-row">
            <div className="it-counter">
              Pregunta <strong>{current + 1}</strong> de <strong>{total}</strong>
            </div>
            <div className={`it-timer${timeLeft <= 60 ? ' it-timer--warning' : ''}`}>
              ⏱ {formatTime(timeLeft)}
            </div>
          </div>

          {/* Progress bar */}
          <div className="it-prog-bar">
            <div className="it-prog-fill" style={{ width: `${(current / total) * 100}%`, background: areaColor }} />
          </div>

          {/* Question card */}
          <div className={`it-card${animating ? ' it-card--exit' : ''}`}>
            <div className="it-card-header">
              <div className="it-card-icon" style={{ background: areaColor }}>?</div>
              <span className="it-card-label">Preguntas</span>
            </div>
            <div className="it-card-divider" style={{ background: areaColor }} />

            <p className="it-question">{question?.text}</p>

            {submitting ? (
              <div className="it-submitting">
                <div className="it-spinner" />
                <span>Procesando tus respuestas…</span>
              </div>
            ) : (
              <div className="it-actions">
                <button
                  className="it-btn it-btn--yes"
                  onClick={() => handleAnswer(true)}
                  disabled={submitting}
                >
                  <span className="it-btn-check">✓</span>
                  Sí
                </button>
                <button
                  className="it-btn it-btn--no"
                  onClick={() => handleAnswer(false)}
                  disabled={submitting}
                >
                  <span className="it-btn-cross">✗</span>
                  No
                </button>
              </div>
            )}
          </div>

          {submitError && (
            <div className="it-error-msg">
              <span>⚠️</span> {submitError}
            </div>
          )}

        </main>
      </div>

      {/* ── FOOTER ── */}
      <BottomBar />
    </div>
  );
}