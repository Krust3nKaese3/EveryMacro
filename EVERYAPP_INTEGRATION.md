# EveryApp Integration Guide

Dieses Dokument beschreibt, wie EveryMacro in EveryApp integriert wird und welche Bridge-APIs benötigt werden.

## Übersicht

EveryMacro ist als Mini-App für EveryApp konzipiert und lädt als einzelne `index.html` Datei. Alle Funktionen sind inline implementiert (JavaScript + CSS).

## Repository-URL für EveryApp

```
https://github.com/Krust3nKaese3/EveryMacro
```

Diese URL kann direkt in EveryApp eingefügt werden.

## Benötigte EveryApp Bridge-APIs

### Bereits vorhanden (funktioniert sofort)

- ✅ `EveryAppBridge.storage.get/set/remove` - Makros speichern
- ✅ `EveryAppBridge.http.fetch` - HTTP-Requests (grundlegend)
- ✅ `EveryAppBridge.notifications.schedule` - Benachrichtigungen
- ✅ `EveryAppBridge.vibration.vibrate` - Vibration
- ✅ `EveryAppBridge.bluetooth.scan/connect/disconnect` - Bluetooth (bestehend)

### Neu benötigt (parallel hinzuzufügen)

EveryMacro funktioniert im eingeschränkten Modus ohne diese APIs, aber für volle Funktionalität werden benötigt:

#### 1. Event System

```javascript
EveryAppBridge.events.on(eventName, callback)
EveryAppBridge.events.off(eventName, callback?)
```

**Zweck:** Abonnieren von nativen Events (Bluetooth, App-Lifecycle)

#### 2. Bluetooth Events

```javascript
// Event: bluetooth.connected
// Payload: { name: string, address: string }
EveryAppBridge.events.on('bluetooth.connected', (device) => {
  console.log('Connected:', device.name);
});

// Event: bluetooth.disconnected
// Payload: { name: string, address: string }
EveryAppBridge.events.on('bluetooth.disconnected', (device) => {
  console.log('Disconnected:', device.name);
});

// Query connected devices
const devices = await EveryAppBridge.bluetooth.getConnectedDevices();
// Returns: [{ name: string, address: string }, ...]
```

**Implementierung:**
- Android: `BroadcastReceiver` für `BluetoothDevice.ACTION_ACL_CONNECTED` / `ACTION_ACL_DISCONNECTED`
- Alternativ: `BluetoothAdapter` mit `BluetoothProfile.ServiceListener`

#### 3. App Start Event

```javascript
// Event: app.start
EveryAppBridge.events.on('app.start', () => {
  console.log('App started');
});
```

**Implementierung:**
- React Native: `AppState` listener oder Background Task
- Feuert nur wenn Hintergrundmodus aktiv ist

#### 4. Enhanced HTTP API

```javascript
const response = await EveryAppBridge.http.request({
  url: 'http://192.168.178.20/api',
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ command: 'on' }),
  timeoutMs: 5000
});
// Returns: { status: number, headers: object, body: string }
```

**Unterschied zu `fetch`:**
- Volle Kontrolle über HTTP-Methoden
- Custom Headers
- Konfigurierbarer Timeout
- Response Headers verfügbar

#### 5. Background Mode

```javascript
// Enable background execution
await EveryAppBridge.background.enable();

// Check status
const enabled = await EveryAppBridge.background.isEnabled();
```

**Implementierung:**
- Android Foreground Service mit Notification
- Oder WorkManager für periodische Tasks
- Benötigt Benutzer-Zustimmung (Permission-Dialog)

## Manifest (everyapp.json)

```json
{
  "name": "EveryMacro",
  "version": "1.0.0",
  "description": "Automatisierung mit benutzerdefinierten Makros (JavaScript)",
  "entrypoint": "index.html",
  "permissions": [
    "storage",
    "http",
    "bluetooth",
    "notifications",
    "vibration",
    "background"
  ]
}
```

**Neues Permission:** `background`

## Feature Detection

EveryMacro erkennt automatisch fehlende Features:

```javascript
const features = {
  bluetooth: hasBridge && window.EveryAppBridge.bluetooth && 
            typeof window.EveryAppBridge.bluetooth.getConnectedDevices === 'function',
  events: hasBridge && window.EveryAppBridge.events &&
         typeof window.EveryAppBridge.events.on === 'function',
  http: hasBridge && window.EveryAppBridge.http &&
       typeof window.EveryAppBridge.http.request === 'function',
  background: hasBridge && window.EveryAppBridge.background &&
             typeof window.EveryAppBridge.background.enable === 'function'
};
```

**Fallback-Verhalten:**
- Ohne Events: Nur `manual()` und `interval()` Trigger funktionieren
- Ohne erweiterte HTTP-API: Fallback auf `fetch()` (eingeschränkt)
- Ohne Background: Nur Ausführung wenn App geöffnet ist
- Warnung wird angezeigt: "⚠️ Einige Funktionen fehlen in dieser EveryApp-Version"

## Implementierung in EveryApp

### Dateien zu ändern

1. **`src/bridge/BridgeMessageHandler.ts`**
   - Event-System hinzufügen (`on`, `off`, `emit`)
   - Bridge-Script erweitern mit `EveryAppBridge.events`

2. **`src/bridge/NativeCapabilities.ts`**
   - Bluetooth-Event-Listener registrieren
   - `http.request()` Methode hinzufügen
   - `background.enable()` / `isEnabled()` implementieren
   - `bluetooth.getConnectedDevices()` hinzufügen

3. **`src/types/index.ts`**
   - Permission `"background"` zum Type hinzufügen

4. **`src/components/PermissionRequestModal.tsx`**
   - Dialog für Background-Permission

### Pseudocode: Event System

```typescript
// BridgeMessageHandler.ts
class BridgeMessageHandler {
  private eventListeners: Map<string, Function[]> = new Map();

  generateBridgeScript(): string {
    return `
      window.EveryAppBridge.events = {
        on: (event, callback) => sendMessage('events.on', [event, callback.toString()]),
        off: (event) => sendMessage('events.off', [event])
      };
    `;
  }

  emit(event: string, payload: any) {
    const listeners = this.eventListeners.get(event) || [];
    listeners.forEach(callback => callback(payload));
  }
}

// NativeCapabilities.ts
import { DeviceEventEmitter } from 'react-native';

constructor(appId: string, messageHandler: BridgeMessageHandler) {
  // Register Bluetooth listeners
  this.bluetoothListener = DeviceEventEmitter.addListener(
    'BleManagerConnectPeripheral',
    (device) => {
      messageHandler.emit('bluetooth.connected', {
        name: device.name,
        address: device.id
      });
    }
  );
}
```

## Testing

### Test 1: Feature Detection
1. Lade EveryMacro in aktueller EveryApp-Version
2. Erwartung: Warnungen für fehlende Features werden angezeigt

### Test 2: Manual Trigger (sollte bereits funktionieren)
1. Erstelle ein Makro mit `manual()` Trigger
2. Klicke "Jetzt testen"
3. Erwartung: HTTP-Request wird ausgeführt

### Test 3: Bluetooth Event (nach API-Implementierung)
1. Erstelle Denon-Makro aus Beispiel
2. Verbinde Bluetooth-Gerät "1Mii"
3. Erwartung: Makro wird automatisch ausgeführt

### Test 4: Background Mode
1. Aktiviere Hintergrundmodus in EveryMacro
2. Schließe EveryApp
3. Verbinde Bluetooth-Gerät
4. Erwartung: Makro läuft im Hintergrund

## Sicherheit

- **Event-Scoping:** Events sind pro Mini-App isoliert (kein Cross-App-Zugriff)
- **Background-Permission:** Explizite Benutzer-Zustimmung erforderlich
- **HTTP-Requests:** Respektieren bestehende EveryApp-Sicherheitsrichtlinien
- **Code-Sandboxing:** Makros laufen in eingeschränktem Scope (nur DSL-Funktionen)

## Roadmap

### Phase 1: Aktuell (ohne neue APIs)
- ✅ Manual-Trigger funktionieren
- ✅ Interval-Trigger (WebView bleibt offen)
- ✅ HTTP-Requests via `fetch()`
- ✅ Storage, Notifications, Vibration

### Phase 2: Mit neuen APIs
- ⏳ Bluetooth-Trigger
- ⏳ App-Start-Trigger
- ⏳ Erweiterte HTTP-API
- ⏳ Hintergrundmodus

### Phase 3: Erweiterungen
- Weitere Trigger (Standort, Zeit, WiFi-Verbindung)
- Makro-Sharing (QR-Code, Export)
- Conditions-UI (optional)

## Support

Bei Fragen zur Integration:
- Siehe `EVERYMACRO_BRIDGE_REQUIREMENTS.md` (vollständige API-Spec)
- GitHub Issues: https://github.com/Krust3nKaese3/EveryMacro/issues
- EveryApp Issues: https://github.com/Krust3nKaese3/EveryApp/issues

## Beispiel: Bridge-Erweiterung für Bluetooth Events

Hier ein konkretes Beispiel, wie die Bluetooth-Events in EveryApp implementiert werden können:

### Android Native Code

```java
// In einer Service-Klasse
public class BluetoothEventService extends Service {
    private BroadcastReceiver bluetoothReceiver = new BroadcastReceiver() {
        @Override
        public void onReceive(Context context, Intent intent) {
            String action = intent.getAction();
            BluetoothDevice device = intent.getParcelableExtra(BluetoothDevice.EXTRA_DEVICE);
            
            if (BluetoothDevice.ACTION_ACL_CONNECTED.equals(action)) {
                // Emit to bridge
                sendEvent("bluetooth.connected", device.getName(), device.getAddress());
            } else if (BluetoothDevice.ACTION_ACL_DISCONNECTED.equals(action)) {
                sendEvent("bluetooth.disconnected", device.getName(), device.getAddress());
            }
        }
    };
    
    @Override
    public int onStartCommand(Intent intent, int flags, int startId) {
        IntentFilter filter = new IntentFilter();
        filter.addAction(BluetoothDevice.ACTION_ACL_CONNECTED);
        filter.addAction(BluetoothDevice.ACTION_ACL_DISCONNECTED);
        registerReceiver(bluetoothReceiver, filter);
        return START_STICKY;
    }
}
```

### React Native Bridge

```typescript
// NativeModules/BluetoothEvents.ts
import { NativeModules, DeviceEventEmitter } from 'react-native';

const { BluetoothEvents } = NativeModules;

export function startBluetoothEventListener(callback: (event: any) => void) {
  DeviceEventEmitter.addListener('BluetoothConnected', (device) => {
    callback({ type: 'bluetooth.connected', device });
  });
  
  DeviceEventEmitter.addListener('BluetoothDisconnected', (device) => {
    callback({ type: 'bluetooth.disconnected', device });
  });
  
  BluetoothEvents.startListening();
}
```

## Zusammenfassung

EveryMacro ist **jetzt schon lauffähig** in EveryApp, allerdings mit eingeschränkter Funktionalität (nur manuelle Trigger). Für die volle MacroDroid-ähnliche Automatisierung werden die beschriebenen Bridge-APIs benötigt, die parallel zu EveryApp entwickelt werden können.

Die App erkennt automatisch fehlende Features und informiert den Benutzer entsprechend.
