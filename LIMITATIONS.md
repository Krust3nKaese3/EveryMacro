# EveryMacro - Limitationen und Einschränkungen

## Übersicht

Dieses Dokument beschreibt die aktuellen Limitationen von EveryMacro und erklärt, welche Funktionen verfügbar sind bzw. welche zusätzliche EveryApp-Unterstützung benötigen.

## Aktuelle Limitationen

### 1. Bluetooth-Trigger (erfordert neue EveryApp-APIs)

**Status:** ⏳ Nicht verfügbar

**Betroffen:**
- `bluetoothConnected(name)` Trigger
- `bluetoothDisconnected(name)` Trigger

**Grund:**
EveryApp bietet aktuell nur `bluetooth.scan()`, `connect()`, `disconnect()` - aber keine **Event-basierte Benachrichtigung** bei Verbindungsänderungen.

**Workaround:**
Keine vollständige Alternative. Interval-basiertes Polling wäre möglich, aber ineffizient und unzuverlässig.

**Lösung:**
Neue Bridge-APIs erforderlich:
- `EveryAppBridge.events.on('bluetooth.connected', callback)`
- `EveryAppBridge.events.on('bluetooth.disconnected', callback)`
- `EveryAppBridge.bluetooth.getConnectedDevices()`

**Dokumentation:** Siehe `EVERYMACRO_BRIDGE_REQUIREMENTS.md`

---

### 2. App-Start-Trigger (erfordert Hintergrundmodus)

**Status:** ⏳ Nicht verfügbar

**Betroffen:**
- `appStart()` Trigger

**Grund:**
WebViews werden beim Schließen von EveryApp beendet. Ein App-Start kann daher nicht erkannt werden.

**Workaround:**
Keine.

**Lösung:**
Background-Mode erforderlich:
- `EveryAppBridge.background.enable()`
- `EveryAppBridge.events.on('app.start', callback)`

---

### 3. Interval-Trigger im Hintergrund

**Status:** ⚠️ Nur im Vordergrund verfügbar

**Betroffen:**
- `interval(ms)` Trigger

**Aktuell:**
Funktioniert, **solange EveryApp geöffnet ist**. Wenn die App geschlossen oder EveryMacro verlassen wird, stoppt der Interval-Timer.

**Workaround:**
App offen lassen (unpraktisch).

**Lösung:**
Hintergrundmodus erforderlich (siehe oben).

---

### 4. Erweiterte HTTP-API

**Status:** ⚠️ Eingeschränkt verfügbar

**Betroffen:**
- `ctx.http.request()` mit Custom Headers, Timeout, POST/PUT/DELETE

**Aktuell:**
- ✅ GET-Requests via `EveryAppBridge.http.fetch()` funktionieren
- ❌ POST/PUT/DELETE eingeschränkt (fetch-API-Abhängig)
- ❌ Keine Custom Headers
- ❌ Kein konfigurierbarer Timeout

**Workaround:**
Grundlegende GET-Requests sind möglich. Für APIs mit Custom Headers oder POST-Body: Feature fehlt.

**Lösung:**
Neue Bridge-API:
```javascript
EveryAppBridge.http.request({
  url: string,
  method: string,
  headers?: object,
  body?: string,
  timeoutMs?: number
})
```

---

### 5. Hintergrundmodus generell

**Status:** ❌ Nicht verfügbar

**Betroffen:**
- Alle Trigger laufen nur wenn App geöffnet ist
- `interval()` stoppt beim Schließen
- `bluetoothConnected()` würde nicht erkannt werden

**Grund:**
React Native WebView wird beim Minimieren/Schließen pausiert oder beendet.

**Workaround:**
Keine echte Lösung. App offen lassen.

**Lösung:**
Background-Service in EveryApp:
- Android Foreground Service
- Notification: "EveryMacro läuft im Hintergrund"
- WebView-Instanz oder leichtgewichtige JS-Engine (Hermes) im Hintergrund

**Anforderungen:**
- Permission `background` in `everyapp.json`
- User-Consent beim Aktivieren
- Battery-Optimierung beachten

---

### 6. Keine UI für Trigger/Conditions-Builder

**Status:** ✅ By Design (nicht geplant)

**Grund:**
EveryMacro ist bewusst **code-basiert** und für **AI-Generierung optimiert**. Ein grafischer Builder würde die Flexibilität einschränken und ist für den Use-Case nicht notwendig.

**Nutzung:**
Benutzer lassen Makros von einem AI-Assistenten schreiben:

**Beispiel-Prompt:**
> "Erstelle ein EveryMacro, das bei Bluetooth-Verbindung mit 'MyCarAudio' eine HTTP POST-Anfrage an http://192.168.178.30/api/scene sendet mit Body {\"scene\":\"driving\"}."

AI generiert fertigen Code → Benutzer fügt ihn ein → Fertig.

**Alternative:**
Für Benutzer ohne AI-Zugang: Vorlagen in `examples/` Ordner bereitstellen.

---

### 7. HTTP CORS-Einschränkungen

**Status:** ⚠️ Plattform-abhängig

**Betroffen:**
- Externe APIs (z.B. öffentliche REST-APIs)

**Grund:**
HTTP-Requests von WebView aus unterliegen CORS-Policies. Viele externe APIs blockieren Requests ohne korrekte CORS-Header.

**Workaround:**
- Nur lokale Geräte/APIs verwenden (z.B. Smart Home im LAN)
- APIs mit CORS-Support nutzen
- Proxy-Server (außerhalb EveryApp-Scope)

**Lösung:**
EveryApp könnte HTTP-Requests über einen nativen Proxy ausführen (umgeht CORS), aber das hat Sicherheits-Implikationen.

---

### 8. Keine Multi-Step Debugging UI

**Status:** ✅ By Design

**Aktuell:**
- Makros werden als Ganzes ausgeführt
- Fehler werden im Log angezeigt
- Keine Schritt-für-Schritt-Ausführung oder Breakpoints

**Grund:**
Würde UI-Komplexität erhöhen und ist für den Use-Case nicht kritisch.

**Workaround:**
- Logs mit `ctx.log()` schreiben
- "Jetzt testen" Button für manuelles Debugging
- Makro in kleinere Schritte aufteilen

---

### 9. Keine persistenten Variablen über App-Neustart hinaus

**Status:** ⚠️ Eingeschränkt verfügbar

**Betroffen:**
- `ctx.vars` Persistierung

**Aktuell:**
- ✅ Variablen bleiben zwischen Makro-Ausführungen erhalten
- ✅ Überleben EveryMacro-Neuladen
- ❌ Werden bei EveryApp-Neustart **möglicherweise** gelöscht (abhängig von Storage-Implementation)

**Grund:**
`EveryAppBridge.storage` verwendet `AsyncStorage`, sollte persistent sein - aber bei App-Cache-Löschen verloren gehen.

**Lösung:**
EveryApp dokumentiert Storage-Persistenz-Garantien.

---

### 10. Keine Makro-Prioritäten oder Abhängigkeiten

**Status:** ⏳ Zukünftig

**Aktuell:**
Alle Makros laufen unabhängig. Keine Möglichkeit zu sagen:
- "Makro A muss vor Makro B laufen"
- "Makro C hat höhere Priorität"

**Workaround:**
Makros kombinieren oder mit `ctx.wait()` verzögern.

**Zukünftige Erweiterung:**
```javascript
macro({
  name: "High Priority",
  priority: 1,  // Höhere Priorität zuerst
  // ...
})
```

---

## Zusammenfassung: Was funktioniert JETZT?

### ✅ Vollständig funktionsfähig (ohne neue APIs)

1. **Manual-Trigger:** "Jetzt testen" Button ✅
2. **HTTP GET-Requests:** `ctx.http.get()` (via fetch) ✅
3. **Benachrichtigungen:** `ctx.notify()` ✅
4. **Vibration:** `ctx.vibrate()` ✅
5. **Logs:** `ctx.log()` ✅
6. **Persistente Variablen:** `ctx.vars` ✅
7. **Storage:** Makros werden gespeichert ✅
8. **Code-Validierung:** Syntax-Check beim Speichern ✅

### ⚠️ Eingeschränkt funktionsfähig

1. **Interval-Trigger:** Nur im Vordergrund ⚠️
2. **HTTP POST/PUT:** Eingeschränkt (keine Custom Headers) ⚠️

### ❌ Nicht verfügbar (ohne neue APIs)

1. **Bluetooth-Trigger:** bluetoothConnected/Disconnected ❌
2. **App-Start-Trigger:** appStart() ❌
3. **Hintergrundmodus:** background.enable() ❌
4. **Erweiterte HTTP-API:** Custom Headers, Timeout ❌

---

## Roadmap: Wann werden Features verfügbar?

### Phase 1: **Jetzt** (ohne neue APIs)
- ✅ Manual-Testing und einfache GET-Requests
- ✅ Makro-Entwicklung und Validierung
- ✅ Denon-Beispiel funktioniert **wenn manuell getestet**

### Phase 2: **Neue EveryApp-APIs** (EveryApp v2.0?)
- ⏳ Bluetooth-Trigger
- ⏳ Erweiterte HTTP-API
- ⏳ Hintergrundmodus
- ⏳ App-Start-Trigger

**Zeitrahmen:** Abhängig von EveryApp-Entwicklung

### Phase 3: **Erweiterte Features** (EveryMacro v2.0)
- ⏳ Weitere Trigger (WiFi, Standort, Zeit-basiert)
- ⏳ Makro-Prioritäten
- ⏳ Makro-Sharing (QR-Code, Export/Import)
- ⏳ Vorlagen-Bibliothek

---

## Workarounds für Benutzer

### "Ich will Bluetooth-Trigger, aber sie funktionieren nicht"

**Lösung:**
1. Prüfe ob EveryApp die neuen APIs unterstützt (Warnmeldung beachten)
2. Falls nicht: Verwende Manual-Trigger als Test
3. Warte auf EveryApp-Update

**Alternative:**
Nutze Interval-Trigger mit `bluetooth.scan()` (ineffizient, aber funktioniert):

```javascript
macro({
  name: "Bluetooth-Polling (Workaround)",
  triggers: [interval(5000)],  // Alle 5 Sekunden
  actions: async (ctx) => {
    // Manual scan via existing API
    const devices = await window.EveryAppBridge.bluetooth.scan();
    const myDevice = devices.find(d => d.name === '1Mii');
    
    if (myDevice && !ctx.vars.wasConnected) {
      ctx.vars.wasConnected = true;
      // Execute action
      await ctx.http.get("http://192.168.178.20/power_on");
    } else if (!myDevice) {
      ctx.vars.wasConnected = false;
    }
  }
})
```

**Nachteile:**
- Battery-intensiv
- Verzögerung (bis zu 5 Sekunden)
- Unzuverlässig bei schnellen Verbindungswechseln

---

## Für Entwickler: Implementierungs-Priorität

**Empfohlene Reihenfolge für EveryApp-APIs:**

1. **Event-System** (Basis für alles andere)
2. **Bluetooth-Events** (höchster User-Value)
3. **Erweiterte HTTP-API** (einfach zu implementieren)
4. **Hintergrundmodus** (komplex, aber essentiell)
5. **App-Start-Event** (folgt aus Hintergrundmodus)

---

## Support & Feedback

- **Limitationen unerwartet?** → GitHub Issue in EveryMacro-Repo
- **Feature-Request?** → Issue mit Label "enhancement"
- **Bridge-APIs fehlen?** → Issue in EveryApp-Repo

---

**Letzte Aktualisierung:** 2024 (basierend auf EveryApp v1.0)
