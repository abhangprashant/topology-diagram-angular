import { Component, Input, Output, EventEmitter } from '@angular/core';
import { Device } from '../../models/topology.model';
import { TopologyService } from '../../services/topology.service';

@Component({
  selector: 'app-device',
  templateUrl: './device.component.html',
  styleUrls: ['./device.component.scss'],
})
export class DeviceComponent {
  @Input() device!: Device;
  @Output() deviceDrag = new EventEmitter<{
    device: Device;
    x: number;
    y: number;
  }>();

  constructor(private topologyService: TopologyService) {}

  getInterfaceColor(interfaceName: string): string {
    const networkInterface = this.device.interfaces.find(
      (i) => i.name === interfaceName
    );
    return networkInterface
      ? this.topologyService.getZoneColor(networkInterface.zone)
      : '#000';
  }

  onDragStart(event: DragEvent): void {
    if (event.dataTransfer) {
      event.dataTransfer.setData('text/plain', this.device.hostname);
    }
  }
}
