import { Component, Input, Output, EventEmitter } from '@angular/core';
import { NetworkInterface } from '../../models/topology.model';

@Component({
  selector: 'app-interface',
  templateUrl: './interface.component.html',
  styleUrls: ['./interface.component.scss'],
})
export class InterfaceComponent {
  @Input() networkInterface!: NetworkInterface;
  @Input() color: string = '#000';
  @Input() position: { x: number; y: number } = { x: 0, y: 0 };
  @Output() interfaceClick = new EventEmitter<NetworkInterface>();

  onClick(): void {
    this.interfaceClick.emit(this.networkInterface);
  }
}
