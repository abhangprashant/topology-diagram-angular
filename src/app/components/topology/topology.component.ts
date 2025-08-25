import { Component, OnInit, OnDestroy } from '@angular/core';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { TopologyService } from '../../services/topology.service';
import {
  TopologyData,
  Device,
  DeviceGroup,
  Connection,
  Flow,
} from '../../models/topology.model';

@Component({
  selector: 'app-topology',
  templateUrl: './topology.component.html',
  styleUrls: ['./topology.component.scss'],
})
export class TopologyComponent implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();
  topologyData: TopologyData | null = null;
  isLoading = false;
  svgWidth = 1400;
  svgHeight = 1000;

  // Layout configuration
  private readonly GROUP_SPACING_X = 20;
  private readonly Y_LEVEL_SPACING = 50;
  private readonly BASE_MARGIN_X = 50;
  private readonly BASE_MARGIN_Y = 50;

  constructor(private topologyService: TopologyService) {}

  ngOnInit(): void {
    this.subscribeToLoadingState();
    this.subscribeToTopologyData();
    this.subscribeToFlowSelection(); // Changed from subscribeToConnectionSelection
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private subscribeToLoadingState(): void {
    this.topologyService.isLoading$
      .pipe(takeUntil(this.destroy$))
      .subscribe((isLoading) => {
        this.isLoading = isLoading;
      });
  }

  private subscribeToTopologyData(): void {
    this.topologyService.topologyData$
      .pipe(takeUntil(this.destroy$))
      .subscribe((data) => {
        if (data) {
          this.topologyData = data;
          this.setupInitialPositions();
          console.log('Topology component received data:', {
            devices: data.devices.length,
            groups: data.device_group.length,
            connections: data.connection.length,
            flows: data.flows.length,
            zones: data.zones.length,
          });
        }
      });
  }

  // Replace the old subscribeToConnectionSelection method with this
  private subscribeToFlowSelection(): void {
    this.topologyService.selectedFlow$
      .pipe(takeUntil(this.destroy$))
      .subscribe((flow: Flow | null) => {
        // Flow selection automatically handles connection highlighting
        // No additional logic needed here
      });
  }

  private setupInitialPositions(): void {
    if (!this.topologyData) return;

    console.log('Setting up non-overlapping positions...');

    this.topologyData.device_group.forEach((group) => {
      const devicesInGroup = this.getDevicesInGroup(group);
      this.updateDeviceGroupSize(group, devicesInGroup);
    });

    this.calculateNonOverlappingPositions();
    this.positionStandaloneDevices();
  }

  private calculateNonOverlappingPositions(): void {
    if (!this.topologyData) return;

    const groupsByYLevel = new Map<number, DeviceGroup[]>();

    this.topologyData.device_group.forEach((group) => {
      const yLevel = group['y-level'] || 1;
      if (!groupsByYLevel.has(yLevel)) {
        groupsByYLevel.set(yLevel, []);
      }
      groupsByYLevel.get(yLevel)!.push(group);
    });

    groupsByYLevel.forEach((groups) => {
      groups.sort((a, b) => (a['x-level'] || 1) - (b['x-level'] || 1));
    });

    const sortedYLevels = Array.from(groupsByYLevel.keys()).sort(
      (a, b) => a - b
    );
    let currentY = this.BASE_MARGIN_Y;

    for (const yLevel of sortedYLevels) {
      const groups = groupsByYLevel.get(yLevel)!;
      let currentX = this.BASE_MARGIN_X;
      let maxHeightInLevel = 0;

      for (const group of groups) {
        group.x = currentX;
        group.y = currentY;

        currentX += (group.width || 350) + this.GROUP_SPACING_X;
        maxHeightInLevel = Math.max(maxHeightInLevel, group.height || 150);

        console.log(
          `Group ${group.name} positioned at (${group.x}, ${group.y}) with size ${group.width}×${group.height}`
        );
      }

      currentY += maxHeightInLevel + this.Y_LEVEL_SPACING;
    }

    this.updateCanvasSize();
  }

  private updateCanvasSize(): void {
    if (!this.topologyData) return;

    let maxRight = 0;
    let maxBottom = 0;

    this.topologyData.device_group.forEach((group) => {
      maxRight = Math.max(maxRight, (group.x || 0) + (group.width || 350));
      maxBottom = Math.max(maxBottom, (group.y || 0) + (group.height || 150));
    });

    this.svgWidth = Math.max(1400, maxRight + 100);
    this.svgHeight = Math.max(1000, maxBottom + 100);
  }

  private positionStandaloneDevices(): void {
    if (!this.topologyData) return;

    let deviceIndex = 0;
    this.topologyData.devices.forEach((device) => {
      const deviceGroup = this.topologyData!.device_group.find((g) =>
        g.devices.includes(device.hostname)
      );

      if (!deviceGroup) {
        const maxGroupBottom =
          this.topologyData!.device_group.length > 0
            ? Math.max(
                ...this.topologyData!.device_group.map(
                  (g) => (g.y || 0) + (g.height || 150)
                )
              )
            : this.BASE_MARGIN_Y;

        device.x = this.BASE_MARGIN_X + deviceIndex * 150;
        device.y = maxGroupBottom + 50;
        deviceIndex++;
      }
    });
  }

  private updateDeviceGroupSize(group: DeviceGroup, devices: Device[]): void {
    if (!group || !devices || devices.length === 0) {
      group.width = 150;
      group.height = 100;
      return;
    }

    let maxRight = 0;
    let maxBottom = 0;
    const groupPadding = 40;
    const deviceWidth = 90;
    const deviceHeight = 70;

    devices.forEach((device) => {
      let x, y;

      if (device['x-level'] !== undefined && device['y-level'] !== undefined) {
        x = 20 + (device['x-level'] - 1) * 100;
        y = 40 + (device['y-level'] - 1) * 80;
      } else {
        const deviceIndex = devices.findIndex(
          (d) => d.hostname === device.hostname
        );
        x = 20 + deviceIndex * 100;
        y = 40;
      }

      maxRight = Math.max(maxRight, x + deviceWidth);
      maxBottom = Math.max(maxBottom, y + deviceHeight);
    });

    group.width = maxRight + groupPadding;
    group.height = maxBottom + groupPadding;
  }

  getDevicesInGroup(group: DeviceGroup): Device[] {
    if (!this.topologyData) return [];
    return this.topologyData.devices.filter((device) =>
      group.devices.includes(device.hostname)
    );
  }

  isDeviceInAnyGroup(deviceHostname: string): boolean {
    if (!this.topologyData) return false;
    return this.topologyData.device_group.some((g) =>
      g.devices.includes(deviceHostname)
    );
  }

  getConnectionPath(connection: Connection): string {
    const sourcePos = this.getInterfacePosition(
      connection.source_device,
      connection.source_interface
    );
    const destPos = this.getInterfacePosition(
      connection.destination_device,
      connection.destination_interface
    );
    return `M ${sourcePos.x} ${sourcePos.y} L ${destPos.x} ${destPos.y}`;
  }

  // Updated method to handle flow-based connection coloring
  getConnectionStrokeColor(connection: Connection): string {
    if (!connection.selected) return '#666';

    return '#8A2BE2'; // BlueViolet color for selected connections
  }

  public getInterfacePosition(
    deviceName: string,
    interfaceName: string
  ): { x: number; y: number } {
    if (!this.topologyData) return { x: 0, y: 0 };

    const device = this.topologyData.devices.find(
      (d) => d.hostname === deviceName
    );
    if (!device) return { x: 0, y: 0 };

    const deviceGroup = this.topologyData.device_group.find((g) =>
      g.devices.includes(device.hostname)
    );

    let deviceAbsoluteX, deviceAbsoluteY;

    if (deviceGroup) {
      let deviceRelativeX, deviceRelativeY;

      if (device['x-level'] !== undefined && device['y-level'] !== undefined) {
        deviceRelativeX = 20 + (device['x-level'] - 1) * 100;
        deviceRelativeY = 40 + (device['y-level'] - 1) * 80;
      } else {
        const devicesInGroup = this.getDevicesInGroup(deviceGroup);
        const deviceIndex = devicesInGroup.findIndex(
          (d) => d.hostname === device.hostname
        );
        deviceRelativeX = 20 + deviceIndex * 100;
        deviceRelativeY = 40;
      }

      deviceAbsoluteX = (deviceGroup.x || 0) + deviceRelativeX;
      deviceAbsoluteY = (deviceGroup.y || 0) + deviceRelativeY;
    } else {
      deviceAbsoluteX = device.x || 0;
      deviceAbsoluteY = device.y || 0;
    }

    const interfaceIndex = device.interfaces.findIndex(
      (i) => i.name === interfaceName
    );
    if (interfaceIndex === -1) {
      console.warn(
        `Interface ${interfaceName} not found in device ${deviceName}`
      );
      return { x: deviceAbsoluteX + 40, y: deviceAbsoluteY + 45 };
    }

    const deviceCenterX = deviceAbsoluteX + 40;
    const deviceBottomY = deviceAbsoluteY + 30;
    const interfacesContainerY = deviceBottomY + 4;

    const interfaceSquareWidth = 12;
    const interfaceGap = 6;
    const totalInterfaces = device.interfaces.length;

    const totalInterfacesWidth =
      totalInterfaces * interfaceSquareWidth +
      (totalInterfaces - 1) * interfaceGap;
    const interfacesStartX = deviceCenterX - totalInterfacesWidth / 2;

    const interfaceX =
      interfacesStartX +
      interfaceIndex * (interfaceSquareWidth + interfaceGap) +
      interfaceSquareWidth / 2;
    const interfaceY = interfacesContainerY + interfaceSquareWidth / 2;

    return { x: interfaceX, y: interfaceY };
  }

  public getDeviceCenter(deviceName: string): { x: number; y: number } {
    if (!this.topologyData) return { x: 0, y: 0 };

    const device = this.topologyData.devices.find(
      (d) => d.hostname === deviceName
    );
    if (!device) return { x: 0, y: 0 };

    const deviceGroup = this.topologyData.device_group.find((g) =>
      g.devices.includes(device.hostname)
    );

    let deviceAbsoluteX, deviceAbsoluteY;

    if (deviceGroup) {
      const devicesInGroup = this.getDevicesInGroup(deviceGroup);
      const deviceIndex = devicesInGroup.findIndex(
        (d) => d.hostname === device.hostname
      );

      let deviceRelativeX, deviceRelativeY;
      if (device['x-level'] !== undefined && device['y-level'] !== undefined) {
        deviceRelativeX = 20 + (device['x-level'] - 1) * 100;
        deviceRelativeY = 40 + (device['y-level'] - 1) * 80;
      } else {
        deviceRelativeX = 20 + deviceIndex * 100;
        deviceRelativeY = 40;
      }

      deviceAbsoluteX = (deviceGroup.x || 0) + deviceRelativeX;
      deviceAbsoluteY = (deviceGroup.y || 0) + deviceRelativeY;
    } else {
      deviceAbsoluteX = device.x || 0;
      deviceAbsoluteY = device.y || 0;
    }

    return {
      x: deviceAbsoluteX + 40,
      y: deviceAbsoluteY + 15,
    };
  }

  onGroupPositionChanged(event: {
    group: DeviceGroup;
    x: number;
    y: number;
  }): void {
    const group = this.topologyData?.device_group.find(
      (g) => g.name === event.group.name
    );
    if (group) {
      group.x = event.x;
      group.y = event.y;
    }
  }

  reloadData(): void {
    this.topologyService.reloadData().subscribe({
      next: (data) => {
        console.log('Data reloaded successfully');
      },
      error: (error) => {
        console.error('Failed to reload data:', error);
      },
    });
  }

  recalculatePositions(): void {
    this.setupInitialPositions();
  }

  autoArrangeGroups(): void {
    this.calculateNonOverlappingPositions();
  }

  refreshGroupSizes(): void {
    if (!this.topologyData) return;

    this.topologyData.device_group.forEach((group) => {
      const devicesInGroup = this.getDevicesInGroup(group);
      this.updateDeviceGroupSize(group, devicesInGroup);
    });

    this.calculateNonOverlappingPositions();
  }

  onDeviceDrop(event: DragEvent): void {
    event.preventDefault();
  }

  onDragOver(event: DragEvent): void {
    event.preventDefault();
  }
}
