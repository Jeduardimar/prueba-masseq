export type MachineType =
  | 'volqueta'
  | 'retroexcavadora'
  | 'excavadora'
  | 'motoniveladora'
  | 'vibrocompactador'
  | 'cargador'
  | 'bulldozer'
  | 'carrotanque'
  | 'trituradora';

export type MachineStatus = 'disponible' | 'en_obra' | 'mantenimiento';

export interface Machine {
  id: number;
  title: string;
  type: MachineType;
  brand: string;
  model: string;
  year: number;
  capacity: string;
  status: MachineStatus;
  location: string;
  description: string;
  /** URL http(s) o imagen propia /images/<tipo>.jpg|.svg (opcional). */
  image?: string;
}

/** Datos que se envían al crear o editar (sin id). */
export type MachineInput = Omit<Machine, 'id'>;

export interface Option<T extends string> {
  value: T;
  label: string;
}

/** Mismo catálogo que expone GET /api/catalog. */
export const MACHINE_TYPES: Option<MachineType>[] = [
  { value: 'volqueta', label: 'Volqueta' },
  { value: 'retroexcavadora', label: 'Retroexcavadora' },
  { value: 'excavadora', label: 'Excavadora' },
  { value: 'motoniveladora', label: 'Motoniveladora' },
  { value: 'vibrocompactador', label: 'Vibrocompactador' },
  { value: 'cargador', label: 'Cargador frontal' },
  { value: 'bulldozer', label: 'Bulldozer' },
  { value: 'carrotanque', label: 'Carrotanque' },
  { value: 'trituradora', label: 'Planta trituradora' },
];

export const MACHINE_STATUSES: Option<MachineStatus>[] = [
  { value: 'disponible', label: 'Disponible' },
  { value: 'en_obra', label: 'En obra' },
  { value: 'mantenimiento', label: 'En mantenimiento' },
];

export const typeLabel = (t: string): string => MACHINE_TYPES.find((o) => o.value === t)?.label ?? t;

export const statusLabel = (s: string): string => MACHINE_STATUSES.find((o) => o.value === s)?.label ?? s;

/** Quita tildes y pasa a minúsculas para búsquedas. */
export const normalize = (s: unknown): string =>
  String(s ?? '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim();
