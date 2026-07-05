#!/usr/bin/env python3
import json
import re
import serial
import paho.mqtt.client as mqtt
import time
import signal
import sys

SERIAL_PORT = '/dev/cu.usbserial-0001'
BAUD = 115200
MQTT_HOST = 'localhost'
MQTT_PORT = 1883
TOPIC_TELEMETRY = 'device/wearable-001/telemetry'
TOPIC_SOS = 'surakshawatch/wearable-001/events'
DEVICE_ID = 'wearable-001'

mqtt_client = mqtt.Client()
mqtt_client.connect(MQTT_HOST, MQTT_PORT, 60)
mqtt_client.loop_start()
print(f'Bridge MQTT connected to {MQTT_HOST}:{MQTT_PORT}')


def parse_telemetry(text):
    lat_m = re.search(r'Latitude:\s*([\d.-]+)', text)
    lng_m = re.search(r'Longitude:\s*([\d.-]+)', text)
    if not lat_m or not lng_m:
        return None
    lat = float(lat_m.group(1))
    lng = float(lng_m.group(1))

    def f(p):
        m = re.search(p, text)
        return float(m.group(1)) if m else None

    alt = f(r'Altitude:\s*([\d.-]+)\s*m')
    speed = f(r'Speed:\s*([\d.-]+)\s*km/h')
    sats_m = re.search(r'GPS satellites:\s*(\d+)', text)
    hdop_m = re.search(r'GPS HDOP:\s*([\d.-]+)', text)

    data = {'deviceId': DEVICE_ID, 'latitude': lat, 'longitude': lng}
    if alt is not None: data['altitudeM'] = alt
    if speed is not None: data['speedKmph'] = speed
    if sats_m: data['satellites'] = int(sats_m.group(1))
    if hdop_m: data['hdop'] = float(hdop_m.group(1))
    return data


def parse_sos(lines):
    text = '\n'.join(lines)
    event_m = re.search(r'SOS event:\s*(\S+)', text)
    if not event_m:
        return None
    event_type = event_m.group(1)

    data = {'deviceId': DEVICE_ID, 'eventType': event_type,
            'sosActive': event_type not in ('sos_stopped',)}

    if event_type != 'sos_stopped':
        loc_m = re.search(r'SOS location:\s*([\d.-]+),\s*([\d.-]+)', text)
        if loc_m:
            data['latitude'] = float(loc_m.group(1))
            data['longitude'] = float(loc_m.group(2))

        def f(p):
            m = re.search(p, text)
            return float(m.group(1)) if m else None

        alt = f(r'Altitude:\s*([\d.-]+)\s*m')
        speed = f(r'Speed:\s*([\d.-]+)\s*km/h')
        sats_m = re.search(r'Satellites:\s*(\d+)', text)
        if alt is not None: data['altitudeM'] = alt
        if speed is not None: data['speedKmph'] = speed
        if sats_m: data['satellites'] = int(sats_m.group(1))

    data['connectionType'] = 'serial'
    return data


def open_serial():
    try:
        s = serial.Serial(SERIAL_PORT, BAUD, timeout=3, exclusive=True)
        time.sleep(2)
        s.reset_input_buffer()
        return s
    except Exception as e:
        print(f'Failed to open serial: {e}')
        return None


def cleanup(signum, frame):
    print('\nShutting down bridge...')
    mqtt_client.loop_stop()
    mqtt_client.disconnect()
    if 'ser' in dir() and ser:
        try: ser.close()
        except: pass
    sys.exit(0)


signal.signal(signal.SIGINT, cleanup)
signal.signal(signal.SIGTERM, cleanup)

ser = open_serial()
if not ser:
    print('Could not open serial port, exiting')
    sys.exit(1)

print(f'Serial bridge listening on {SERIAL_PORT} -> mqtt://{MQTT_HOST}:{MQTT_PORT}')
print(f'  Telemetry -> {TOPIC_TELEMETRY}')
print(f'  SOS events -> {TOPIC_SOS}')

buffer = []
state = 'idle'
last_publish = 0

while True:
    try:
        raw = ser.readline()
        if not raw:
            continue
        line = raw.decode('utf-8', errors='replace').strip()
    except (serial.SerialException, OSError) as e:
        print(f'Serial error ({e}), reconnecting in 3s...')
        try:
            ser.close()
        except Exception:
            pass
        time.sleep(3)
        ser = open_serial()
        if not ser:
            print('Reconnect failed, retrying in 10s...')
            time.sleep(10)
            ser = open_serial()
        buffer = []
        state = 'idle'
        continue

    if not line:
        continue

    # --- Detect block starts (only in idle or when matching the transition) ---

    if line.startswith('SOS event:'):
        # If we were collecting something else, process it first
        if state == 'telemetry' and buffer:
            data = parse_telemetry('\n'.join(buffer))
            if data:
                mqtt_client.publish(TOPIC_TELEMETRY, json.dumps(data), qos=1)
                print(f'Telemetry: {json.dumps(data)}')
        buffer = [line]
        state = 'sos'
        continue

    if line.startswith('Device:'):
        if state == 'sos' and buffer:
            data = parse_sos(buffer)
            if data:
                payload = json.dumps(data)
                mqtt_client.publish(TOPIC_SOS, payload, qos=1)
                print(f'SOS event: {payload}')
        buffer = [line]
        state = 'telemetry'
        continue

    # --- Accumulate lines in current block ---

    if state == 'telemetry':
        buffer.append(line)
        if line.startswith('GPS UTC') or (line.startswith('Speed:') and 'km/h' in line and not line.startswith('GPS')):
            text = '\n'.join(buffer)
            data = parse_telemetry(text)
            if data:
                now = time.time()
                if now - last_publish >= 4:
                    payload = json.dumps(data)
                    mqtt_client.publish(TOPIC_TELEMETRY, payload, qos=1)
                    print(f'Telemetry: {payload}')
                    last_publish = now
            buffer = []
            state = 'idle'

    elif state == 'sos':
        buffer.append(line)
        if line.startswith('---') or line.startswith('GPS UTC'):
            text = '\n'.join(buffer)
            data = parse_sos(buffer)
            if data:
                payload = json.dumps(data)
                mqtt_client.publish(TOPIC_SOS, payload, qos=1)
                print(f'SOS event: {payload}')
            buffer = []
            state = 'idle'
