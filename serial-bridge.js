import { createReadStream } from 'node:fs';
import { createInterface } from 'node:readline';
import mqtt from 'mqtt';

const SERIAL_PORT = '/dev/cu.usbserial-0001';
const MQTT_URL = 'mqtt://localhost:1883';
const TOPIC = 'device/wearable-001/telemetry';
const DEVICE_ID = 'wearable-001';

const mqttClient = mqtt.connect(MQTT_URL);
mqttClient.on('connect', () => console.log(`Bridge connected to ${MQTT_URL}`));
mqttClient.on('error', (err) => console.error('Bridge MQTT error:', err.message));

function parseBlock(lines) {
  const text = lines.join('\n');
  const m = (pattern) => pattern.exec(text)?.[1];
  const lat = parseFloat(m(/Latitude:\s*([\d.-]+)/));
  const lng = parseFloat(m(/Longitude:\s*([\d.-]+)/));
  const alt = parseFloat(m(/Altitude:\s*([\d.-]+)\s*m/));
  const speed = parseFloat(m(/Speed:\s*([\d.-]+)\s*km\/h/));
  const sats = parseInt(m(/GPS satellites:\s*(\d+)/), 10);
  const hdop = parseFloat(m(/GPS HDOP:\s*([\d.-]+)/));

  if (isNaN(lat) || isNaN(lng)) return null;

  return {
    deviceId: DEVICE_ID,
    latitude: lat,
    longitude: lng,
    altitudeM: isNaN(alt) ? undefined : alt,
    speedKmph: isNaN(speed) ? undefined : speed,
    satellites: isNaN(sats) ? undefined : sats,
    hdop: isNaN(hdop) ? undefined : hdop,
  };
}

const rl = createInterface({
  input: createReadStream(SERIAL_PORT),
  crlfDelay: Infinity,
});

let buffer = [];
let inBlock = false;

rl.on('line', (line) => {
  if (line.startsWith('Device:')) {
    buffer = [line];
    inBlock = true;
    return;
  }

  if (inBlock) {
    buffer.push(line);
    if (line.startsWith('GPS UTC') || (line.startsWith('Speed:') && !line.includes('GPS'))) {
      inBlock = false;
      const data = parseBlock(buffer);
      if (data) {
        const payload = JSON.stringify(data);
        mqttClient.publish(TOPIC, payload, { qos: 1 });
        console.log(`Published: ${payload}`);
      }
      buffer = [];
    }
  }
});

rl.on('error', (err) => console.error('Serial read error:', err.message));

process.on('SIGINT', () => {
  mqttClient.end();
  process.exit();
});

console.log(`Serial bridge listening on ${SERIAL_PORT}...`);
