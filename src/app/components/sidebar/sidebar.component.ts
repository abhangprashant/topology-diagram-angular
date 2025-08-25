import { Component, OnInit, OnDestroy } from '@angular/core';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { CdkDragMove } from '@angular/cdk/drag-drop';
import { TopologyService } from '../../services/topology.service';
import { Flow, TopologyData } from '../../models/topology.model';

@Component({
  selector: 'app-sidebar',
  templateUrl: './sidebar.component.html',
  styleUrls: ['./sidebar.component.scss'],
})
export class SidebarComponent implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();

  // Flow management properties
  flows: Flow[] = [];
  selectedFlow: Flow | null = null;
  isLoading = false;

  // Resizable sidebar properties - ADD THESE MISSING PROPERTIES
  sidebarWidth: number = 400; // Default width
  minWidth: number = 300; // Minimum width
  maxWidth: number = 800; // Maximum width
  isResizing: boolean = false;

  constructor(private topologyService: TopologyService) {}

  ngOnInit(): void {
    this.subscribeToLoadingState();
    this.subscribeToTopologyData();
    this.subscribeToFlowSelection();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  // Resize functionality methods
  onResizeStart(): void {
    this.isResizing = true;
    document.body.style.cursor = 'ew-resize';
    document.body.style.userSelect = 'none';
  }

  onResize(event: CdkDragMove): void {
    if (!this.isResizing) return;

    let newWidth = event.pointerPosition.x;

    // Apply constraints
    newWidth = Math.max(this.minWidth, Math.min(newWidth, this.maxWidth));

    this.sidebarWidth = newWidth;

    // Reset transform to prevent visual drift
    const element = event.source.element.nativeElement;
    element.style.transform = 'none';
  }

  onResizeEnd(): void {
    this.isResizing = false;
    document.body.style.cursor = '';
    document.body.style.userSelect = '';
  }

  // Reset to default width
  resetWidth(): void {
    this.sidebarWidth = 400;
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
          this.flows = data.flows;
        }
      });
  }

  private subscribeToFlowSelection(): void {
    this.topologyService.selectedFlow$
      .pipe(takeUntil(this.destroy$))
      .subscribe((flow) => {
        this.selectedFlow = flow;
      });
  }

  onFlowSelect(flow: Flow): void {
    this.topologyService.selectFlow(flow);
  }

  onDeselectAll(): void {
    this.topologyService.deselectAllFlows();
  }

  getStatusColor(status: string): string {
    return this.topologyService.getFlowStatusColor(status);
  }

  getStatusIcon(status: string): string {
    switch (status) {
      case 'approved':
        return '✓';
      case 'pending':
        return '⏳';
      case 'rejected':
        return '✗';
      default:
        return '?';
    }
  }

  getFlowsByStatus(status: string): Flow[] {
    return this.flows.filter((f) => f.status === status);
  }

  get approvedFlows(): Flow[] {
    return this.getFlowsByStatus('approved');
  }

  get pendingFlows(): Flow[] {
    return this.getFlowsByStatus('pending');
  }

  get rejectedFlows(): Flow[] {
    return this.getFlowsByStatus('rejected');
  }
}
