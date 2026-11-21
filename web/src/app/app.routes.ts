import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: '',
    title: 'Flota de maquinaria · MASSEQ',
    loadComponent: () => import('./pages/machine-list/machine-list').then((m) => m.MachineList),
  },
  {
    path: 'maquinaria/nueva',
    title: 'Agregar equipo · MASSEQ',
    loadComponent: () => import('./pages/machine-form/machine-form').then((m) => m.MachineForm),
  },
  {
    path: 'maquinaria/:id/editar',
    title: 'Editar equipo · MASSEQ',
    loadComponent: () => import('./pages/machine-form/machine-form').then((m) => m.MachineForm),
  },
  {
    path: 'maquinaria/:id',
    title: 'Detalle del equipo · MASSEQ',
    loadComponent: () => import('./pages/machine-detail/machine-detail').then((m) => m.MachineDetail),
  },
  {
    path: '**',
    title: 'Página no encontrada · MASSEQ',
    loadComponent: () => import('./pages/not-found/not-found').then((m) => m.NotFound),
  },
];
