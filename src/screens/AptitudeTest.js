import React, { useState, useEffect, useCallback } from 'react';
import { useQuery, useMutation } from '@apollo/client';
import { GET_APTITUDE_QUESTIONS, SAVE_APTITUDE_ANSWERS } from '../graphql/queries';
import Layout from '../components/Layout';
import IntroPanel from '../components/IntroPanel';
import matematicasImg from '../assets/matematicas.jpeg';
import fisicaImg from '../assets/fisica.jpg';
import quimicaImg from '../assets/quimica.jpg';
import biologiaImg from '../assets/biologia.png';
import './AptitudeTest.css';

const SUBJECT_INFO = {
  MAT: { label: 'Matemática',              icon: '∑',  color: '#1B4F8A' },
  FIS: { label: 'Física',                  icon: '⚡', color: '#6B3FA0' },
  QUI: { label: 'Química',                 icon: '⚗', color: '#C0580A' },
  BIO: { label: 'Biología',                icon: '🌿', color: '#2E7D52' },
  RAZ: { label: 'Razonamiento Abstracto',  icon: '🧩', color: '#6B4C9A' },
};

// Imagen + texto introductorio por materia, reutilizando el mismo panel
// visual que en Welcome / InterestTest (IntroPanel) para mantener consistencia.
const SUBJECT_IMAGES = {
  MAT: matematicasImg,
  FIS: fisicaImg,
  QUI: quimicaImg,
  BIO: biologiaImg,
};

const SUBJECT_INTRO = {
  MAT: {
    titleLine1: 'Pon a prueba tu',
    titleEm: 'razonamiento lógico',
    desc: 'Resuelve problemas numéricos y algebraicos que evalúan tu capacidad de análisis matemático.',
  },
  FIS: {
    titleLine1: 'Explora las leyes',
    titleEm: 'de la física',
    desc: 'Responde preguntas sobre movimiento, energía y fuerzas que rigen los fenómenos naturales.',
  },
  QUI: {
    titleLine1: 'Descubre el mundo',
    titleEm: 'de la química',
    desc: 'Evalúa tu comprensión sobre la composición, estructura y transformación de la materia.',
  },
  BIO: {
    titleLine1: 'Conecta con',
    titleEm: 'la biología',
    desc: 'Pon a prueba tu conocimiento sobre los seres vivos y los procesos que sostienen la vida.',
  },
};

// Tamaño de imagen específico por materia (10px más grande que el default
// para Matemática, Química y Biología; Física conserva el tamaño base).
const SUBJECT_IMAGE_SIZE = {
  MAT: '285px',
  QUI: '285px',
  BIO: '285px',
};

const TIME_PER_SUBJECT = 15 * 60;

export default function AptitudeTest({ postulant, enabledSubjects, assessmentId, onComplete }) {
  const { data, loading, error } = useQuery(GET_APTITUDE_QUESTIONS, {
    variables: { subjects: enabledSubjects },
  });

  const [saveAptitudeAnswers] = useMutation(SAVE_APTITUDE_ANSWERS);

  const [groupedQuestions,  setGroupedQuestions]  = useState({});
  const [orderedSubjects,   setOrderedSubjects]   = useState([]);
  const [subjectIndex,      setSubjectIndex]       = useState(0);
  const [questionIndex,     setQuestionIndex]      = useState(0);
  const [answers,           setAnswers]            = useState({});
  const [selected,          setSelected]           = useState(null);
  const [timeLeft,          setTimeLeft]           = useState(TIME_PER_SUBJECT);
  const [animating,         setAnimating]          = useState(false);
  const [submitting,        setSubmitting]         = useState(false);
  const [ready,             setReady]              = useState(false);

  useEffect(() => {
    if (!data?.aptitudeQuestionsBySubjects) return;
    const groups = {};
    for (const q of data.aptitudeQuestionsBySubjects) {
      const code = q.area.code;
      if (!groups[code]) groups[code] = [];
      groups[code].push(q);
    }
    // Solo incluir las materias que REALMENTE tienen preguntas en la BD
    const validSubjects = enabledSubjects.filter(code => groups[code] && groups[code].length > 0);
    setGroupedQuestions(groups);
    setOrderedSubjects(validSubjects);
    setReady(true);
  }, [data, enabledSubjects]);

  useEffect(() => { setTimeLeft(TIME_PER_SUBJECT); }, [subjectIndex]);

  useEffect(() => {
    if (!ready) return;
    if (timeLeft <= 0) { handleFinishSubject(); return; }
    const t = setTimeout(() => setTimeLeft(s => s - 1), 1000);
    return () => clearTimeout(t);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [timeLeft, ready]);

  const currentSubjectCode      = orderedSubjects[subjectIndex];
  const currentQuestions        = groupedQuestions[currentSubjectCode] || [];
  const currentQuestion         = currentQuestions[questionIndex];
  const totalSubjects           = orderedSubjects.length;
  const totalQuestionsInSubject = currentQuestions.length;

  const formatTime = (secs) => {
    const m = Math.floor(secs / 60).toString().padStart(2, '0');
    const s = (secs % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  };

  const computeAndSaveResults = useCallback(async (finalAnswers) => {
    const results = {};
    for (const code of orderedSubjects) {
      const qs = groupedQuestions[code] || [];
      let score = 0;
      const failedQuestions = [];
      for (const q of qs) {
        const correct = finalAnswers[q.id] && q.correctAnswer &&
          finalAnswers[q.id].toLowerCase() === q.correctAnswer.toLowerCase();
        if (correct) {
          score++;
        } else {
          // Solo guardamos el enunciado de la pregunta — nunca cuál era
          // la respuesta correcta ni cuál marcó el postulante.
          failedQuestions.push(q.text);
        }
      }
      results[code] = { score, total: qs.length, failedQuestions };
    }

    setSubmitting(true);
    try {
      if (!assessmentId) {
        console.error('AptitudeTest: falta assessmentId — las respuestas NO se van a guardar en el backend.');
      } else {
        const responses = Object.entries(finalAnswers).map(([qId, val]) => ({
          questionId: qId,
          valueStr: val,
        }));
        await saveAptitudeAnswers({
          variables: { interestAssessmentId: assessmentId, responses },
        });
      }
    } catch (err) {
      console.error('Error guardando resultados:', err);
    } finally {
      setSubmitting(false);
    }

    onComplete(results);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [orderedSubjects, groupedQuestions, assessmentId]);

  const handleFinishSubject = useCallback(() => {
    if (subjectIndex < totalSubjects - 1) {
      setSubjectIndex(i => i + 1);
      setQuestionIndex(0);
      setSelected(null);
    } else {
      computeAndSaveResults(answers);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [subjectIndex, totalSubjects, answers, computeAndSaveResults]);

  const handleNext = () => {
    if (selected === null) return;
    const updated = { ...answers, [currentQuestion.id]: selected };
    setAnswers(updated);
    setSelected(null);

    setAnimating(true);
    setTimeout(() => {
      if (questionIndex < totalQuestionsInSubject - 1) {
        setQuestionIndex(i => i + 1);
      } else {
        handleFinishSubject();
      }
      setAnimating(false);
    }, 200);
  };

  // Estados de carga
  if (loading) return (
    <Layout step={2} totalSteps={3} title="Cargando pruebas...">
      <div className="apt-loading"><div className="spinner" /><p>Preparando preguntas…</p></div>
    </Layout>
  );

  if (error) return (
    <Layout step={2} totalSteps={3} title="Error">
      <div className="apt-error"><p>No se pudieron cargar las preguntas.</p><code>{error.message}</code></div>
    </Layout>
  );

  // Aún procesando grupos
  if (!ready) return (
    <Layout step={2} totalSteps={3} title="Preparando...">
      <div className="apt-loading"><div className="spinner" /><p>Organizando materias…</p></div>
    </Layout>
  );

  // Sin materias válidas con preguntas
  if (orderedSubjects.length === 0) return (
    <Layout step={2} totalSteps={3} title="Sin preguntas disponibles">
      <div className="apt-error">
        <p>No se encontraron preguntas para las materias seleccionadas.</p>
        <p style={{marginTop:8, fontSize:13, color:'#666'}}>
          Materias requeridas: {enabledSubjects.join(', ')}
        </p>
        <p style={{marginTop:4, fontSize:13, color:'#666'}}>
          Ejecuta <code>python manage.py seed_data</code> en el servidor para cargar las preguntas.
        </p>
      </div>
    </Layout>
  );

  if (submitting) return (
    <Layout step={2} totalSteps={3} title="Guardando resultados...">
      <div className="apt-loading"><div className="spinner" /><p>Procesando tus respuestas…</p></div>
    </Layout>
  );

  if (!currentQuestion) return (
    <Layout step={2} totalSteps={3} title="Cargando...">
      <div className="apt-loading"><div className="spinner" /></div>
    </Layout>
  );

  const info   = SUBJECT_INFO[currentSubjectCode] || { label: currentSubjectCode, icon: '📝', color: '#1B4F8A' };
  const options = currentQuestion.optionsJson
    ? (typeof currentQuestion.optionsJson === 'string'
        ? JSON.parse(currentQuestion.optionsJson)
        : currentQuestion.optionsJson)
    : {};
  const isLast        = questionIndex === totalQuestionsInSubject - 1;
  const isLastSubject = subjectIndex === totalSubjects - 1;
  const timerWarning  = timeLeft <= 60;

  // Detecta si las opciones son íconos SVG (preguntas de razonamiento abstracto)
  // o texto plano (resto de materias). Esto permite que ambos formatos
  // convivan sin romper preguntas existentes.
  const isSvgMarkup = (value) =>
    typeof value === 'string' && value.trim().startsWith('<svg');

  const optionEntries  = Object.entries(options);
  const hasVisualOptions = optionEntries.some(([, value]) => isSvgMarkup(value));
  const hasMatrixImage   = isSvgMarkup(currentQuestion.imageSvg);

  // Para Matemática, Física, Química y Biología mostramos el mismo panel
  // introductorio (imagen + texto) que en el test de intereses, en lugar
  // de dejar la pregunta sola ocupando todo el ancho.
  const showIntroPanel = !hasVisualOptions && !!SUBJECT_IMAGES[currentSubjectCode];

  return (
    <Layout step={2} totalSteps={3}>
      <div className={`apt-wrapper${currentSubjectCode === 'RAZ' ? ' apt-wrapper--raz' : ''}${showIntroPanel ? ' apt-wrapper--split' : ''}`}>

        {/* Columna introductoria: imagen + texto de la materia (MAT/FIS/QUI/BIO) */}
        {showIntroPanel && (
          <div className="apt-intro-col">
            <IntroPanel
              compact
              image={SUBJECT_IMAGES[currentSubjectCode]}
              imageMaxWidth={SUBJECT_IMAGE_SIZE[currentSubjectCode]}
              badge={info.label}
              titleLine1={SUBJECT_INTRO[currentSubjectCode]?.titleLine1}
              titleEm={SUBJECT_INTRO[currentSubjectCode]?.titleEm}
              description={SUBJECT_INTRO[currentSubjectCode]?.desc}
            />
          </div>
        )}

        {/* Columna izquierda: header + pregunta (para RAZ) o todo junto */}
        <div className={`apt-left-col${showIntroPanel ? ' apt-left-col--narrow' : ''}`}>
          <div className="apt-subject-header" style={{ borderColor: info.color + '44' }}>
            <div className="apt-subject-left">
              <span className="apt-subject-icon" style={{ color: info.color }}>{info.icon}</span>
              <div>
                <div className="apt-subject-name" style={{ color: info.color }}>{info.label}</div>
                <div className="apt-subject-counter">
                  Materia {subjectIndex + 1} de {totalSubjects} · Pregunta {questionIndex + 1} de {totalQuestionsInSubject}
                </div>
              </div>
            </div>
            <div className={`apt-timer${timerWarning ? ' apt-timer--warning' : ''}`}>
              ⏱ {formatTime(timeLeft)}
            </div>
          </div>

          <div className="apt-progress-bar">
            <div className="apt-progress-fill"
              style={{ width: `${(questionIndex / totalQuestionsInSubject) * 100}%`, background: info.color }} />
          </div>

          <div className={`apt-card${animating ? ' apt-card--exit' : ''}`}>
            <p className="apt-question">{currentQuestion.text}</p>

            {hasMatrixImage && (
              <div className="apt-matrix-wrap">
                <div dangerouslySetInnerHTML={{ __html: currentQuestion.imageSvg }} />
              </div>
            )}

            {/* Para RAZ: opciones van en columna derecha; para el resto: aquí mismo */}
            {!hasVisualOptions && (
              <>
                <div className="apt-options">
                  {optionEntries.map(([key, value]) => (
                    <button
                      key={key}
                      className={`apt-option${selected === key ? ' apt-option--selected' : ''}`}
                      onClick={() => setSelected(key)}
                    >
                      <span className="apt-option-key">{key.toUpperCase()}</span>
                      <span className="apt-option-text">{value}</span>
                    </button>
                  ))}
                </div>
                <button
                  className="btn-primary btn-full apt-next"
                  onClick={handleNext}
                  disabled={selected === null}
                >
                  {isLast && isLastSubject ? 'Ver resultados →' : isLast ? 'Siguiente materia →' : 'Siguiente pregunta →'}
                </button>
              </>
            )}
          </div>
        </div>

        {/* Columna derecha: solo para preguntas visuales (RAZ) */}
        {hasVisualOptions && (
          <div className="apt-right-col">
            <div className="apt-options apt-options--visual">
              {optionEntries.map(([key, value]) => {
                const visual = isSvgMarkup(value);
                return (
                  <button
                    key={key}
                    className={`apt-option${visual ? ' apt-option--visual' : ''}${selected === key ? ' apt-option--selected' : ''}`}
                    onClick={() => setSelected(key)}
                  >
                    <span className="apt-option-key">{key.toUpperCase()}</span>
                    {visual ? (
                      <span className="apt-option-icon" dangerouslySetInnerHTML={{ __html: value }} />
                    ) : (
                      <span className="apt-option-text">{value}</span>
                    )}
                  </button>
                );
              })}
            </div>
            <button
              className="btn-primary btn-full apt-next"
              onClick={handleNext}
              disabled={selected === null}
            >
              {isLast && isLastSubject ? 'Ver resultados →' : isLast ? 'Siguiente materia →' : 'Siguiente pregunta →'}
            </button>
          </div>
        )}

      </div>
    </Layout>
  );
}