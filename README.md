# EveryMacro

**EveryMacro** ist eine Mini-App für [EveryApp](https://github.com/Krust3nKaese3/EveryApp), die MacroDroid-ähnliche Automatisierung ermöglicht. Erstelle Makros mit Triggern (z.B. Bluetooth-Verbindung), Bedingungen und Aktionen (HTTP-Requests, Benachrichtigungen, etc.).

## Features

- ✅ **Bluetooth-Trigger**: Automatisch bei Gerät-Verbindung/-Trennung (Classic Bluetooth)
- ✅ **HTTP-Requests**: GET/POST/PUT/DELETE mit Custom Headers zu Smart Home APIs, lokalen Geräten
- ✅ **Benachrichtigungen & Vibration**: Feedback bei Makro-Ausführung
- ✅ **Persistente Variablen**: Zustand zwischen Ausführungen speichern
- ✅ **Interval-Trigger**: Periodische Makros (auch im Hintergrund)
- ✅ **Hintergrundmodus**: Foreground Service mit persistenter Notification
- ✅ **App-Start-Trigger**: Makros bei App-Start ausführen
- ✅ **Manueller Test**: Makros jederzeit testen
- ✅ **Einfache DSL**: JavaScript-basiert, AI-freundlich

> **Alle Features verfügbar ab EveryApp v2.0** ([PR #3](https://github.com/Krust3nKaese3/EveryApp/pull/3))

## Installation in EveryApp

1. EveryApp öffnen
2. Repository-URL hinzufügen:
   ```
   https://github.com/Krust3nKaese3/EveryMacro
   ```
3. App laden und Berechtigungen gewähren
4. EveryMacro ist bereit!

## Verwendung

### Makros erstellen

1. **"Hinzufügen"** Button klicken
2. Makro-Code einfügen (siehe Beispiele unten oder `MACROS.md`)
3. **"Speichern"** klicken
4. Makro aktivieren (Toggle-Button)

### Makro testen

- **"▶ Testen"** Button neben dem Makro klicken
- Ergebnis im Log prüfen

### Hintergrundmodus

- Toggle "Hintergrundmodus" aktivieren
- Makros laufen auch wenn EveryApp geschlossen ist
- Erforderlich für `appStart()` und `interval()` Trigger

## Beispiele

### Beispiel 1: Denon Receiver bei Bluetooth einschalten

Schaltet einen Denon AV-Receiver ein, wenn das Telefon sich mit einem 1Mii Bluetooth-Adapter verbindet:

```javascript
macro({
  name: "Denon einschalten (1Mii BT)",
  triggers: [
    bluetoothConnected("1Mii")
  ],
  actions: async (ctx) => {
    ctx.log("1Mii verbunden, prüfe Denon-Status...");
    
    try {
      // Status abfragen
      const statusResponse = await ctx.http.get(
        "http://192.168.178.20/goform/formMainZone_MainZoneXml.xml"
      );
      
      // Nur einschalten wenn im Standby
      if (statusResponse.body.includes("<Power><value>STANDBY</value>")) {
        ctx.log("Denon ist im Standby, schalte ein...");
        
        // Einschalten
        await ctx.http.get(
          "http://192.168.178.20/goform/formiPhoneAppDirect.xml?ZMON"
        );
        
        // Warte 4 Sekunden
        await ctx.wait(4000);
        
        // DVD-Quelle wählen
        await ctx.http.get(
          "http://192.168.178.20/goform/formiPhoneAppDirect.xml?SIDVD"
        );
        
        ctx.log("Denon eingeschaltet, DVD-Quelle gewählt");
        await ctx.notify("Denon Receiver", "Erfolgreich eingeschaltet");
        ctx.vibrate([100, 50, 100]);
      } else {
        ctx.log("Denon läuft bereits, nichts zu tun");
      }
      
    } catch (error) {
      ctx.log(`Fehler: ${error.message}`);
      await ctx.notify("Denon-Fehler", "Konnte nicht einschalten");
    }
  }
})
```

### Beispiel 2: Denon ausschalten bei Bluetooth-Trennung

```javascript
macro({
  name: "Denon ausschalten (1Mii BT getrennt)",
  triggers: [
    bluetoothDisconnected("1Mii")
  ],
  actions: async (ctx) => {
    ctx.log("1Mii getrennt, schalte Denon aus...");
    
    try {
      await ctx.http.get(
        "http://192.168.178.20/goform/formiPhoneAppDirect.xml?PWSTANDBY"
      );
      
      ctx.log("Denon in Standby versetzt");
      await ctx.notify("Denon Receiver", "In Standby versetzt");
      
    } catch (error) {
      ctx.log(`Fehler beim Ausschalten: ${error.message}`);
    }
  }
})
```

Weitere Beispiele im `examples/` Ordner und in `MACROS.md`.

## Makro-DSL Schnellreferenz

### Trigger

- `bluetoothConnected(name)` - Bei Bluetooth-Verbindung
- `bluetoothDisconnected(name)` - Bei Bluetooth-Trennung
- `appStart()` - Bei App-Start (Hintergrundmodus)
- `interval(ms)` - Periodisch (z.B. alle 5 Minuten)
- `manual()` - Nur manueller Test

### Context-Funktionen (ctx)

- `ctx.http.get(url)` - HTTP GET Request
- `ctx.http.request({ url, method, headers, body, timeoutMs })` - Vollständiger HTTP Request
- `ctx.wait(ms)` - Warten
- `ctx.notify(title, body)` - Benachrichtigung anzeigen
- `ctx.vibrate(pattern)` - Gerät vibrieren lassen
- `ctx.log(message)` - Log-Nachricht schreiben
- `ctx.vars.key = value` - Persistente Variable speichern

### Vollständige Dokumentation

Siehe **[MACROS.md](MACROS.md)** für:
- Detaillierte API-Referenz
- Alle Trigger und Optionen
- Fehlerbehandlung
- Best Practices
- Weitere Beispiele

## Anforderungen

### EveryApp v2.0 oder neuer

**Erforderlich:** EveryApp mit [PR #3](https://github.com/Krust3nKaese3/EveryApp/pull/3) (Advanced Capabilities)

**Alle benötigten Bridge-APIs sind implementiert:**
- ✅ `EveryAppBridge.events.on('bluetooth.connected', callback)` - Classic Bluetooth Events
- ✅ `EveryAppBridge.events.on('bluetooth.disconnected', callback)` - Classic Bluetooth Events
- ✅ `EveryAppBridge.events.on('app.start', callback)` - App-Start-Event
- ✅ `EveryAppBridge.bluetooth.getConnectedDevices()` - Aktuell verbundene Geräte
- ✅ `EveryAppBridge.http.request({ url, method, headers, body, timeoutMs })` - Vollständige HTTP-API
- ✅ `EveryAppBridge.background.enable/disable/isEnabled()` - Hintergrundmodus-Steuerung
- ✅ `EveryAppBridge.storage.*` - Key-Value Storage
- ✅ `EveryAppBridge.notifications.*` - Benachrichtigungen
- ✅ `EveryAppBridge.vibration.*` - Vibration

**Feature Detection:**
EveryMacro erkennt automatisch fehlende Features und zeigt Warnungen an, falls eine ältere EveryApp-Version verwendet wird.

## Manifest

```json
{
  "name": "EveryMacro",
  "version": "1.0.0",
  "description": "Automatisierung mit benutzerdefinierten Makros (JavaScript)",
  "entrypoint": "index.html",
  "permissions": ["storage", "http", "bluetooth", "notifications", "vibration", "background"]
}
```

## Sicherheit

- Makros laufen in einem eingeschränkten Scope (nur DSL-Funktionen verfügbar)
- Kein direkter Zugriff auf DOM, andere Makros oder Bridge-Internals
- HTTP-Requests unterliegen EveryApp-Berechtigungen
- Code-Validierung vor dem Speichern

## Einschränkungen

1. **Bluetooth:** Nur Classic Bluetooth (nicht BLE) - für Auto, Kopfhörer, Smart Home Geräte
2. **Plattform:** Android-only (EveryApp-Einschränkung, iOS folgt später)
3. **HTTP CORS:** Externe APIs können durch CORS blockiert werden (lokale Geräte funktionieren)
4. **Keine UI-Builder** - Makros werden als Code eingefügt (designt für AI-Generierung)

Siehe [LIMITATIONS.md](LIMITATIONS.md) für Details.

## AI-Assistenten

Diese App ist für AI-gestützte Makro-Erstellung optimiert. AI-Assistenten können Makros nach `MACROS.md` generieren:

**Beispiel-Prompt:**
> "Erstelle ein EveryMacro, das bei Verbindung mit meinem Auto-Bluetooth (Name: 'MyCarAudio') eine HTTP POST-Anfrage an http://192.168.178.30/api/scene mit Body {\"scene\":\"driving\"} sendet."

## Entwicklung

Das Projekt besteht aus einer einzelnen `index.html` mit inline JavaScript und CSS - optimiert für EveryApp's Loader-Format.

## Lizenz

MIT License

---

**Repository:** https://github.com/Krust3nKaese3/EveryMacro  
**Für EveryApp:** https://github.com/Krust3nKaese3/EveryApp
