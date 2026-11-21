/** Tipos de equipo y estados permitidos en la flota. */
const TYPES = {
  volqueta: 'Volqueta',
  retroexcavadora: 'Retroexcavadora',
  excavadora: 'Excavadora',
  motoniveladora: 'Motoniveladora',
  vibrocompactador: 'Vibrocompactador',
  cargador: 'Cargador frontal',
  bulldozer: 'Bulldozer',
  carrotanque: 'Carrotanque',
  trituradora: 'Planta trituradora',
};

const STATUSES = {
  disponible: 'Disponible',
  en_obra: 'En obra',
  mantenimiento: 'En mantenimiento',
};

/** Ilustración por defecto según el tipo de equipo. */
const defaultImage = (type) => `/images/${TYPES[type] ? type : 'default'}.svg`;

module.exports = { TYPES, STATUSES, defaultImage };
