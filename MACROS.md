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

## Kacheln, Kachel-Menü, Homescreen-Widgets, WLAN-Access-Point (braucht nächsten Build)

Alles hier ist nativ vorbereitet und **braucht den nächsten Build**. Auf der aktuellen APK wird die Konfiguration nur gespeichert. Im Log steht dann „Kacheln/Widgets brauchen nächsten Build“ bzw. „WLAN-Info braucht nächsten Build“. Es stürzt nichts ab.

### Deklaration im Makro
```js
macro({
  name: 'Denon',
  ui: [
    tile({ slot: 1, icon: 'power', label: 'Denon', state: 'off',
      menu: [
        { type: 'button', id: 'tv',    icon: 'tv',    label: 'TV' },
        { type: 'button', id: 'musik', icon: 'music', label: 'Musik' },
        { type: 'button', id: 'power', icon: 'power', label: 'An/Aus' },
        { type: 'slider', id: 'vol', label: 'Lautstärke', min: 0, max: 70, step: 1, value: 35 },
      ] }),
    widget({ id: 'denon', size: 'large', title: 'Denon', columns: 4, items: [
      { type: 'button', id: 'power', icon: 'power', label: 'An/Aus' },
      { type: 'button', id: 'tv', icon: 'tv', label: 'TV' },
      { type: 'button', id: 'musik', icon: 'music', label: 'Musik' },
      { type: 'slider', id: 'vol', label: 'Vol', min: 0, max: 70, step: 1, value: 35 },
    ] }),
  ],
  triggers: [tileMenu(), widgetAction()],
  actions: [async (ctx) => {
    const ip = 'http://192.168.178.50';            // Denon-IP anpassen
    const cmd = (c) => ctx.http.get(`${ip}/goform/formiPhoneAppDirect.xml?${encodeURIComponent(c)}`);
    const { id, value } = ctx.trigger;             // id des Knopfs/Sliders, value bei Slidern
    if (id === 'power') {
      const on = ctx.globals.denonOn !== true;
      await cmd(on ? 'PWON' : 'PWSTANDBY'); ctx.globals.denonOn = on;
      await ctx.tile.setState(1, on ? 'on' : 'off');
    }
    if (id === 'tv')    await cmd('SITV');
    if (id === 'musik') await cmd('SIMPLAY');
    if (id === 'vol')   await cmd('MV' + String(Math.round(value)).padStart(2, '0'));
  }],
});
```

- **`tile({slot?, icon, label, state, subtitle?, menu?})`**: Schnelleinstellungs-Kachel „EveryApp 1–5“. Ohne `slot` wird der nächste freie Slot genommen; explizite Slots haben Vorrang vor `quickTile`-Slots. Eine Kachel **ohne** `menu` löst beim Tippen `quickTile(label)` aus. Eine Kachel **mit** `menu` öffnet einen kleinen nativen Dialog. Knöpfe schließen den Dialog (außer bei `keepOpen: true`). Slider feuern beim Loslassen und merken sich ihren Wert.
- **`widget({id, size:'small'|'large', title?, columns?, items})`**: Es gibt zwei Widget-Typen: „EveryApp klein“ (2×1) und „EveryApp groß“ (4×2). Beide sind in der Größe veränderbar. Hast du mehrere Widget-Configs, fragt Android beim Platzieren, welche angezeigt wird. Knöpfe lösen `widgetAction` aus. Ein Slider-Feld öffnet beim Tippen den Dialog mit einem echten Slider.
- **Icons**: Eingebaut sind `power tv music volume_up volume_down volume_mute speaker lightbulb home play pause stop next previous bluetooth wifi star heart add remove check close headset movie game bolt lock car circle input menu`. Du kannst auch `data:image/png;base64,…` oder eine `https://…`-URL angeben (wird einmal geladen). Unbekannte Namen werden als erster Buchstabe angezeigt.
- **Trigger**: `tileMenu(id?)` und `widgetAction(id?)`. Ohne id reagiert der Trigger auf alle Einträge. Im Makro stehen dann `ctx.trigger.id`, `ctx.trigger.value` (bei Slidern), `ctx.trigger.slot` (Kachel) und `ctx.trigger.widgetId` zur Verfügung.
- **Laufzeit-API**:
  - `ctx.tile.setState(slot|label, 'on'|'off')`, `ctx.tile.setLabel(…)`, `ctx.tile.setIcon(…)`, `ctx.tile.update(slot, patch)`
  - `ctx.widget.update(id, { title, items: { vol: { value: 40 }, power: { state: 'on' } } })`
- Kacheln musst du selbst hinzufügen: Schnelleinstellungen → Stift → „EveryApp N“. Widgets fügst du selbst über Homescreen → Widgets → EveryApp hinzu.

### WLAN / Access Point (Fritzbox vs. Repeater)
- `await ctx.wifi.info()` liefert `{ ssid, bssid, rssi, frequency, linkSpeed, ip, error? }`. Auf der aktuellen APK kommt `{ssid:null, bssid:null, error}`.
- Trigger `wifiChanged(bssid?)` feuert, wenn der Access Point (BSSID) oder die SSID wechselt. Das funktioniert auch im Hintergrund über den EveryApp-Vordergrunddienst. Die Werte stehen dann in `ctx.trigger.bssid`, `ssid`, `rssi`, `frequency`, `prevBssid` und `prevSsid`. Der erste Wert nach dem Start des Dienstes wird nur gemerkt und löst nichts aus. `wifiChanged('aa:bb:…')` filtert auf eine BSSID oder einen SSID-Namen.
- **Berechtigungen**: Android verrät SSID und BSSID nur mit *genauem Standort*. Im Hintergrund brauchst du zusätzlich *Standort „Immer zulassen“*, und der Standort muss am Handy eingeschaltet sein. `EveryAppBridge.network.requestLocation(true)` fragt in zwei Schritten: Zuerst erklärt es, wofür der Standort gebraucht wird, und fragt den genauen Standort ab. Danach führt es zur Einstellungsseite für „Immer zulassen“, denn ab Android 11 geht das nur über die Einstellungen.
- Die BSSID siehst du unter EveryMacro → Netzwerk-Info → „Für KI kopieren“.

```js
// BSSIDs aus "Netzwerk-Info" eintragen
macro({
  name: 'Fritz AP',
  triggers: [wifiChanged()],
  actions: [async (ctx) => {
    const APS = { 'aa:bb:cc:dd:ee:01': 'Fritzbox', 'aa:bb:cc:dd:ee:02': 'Repeater (192.168.178.133)' };
    const t = ctx.trigger;
    if (!t.bssid) return ctx.notify('WLAN', 'WLAN getrennt');
    await ctx.notify('WLAN-Wechsel', `${APS[t.bssid] || t.bssid} (${t.ssid}, ${t.rssi} dBm)`);
  }],
});
```

## BLE (Bluetooth Low Energy, GATT), z.B. LED-Leiste (braucht nächsten Build)

Auf der aktuellen APK wirft jede `ctx.ble.*`-Funktion den Fehler „BLE braucht nächsten Build“.

- `await ctx.ble.scan({ durationMs: 4000, namePrefix: 'ELK' })` liefert `[{ address, name, rssi, serviceUuids, manufacturerData }]`.
- `await ctx.ble.connect(addr, { timeoutMs: 10000 })` liefert `{ address, name, services: [{ uuid, characteristics: [{ uuid, properties: ['read','write','writeWithoutResponse','notify','indicate'] }] }] }`. Eine bestehende Verbindung wird wiederverwendet.
- `await ctx.ble.write(addr, serviceUuid, charUuid, bytes, { withResponse })`:
  - `bytes` kann ein Array `[0x7e, 0x04, …]` oder ein Hex-String `"7e0404…"` sein.
  - Ohne Angabe von `withResponse` wird „mit Antwort“ benutzt, wenn die Characteristic das kann.
  - UUIDs gehen auch kurz (`'ffe0'`, `'ffe1'`).
  - `write`, `read` und `notify` verbinden automatisch, falls nötig.
- `await ctx.ble.read(addr, svc, chr)` liefert `{ hex, bytes }`.
- `await ctx.ble.notify(addr, svc, chr, true)` schaltet Benachrichtigungen ein. Der Trigger `bleNotify(addr?, charUuid?)` liefert dann `ctx.trigger.hex`, `ctx.trigger.bytes` (gleich `ctx.trigger.value`), `address`, `serviceUuid` und `charUuid`.
- `await ctx.ble.disconnect(addr)` trennt die Verbindung.
- **Berechtigung**: „Geräte in der Nähe“ (BLUETOOTH_SCAN + BLUETOOTH_CONNECT). Der Standort wird dafür nicht gebraucht. Android fragt beim ersten Scan in EveryMacro → **BLE-Info**. Hintergrund-Makros fragen nicht nach, sondern melden einen Fehler, wenn die Berechtigung fehlt.
- **BLE-Info**: Scannen, auf ein Gerät tippen, dann siehst du alle Services, Characteristics, Eigenschaften und lesbaren Werte. Mit „Für KI kopieren“ kopierst du das Ergebnis.
- Die meisten LED-Controller erlauben **nur eine Verbindung**. Die MeRGBW-App muss also geschlossen bzw. getrennt sein.

### LED-Leiste (MeRGBW): Protokoll herausfinden
Das Byte-Protokoll der MeRGBW-App ist nicht dokumentiert und muss mitgeschnitten werden:
1. Entwickleroptionen → „Bluetooth-HCI-Snoop-Log aktivieren“ einschalten, dann Bluetooth aus und wieder an.
2. In MeRGBW ein paar Aktionen machen: an, aus, rot, grün, Helligkeit.
3. Den Log holen: `adb bugreport bugreport.zip` (darin liegt `btsnoop_hci.log`). Den Log in Wireshark öffnen und mit `btatt.opcode == 0x52 || btatt.opcode == 0x12` filtern, das sind die Write Commands und Write Requests.
4. Service- und Char-UUIDs sowie die Bytes notieren und hier eintragen. Am einfachsten gibst du der KI zusätzlich den BLE-Info-Dump.

```js
// Platzhalter! UUIDs und Bytes aus BLE-Info + HCI-Snoop-Log ersetzen.
const LED = { addr: 'AA:BB:CC:DD:EE:FF', svc: 'ffe0', chr: 'ffe1' };
macro({
  name: 'LED rot',
  ui: [tile({ slot: 2, icon: 'lightbulb', label: 'LED', menu: [
    { type: 'button', id: 'on', icon: 'lightbulb', label: 'An' },
    { type: 'button', id: 'off', icon: 'close', label: 'Aus' },
    { type: 'button', id: 'red', icon: 'circle', label: 'Rot' },
    { type: 'slider', id: 'bri', label: 'Helligkeit', min: 0, max: 100, step: 5, value: 80 },
  ] })],
  triggers: [tileMenu()],
  actions: [async (ctx) => {
    const w = (bytes) => ctx.ble.write(LED.addr, LED.svc, LED.chr, bytes, { withResponse: false });
    const { id, value } = ctx.trigger;
    if (id === 'on')  await w('7e0404f00001ff00ef');        // Beispiel-Bytes (ELK-BLEDOM-Stil), NICHT MeRGBW-verifiziert
    if (id === 'off') await w('7e0404000000ff00ef');
    if (id === 'red') await w([0x7e, 0x07, 0x05, 0x03, 0xff, 0x00, 0x00, 0x10, 0xef]);
    if (id === 'bri') await w([0x7e, 0x04, 0x01, Math.round(value), 0xff, 0x00, 0x00, 0x00, 0xef]);
    await ctx.tile.setState(2, id === 'off' ? 'off' : 'on');
  }],
});
```

### BLE: Berechtigung und automatisches Neu-Abonnieren
- Eine Mini-App braucht `"ble"` in den `permissions` ihres Manifests (`everyapp.json`). EveryMacro hat das deklariert, EveryApp fragt beim nächsten Start einmal nach. Ohne diese Berechtigung kommt der Fehler „BLE nicht erlaubt …“.
- `ctx.ble.notify(addr, svc, chr, true)` merkt sich das Abo dauerhaft. Bricht die Verbindung ab oder startet EveryApp neu, verbindet EveryApp automatisch wieder und abonniert neu, mit wachsender Wartezeit bis maximal 5 Minuten. Ein Neu-Abonnieren per `appStart`/`interval` ist nicht mehr nötig.
- `ctx.ble.notify(…, false)` entfernt das Abo. `ctx.ble.disconnect(addr)` pausiert die automatische Wiederverbindung bis zum nächsten `connect`/`notify`.

## Tuya / Smart Life lokal (LAN, ohne Internet) – braucht nächsten Build

Steuert Tuya-Geräte (z.B. Deckenlampe) direkt im WLAN über Port 6668, Protokoll 3.3 / 3.4 / 3.5.
Benötigt die Permission **`net`** (steht in `everyapp.json`; EveryApp fragt beim nächsten Start nach).
Auf der alten APK werfen alle Aufrufe `… braucht nächsten Build` (kein Absturz).

**localKey besorgen:** einmalig mit [tinytuya](https://github.com/jasonacox/tinytuya) `python -m tinytuya wizard`
(Tuya-IoT-Developer-Account, Smart-Life-App verknüpfen) → liefert `id`, `key` (=localKey, 16 Zeichen) und `version`.
Achtung: Wird das Gerät in der App neu gekoppelt, ändert sich der localKey.

**Typische DPs Lampe:** `"20"` an/aus (bool), `"21"` Modus (`"white"`/`"colour"`), `"22"` Helligkeit (10–1000), `"23"` Farbtemperatur (0–1000).

```js
macro("Deckenlampe an", {
  secrets: [{ key: "tuyaKey", label: "Tuya localKey (16 Zeichen)" }],
  run: async (ctx) => {
    const lamp = ctx.tuyaLocal({
      id: "bf1234567890abcdef",      // Geräte-ID
      localKey: ctx.secrets.tuyaKey,
      version: "3.4",                 // 3.3 | 3.4 | 3.5
      // ip: "192.168.178.40",        // optional – sonst UDP-Discovery (6666/6667/7000, ~6 s)
    });
    try {
      await lamp.set({ "20": true, "22": 800 });   // lokal zuerst
      ctx.log("Status: " + JSON.stringify(await lamp.status()));
    } catch (e) {
      ctx.log("Lokal fehlgeschlagen: " + e.message + " → Cloud-Fallback", "warn");
      // Cloud-Fallback (Platzhalter): Tuya-IoT-Cloud-API mit Access-ID/Secret aus ctx.secrets,
      // signiert per ctx.crypto.hmacSha256, Aufruf per ctx.http – noch nicht fertig implementiert.
      throw e;
    }
  }
});
```

**Geräte im WLAN finden:** `const list = await ctx.net.tuyaDiscover(6000)` → `[{ip, gwId, version, …}]`.
Tipp: feste IP im Router vergeben und `ip` setzen – schneller und zuverlässiger als Discovery.

**Low-Level** (alles Hex-Strings):
- `const s = await ctx.net.tcp(host, port, {timeoutMs})` → `s.send(hex)`, `await s.receive({minBytes, timeoutMs})` (`''` bei Timeout), `s.close()`
- `ctx.net.udpSend(host, port, hex, {broadcast: true})`, `await ctx.net.udpListen([6666, 6667], 5000)` → `[{from, port, hex}]`
- `ctx.crypto.aesEcb(encrypt, keyHex, dataHex)` (ohne Padding), `aesGcm(encrypt, key, iv, aad, data)` (Tag hinten angehängt), `hmacSha256(key, data)`, `md5(data)`, `crc32(data)` → Zahl, `randomHex(n)`

## 🔑 Secrets (API-Keys, Passwörter)

Secrets stehen **nie im Makro-Code**. Das Makro deklariert nur, welche es braucht:

```js
macro({
  name: "Tuya Licht",
  secrets: [
    { key: "TUYA_SECRET", label: "Tuya Access Secret", hint: "iot.tuya.com → Projekt → Overview" },
    { key: "TUYA_ID", label: "Tuya Access ID" }
  ],
  triggers: [manual()],
  actions: async (ctx) => {
    const secret = ctx.secrets.TUYA_SECRET;   // fehlt es -> Fehler "Secret TUYA_SECRET fehlt"
    ctx.log("Secret geladen: " + secret);      // im Log steht nur "•••"
  }
});
```

- **Beim Speichern** erscheint für jedes fehlende Secret ein maskiertes Feld mit 👁 (anzeigen/verbergen), 📋 (einfügen) und 🗑️ (löschen).
- Jede Eingabe wird **sofort gespeichert** – du kannst die App verlassen, das Secret holen und zurückkommen; auch teilweise ausgefüllt ist ok. Ein offener Secrets-Dialog öffnet sich nach einem Neuladen wieder.
- **Später bearbeiten:** Button `🔑N` am Makro.
- **Gespeichert pro Secret-Key, nicht pro Makro:** Löschst du ein Makro und legst es neu an, sind die Secrets noch da. Makros mit demselben Key teilen sich das Secret.
- **Fehlt ein Secret beim Ausführen:** Fehler `Secret TUYA_SECRET fehlt` mit Button „🔑 jetzt eintragen“.
- `ctx.secrets` ist schreibgeschützt und funktioniert in der App und in Hintergrund-Tasks.
- Secret-Werte werden im Log (App und Hintergrund) durch `•••` ersetzt und stehen in keinem „Für KI kopieren“-Block.
- ⚠️ **LITE:** Aktuell werden Secrets **unverschlüsselt** app-intern in EveryApp gespeichert (nicht für andere Apps lesbar, aber nicht im Keystore). Mit dem nächsten EveryApp-Build werden sie automatisch in den Android Keystore (expo-secure-store) migriert.
- Erlaubte Keys: `A-Z a-z 0-9 _ . -`, max. 64 Zeichen.

## 🔗 Makros per Link importieren

**Formate** (nur `https`):
- Deep-Link: `everyapp://everymacro/import?url=<URL-encodete https-Raw-URL>` oder `everyapp://everymacro/import?gist=<gist-id>`
  (auf Dev-Client-Builds auch `exp+everyapp://everymacro/import?...`). Braucht den nächsten nativen Build (Scheme `everyapp`).
- Ohne Deep-Link (geht sofort): Im Abschnitt *Makros* URL ins Feld → **Import**, oder **📋 Aus Zwischenablage importieren**.
  Akzeptiert: `https://…` Raw-URL, `https://gist.github.com/<user>/<id>`, nackte Gist-ID, einen `everyapp://…`-Link oder direkt den Makro-Code.
- Gist: geladen über `https://api.github.com/gists/<id>`; genommen wird die erste Datei `*.macro.js`/`*.macro.json`, sonst die erste Datei.
- Inhalt: Makro-Code (`macro({...})`) oder JSON `{"code":"macro({...})"}` bzw. ein Array davon (mehrere Makros).

**Upsert:** Schlüssel ist das Feld `id` im Makro-Objekt, sonst `name`.
```js
macro({ id: "deckenlampe-an", name: "Deckenlampe an", triggers: [manual()], run: async (ctx) => { /* … */ } });
```
Vor dem Speichern: Dialog „Makro X wird aktualisiert“ bzw. „… wird neu angelegt“ (OK/Abbrechen).
Beim Aktualisieren bleiben gespeicherte Secrets und `ctx.vars` erhalten (interne ID ändert sich nicht), ebenso aktiviert/deaktiviert und Ausführungszähler.
Fehler (HTTP-Status, kein https, ungültiges Makro) erscheinen in einer roten Box mit **📋 Fehler kopieren**.

### 📁 GitHub-Ordner: Alle Makros auf einmal importieren

**Neu:** Du kannst jetzt **alle** `.js`-Makros aus einem GitHub-Repo-Ordner auf einmal importieren.

**So geht's:**
1. Im Abschnitt **Makros** findest du unter dem normalen Import-Feld den neuen Bereich **„📁 GitHub-Ordner importieren"**
2. Gib die URL zu einem GitHub-Ordner ein, z.B.:
   ```
   https://github.com/Krust3nKaese3/EveryMacro/tree/main/my-macros
   ```
3. Klicke auf **„Importieren"**
4. EveryMacro lädt alle `.js`-Dateien aus dem Ordner und importiert sie einzeln
5. Du siehst eine Zusammenfassung: wie viele Makros importiert/aktualisiert/fehlgeschlagen wurden
6. Bei Fehlern kannst du die Fehlermeldungen kopieren

**Unterstützte URL-Formate:**
- `https://github.com/<owner>/<repo>/tree/<branch>/<path>`
- `https://raw.githubusercontent.com/<owner>/<repo>/<branch>/<path>` (wird automatisch konvertiert)

**Deep-Link:** Der GitHub-Ordner-Import funktioniert auch per Deep-Link:
```
everyapp://everymacro/import?url=https://github.com/user/repo/tree/main/folder
```

**Dev-Umgebung:** Wenn EveryMacro in einem Entwicklungs-Build von EveryApp (z.B. `SrvEveryApp` mit Expo Dev-Server) läuft, wird das URL-Feld automatisch mit `https://github.com/Krust3nKaese3/EveryMacro/tree/main/my-macros` vorausgefüllt.

**Update-Logik:**
- Makros mit demselben `id` werden aktualisiert (Secrets und `ctx.vars` bleiben erhalten)
- Makros ohne `id` werden am Namen erkannt
- Neue Makros werden hinzugefügt
- Bestehende Makros werden **nicht** nochmal gefragt (nur bei Einzelimport) – beim Massen-Import werden alle Makros automatisch übernommen

## 🪟 Popups (Overlay-Fenster) – braucht nächsten Build, Permission `popup`

Ein Popup ist ein frei gestaltbares Overlay-Fenster mit eigenem HTML/JS. Öffnet sich per Quick-Tile, Widget-Knopf
oder `ctx.popup.open()` (nur wenn EveryApp im Vordergrund ist).

**Spec:** `{ id, html | url (nur https), title?, state?: {…}, throttleMs?: 300, style?: {…} }`

| style | Werte | Standard |
|---|---|---|
| `width`, `height` | dp-Zahl, `"80%"`, `"auto"` (Höhe passt sich dem Inhalt an; Breite auto = 92 %) | 92 % × 420 dp |
| `position` | `center` · `bottom` (Sheet) · `top` | `center` |
| `margin` | dp | 16 |
| `background` | `#RRGGBB`, `#AARRGGBB`, `rgba(r,g,b,a)` | `#F21E2A44` |
| `backgroundAlpha` | 0..1 (überschreibt Alpha) | – |
| `scrim`, `scrimAlpha` | Farbe hinter dem Fenster, 0..1 | `#000`, 0.4 |
| `blur` | dp, Hintergrund-Blur (Android 12+, sonst ignoriert) | 0 |
| `cornerRadius`, `borderWidth`, `borderColor`, `elevation` | dp / Farbe | 22, 0, –, 12 |
| `animation` | `fade` · `slide` · `scale` · `none` | `fade` |
| `dismissOnOutsideTap` | bool | true |

**Binden:** `tile({ label, icon, popup: spec })` oder Widget-Knopf `{ type: "button", id, label, popup: spec }`.

**Im Popup-HTML:** `EveryAppPopup.send(event, value)`, `EveryAppPopup.state` (zuletzt gespeicherter Zustand),
`EveryAppPopup.onMessage(d => …)`, `EveryAppPopup.close()`, `EveryAppPopup.resize()`.

**Im Makro:** Trigger `popupEvent(popupId?, event?)` → `ctx.trigger = { type: "popup", popupId, event, value }`
(pro Event gedrosselt, Standard 300 ms; beim Schließen `event: "close"`).
Zurück ans Popup: `ctx.popup.send(popupId, { key: value })` (wird gespeichert und live angezeigt), `ctx.popup.close(id)`, `ctx.popup.state(id)`.

**Komponenten-Bibliothek `popupKit({ title?, accent?, css?, items })`** liefert fertiges HTML:
- `{ type: "colorWheel", id, size?: 220 }` → Wert `{h: 0–360, s: 0–1000, v}` (Tuya colour_data_v2-Skala)
- `{ type: "slider", id, label?, min?, max?, step?, unit? }` → Zahl
- `{ type: "toggle", id, label? }` → true/false
- `{ type: "buttons", items: [{ id, label, value?, close? }] }` → `value` (Standard true)
- `{ type: "html", html }` → eigenes Markup
Startwerte: `value` am Item oder `state: { id: wert }` in der Spec; `ctx.popup.send(popupId, { id: wert })` aktualisiert live.

### Beispiel „Licht“ (Tuya, lokal)
Tuya-DPs (typisch, v2): `20` an/aus, `21` Modus `"white"|"colour"`, `22` bright_value_v2 (10–1000),
`23` temp_value_v2 (0–1000), `24` colour_data_v2 = JSON `{"h":0–360,"s":0–1000,"v":0–1000}` (bei 3.3 oft als Hex-String – siehe Gerät).
```js
macro({
  id: "licht-popup", name: "Licht",
  secrets: [{ key: "tuyaKey", label: "Tuya localKey" }],
  ui: [tile({ label: "Licht", icon: "lightbulb", popup: {
    id: "licht",
    html: popupKit({ title: "Deckenlampe", items: [
      { type: "toggle", id: "on", label: "An" },
      { type: "colorWheel", id: "color" },
      { type: "slider", id: "bright", label: "Helligkeit", min: 10, max: 1000, step: 10 },
      { type: "slider", id: "ct", label: "Farbtemperatur", min: 0, max: 1000, step: 10 },
      { type: "buttons", items: [{ id: "white", label: "Weiß" }, { id: "off", label: "Aus", close: true }] },
    ] }),
    style: { position: "bottom", height: "auto", animation: "slide", cornerRadius: 28, blur: 20, scrimAlpha: 0.3 },
  } })],
  triggers: [popupEvent("licht")],
  run: async (ctx) => {
    const lamp = ctx.tuyaLocal({ id: "bf1234567890abcdef", localKey: ctx.secrets.tuyaKey, version: "3.4" });
    const { event, value } = ctx.trigger;
    if (event === "on") await lamp.set({ "20": value });
    if (event === "off") await lamp.set({ "20": false });
    if (event === "bright") await lamp.set({ "21": "white", "22": value });
    if (event === "ct") await lamp.set({ "21": "white", "23": value });
    if (event === "white") await lamp.set({ "20": true, "21": "white" });
    if (event === "color") await lamp.set({ "20": true, "21": "colour", "24": JSON.stringify({ h: value.h, s: value.s, v: ctx.vars.v || 1000 }) });
    if (event === "bright") ctx.vars.v = value;
    if (event !== "close") await ctx.tile(1).set({ state: event === "off" || value === false ? "inactive" : "active" });
  },
});
```

## 🟦 Kacheln zur Laufzeit ändern – `ctx.tile(n)` (braucht nächsten Build, Permission `tiles`)
`await ctx.tile(1).set({ icon, label, subtitle, state })`, `await ctx.tile(1).get()`, `await ctx.tile(1).release()` – n = 1..5.
- `state`: `"active"` · `"inactive"` · `"unavailable"` (auch `"on"/"off"`/true/false)
- `subtitle`: Android 10+ (älter: ignoriert)
- `icon`: Name (`lightbulb, power, bolt, tv, wifi, music, play, pause, home, lock, star, heart, car, speaker, …`; Material-Aliase wie `power_settings_new`, `play_arrow`),
  Pfad im Mini-App-Repo (`icons/lamp.png`), `https://…png`, `data:image/png;base64,…` oder SVG (`<svg…>`/`.svg`, nur im Vordergrund – im Hintergrund PNG/Name nutzen).
  Das Bild wird zur weißen Maske; Android färbt es selbst ein.
- Eine Kachel gehört der Mini-App, die sie belegt; andere Mini-Apps bekommen einen Fehler. Bleibt nach Neustart erhalten.
- Alt weiterhin: `ctx.tile.setState(slotOderName, "on")` usw.
