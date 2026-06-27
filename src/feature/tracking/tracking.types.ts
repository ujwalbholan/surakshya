export interface LocationUpdatePayload {
  id: string;
  deviceId: string;
  latitude: number;
  longitude: number;
  altitudeM?: number;
  speedKmph?: number;
  satellites?: number;
  hdop?: number;
  recordedAt: string;
}
