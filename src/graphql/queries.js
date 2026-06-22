import { gql } from '@apollo/client';

// ── AUTH ──────────────────────────────────────────────────────────────────────

export const ADMIN_LOGIN = gql`
  mutation AdminLogin($username: String!, $password: String!) {
    adminLogin(username: $username, password: $password) {
      success
      error
      isAdmin
    }
  }
`;

export const ADMIN_LOGOUT = gql`
  mutation AdminLogout {
    adminLogout {
      success
    }
  }
`;

export const IS_ADMIN_LOGGED_IN = gql`
  query IsAdminLoggedIn {
    isAdminLoggedIn
  }
`;

// ── PANEL ADMIN ───────────────────────────────────────────────────────────────

export const GET_ALL_POSTULANTS = gql`
  query GetAllPostulants {
    allPostulants {
      assessmentId
      nombre
      ci
      fecha
      horaInicio
      horaFin
      isCompleted
      carrera
      colegio
      aptitudeScores
    }
  }
`;

export const GET_POSTULANT_DETAIL = gql`
  query GetPostulantDetail($assessmentId: ID!) {
    postulantDetail(assessmentId: $assessmentId) {
      assessmentId
      nombre
      ci
      fecha
      horaInicio
      horaFin
      carrera
      colegio
      interestSummary
      enabledSubjects
      aptitudeScores
    }
  }
`;

// ── TESTS DE INTERESES ────────────────────────────────────────────────────────

export const GET_INTEREST_QUESTIONS = gql`
  query GetInterestQuestions($testTypeId: ID!) {
    activeTestQuestions(testTypeId: $testTypeId) {
      id
      text
      dimension
      area {
        id
        code
        name
      }
    }
  }
`;

export const SET_CARRERA_ELEGIDA = gql`
  mutation SetCarreraElegida($assessmentId: ID!, $carreraElegida: String!) {
    setCarreraElegida(assessmentId: $assessmentId, carreraElegida: $carreraElegida) {
      success
    }
  }
`;

// ── NUEVA MUTACIÓN CON COLEGIO ────────────────────────────────────────────────

export const START_GUEST_ASSESSMENT = gql`
  mutation StartGuestAssessment($nombre: String!, $ci: String!, $colegio: String) {
    startGuestAssessment(nombre: $nombre, ci: $ci, colegio: $colegio) {
      assessmentId
    }
  }
`;

export const SUBMIT_ANSWERS = gql`
  mutation SubmitAssessmentAnswers($assessmentId: ID!, $responses: [ResponseInput!]!) {
    submitAssessmentAnswers(assessmentId: $assessmentId, responses: $responses) {
      success
      enabledSubjects
      diagnosisSummary
      assessment {
        id
        isCompleted
      }
    }
  }
`;

// ── TESTS DE APTITUDES ────────────────────────────────────────────────────────

export const GET_APTITUDE_QUESTIONS = gql`
  query GetAptitudeQuestions($subjects: [String!]!) {
    aptitudeQuestionsBySubjects(subjects: $subjects) {
      id
      text
      dimension
      optionsJson
      correctAnswer
      imageSvg
      area {
        id
        code
        name
      }
    }
  }
`;

export const SAVE_APTITUDE_ANSWERS = gql`
  mutation SaveAptitudeAnswers($interestAssessmentId: ID!, $responses: [ResponseInput!]!) {
    saveAptitudeAnswers(interestAssessmentId: $interestAssessmentId, responses: $responses) {
      success
    }
  }
`;