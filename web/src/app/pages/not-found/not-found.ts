import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';

@Component({
  selector: 'app-not-found',
  imports: [RouterLink, MatButtonModule, MatIconModule],
  template: `
    <div class="state-box">
      <mat-icon>wrong_location</mat-icon>
      <h1>Página no encontrada</h1>
      <p>La dirección que buscas no existe.</p>
      <a mat-flat-button routerLink="/">Ir al listado de equipos</a>
    </div>
  `,
})
export class NotFound {}
