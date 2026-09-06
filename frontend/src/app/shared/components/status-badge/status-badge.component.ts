import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-status-badge',
  standalone: true,
  imports: [CommonModule],
  template: `
    <span class="badge" [ngClass]="'badge-' + status">
      <span class="dot"></span>
      {{ label }}
    </span>
  `,
  styles: [`
    .dot {
      width: 6px;
      height: 6px;
      border-radius: 50%;
      background-color: currentColor;
    }
  `]
})
export class StatusBadgeComponent {
  @Input() status: string = 'pendiente';

  get label(): string {
    switch (this.status) {
      case 'pendiente': return 'Pendiente';
      case 'confirmada': return 'Confirmada';
      case 'finalizada': return 'Finalizada';
      case 'cancelada': return 'Cancelada';
      default: return this.status;
    }
  }
}
