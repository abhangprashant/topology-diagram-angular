import { Component, Input, Output, EventEmitter } from '@angular/core';
import { FaIconLibrary } from '@fortawesome/angular-fontawesome';
import { IconProp } from '@fortawesome/fontawesome-svg-core'; // Add this import
import {
  faNetworkWired,
  faShieldAlt,
  faProjectDiagram,
  faServer,
  faDesktop,
  faQuestionCircle,
} from '@fortawesome/free-solid-svg-icons';
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

  // Define icons with proper IconProp type
  private firewallIcon: IconProp = faShieldAlt;
  private switchIcon: IconProp = faNetworkWired;
  private routerIcon: IconProp = faProjectDiagram;
  private serverIcon: IconProp = faServer;
  private workstationIcon: IconProp = faDesktop;
  private defaultIcon: IconProp = faQuestionCircle;

  constructor(
    private topologyService: TopologyService,
    private library: FaIconLibrary
  ) {
    // Register icons with FontAwesome library
    library.addIcons(
      faNetworkWired,
      faShieldAlt,
      faProjectDiagram,
      faServer,
      faDesktop,
      faQuestionCircle
    );
  }

  getDeviceIcon(): IconProp {
    switch (this.device.type) {
      case 'firewall':
        return this.firewallIcon;
      case 'switch':
        return this.switchIcon;
      case 'router':
        return this.routerIcon;
      case 'server':
        return this.serverIcon;
      case 'workstation':
        return this.workstationIcon;
      default:
        return this.defaultIcon;
    }
  }

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
