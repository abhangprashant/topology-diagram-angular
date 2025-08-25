import {
  Component,
  Input,
  Output,
  EventEmitter,
  OnInit,
  OnDestroy,
  OnChanges,
  SimpleChanges,
  HostListener,
} from '@angular/core';
import { DeviceGroup, Device } from '../../models/topology.model';

@Component({
  selector: 'app-device-group',
  templateUrl: './device-group.component.html',
  styleUrls: ['./device-group.component.scss'],
})
export class DeviceGroupComponent implements OnInit, OnDestroy, OnChanges {
  @Input() deviceGroup!: DeviceGroup;
  @Input() devicesInGroup: Device[] = [];
  @Output() groupPositionChanged = new EventEmitter<{
    group: DeviceGroup;
    x: number;
    y: number;
  }>();

  private isDragging = false;
  private dragStartX = 0;
  private dragStartY = 0;
  private initialGroupX = 0;
  private initialGroupY = 0;

  // Device positioning configuration within group
  private readonly DEVICE_GRID_SIZE_X = 100;
  private readonly DEVICE_GRID_SIZE_Y = 80;
  private readonly DEVICE_BASE_MARGIN_X = 20;
  private readonly DEVICE_BASE_MARGIN_Y = 40;
  private readonly GROUP_PADDING = 40;
  private readonly DEVICE_WIDTH = 90;
  private readonly DEVICE_HEIGHT = 70;

  ngOnInit(): void {
    this.initializeGroupPosition();
    this.updateGroupSize();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['devicesInGroup']) {
      this.updateGroupSize();
    }
  }

  ngOnDestroy(): void {
    this.stopDragging();
  }

  private initializeGroupPosition(): void {
    if (
      this.deviceGroup.x === undefined &&
      this.deviceGroup['x-level'] !== undefined
    ) {
      this.deviceGroup.x = 50 + (this.deviceGroup['x-level'] - 1) * 400;
    }
    if (
      this.deviceGroup.y === undefined &&
      this.deviceGroup['y-level'] !== undefined
    ) {
      this.deviceGroup.y = 50 + (this.deviceGroup['y-level'] - 1) * 200;
    }

    if (!this.deviceGroup.x) this.deviceGroup.x = 50;
    if (!this.deviceGroup.y) this.deviceGroup.y = 50;
  }

  private updateGroupSize(): void {
    if (!this.devicesInGroup || this.devicesInGroup.length === 0) {
      this.deviceGroup.width = 150;
      this.deviceGroup.height = 100;
      return;
    }

    let maxRight = 0;
    let maxBottom = 0;

    this.devicesInGroup.forEach((device) => {
      const position = this.getDevicePositionInGroup(0, device);

      const deviceRight = position.x + this.DEVICE_WIDTH;
      const deviceBottom = position.y + this.DEVICE_HEIGHT;

      maxRight = Math.max(maxRight, deviceRight);
      maxBottom = Math.max(maxBottom, deviceBottom);
    });

    this.deviceGroup.width = maxRight + this.GROUP_PADDING;
    this.deviceGroup.height = maxBottom + this.GROUP_PADDING;
  }

  onMouseDown(event: MouseEvent): void {
    const target = event.target as HTMLElement;
    if (
      target.classList.contains('group-background') ||
      target.classList.contains('group-label')
    ) {
      this.startDragging(event);
    }
  }

  onDeviceMouseDown(event: MouseEvent): void {
    event.stopPropagation();
  }

  private startDragging(event: MouseEvent): void {
    this.isDragging = true;
    this.dragStartX = event.clientX;
    this.dragStartY = event.clientY;
    this.initialGroupX = this.deviceGroup.x || 0;
    this.initialGroupY = this.deviceGroup.y || 0;

    event.preventDefault();

    document.addEventListener('mousemove', this.onMouseMove.bind(this));
    document.addEventListener('mouseup', this.onMouseUp.bind(this));

    document.body.style.cursor = 'grabbing';

    const element = event.target as HTMLElement;
    const container = element.closest('.device-group-container') as HTMLElement;
    if (container) {
      container.classList.add('dragging');
    }
  }

  private onMouseMove(event: MouseEvent): void {
    if (!this.isDragging) return;

    const deltaX = event.clientX - this.dragStartX;
    const deltaY = event.clientY - this.dragStartY;

    this.deviceGroup.x = this.initialGroupX + deltaX;
    this.deviceGroup.y = this.initialGroupY + deltaY;

    this.groupPositionChanged.emit({
      group: this.deviceGroup,
      x: this.deviceGroup.x,
      y: this.deviceGroup.y,
    });
  }

  private onMouseUp(event: MouseEvent): void {
    if (!this.isDragging) return;

    const containers = document.querySelectorAll(
      '.device-group-container.dragging'
    );
    containers.forEach((container) => container.classList.remove('dragging'));

    this.stopDragging();
  }

  private stopDragging(): void {
    this.isDragging = false;

    document.removeEventListener('mousemove', this.onMouseMove.bind(this));
    document.removeEventListener('mouseup', this.onMouseUp.bind(this));

    document.body.style.cursor = 'default';
  }

  getDevicePositionInGroup(
    index: number,
    device: Device
  ): { x: number; y: number } {
    if (device['x-level'] !== undefined && device['y-level'] !== undefined) {
      return {
        x:
          this.DEVICE_BASE_MARGIN_X +
          (device['x-level'] - 1) * this.DEVICE_GRID_SIZE_X,
        y:
          this.DEVICE_BASE_MARGIN_Y +
          (device['y-level'] - 1) * this.DEVICE_GRID_SIZE_Y,
      };
    }

    return {
      x: this.DEVICE_BASE_MARGIN_X + index * this.DEVICE_GRID_SIZE_X,
      y: this.DEVICE_BASE_MARGIN_Y,
    };
  }

  recalculateSize(): void {
    this.updateGroupSize();
  }

  @HostListener('window:resize', ['$event'])
  onWindowResize(event: any): void {
    this.updateGroupSize();
  }
}
