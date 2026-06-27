import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Device } from '../device/entities/device.entity';
import { LocationPing } from '../device/entities/location-ping.entity';
import {
  DeviceTelemetry,
  extractDeviceIdFromTopic,
  parseDeviceTelemetry,
} from './device-telemetry.parser';
import { TrackingGateway } from './tracking.gateway';
import { TrackingIngestService } from './tracking-ingest.interface';
import { LocationUpdatePayload } from './tracking.types';

@Injectable()
export class TrackingService implements TrackingIngestService {
  private readonly logger = new Logger(TrackingService.name);

  constructor(
    @InjectRepository(Device)
    private readonly deviceRepo: Repository<Device>,
    @InjectRepository(LocationPing)
    private readonly pingRepo: Repository<LocationPing>,
    private readonly trackingGateway: TrackingGateway,
  ) {}

  async ingestMqttMessage(topic: string, payload: string): Promise<void> {
    try {
      const json = JSON.parse(payload) as Record<string, unknown>;
      await this.ingestJson(topic, json);
      return;
    } catch {
      // plain-text telemetry from the wearable
    }

    const fallbackDeviceId = extractDeviceIdFromTopic(topic);
    const telemetry = parseDeviceTelemetry(payload, fallbackDeviceId);

    if (!telemetry) {
      this.logger.warn(`Could not parse MQTT payload on topic ${topic}`);
      return;
    }

    await this.ingestTelemetry(telemetry);
  }

  async ingestJson(topic: string, json: Record<string, unknown>) {
    const deviceId = String(
      (json.deviceId as string) ??
        (json.device as string) ??
        extractDeviceIdFromTopic(topic) ??
        '',
    );

    if (!deviceId) {
      this.logger.warn(`JSON payload missing deviceId on topic ${topic}`);
      return;
    }

    await this.ingestTelemetry({
      deviceId,
      latitude: parseOptionalNumber(json.latitude),
      longitude: parseOptionalNumber(json.longitude),
      altitudeM: parseOptionalNumber(json.altitude ?? json.altitudeM),
      speedKmph: parseOptionalNumber(json.speedKmph ?? json.speed),
      satellites: parseOptionalNumber(json.satellites),
      hdop: parseOptionalNumber(json.hdop),
      nmeaSentences: [],
    });
  }

  async ingestTelemetry(data: DeviceTelemetry) {
    if (data.latitude == null || data.longitude == null) {
      this.logger.warn(`No coordinates for device ${data.deviceId}`);
      return;
    }

    const device = await this.findOrCreateDevice(data.deviceId);

    const ping = this.pingRepo.create({
      device,
      latitude: data.latitude,
      longitude: data.longitude,
      altitudeM: data.altitudeM,
      speedKmph: data.speedKmph,
      satellites: data.satellites,
      hdop: data.hdop,
    });

    const saved = await this.pingRepo.save(ping);
    const payload = this.toPayload(saved, data.deviceId);

    this.trackingGateway.emitLocationUpdate(payload);
    this.logger.log(
      `Saved and broadcast ping for ${data.deviceId}: ${data.latitude}, ${data.longitude}`,
    );

    return payload;
  }

  private toPayload(
    ping: LocationPing,
    deviceId: string,
  ): LocationUpdatePayload {
    return {
      id: ping.id,
      deviceId,
      latitude: ping.latitude,
      longitude: ping.longitude,
      altitudeM: ping.altitudeM,
      speedKmph: ping.speedKmph,
      satellites: ping.satellites,
      hdop: ping.hdop,
      recordedAt: ping.recordedAt.toISOString(),
    };
  }

  private async findOrCreateDevice(deviceId: string): Promise<Device> {
    let device = await this.deviceRepo.findOne({ where: { imei: deviceId } });

    if (!device) {
      device = this.deviceRepo.create({ imei: deviceId, label: deviceId });
      device = await this.deviceRepo.save(device);
      this.logger.log(`Registered new device: ${deviceId}`);
    }

    return device;
  }
}

function parseOptionalNumber(value: unknown): number | undefined {
  if (value == null || value === '') {
    return undefined;
  }

  let parsed: number | undefined;

  if (typeof value === 'number') {
    parsed = value;
  } else if (typeof value === 'string') {
    parsed = Number.parseFloat(value);
  } else {
    parsed = undefined;
  }

  return Number.isFinite(parsed) ? parsed : undefined;
}
