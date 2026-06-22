import React, { useState, useEffect } from 'react';
import { useQuery, useMutation } from '@apollo/client';
import { IS_ADMIN_LOGGED_IN, SET_CARRERA_ELEGIDA } from './graphql/queries';

import Welcome         from './screens/Welcome';
import InterestTest    from './screens/InterestTest';
import InterestResults from './screens/InterestResults';
import AptitudeTest    from './screens/AptitudeTest';
import FinalReport     from './screens/FinalReport';
import AdminLogin      from './screens/AdminLogin';
import AdminDashboard  from './screens/AdminDashboard';

const SCREENS = {
  WELCOME:  'welcome',
  INTEREST: 'interest',
  RESULTS:  'results',
  APTITUDE: 'aptitude',
  REPORT:   'report',
};

export default function App() {
  const [mode,   setMode]   = useState('student');
  const [screen, setScreen] = useState(SCREENS.WELCOME);

  const [postulant,        setPostulant]        = useState(null);
  const [assessmentId,     setAssessmentId]     = useState(null);
  const [enabledSubjects,  setEnabledSubjects]  = useState([]);  // todas las materias habilitadas
  const [selectedSubjects, setSelectedSubjects] = useState([]);  // solo las de la carrera elegida
  const [selectedCarrera,  setSelectedCarrera]  = useState(null);
  const [interestSummary,  setInterestSummary]  = useState('');
  const [aptitudeResults,  setAptitudeResults]  = useState({});
  const [carrerasProbadas, setCarrerasProbadas] = useState([]); // códigos de carreras ya evaluadas en esta sesión

  const { data: authData, refetch: refetchAuth } = useQuery(IS_ADMIN_LOGGED_IN, {
    fetchPolicy: 'network-only',
  });

  const [setCarreraElegida] = useMutation(SET_CARRERA_ELEGIDA);

  useEffect(() => {
    if (authData?.isAdminLoggedIn) setMode('admin_dashboard');
  }, [authData]);

  useEffect(() => {
    if (window.location.pathname === '/admin-panel') setMode('admin_login');
  }, []);

  const handleAdminLoginSuccess = () => { refetchAuth(); setMode('admin_dashboard'); };
  const handleAdminLogout = () => {
    setMode('student');
    setScreen(SCREENS.WELCOME);
    window.history.replaceState(null, '', '/');
  };

  // El postulante tuvo afinidad con más de una carrera: le permitimos
  // rendir también la prueba de aptitud de otra de ellas, sin tener que
  // repetir el test de intereses desde cero.
  const handleStartAnotherCareer = async (carreraObj) => {
    if (assessmentId) {
      try {
        await setCarreraElegida({ variables: { assessmentId, carreraElegida: carreraObj.nombre } });
      } catch (err) { console.error('Error guardando carrera:', err); }
    }
    setSelectedCarrera(carreraObj);
    setSelectedSubjects(carreraObj.materiasConRaz || carreraObj.materias);
    setAptitudeResults({});
    setScreen(SCREENS.APTITUDE);
  };

  // "Finalizar prueba": vuelve al inicio para que el siguiente postulante
  // pueda usar el mismo equipo, sin dejar datos de la sesión anterior.
  const handleFinish = () => {
    setPostulant(null);
    setAssessmentId(null);
    setEnabledSubjects([]);
    setSelectedSubjects([]);
    setSelectedCarrera(null);
    setInterestSummary('');
    setAptitudeResults({});
    setCarrerasProbadas([]);
    setScreen(SCREENS.WELCOME);
  };

  if (mode === 'admin_login') {
    return <AdminLogin onSuccess={handleAdminLoginSuccess} onBack={() => { setMode('student'); window.history.replaceState(null, '', '/'); }} />;
  }
  if (mode === 'admin_dashboard') {
    return <AdminDashboard onLogout={handleAdminLogout} />;
  }

  return (
    <>
      {screen === SCREENS.WELCOME && (
        <Welcome
          onStart={(data) => { setPostulant(data); setScreen(SCREENS.INTEREST); }}
          onAdminClick={() => setMode('admin_login')}
        />
      )}

      {screen === SCREENS.INTEREST && (
        <InterestTest
          postulant={postulant}
          onComplete={(asmId, subjects, summary) => {
            setAssessmentId(asmId);
            setEnabledSubjects(subjects);
            setInterestSummary(summary);
            setScreen(SCREENS.RESULTS);
          }}
        />
      )}

      {screen === SCREENS.RESULTS && (
        <InterestResults
          postulant={postulant}
          assessmentId={assessmentId}
          enabledSubjects={enabledSubjects}
          summary={interestSummary}
          onContinue={(materiasCarrera, carrera) => {
            // Recibe solo las materias de la carrera que el postulante eligió
            setSelectedSubjects(materiasCarrera);
            setSelectedCarrera(carrera);
            setScreen(SCREENS.APTITUDE);
          }}
        />
      )}

      {screen === SCREENS.APTITUDE && (
        <AptitudeTest
          postulant={postulant}
          enabledSubjects={selectedSubjects}   // ← solo las materias de la carrera elegida
          carrera={selectedCarrera}
          assessmentId={assessmentId}
          onComplete={(results) => {
            setAptitudeResults(results);
            setCarrerasProbadas(prev =>
              selectedCarrera && !prev.includes(selectedCarrera.code)
                ? [...prev, selectedCarrera.code]
                : prev
            );
            setScreen(SCREENS.REPORT);
          }}
        />
      )}

      {screen === SCREENS.REPORT && (
        <FinalReport
          postulant={postulant}
          carrera={selectedCarrera}
          allEnabledSubjects={enabledSubjects}
          carrerasProbadas={carrerasProbadas}
          aptitudeResults={aptitudeResults}
          interestSummary={interestSummary}
          onStartAnotherCareer={handleStartAnotherCareer}
          onFinish={handleFinish}
        />
      )}
    </>
  );
}
