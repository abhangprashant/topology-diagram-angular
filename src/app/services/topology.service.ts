import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable, forkJoin } from 'rxjs';
import { map, tap, catchError } from 'rxjs/operators';
import {
  TopologyData,
  TopologyFileData,
  ConnectionsFileData,
  FlowsFileData,
  Connection,
  Flow,
} from '../models/topology.model';

@Injectable({
  providedIn: 'root',
})
export class TopologyService {
  private topologyDataSubject = new BehaviorSubject<TopologyData | null>(null);
  public topologyData$ = this.topologyDataSubject.asObservable();

  private selectedFlowSubject = new BehaviorSubject<Flow | null>(null);
  public selectedFlow$ = this.selectedFlowSubject.asObservable();

  private isLoadingSubject = new BehaviorSubject<boolean>(false);
  public isLoading$ = this.isLoadingSubject.asObservable();

  constructor(private http: HttpClient) {
    this.loadTopologyData();
  }

  private loadTopologyData(): void {
    this.isLoadingSubject.next(true);

    const topologyData$ = this.http.get<TopologyFileData>(
      '/assets/topology.json'
    );
    const connectionsData$ = this.http.get<ConnectionsFileData>(
      '/assets/connections.json'
    );
    const flowsData$ = this.http.get<FlowsFileData>('/assets/flows.json');

    forkJoin({
      topology: topologyData$,
      connections: connectionsData$,
      flows: flowsData$,
    })
      .pipe(
        map(({ topology, connections, flows }) =>
          this.combineData(topology, connections, flows)
        ),
        tap((combinedData) => {
          console.log(
            'Successfully loaded and combined topology data:',
            combinedData
          );
          this.topologyDataSubject.next(combinedData);
          this.isLoadingSubject.next(false);
        }),
        catchError((error) => {
          console.error('Error loading topology data:', error);
          this.isLoadingSubject.next(false);
          throw error;
        })
      )
      .subscribe();
  }

  private combineData(
    topologyData: TopologyFileData,
    connectionsData: ConnectionsFileData,
    flowsData: FlowsFileData
  ): TopologyData {
    const combinedData: TopologyData = {
      devices: topologyData.devices || [],
      device_group: topologyData.device_group || [],
      zones: topologyData.zones || [],
      connection:
        connectionsData.connections.map((conn) => ({
          ...conn,
          selected: false,
        })) || [],
      flows:
        flowsData.flows.map((flow) => ({
          ...flow,
          selected: false,
        })) || [],
    };

    this.validateConnections(combinedData);
    this.validateFlows(combinedData);

    return combinedData;
  }

  private validateConnections(data: TopologyData): void {
    const deviceNames = new Set(data.devices.map((d) => d.hostname));

    data.connection.forEach((conn) => {
      if (!deviceNames.has(conn.source_device)) {
        console.warn(
          `Connection ${conn.label} references non-existent source device: ${conn.source_device}`
        );
      }

      if (!deviceNames.has(conn.destination_device)) {
        console.warn(
          `Connection ${conn.label} references non-existent destination device: ${conn.destination_device}`
        );
      }

      const sourceDevice = data.devices.find(
        (d) => d.hostname === conn.source_device
      );
      if (
        sourceDevice &&
        !sourceDevice.interfaces.some((i) => i.name === conn.source_interface)
      ) {
        console.warn(
          `Connection ${conn.label} references non-existent source interface: ${conn.source_interface}`
        );
      }

      const destDevice = data.devices.find(
        (d) => d.hostname === conn.destination_device
      );
      if (
        destDevice &&
        !destDevice.interfaces.some(
          (i) => i.name === conn.destination_interface
        )
      ) {
        console.warn(
          `Connection ${conn.label} references non-existent destination interface: ${conn.destination_interface}`
        );
      }
    });
  }

  private validateFlows(data: TopologyData): void {
    const connectionLabels = new Set(data.connection.map((c) => c.label));

    data.flows.forEach((flow) => {
      flow.connection_labels.forEach((label) => {
        if (!connectionLabels.has(label)) {
          console.warn(
            `Flow ${flow.id} references non-existent connection label: ${label}`
          );
        }
      });
    });
  }

  getTopologyData(): TopologyData | null {
    return this.topologyDataSubject.value;
  }

  selectFlow(flow: Flow): void {
    const topologyData = this.topologyDataSubject.value;
    if (topologyData) {
      // Deselect all flows and connections
      topologyData.flows.forEach((f) => (f.selected = false));
      topologyData.connection.forEach((c) => (c.selected = false));

      // Select the chosen flow
      flow.selected = true;

      // Highlight all connections used by this flow
      flow.connection_labels.forEach((label) => {
        const connection = topologyData.connection.find(
          (c) => c.label === label
        );
        if (connection) {
          connection.selected = true;
        }
      });

      this.selectedFlowSubject.next(flow);
      console.log(
        `Selected flow ${flow.id} with ${flow.connection_labels.length} connections:`,
        flow.connection_labels
      );
    }
  }

  deselectAllFlows(): void {
    const topologyData = this.topologyDataSubject.value;
    if (topologyData) {
      topologyData.flows.forEach((f) => (f.selected = false));
      topologyData.connection.forEach((c) => (c.selected = false));
      this.selectedFlowSubject.next(null);
    }
  }

  getZoneColor(zoneName: string): string {
    const topologyData = this.topologyDataSubject.value;
    if (!topologyData) return '#000';

    const zone = topologyData.zones.find((z) => z.name === zoneName);
    return zone ? zone.color : '#000';
  }

  getFlowStatusColor(status: string): string {
    switch (status) {
      case 'approved':
        return '#28a745'; // Green
      case 'pending':
        return '#ffc107'; // Yellow
      case 'rejected':
        return '#dc3545'; // Red
      default:
        return '#6c757d'; // Gray
    }
  }

  getConnectionsByLabels(labels: string[]): Connection[] {
    const topologyData = this.topologyDataSubject.value;
    if (!topologyData) return [];

    return topologyData.connection.filter((c) => labels.includes(c.label));
  }

  reloadData(): Observable<TopologyData> {
    this.loadTopologyData();
    return this.topologyData$.pipe(
      map((data) => {
        if (!data) throw new Error('Failed to load topology data');
        return data;
      })
    );
  }
}
