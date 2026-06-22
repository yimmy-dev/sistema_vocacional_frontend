// Generador de PDF del informe de orientación vocacional.
// Módulo compartido: lo usan tanto la pantalla de resultados finales del
// postulante (FinalReport.js) como el panel de administración
// (AdminDashboard.js), para que ambos descarguen exactamente el mismo
// documento sin duplicar la lógica.

import logoUrl from '../assets/logo.png';

export const SUBJECT_INFO = {
  MAT: { label: 'Matemática', icon: '∑', color: '#1B4F8A', bg: '#E8F0FA' },
  FIS: { label: 'Física',     icon: '⚡', color: '#6B3FA0', bg: '#F2EAF9' },
  QUI: { label: 'Química',    icon: '⚗', color: '#C0580A', bg: '#FDF0E6' },
  BIO: { label: 'Biología',   icon: '🌿', color: '#2E7D52', bg: '#E8F5EE' },
  RAZ: { label: 'Razonamiento Abstracto', icon: '🧩', color: '#6B4C9A', bg: '#F0EBF8' },
};

// Convierte la imagen del logo (importada por webpack) a base64 para poder
// insertarla en el PDF con jsPDF.addImage.
function loadImageAsDataURL(url) {
  return fetch(url)
    .then((res) => res.blob())
    .then((blob) => new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result);
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    }));
}

/**
 * Genera y descarga el PDF del informe de orientación vocacional.
 *
 * @param {Object} postulant - { nombre, ci }
 * @param {Object|null} carrera - { nombre } carrera evaluada
 * @param {Object} aptitudeResults - { [code]: { score, total, failedQuestions } }
 * @param {string} interestSummary - (sin uso actualmente en el cuerpo del PDF,
 *        se mantiene en la firma por compatibilidad con ambos llamadores)
 * @param {Array} allEnabledSubjects - (idem, reservado para uso futuro)
 */
export function generatePDF(postulant, carrera, aptitudeResults, interestSummary, allEnabledSubjects) {
  Promise.all([import('jspdf'), loadImageAsDataURL(logoUrl)]).then(([{ jsPDF }, logoDataUrl]) => {
    const doc = new jsPDF({ unit: 'mm', format: 'a4' });
    const W = 210, M = 20;
    const CONTENT_W = W - M * 2;
    let y = 0;
    let page = 1;

    const palette = {
      primary: [27, 79, 138],
      text:    [26, 35, 50],
      muted:   [90, 100, 115],
      border:  [209, 219, 232],
      ok:      [46, 125, 82],
      okBg:    [232, 245, 238],
      fail:    [192, 57, 43],
      failBg:  [253, 240, 240],
      panel:   [245, 247, 250],
    };

    const fecha = new Date().toLocaleDateString('es-BO', { year: 'numeric', month: 'long', day: 'numeric' });

    // ── Encabezado de páginas siguientes (sin la franja azul, solo margen superior) ──
    function drawPageHeader(subtitle) {
      y = M + 4;
    }

    // ── Pie de página ──
    function drawPageFooter() {
      doc.setDrawColor(...palette.border);
      doc.line(M, 285, W - M, 285);
      doc.setFontSize(8); doc.setFont('times', 'normal'); doc.setTextColor(...palette.muted);
      doc.text('Facultad Integral de los Valles Cruceños — Sistema de Orientación Vocacional', M, 291);
      doc.text(`Página ${page}`, W / 2, 291, { align: 'center' });
      doc.text(fecha, W - M, 291, { align: 'right' });
    }

    // ── Salto de página con control de espacio restante ──
    function ensureSpace(neededHeight, subtitle) {
      if (y + neededHeight > 278) {
        drawPageFooter();
        doc.addPage();
        page += 1;
        drawPageHeader(subtitle);
      }
    }

    // ── Helper: título de sección ──
    function sectionTitle(text, subtitle) {
      ensureSpace(20, subtitle);
      doc.setTextColor(...palette.primary);
      doc.setFontSize(13); doc.setFont('times', 'bold');
      doc.text(text, M, y); y += 2;
      y += 10;
    }

    // ── Helper: párrafo justificado con salto de página automático ──
    function paragraph(text, opts = {}) {
      const { size = 12, color = palette.text, lineH = 6.2, style = 'normal' } = opts;
      doc.setFontSize(size); doc.setFont('times', style); doc.setTextColor(...color);
      const lines = doc.splitTextToSize(text, CONTENT_W);
      for (const line of lines) {
        ensureSpace(lineH + 2, '');
        doc.text(line, M, y);
        y += lineH;
      }
      y += 2;
    }

    // ── Helper: lista con viñetas ──
    function bulletList(items, opts = {}) {
      const { size = 12, color = palette.text } = opts;
      doc.setFontSize(size); doc.setFont('times', 'normal'); doc.setTextColor(...color);
      for (const item of items) {
        const lines = doc.splitTextToSize(item, CONTENT_W - 7);
        ensureSpace(lines.length * 6.2 + 2, '');
        doc.setFont('times', 'bold');
        doc.text('•', M, y);
        doc.setFont('times', 'normal');
        doc.text(lines, M + 5, y);
        y += lines.length * 6.2 + 2;
      }
    }

    // ════════════════════════════════════════════════════════════════
    // PORTADA
    // ════════════════════════════════════════════════════════════════
    doc.setFillColor(...palette.primary);
    doc.rect(0, 0, W, 48, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(19); doc.setFont('times', 'bold');
    doc.text('INFORME DE ORIENTACIÓN VOCACIONAL', M, 20);
    doc.setFontSize(10.5); doc.setFont('times', 'normal');
    doc.text('Facultad Integral de los Valles Cruceños — UAGRM', M, 29);
    doc.text(`Documento generado el ${fecha}`, M, 36);
    // Logo institucional, esquina superior derecha de la portada
    const logoSize = 24;
    const bannerHeight = 48;
    doc.addImage(logoDataUrl, 'PNG', W - logoSize - 16, (bannerHeight - logoSize) / 2, logoSize, logoSize);
    y = 60;

    // Datos del postulante
    sectionTitle('1. Datos del Postulante', 'Datos del postulante');
    doc.setFillColor(...palette.panel);
    doc.roundedRect(M, y - 4, CONTENT_W, 26, 3, 3, 'F');
    doc.setFontSize(10.5); doc.setFont('times', 'normal'); doc.setTextColor(...palette.text);
    doc.text(`Nombre completo:`, M + 6, y + 4);
    doc.setFont('times', 'bold');
    doc.text(`${postulant?.nombre || '-'}`, M + 55, y + 4);
    doc.setFont('times', 'normal');
    doc.text(`Cédula de identidad:`, M + 6, y + 12);
    doc.setFont('times', 'bold');
    doc.text(`${postulant?.ci || '-'}`, M + 55, y + 12);
    doc.setFont('times', 'normal');
    doc.text(`Fecha de evaluación:`, M + 6, y + 20);
    doc.setFont('times', 'bold');
    doc.text(fecha, M + 55, y + 20);
    y += 36;

    // Cálculos generales (se usan más adelante en Conclusiones y Recomendaciones)
    const totalMats = Object.keys(aptitudeResults).length;
    const aprobMats = Object.entries(aptitudeResults).filter(([, r]) => r.total > 0 && (r.score / r.total) >= 0.6).length;
    const sumaPct   = Object.values(aptitudeResults).reduce((acc, r) => acc + (r.total > 0 ? (r.score / r.total) * 100 : 0), 0);
    const promedioFinal = totalMats > 0 ? Math.round(sumaPct / totalMats) : 0;
    const apto = promedioFinal >= 51;

    if (carrera) {
      ensureSpace(22, 'Datos del postulante');
      doc.setFillColor(232, 240, 250);
      doc.roundedRect(M, y, CONTENT_W, 18, 3, 3, 'F');
      doc.setTextColor(...palette.primary); doc.setFont('times', 'bold'); doc.setFontSize(10.5);
      doc.text('Carrera evaluada:', M + 6, y + 7);
      doc.setFontSize(12);
      doc.text(carrera.nombre, M + 6, y + 14);
      y += 26;
    }

    // ════════════════════════════════════════════════════════════════
    // RESULTADOS DETALLADOS DE APTITUD ACADÉMICA
    // ════════════════════════════════════════════════════════════════
    sectionTitle('2. Resultados de Aptitud Académica por Materia', 'Resultados de aptitud académica');
    paragraph(
      `Esta sección detalla el desempeño del postulante en cada una de las pruebas de aptitud ` +
      `rendidas. Cada materia fue evaluada de manera independiente, con un límite de tiempo de 15 ` +
      `minutos y un conjunto de preguntas de opción múltiple. El umbral mínimo de aprobación para ` +
      `cada materia es del 60% de respuestas correctas.`
    );

    const interpretaciones = {
      alto:   (label) => `El postulante demostró un dominio sólido de los contenidos evaluados en ${label}, respondiendo correctamente a la gran mayoría de las preguntas. Este resultado sugiere una base académica adecuada para enfrentar los contenidos universitarios relacionados con esta área.`,
      medio:  (label) => `El postulante alcanzó el puntaje mínimo requerido en ${label}, aunque con un margen ajustado sobre el umbral de aprobación. Se recomienda repasar los temas en los que se presentaron errores para consolidar una base más firme antes de iniciar estudios superiores.`,
      bajo:   (label) => `El desempeño del postulante en ${label} estuvo por debajo del umbral mínimo de aprobación. Esto indica la necesidad de reforzar significativamente los contenidos de esta materia, ya sea mediante estudio independiente, cursos de nivelación o apoyo académico adicional, antes de cursar materias universitarias que dependan de estos conocimientos.`,
    };

    for (const [code, r] of Object.entries(aptitudeResults)) {
      const pct      = r.total > 0 ? Math.round((r.score / r.total) * 100) : 0;
      const approved = pct >= 60;
      const info     = SUBJECT_INFO[code] || { label: code };
      const nivel    = pct >= 80 ? 'alto' : pct >= 60 ? 'medio' : 'bajo';

      ensureSpace(34, 'Resultados de aptitud académica');

      // Encabezado de la materia con barra de resultado
      doc.setFillColor(approved ? 232 : 253, approved ? 245 : 240, approved ? 238 : 240);
      doc.roundedRect(M, y, CONTENT_W, 16, 2, 2, 'F');
      doc.setTextColor(...palette.text); doc.setFont('times', 'bold'); doc.setFontSize(11);
      doc.text(`${info.label}`, M + 4, y + 10);
      doc.setFont('times', 'normal');
      doc.text(`${r.score} / ${r.total} respuestas correctas  (${pct}%)`, M + 70, y + 10);
      doc.setFont('times', 'bold');
      doc.setTextColor(...(approved ? palette.ok : palette.fail));
      doc.text(approved ? 'APROBADO' : 'NO APROBADO', W - M - 4, y + 10, { align: 'right' });
      y += 22;

      // Barra de progreso visual
      doc.setFillColor(225, 230, 238);
      doc.roundedRect(M, y, CONTENT_W, 4, 2, 2, 'F');
      const fillW = Math.max(2, (pct / 100) * CONTENT_W);
      doc.setFillColor(...(approved ? palette.ok : palette.fail));
      doc.roundedRect(M, y, fillW, 4, 2, 2, 'F');
      y += 10;

      // Párrafo interpretativo
      paragraph(interpretaciones[nivel](info.label));

      // Detalle de preguntas a repasar (solo enumerado, sin revelar respuesta correcta)
      if (!approved && r.failedQuestions?.length > 0) {
        // Evitamos que queden 1 (o 0 con etiqueta sola) preguntas huérfanas
        // al inicio de la página siguiente, sin contexto de su materia.
        // Si el remanente que NO entra en la página actual es de solo 1
        // pregunta, sacrificamos una pregunta más de la página actual para
        // que al menos 2 queden juntas en la siguiente (o forzamos todo el
        // bloque a la siguiente página si ni la etiqueta entra cómoda).
        doc.setFontSize(12); doc.setFont('times', 'normal');
        const labelHeight = 10;
        const itemHeights = r.failedQuestions.map((item) => {
          const lines = doc.splitTextToSize(item, CONTENT_W - 7);
          return lines.length * 6.2 + 2;
        });

        let availableNow = 278 - y - labelHeight;
        let itemsThatFit = 0;
        for (const h of itemHeights) {
          if (h > availableNow) break;
          availableNow -= h;
          itemsThatFit += 1;
        }

        const total = r.failedQuestions.length;
        let remainder = total - itemsThatFit;
        // Si quedaría exactamente 1 pregunta sola en la página siguiente,
        // bajamos una pregunta más de la actual para que se vayan 2 juntas.
        if (remainder === 1 && itemsThatFit > 0) {
          itemsThatFit -= 1;
          remainder = total - itemsThatFit;
        }

        if (itemsThatFit === 0) {
          // Ni la etiqueta entra cómoda con al menos una pregunta: todo el
          // bloque pasa junto a la siguiente página.
          const totalListHeight = itemHeights.reduce((a, b) => a + b, 0);
          ensureSpace(labelHeight + totalListHeight, 'Resultados de aptitud académica');
          doc.setFontSize(12); doc.setFont('times', 'bold'); doc.setTextColor(...palette.fail);
          doc.text(`Preguntas a repasar (${total}):`, M, y); y += 6;
          bulletList(r.failedQuestions);
        } else {
          ensureSpace(10, 'Resultados de aptitud académica');
          doc.setFontSize(12); doc.setFont('times', 'bold'); doc.setTextColor(...palette.fail);
          doc.text(`Preguntas a repasar (${total}):`, M, y); y += 6;

          const primeraParte = r.failedQuestions.slice(0, itemsThatFit);
          const segundaParte = r.failedQuestions.slice(itemsThatFit);
          bulletList(primeraParte);
          if (segundaParte.length > 0) {
            // Forzamos el salto de página para que el resto no quede
            // fragmentado de forma impredecible.
            const segundaAltura = itemHeights.slice(itemsThatFit).reduce((a, b) => a + b, 0);
            ensureSpace(segundaAltura, 'Resultados de aptitud académica');
            bulletList(segundaParte);
          }
        }
      }

      y += 4;
      ensureSpace(2, 'Resultados de aptitud académica');
      y += 8;
    }

    // ════════════════════════════════════════════════════════════════
    // CONCLUSIONES Y RECOMENDACIONES
    // ════════════════════════════════════════════════════════════════
    sectionTitle('Conclusiones y Recomendaciones', 'Conclusiones y recomendaciones');

    if (apto) {
      paragraph(
        `Con base en los resultados obtenidos, el postulante presenta un perfil académico apto para ` +
        `iniciar estudios en ${carrera?.nombre || 'la carrera evaluada'}. El promedio final de ` +
        `${promedioFinal} puntos, superior al mínimo institucional de 51, junto con la aprobación de ` +
        `${aprobMats} de ${totalMats} materias evaluadas, respalda esta conclusión.`
      );
      paragraph(
        `Se recomienda al postulante mantener hábitos de estudio constantes durante su transición a la ` +
        `educación superior, y aprovechar los espacios de tutoría o nivelación que la institución ofrezca ` +
        `en las materias donde su desempeño, aunque aprobatorio, podría seguir fortaleciéndose.`
      );
    } else {
      const debiles = Object.entries(aptitudeResults)
        .map(([code, r]) => ({ code, pct: r.total > 0 ? Math.round((r.score / r.total) * 100) : 0, label: SUBJECT_INFO[code]?.label || code }))
        .filter(m => m.pct < 60);
      paragraph(
        `Con base en los resultados obtenidos, se recomienda que el postulante refuerce sus conocimientos ` +
        `antes de postularse formalmente a ${carrera?.nombre || 'la carrera evaluada'}. El promedio final ` +
        `de ${promedioFinal} puntos no alcanza el mínimo institucional de 51, principalmente debido al ` +
        `desempeño insuficiente en ${debiles.length === 1 ? 'la siguiente materia' : 'las siguientes materias'}:`
      );
      bulletList(debiles.map(m => `${m.label} (${m.pct}% — se requiere un mínimo de 60%)`));
      paragraph(
        `Se sugiere al postulante dedicar un periodo de preparación enfocado en estas áreas, ya sea ` +
        `mediante estudio autodirigido, cursos preuniversitarios o apoyo académico personalizado, y ` +
        `volver a rendir las pruebas de aptitud una vez que considere haber consolidado los conocimientos ` +
        `necesarios. Este resultado no debe interpretarse como una limitación definitiva, sino como una ` +
        `oportunidad concreta de mejora antes de iniciar la vida universitaria.`
      );
    }

    paragraph(
      `Este informe tiene un carácter orientativo y busca apoyar la toma de decisiones académicas del ` +
      `postulante y su entorno familiar. No sustituye una evaluación psicopedagógica profesional ni ` +
      `condiciona de manera definitiva el ingreso a la carrera evaluada, quedando sujeto a los procesos ` +
      `de admisión vigentes en la institución.`,
      { size: 9, color: palette.muted, style: 'italic' }
    );

    drawPageFooter();
    doc.save(`Informe_${postulant?.nombre?.replace(/\s+/g, '_') || 'postulante'}.pdf`);
  });
}
