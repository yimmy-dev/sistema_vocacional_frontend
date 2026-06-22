// Fuente única de verdad para las carreras y sus materias requeridas.
// Se usa tanto en InterestResults (elegir carrera) como en FinalReport
// (saber si el postulante tuvo afinidad con más de una carrera, para
// ofrecerle probar la prueba de aptitud de otra de ellas).

export const CARRERAS = [
  { code: 'SIS', nombre: 'Ingeniería de Sistemas',         icon: '💻', color: '#1B4F8A', bg: '#E8F0FA', materias: ['MAT', 'FIS'], materiasConRaz: ['MAT', 'FIS', 'RAZ'], descripcion: 'Diseño y desarrollo de software y sistemas tecnológicos.' },
  { code: 'CON', nombre: 'Contaduría Pública',             icon: '📊', color: '#2E7D52', bg: '#E8F5EE', materias: ['MAT'],        materiasConRaz: ['MAT', 'RAZ'],        descripcion: 'Gestión financiera, contabilidad y auditoría empresarial.' },
  { code: 'ALI', nombre: 'Industrialización de Alimentos', icon: '🧪', color: '#C0580A', bg: '#FDF0E6', materias: ['MAT', 'QUI'], materiasConRaz: ['MAT', 'QUI', 'RAZ'], descripcion: 'Producción, transformación y control de calidad alimentaria.' },
  { code: 'AGR', nombre: 'Agropecuaria',                   icon: '🌱', color: '#5A7A1B', bg: '#F0F5E8', materias: ['MAT', 'BIO'], materiasConRaz: ['MAT', 'BIO', 'RAZ'], descripcion: 'Producción agrícola, ganadería y gestión del campo.' },
];

export const SUBJECT_LABELS = { MAT: 'Matemática', FIS: 'Física', QUI: 'Química', BIO: 'Biología', RAZ: 'Razonamiento Abstracto' };

/**
 * Devuelve las carreras para las que el postulante quedó habilitado,
 * según las materias que desbloqueó en el test de intereses.
 */
export function getCarrerasHabilitadas(enabledSubjects) {
  return CARRERAS.filter(c => c.materias.every(m => enabledSubjects.includes(m)));
}
