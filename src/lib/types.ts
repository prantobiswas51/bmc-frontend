// Shapes returned by bmc-backend (Swagger: /api/docs).

export type OrgRole = "viewer" | "member" | "owner";
export type PlatformRole = "super_admin" | "developer";

export interface Me {
  id: string;
  name: string;
  email: string;
  platformRole: PlatformRole | null;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
  user: Pick<Me, "id" | "name" | "email">;
}

export interface Org {
  id: string;
  name: string;
  role: OrgRole;
}

export interface Member {
  orgId: string;
  userId: string;
  role: OrgRole;
  createdAt: string;
  user: { id: string; name: string; email: string };
}

export interface Location {
  id: string;
  orgId: string;
  name: string;
}

export type DeviceState = Record<string, unknown>;

export interface DeviceType {
  key: string;
  name: string;
  /** Hardware ID prefix used by provisioning, e.g. BM_MBL. */
  idPrefix: string | null;
}

export interface Device {
  id: string;
  hardwareId: string;
  typeKey: string;
  orgId: string | null;
  locationId: string | null;
  location: { id: string; name: string } | null;
  name: string | null;
  desiredState: DeviceState;
  reportedState: DeviceState;
  stateVersion: number;
  syncing: boolean;
  online: boolean;
  lastSeenAt: string | null;
  firmwareVersion: string | null;
  claimedAt: string | null;
}

export interface Command {
  id: string;
  deviceId: string;
  action: string;
  payload: Record<string, unknown>;
  status: "pending" | "sent" | "succeeded" | "failed" | "expired";
  result: unknown;
  createdAt: string;
  ackedAt: string | null;
}

export interface TelemetryPoint {
  bucket: string;
  metrics: Record<string, { avg: number; min: number; max: number }>;
}

export interface ActivityDay {
  day: string;
  commands: number;
  failed: number;
}

export interface AdminStats {
  users: number;
  staff: number;
  organizations: number;
  devices: number;
  claimed: number;
  online: number;
  commands24h: number;
}

export interface AdminUser extends Me {
  createdAt: string;
  orgCount: number;
}

export type AdminDevice = Device & { orgName: string | null };

export interface ProvisionedDevice {
  id: string;
  hardwareId: string;
  typeKey: string;
  deviceSecret: string;
  claimCode: string;
}

export interface AclRule {
  topic: string;
  access: "read" | "write" | "readwrite";
}

export interface MqttUser {
  id: string;
  username: string;
  kind: "device" | "client";
  superuser: boolean;
  enabled: boolean;
  acl: AclRule[];
  lastAuthAt: string | null;
  createdAt: string;
  device: {
    id: string;
    hardwareId: string;
    typeKey: string;
    name: string | null;
    orgName: string | null;
  } | null;
}

export interface MqttBroker {
  broker: string;
  integration: string;
  url: string;
  connected: boolean;
  topicPrefix: string;
  serviceUsername: string | null;
  hooks: { auth: string; superuser: string; acl: string };
  deviceAcl: AclRule[];
}
