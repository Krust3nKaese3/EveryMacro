# EveryMacro - Makro-DSL Dokumentation

## Für AI-Assistenten: So schreibst du Makros für EveryMacro

Diese Dokumentation beschreibt das vollständige DSL (Domain Specific Language) für EveryMacro. Du kannst Makros erstellen, die automatisch auf Ereignisse reagieren und Aktionen ausführen.

---

## Grundstruktur

Jedes Makro wird als JavaScript-Code definiert und folgt diesem Format:

```javascript
macro({
  name: "Makro-Name",
  triggers: [
    // Trigger, die das Makro auslösen
  ],
  conditions: [
    // Optional: Bedingungen, die erfüllt sein müssen
  ],
  actions: async (ctx) => {
    // Aktionen, die ausgeführt werden
  }
})
```

### Pflichtfelder

- **`name`** (string): Anzeigename des Makros
- **`triggers`** (array): Liste von Triggern (mindestens einer)
- **`actions`** (async function): Funktion, die die Aktionen ausführt

### Optionale Felder

- **`conditions`** (array): Bedingungen, die vor der Ausführung geprüft werden

---

## Triggers

Triggers definieren, wann ein Makro ausgeführt wird.

### `bluetoothConnected(nameOrAddress)`

Wird ausgelöst, wenn ein Bluetooth-Gerät verbunden wird.

**Parameter:**
- `nameOrAddress` (string, optional): Name oder MAC-Adresse des Geräts. Wenn nicht angegeben, wird bei JEDEM Gerät ausgelöst.

**Beispiele:**
```javascript
bluetoothConnected("1Mii")  // Nur bei Gerät namens "1Mii"
bluetoothConnected("00:11:22:33:44:55")  // Nur bei dieser MAC-Adresse
bluetoothConnected()  // Bei JEDEM verbundenen Gerät
```

### `bluetoothDisconnected(nameOrAddress)`

Wird ausgelöst, wenn ein Bluetooth-Gerät getrennt wird.

**Parameter:**
- `nameOrAddress` (string, optional): Name oder MAC-Adresse des Geräts

**Beispiele:**
```javascript
bluetoothDisconnected("1Mii")
bluetoothDisconnected()
```

### `appStart()`

Wird ausgelöst, wenn EveryApp gestartet wird (funktioniert nur im Hintergrundmodus).

**Beispiel:**
```javascript
appStart()
```

### `interval(ms)`

Wird in regelmäßigen Abständen ausgelöst.

**Parameter:**
- `ms` (number): Intervall in Millisekunden

**Beispiele:**
```javascript
interval(60000)  // Jede Minute
interval(3600000)  // Jede Stunde
interval(5000)  // Alle 5 Sekunden
```

### `manual()`

Wird nur ausgelöst, wenn der Benutzer auf "Jetzt testen" klickt.

**Beispiel:**
```javascript
manual()
```

---

## Context Object (`ctx`)

Die `actions`-Funktion erhält ein Context-Objekt mit folgenden Hilfsfunktionen:

### `ctx.http.get(url)`

Führt einen HTTP GET-Request aus.

**Parameter:**
- `url` (string): Die URL

**Rückgabe:**
- Promise mit `{ status, headers, body }`

**Beispiel:**
```javascript
const response = await ctx.http.get("http://192.168.178.20/status.xml");
ctx.log(`Status: ${response.status}`);
ctx.log(`Body: ${response.body}`);
```

### `ctx.http.request(options)`

Führt einen HTTP-Request mit vollständigen Optionen aus.

**Parameter:**
- `options` (object):
  - `url` (string): Die URL
  - `method` (string): HTTP-Methode (GET, POST, PUT, DELETE, etc.)
  - `headers` (object, optional): HTTP-Header
  - `body` (string, optional): Request-Body
  - `timeoutMs` (number, optional): Timeout in Millisekunden

**Rückgabe:**
- Promise mit `{ status, headers, body }`

**Beispiel:**
```javascript
const response = await ctx.http.request({
  url: "http://192.168.178.20/api/command",
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({ command: "power_on" }),
  timeoutMs: 5000
});
```

### `ctx.wait(ms)`

Wartet eine bestimmte Zeit.

**Parameter:**
- `ms` (number): Wartezeit in Millisekunden

**Beispiel:**
```javascript
await ctx.wait(4000);  // Warte 4 Sekunden
```

### `ctx.notify(title, body)`

Zeigt eine Benachrichtigung an.

**Parameter:**
- `title` (string): Titel der Benachrichtigung
- `body` (string): Text der Benachrichtigung

**Beispiel:**
```javascript
await ctx.notify("Denon eingeschaltet", "Receiver wurde erfolgreich gestartet");
```

### `ctx.vibrate(pattern)`

Lässt das Gerät vibrieren.

**Parameter:**
- `pattern` (array, optional): Vibrationsmuster in Millisekunden [vibrate, pause, vibrate, ...]

**Beispiele:**
```javascript
ctx.vibrate();  // Einmal kurz
ctx.vibrate([100, 50, 100]);  // Vibriere 100ms, Pause 50ms, Vibriere 100ms
```

### `ctx.log(message)`

Schreibt eine Nachricht in das Makro-Log.

**Parameter:**
- `message` (string): Die Log-Nachricht

**Beispiel:**
```javascript
ctx.log("Makro wurde gestartet");
```

### `ctx.vars`

Persistente Variablen, die zwischen Makro-Ausführungen gespeichert werden.

**Beispiel:**
```javascript
// Wert setzen
ctx.vars.counter = (ctx.vars.counter || 0) + 1;

// Wert lesen
ctx.log(`Ausführung Nr. ${ctx.vars.counter}`);
```

---

## Conditions (Optional)

Bedingungen sind Funktionen, die `true` oder `false` zurückgeben. Das Makro wird nur ausgeführt, wenn ALLE Bedingungen `true` zurückgeben.

**Beispiel:**
```javascript
conditions: [
  async (ctx) => {
    const hour = new Date().getHours();
    return hour >= 8 && hour <= 22;  // Nur zwischen 8:00 und 22:00 Uhr
  }
]
```

---

## Fehlerbehandlung

- Wenn ein Fehler auftritt, wird er im Log angezeigt
- Das Makro wird gestoppt, aber nicht deaktiviert
- Verwende `try-catch` für eigene Fehlerbehandlung:

```javascript
actions: async (ctx) => {
  try {
    const response = await ctx.http.get("http://example.com/api");
    ctx.log("Erfolgreich");
  } catch (error) {
    ctx.log(`Fehler: ${error.message}`);
    await ctx.notify("Fehler", "Verbindung fehlgeschlagen");
  }
}
```

---

## Regeln & Best Practices

1. **Immer `await` verwenden** bei asynchronen Funktionen (http, wait, notify)
2. **Fehler abfangen** mit try-catch
3. **Timeouts setzen** bei HTTP-Requests (timeoutMs)
4. **Logs schreiben** für Debugging (ctx.log)
5. **Kurze Namen** für Makros verwenden
6. **Nicht zu viele Interval-Makros** gleichzeitig (Performance)
7. **Bluetooth-Trigger spezifisch halten** (mit Name/Adresse)

---

## Vollständige Beispiele

### Beispiel 1: Denon Receiver bei Bluetooth-Verbindung einschalten

Dieses Makro schaltet einen Denon AV-Receiver ein, wenn das Telefon sich mit einem 1Mii Bluetooth-Adapter verbindet. Es prüft zuerst, ob das Gerät im Standby ist, und schaltet es dann ein und wählt die DVD-Quelle.

**Datei:** `examples/denon-1mii.js`

```javascript
macro({
  name: "Denon einschalten (1Mii BT)",
  triggers: [
    bluetoothConnected("1Mii")
  ],
  actions: async (ctx) => {
    ctx.log("1Mii verbunden, prüfe Denon-Status...");
    
    try {
      // 1. Status abfragen
      const statusResponse = await ctx.http.get(
        "http://192.168.178.20/goform/formMainZone_MainZoneXml.xml"
      );
      
      ctx.log(`Status empfangen: ${statusResponse.status}`);
      
      // 2. Prüfen ob im Standby
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

### Beispiel 2: Denon Receiver bei Bluetooth-Trennung ausschalten (Optional)

Dieses Makro schaltet den Denon Receiver in den Standby, wenn die Bluetooth-Verbindung zum 1Mii getrennt wird.

**Datei:** `examples/denon-1mii-off.js`

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

### Beispiel 3: Periodische Statusabfrage

Fragt alle 5 Minuten den Status ab und benachrichtigt bei Änderungen.

```javascript
macro({
  name: "Denon Status Monitor",
  triggers: [
    interval(300000)  // 5 Minuten
  ],
  actions: async (ctx) => {
    try {
      const response = await ctx.http.get(
        "http://192.168.178.20/goform/formMainZone_MainZoneXml.xml"
      );
      
      const isOn = !response.body.includes("STANDBY");
      const lastState = ctx.vars.lastState || "unknown";
      
      if (lastState !== "unknown" && lastState !== isOn) {
        await ctx.notify(
          "Denon Status",
          isOn ? "Eingeschaltet" : "Standby"
        );
      }
      
      ctx.vars.lastState = isOn;
      
    } catch (error) {
      ctx.log(`Monitor-Fehler: ${error.message}`);
    }
  }
})
```

### Beispiel 4: Zeit-basierte Bedingung

Führt eine Aktion nur zu bestimmten Zeiten aus.

```javascript
macro({
  name: "Abend-Modus",
  triggers: [
    bluetoothConnected("Auto")
  ],
  conditions: [
    async (ctx) => {
      const hour = new Date().getHours();
      return hour >= 18 || hour < 6;  // Nur abends/nachts
    }
  ],
  actions: async (ctx) => {
    ctx.log("Abend-Modus aktiviert");
    await ctx.notify("Abend-Modus", "Willkommen zu Hause!");
    
    // Licht einschalten, etc.
    await ctx.http.get("http://192.168.178.30/api/light/on");
  }
})
```

### Beispiel 5: Zähler mit persistenten Variablen

```javascript
macro({
  name: "Verbindungs-Zähler",
  triggers: [
    bluetoothConnected()
  ],
  actions: async (ctx) => {
    // Zähler erhöhen
    ctx.vars.connections = (ctx.vars.connections || 0) + 1;
    
    ctx.log(`Verbindung Nr. ${ctx.vars.connections}`);
    
    // Bei jeder 10. Verbindung benachrichtigen
    if (ctx.vars.connections % 10 === 0) {
      await ctx.notify(
        "Meilenstein!",
        `${ctx.vars.connections} Bluetooth-Verbindungen`
      );
    }
  }
})
```

### Beispiel 6: Komplexe HTTP-Anfrage mit POST

```javascript
macro({
  name: "Smart Home API",
  triggers: [
    manual()
  ],
  actions: async (ctx) => {
    try {
      const response = await ctx.http.request({
        url: "http://192.168.178.50/api/scene",
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": "Bearer YOUR_TOKEN"
        },
        body: JSON.stringify({
          scene: "movie_night",
          rooms: ["living_room", "kitchen"]
        }),
        timeoutMs: 10000
      });
      
      if (response.status === 200) {
        ctx.log("Szene aktiviert");
        await ctx.notify("Smart Home", "Film-Modus aktiviert");
      } else {
        ctx.log(`Fehler: Status ${response.status}`);
      }
      
    } catch (error) {
      ctx.log(`API-Fehler: ${error.message}`);
    }
  }
})
```

### Beispiel 7: Mehrere Trigger

```javascript
macro({
  name: "Multi-Trigger Demo",
  triggers: [
    bluetoothConnected("Device1"),
    bluetoothConnected("Device2"),
    appStart()
  ],
  actions: async (ctx) => {
    ctx.log("Makro durch einen der Trigger ausgelöst");
    await ctx.notify("Info", "Multi-Trigger aktiviert");
  }
})
```

---

## Debugging-Tipps

1. **Immer Logs schreiben**: Verwende `ctx.log()` ausgiebig
2. **Manuelle Tests**: Nutze den "Jetzt testen"-Button
3. **Fehler loggen**: Verwende try-catch und logge Fehler
4. **Status prüfen**: Prüfe HTTP-Response-Status codes
5. **Timeouts setzen**: Bei HTTP-Requests immer Timeout angeben
6. **Schrittweise testen**: Teste jeden Schritt einzeln

---

## Bekannte Einschränkungen

1. **Bluetooth-Events** erfordern die neue EveryApp-Version mit Events-API
2. **Hintergrundmodus** muss aktiviert sein für appStart() und Interval-Trigger
3. **HTTP-Requests** sind auf das lokale Netzwerk beschränkt (meist keine externen APIs ohne CORS)
4. **Variablen** (`ctx.vars`) haben keine Größenbeschränkung, aber sollten sparsam verwendet werden

---

## Schnellreferenz

| Funktion | Beschreibung |
|----------|--------------|
| `bluetoothConnected(name)` | Trigger bei BT-Verbindung |
| `bluetoothDisconnected(name)` | Trigger bei BT-Trennung |
| `appStart()` | Trigger bei App-Start |
| `interval(ms)` | Periodischer Trigger |
| `manual()` | Manueller Test-Trigger |
| `ctx.http.get(url)` | HTTP GET Request |
| `ctx.http.request(opts)` | HTTP Request (alle Methoden) |
| `ctx.wait(ms)` | Warten |
| `ctx.notify(title, body)` | Benachrichtigung |
| `ctx.vibrate(pattern)` | Vibration |
| `ctx.log(msg)` | Log schreiben |
| `ctx.vars.key` | Persistente Variable |

---

**Ende der Dokumentation**

## Hintergrundausführung

Ist der **Hintergrundmodus** an, führt EveryApp Makros mit `bluetoothConnected()` / `bluetoothDisconnected()` selbst aus –
auch wenn EveryMacro geschlossen ist, EveryApp im Hintergrund läuft oder aus den letzten Apps weggewischt wurde.
EveryMacro registriert dafür jedes aktivierte Makro über die generische EveryApp-API `background.registerTask` (siehe EveryApp docs/BACKGROUND.md). In der Hintergrundausführung gibt es `ctx.log`, `ctx.wait`, `ctx.http.get/request`,
`ctx.notify`, `ctx.vibrate`, `ctx.vars` und zusätzlich `ctx.device` ({name, address}).
Hintergrund-Logs erscheinen beim nächsten Öffnen von EveryMacro mit dem Präfix `[Hintergrund …]`.
`interval()` läuft ebenfalls im Hintergrund (mind. 10 s); `appStart()` nur bei geöffnetem EveryMacro.

## Bluetooth-Geräte & Matching

`bluetoothConnected(x)` / `bluetoothDisconnected(x)` lösen aus, wenn `x` gleich dem **Originalnamen**, dem **eigenen Namen (Alias)**
oder der **MAC-Adresse** ist (Groß-/Kleinschreibung egal, Leerzeichen am Rand egal). Am zuverlässigsten ist die MAC-Adresse, z.B.
`bluetoothConnected("00:11:22:33:44:55")`.

`ctx.device` enthält: `name` (Original), `alias` (eigener Name), `address` (MAC), `type` (classic/le/dual), `bondState`,
`majorClass` (z.B. `AUDIO_VIDEO`), `deviceClass`, `uuids`, `connected`.

Im Bereich **„Bluetooth-Geräte“** in EveryMacro: „Laden“ zeigt die verbundenen Geräte, „📋 Für KI kopieren“ kopiert alle Infos als Text,
den du deiner KI zum Erstellen eines Makros geben kannst.

### `ctx.copy(text)`
Kopiert Text in die Zwischenablage (im Vordergrund und im Hintergrund).

## Netzwerk-Info & Denon-Info

Im Bereich **„Netzwerk-Info“**:
- **Laden**: eigene IP (per WebRTC, kann „?“ sein), vermutetes Gateway (x.y.z.1 / 192.168.178.1). Der WLAN-Name ist erst ab dem nächsten EveryApp-Build verfügbar (`EveryAppBridge.network.getInfo()`), bis dahin steht dort „nicht verfügbar“.
- **Netz scannen**: fragt x.y.z.1–254 per HTTP (Port 80, 800 ms Timeout, 20 parallel) ab und zeigt antwortende Geräte mit Server-Header und Seitentitel.
- **Geräte-IP + Abfragen** (Standard 192.168.178.20, wird gespeichert): Bei einem Denon/Marantz-AVR werden Power, aktuelle Quelle (intern und umbenannt), Lautstärke und alle Quellen (`intern -> angezeigter Name`) gelesen,
  über `formMainZone_MainZoneXml.xml`, `formMainZone_MainZoneXmlStatus.xml` und `POST /goform/AppCommand.xml`
  (GetSourceStatus/GetRenameSource/GetDeletedSource). Andere Geräte: HTTP-Status und gekürzter Inhalt von `GET /`.
- **📋 Für KI kopieren**: alles als Text inkl. Hinweisen für die KI.

Aktuelle Denon-Quelle im Makro prüfen:
```js
const r = await ctx.http.get("http://192.168.178.20/goform/formMainZone_MainZoneXml.xml");
const src = (/<InputFuncSelect><value>([^<]*)/.exec(r.body) || [])[1]; // z.B. "DVD" (interner Name)
if (src !== "DVD") await ctx.http.get("http://192.168.178.20/goform/formiPhoneAppDirect.xml?SIDVD");
```
SI-Befehle verwenden immer den **internen** Namen: SIDVD, SITV, SISAT/CBL, SIBD, SIGAME, SIMPLAY, SIBT, SINET, SITUNER …

## Media-Steuerung (ab nächstem EveryApp-Build)
`await ctx.media.play()`, `pause()`, `toggle()`, `next()`, `previous()`, `stop()` – sendet Medientasten an den gerade aktiven Player (wie Kopfhörer-Tasten).
Vorher wirft das den Fehler „Media-Steuerung braucht nächsten Build“. Welche App gerade spielt, lässt sich nicht abfragen.

## `ctx.trigger`
`{ type, device?, tile?, interval? }` – `type` ist `bluetoothConnected`, `bluetoothDisconnected`, `quickTile`, `interval`, `boot`, `appStart` oder `manual`.
```js
if (ctx.trigger.type === 'manual') ctx.log('Von Hand gestartet');
```

## `ctx.bluetooth`
- `await ctx.bluetooth.getConnectedDevices()` → Liste `{name, alias, address, ...}`
- `await ctx.bluetooth.isConnected("Denon_AmHasen")` → true/false (Name, Alias oder MAC; Groß-/Kleinschreibung egal)
Mit der aktuellen EveryApp nur eingeschränkt (nur gekoppelte Geräte, kein Alias); ab dem nächsten Build vollständig.

## `ctx.vars` und `ctx.globals` (dauerhaft)
- `ctx.vars` gehört **zu einem Makro** (Speicher-Schlüssel `macro_vars_<Makro-ID>`). Die Werte bleiben über Ausführungen, App-Neustarts
  und zwischen Vordergrund (EveryMacro offen) und Hintergrund (EveryApp-Engine) erhalten, weil beide denselben Schlüssel nutzen.
- `ctx.globals` wird von **allen Makros** geteilt (Schlüssel `macro_globals`), ebenfalls dauerhaft.
- Nur JSON-fähige Werte (Zahl, Text, Bool, Objekt/Array). Zugewiesene Werte werden sofort gespeichert (`delete ctx.vars.x` löscht).
- Werden zwei Makros gleichzeitig ausgeführt, kann bei `ctx.globals` die letzte Speicherung gewinnen.
- Makro löschen oder neu anlegen = neue ID = neue `vars`.
```js
ctx.vars.count = (ctx.vars.count || 0) + 1;
ctx.globals.lastDenonOn = Date.now();
```

## Quick-Settings-Kachel: `quickTile("Name")` (ab nächstem EveryApp-Build)
```js
macro({ name: "Denon an (Kachel)", triggers: [quickTile("Denon an")], actions: async (ctx) => { /* ... */ } });
```
Läuft über den EveryApp-Hintergrund (Hintergrundmodus muss an sein). EveryApp hat 5 Kacheln („EveryApp 1“ bis „EveryApp 5“); jeder Name bekommt automatisch eine Kachel,
die dann diesen Namen trägt. Einmalig in den Schnelleinstellungen über „Bearbeiten“ hinzufügen. Maximal 5 verschiedene Namen.
