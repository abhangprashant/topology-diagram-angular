export interface NetworkInterface {
  name: string;
  ip: string;
  status: string;
  zone: string;
  x?: number;
  y?: number;
}

export interface Device {
  hostname: string;
  group: string;
  interfaces: NetworkInterface[];
  x?: number;
  y?: number;
  'x-level'?: number;
  'y-level'?: number;
}

export interface DeviceGroup {
  name: string;
  devices: string[];
  x?: number;
  y?: number;
  width?: number;
  height?: number;
  'x-level'?: number;
  'y-level'?: number;
}

export interface Zone {
  name: string;
  color: string;
}

export interface Connection {
  source_device: string;
  source_interface: string;
  destination_device: string;
  destination_interface: string;
  label: string; // Unique identifier for connection
  selected?: boolean;
}

export interface Flow {
  id: string;
  name: string;
  source: string;
  destination: string;
  connection_labels: string[]; // Changed to array to support multiple connections
  status: 'approved' | 'pending' | 'rejected';
  bandwidth?: string;
  protocol?: string;
  selected?: boolean;
}

export interface TopologyData {
  devices: Device[];
  device_group: DeviceGroup[];
  zones: Zone[];
  connection: Connection[];
  flows: Flow[];
}

// Separate interfaces for JSON file structures
export interface TopologyFileData {
  devices: Device[];
  device_group: DeviceGroup[];
  zones: Zone[];
}

export interface ConnectionsFileData {
  connections: Connection[];
}

export interface FlowsFileData {
  flows: Flow[];
}
