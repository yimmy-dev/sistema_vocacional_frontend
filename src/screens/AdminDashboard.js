import React, { useState } from 'react';
import { useQuery, useMutation } from '@apollo/client';
import { GET_ALL_POSTULANTS, GET_POSTULANT_DETAIL, ADMIN_LOGOUT } from '../graphql/queries';
import BottomBar from '../components/BottomBar';
import logo from '../assets/logo.png';
import { SUBJECT_INFO, generatePDF } from '../utils/pdfReport';
import './AdminDashboard.css';

// Determina si un postulante aprobó TODAS sus materias (≥60% cada una)
function isAprobado(aptitudeScoresJson) {
  if (!aptitudeScoresJson) return null; // sin datos aún
  try {
    const scores = typeof aptitudeScoresJson === 'string'
      ? JSON.parse(aptitudeScoresJson) : aptitudeScoresJson;
    if (Object.keys(scores).length === 0) return null;
    return Object.values(scores).every(r => r.total > 0 && r.score / r.total >= 0.6);
  } catch { return null; }
}

// Adapta los datos del postulante (forma que devuelve GraphQL en el panel
// admin) a los mismos parámetros que usa generatePDF en FinalReport, para
// que ambas pantallas generen exactamente el mismo documento.
function downloadPDF(p) {
  const postulant = { nombre: p.nombre, ci: p.ci };
  const carrera = p.carrera && p.carrera !== '—' ? { nombre: p.carrera } : null;
  const aptitudeResults = p.aptitudeScores
    ? (typeof p.aptitudeScores === 'string' ? JSON.parse(p.aptitudeScores) : p.aptitudeScores)
    : {};
  generatePDF(postulant, carrera, aptitudeResults, p.interestSummary, []);
}

// ── Modal Detalle ─────────────────────────────────────────────────────────────
function PostulantDetail({ assessmentId, onClose }) {
  const { data, loading, error } = useQuery(GET_POSTULANT_DETAIL, {
    variables: { assessmentId },
    fetchPolicy: 'network-only',
  });

  if (loading) return (
    <div className="ad-detail-overlay">
      <div className="ad-detail-card">
        <div className="ad-loading"><div className="ad-spinner" /><p>Cargando…</p></div>
      </div>
    </div>
  );

  if (error || !data?.postulantDetail) return (
    <div className="ad-detail-overlay">
      <div className="ad-detail-card">
        <p className="ad-error">Error al cargar el detalle.</p>
        <button className="ad-btn-close" onClick={onClose}>Cerrar</button>
      </div>
    </div>
  );

  const p = data.postulantDetail;
  const scores = p.aptitudeScores ? JSON.parse(p.aptitudeScores) : {};
  const aprobado = isAprobado(p.aptitudeScores);

  return (
    <div className="ad-detail-overlay" onClick={onClose}>
      <div className="ad-detail-card" onClick={e => e.stopPropagation()}>
        <div className="ad-detail-header">
          <div>
            <div className="ad-detail-name">{p.nombre}</div>
            <div className="ad-detail-meta">C.I. {p.ci} · {p.fecha}</div>
          </div>
          <button className="ad-btn-close" onClick={onClose}>✕</button>
        </div>

        {/* Carrera */}
        {p.carrera && p.carrera !== '—' && (
          <div className="ad-detail-section">
            <div className="ad-detail-section-title">Carrera postulada</div>
            <div className="ad-carrera-nombre">{p.carrera}</div>
          </div>
        )}

        {/* Colegio — NUEVO */}
        {p.colegio && p.colegio !== '—' && (
          <div className="ad-detail-section">
            <div className="ad-detail-section-title">Colegio de procedencia</div>
            <div className="ad-carrera-nombre">{p.colegio}</div>
          </div>
        )}

        {/* Veredicto */}
        {aprobado !== null && (
          <div className={`ad-veredicto ${aprobado ? 'ad-veredicto--ok' : 'ad-veredicto--fail'}`}>
            <span>{aprobado ? '🎉' : '📚'}</span>
            <span>{aprobado ? 'APROBADO — Tiene el perfil académico para esta carrera.' : 'NO APROBADO — Se recomienda reforzar las áreas marcadas.'}</span>
          </div>
        )}

        {/* Intereses */}
        {p.interestSummary && (
          <div className="ad-detail-section">
            <div className="ad-detail-section-title">Intereses</div>
            <p className="ad-detail-summary">{p.interestSummary}</p>
          </div>
        )}

        {/* Aptitudes */}
        {Object.keys(scores).length > 0 && (
          <div className="ad-detail-section">
            <div className="ad-detail-section-title">Resultados de Aptitud</div>
            <div className="ad-scores">
              {Object.entries(scores).map(([code, r]) => {
                const pct = r.total > 0 ? Math.round((r.score / r.total) * 100) : 0;
                const approved = pct >= 60;
                const info = SUBJECT_INFO[code];
                return (
                  <div key={code} className="ad-score-row">
                    <span className="ad-score-label" style={{ color: info?.color }}>
                      {info?.icon} {info?.label}
                    </span>
                    <div className="ad-score-bar-wrap">
                      <div className="ad-score-bar">
                        <div className="ad-score-fill" style={{ width: `${pct}%`, background: approved ? info?.color : '#c0392b' }} />
                        <div className="ad-score-threshold" />
                      </div>
                      <span className="ad-score-pct" style={{ color: approved ? info?.color : '#c0392b' }}>
                        {r.score}/{r.total} ({pct}%)
                      </span>
                    </div>
                    <span className={`ad-badge ${approved ? 'ad-badge--ok' : 'ad-badge--fail'}`}>
                      {approved ? 'Aprobado' : 'No aprobado'}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        <div className="ad-detail-actions">
          <button className="ad-btn-pdf" onClick={() => downloadPDF(p)}>⬇ Descargar PDF</button>
          <button className="ad-btn-cancel" onClick={onClose}>Cerrar</button>
        </div>
      </div>
    </div>
  );
}

// ── Panel Principal ───────────────────────────────────────────────────────────
export default function AdminDashboard({ onLogout }) {
  const [selectedId, setSelectedId] = useState(null);
  const [searchText, setSearchText] = useState('');

  const { data, loading, error, refetch } = useQuery(GET_ALL_POSTULANTS, {
    fetchPolicy: 'network-only',
  });
  const [adminLogout] = useMutation(ADMIN_LOGOUT);

  const handleLogout = async () => { await adminLogout(); onLogout(); };

  const allPostulants = data?.allPostulants || [];
  const postulants = allPostulants.filter(p =>
    p.nombre.toLowerCase().includes(searchText.toLowerCase()) ||
    p.ci.includes(searchText) ||
    // ── NUEVO: también buscar por colegio ─────────────────────────────────
    (p.colegio && p.colegio.toLowerCase().includes(searchText.toLowerCase()))
  );

  const total      = allPostulants.length;
  const completed  = allPostulants.filter(p => p.isCompleted).length;
  const pending    = total - completed;

  // Aprobados: completados con todas las materias ≥60%
  const aprobados  = allPostulants.filter(p => p.isCompleted && isAprobado(p.aptitudeScores) === true).length;
  const reprobados = allPostulants.filter(p => p.isCompleted && isAprobado(p.aptitudeScores) === false).length;

  return (
    <div className="ad-page">
      <div className="ad-body">
      <aside className="ad-sidebar">
        <div className="ad-sidebar-brand">
          <img src={logo} alt="Escudo FIVC" className="ad-sidebar-logo" />
          <span><span className="ad-sidebar-brand-l1">Orientación</span><span className="ad-sidebar-brand-l2">Vocacional</span></span>
        </div>
        <nav className="ad-nav">
          <div className="ad-nav-item ad-nav-item--active"><span>👥</span> Postulantes</div>
        </nav>
        <button className="ad-logout-btn" onClick={handleLogout}>← Cerrar sesión</button>
      </aside>

      <main className="ad-main">
        <div className="ad-topbar">
          <div>
            <h1 className="ad-page-title">Panel de Postulantes</h1>
            <p className="ad-page-sub">Gestión y seguimiento de evaluaciones vocacionales</p>
          </div>
          <button className="ad-refresh-btn" onClick={() => refetch()} title="Actualizar">↻</button>
        </div>

        {/* Stats — 5 tarjetas */}
        <div className="ad-stats">
          <div className="ad-stat-card">
            <div className="ad-stat-num">{total}</div>
            <div className="ad-stat-label">Registrados</div>
          </div>
          <div className="ad-stat-card">
            <div className="ad-stat-num" style={{ color: '#1B4F8A' }}>{completed}</div>
            <div className="ad-stat-label">Completaron test</div>
          </div>
          <div className="ad-stat-card">
            <div className="ad-stat-num" style={{ color: 'var(--color-accent)' }}>{pending}</div>
            <div className="ad-stat-label">Pendientes</div>
          </div>
          <div className="ad-stat-card">
            <div className="ad-stat-num" style={{ color: 'var(--color-success)' }}>{aprobados}</div>
            <div className="ad-stat-label">Aprobados</div>
          </div>
          <div className="ad-stat-card">
            <div className="ad-stat-num" style={{ color: 'var(--color-danger)' }}>{reprobados}</div>
            <div className="ad-stat-label">Reprobados</div>
          </div>
        </div>

        {/* Buscador */}
        <div className="ad-search-wrap">
          <input
            className="ad-search"
            type="text"
            placeholder="Buscar por nombre, C.I. o colegio…"
            value={searchText}
            onChange={e => setSearchText(e.target.value)}
          />
        </div>

        {loading && <div className="ad-loading"><div className="ad-spinner" /><p>Cargando…</p></div>}
        {error && <div className="ad-error">Error al cargar: {error.message}</div>}

        {!loading && !error && (
          <div className="ad-table-wrap">
            <table className="ad-table">
              <thead>
                <tr>
                  <th>Nombre</th>
                  <th>C.I.</th>
                  <th>Fecha</th>
                  <th>Estado</th>
                  <th>Carrera postulada</th>
                  {/* NUEVO */}
                  <th>Colegio</th>
                  <th>Resultado</th>
                  <th>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {postulants.length === 0 && (
                  <tr><td colSpan="8" className="ad-table-empty">
                    {searchText ? 'Sin resultados.' : 'Aún no hay postulantes registrados.'}
                  </td></tr>
                )}
                {postulants.map(p => {
                  const aprobado = isAprobado(p.aptitudeScores);
                  return (
                    <tr key={p.assessmentId}>
                      <td className="ad-td-name">{p.nombre}</td>
                      <td>{p.ci}</td>
                      <td>{p.fecha}</td>
                      <td>
                        <span className={`ad-status ${p.isCompleted ? 'ad-status--done' : 'ad-status--pending'}`}>
                          {p.isCompleted ? 'Completado' : 'Pendiente'}
                        </span>
                      </td>
                      <td className="ad-carrera-tag">{p.carrera || '—'}</td>
                      {/* NUEVO */}
                      <td>{p.colegio || '—'}</td>
                      <td>
                        {aprobado === true  && <span className="ad-status ad-status--aprobado">✓ Aprobado</span>}
                        {aprobado === false && <span className="ad-status ad-status--reprobado">✗ Reprobado</span>}
                        {aprobado === null  && <span className="ad-tag-empty">—</span>}
                      </td>
                      <td>
                        <button className="ad-btn-view" onClick={() => setSelectedId(p.assessmentId)}>
                          Ver detalle
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </main>
      </div>

      <BottomBar />

      {selectedId && (
        <PostulantDetail assessmentId={selectedId} onClose={() => setSelectedId(null)} />
      )}
    </div>
  );
}