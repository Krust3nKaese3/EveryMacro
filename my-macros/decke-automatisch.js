/*
 * Decke automatisch (WLAN oben, Dämmerung)
 *
 * Zweck:     Schaltet eine Tuya-Deckenlampe und einen MeRGBW-Bluetooth-LED-Streifen automatisch
 *            basierend auf WLAN-Position und Sonnenstand (Dämmerung):
 *            - Oben + hell: nichts tun
 *            - Oben + dunkel: an mit berechneter Helligkeit (graduelle Dämmerung)
 *            - Nicht oben: aus
 * Auslöser:  wifiChanged(WLAN_NAME) – jeder Router-/Repeater-Wechsel im Heim-WLAN
 *            manual()              – Test-Button
 * Ablauf:    1) Sonnenstand für Frankfurt berechnen  2) BSSID prüfen (oben?)
 *            3) Helligkeit anhand Sonnenhöhe berechnen (graduelle Dämmerung)
 *            4) Tuya-Deckenlampe steuern (switch_led + bright_value_v2)
 *            5) MeRGBW-LED-Streifen per Bluetooth steuern (Handshake + Ein/Aus + Helligkeit)
 * Voraussetzungen: Native Build von EveryMacro, Standort "Immer zulassen"
 *            (für BSSID im Hintergrund), Secret TUYA_SECRET (Tuya Access Secret),
 *            Berechtigung "Geräte in der Nähe" für Bluetooth,
 *            nRF Connect und MeRGBW-App müssen geschlossen sein (Konflikt)
 * Geräte:    Repeater/Access Points (BSSIDs), Tuya-Lampe über Tuya Cloud EU,
 *            MeRGBW-Bluetooth-LED-Streifen (Service FFF0, Write FFF3, Notify FFF4)
 *
 * Platzhalter unten ausfüllen (siehe README.md).
 */

// ===== EINSTELLUNGEN =====
const WLAN_NAME = "<DEIN_WLAN_NAME>";
const BSSID_OBEN_1 = "<BSSID_OBEN_1>";
const BSSID_OBEN_2 = "<BSSID_OBEN_2>";
const BSSID_OBEN_3 = "<BSSID_OBEN_3>";
const TUYA_ACCESS_ID = "<TUYA_ACCESS_ID>";
const TUYA_DEVICE_ID = "<TUYA_DEVICE_ID>";
const STREIFEN_MAC = "<STREIFEN_BT_MAC>";

macro({
  name: "Decke automatisch (WLAN oben, Dämmerung)",
  secrets: [{ key: "TUYA_SECRET", label: "Tuya Access Secret", hint: "iot.tuya.com → Projekt → Overview" }],
  triggers: [ wifiChanged(WLAN_NAME), manual() ],
  actions: async (ctx) => {
    // ===== KONFIGURATION =====
    const EINSTELLUNGEN = {
      startSonneGrad: 6,           // Ab dieser Sonnenhöhe (Grad) beginnt die Dämmerung
      vollDunkelSonneGrad: -6,     // Bei dieser Sonnenhöhe ist es voll dunkel (100% Helligkeit)
      minHelligkeitProzent: 20,    // Minimale Helligkeit bei startSonneGrad
      maxHelligkeitProzent: 100    // Maximale Helligkeit bei vollDunkelSonneGrad
    };

    // Frankfurt Koordinaten (generisch, für Sonnenstand-Berechnung)
    const LAT = 50.11, LON = 8.68;

    const OBEN = [BSSID_OBEN_1, BSSID_OBEN_2, BSSID_OBEN_3].map(b => b.toLowerCase());
    const ID = TUYA_ACCESS_ID;
    const SECRET = ctx.secrets.TUYA_SECRET;
    const DEV = TUYA_DEVICE_ID;
    const HOST = "https://openapi.tuyaeu.com";

    // ===== SONNENSTAND-BERECHNUNG =====
    // Berechnet die Sonnenhöhe in Grad für ein gegebenes Datum (vereinfachte Formel)
    const sonnenhoehe = (d) => {
      const rad = Math.PI / 180;
      const jd = d.getTime() / 86400000 + 2440587.5;
      const n = jd - 2451545.0;
      const L = (280.46 + 0.9856474 * n) % 360;
      const g = ((357.528 + 0.9856003 * n) % 360) * rad;
      const lambda = (L + 1.915 * Math.sin(g) + 0.02 * Math.sin(2 * g)) * rad;
      const eps = (23.439 - 0.0000004 * n) * rad;
      const dec = Math.asin(Math.sin(eps) * Math.sin(lambda));
      const ra = Math.atan2(Math.cos(eps) * Math.sin(lambda), Math.cos(lambda));
      const gmst = (18.697374558 + 24.06570982441908 * n) % 24;
      const ha = ((gmst * 15 + LON) * rad) - ra;
      const lat = LAT * rad;
      return Math.asin(Math.sin(lat) * Math.sin(dec) + Math.cos(lat) * Math.cos(dec) * Math.cos(ha)) / rad;
    };

    // ===== ZUSTAND ERMITTELN =====
    const t = ctx.trigger || {};
    let wifi = null;
    try { wifi = await ctx.wifi.info(); } catch (e) {}
    const bssid = (t.bssid || (wifi && wifi.bssid) || "").toLowerCase();
    const oben = OBEN.includes(bssid);
    const hoehe = sonnenhoehe(new Date());
    const E = EINSTELLUNGEN;

    // Berechne Helligkeitsanteil (0.0 = hell/startSonneGrad, 1.0 = dunkel/vollDunkelSonneGrad)
    let anteil = (E.startSonneGrad - hoehe) / (E.startSonneGrad - E.vollDunkelSonneGrad);
    anteil = Math.max(0, Math.min(1, anteil));
    const prozent = Math.round(E.minHelligkeitProzent + anteil * (E.maxHelligkeitProzent - E.minHelligkeitProzent));

    const dunkel = hoehe < E.startSonneGrad;
    ctx.log(`Auslöser ${t.type} | BSSID ${bssid || "keine"} | oben ${oben} | Sonne ${hoehe.toFixed(1)}° | dunkel ${dunkel} | Helligkeit ${prozent}%`);

    // Wenn oben, aber noch hell: nichts tun
    if (oben && !dunkel) {
      ctx.log("Oben, aber noch hell: nichts tun");
      return;
    }

    // ===== TUYA-HILFSFUNKTIONEN (SHA256 + HMAC) =====
    const utf8 = (s) => Array.from(unescape(encodeURIComponent(s)), c => c.charCodeAt(0));

    const sha256 = (bytes) => {
      const K = [0x428a2f98,0x71374491,0xb5c0fbcf,0xe9b5dba5,0x3956c25b,0x59f111f1,0x923f82a4,0xab1c5ed5,0xd807aa98,0x12835b01,0x243185be,0x550c7dc3,0x72be5d74,0x80deb1fe,0x9bdc06a7,0xc19bf174,0xe49b69c1,0xefbe4786,0x0fc19dc6,0x240ca1cc,0x2de92c6f,0x4a7484aa,0x5cb0a9dc,0x76f988da,0x983e5152,0xa831c66d,0xb00327c8,0xbf597fc7,0xc6e00bf3,0xd5a79147,0x06ca6351,0x14292967,0x27b70a85,0x2e1b2138,0x4d2c6dfc,0x53380d13,0x650a7354,0x766a0abb,0x81c2c92e,0x92722c85,0xa2bfe8a1,0xa81a664b,0xc24b8b70,0xc76c51a3,0xd192e819,0xd6990624,0xf40e3585,0x106aa070,0x19a4c116,0x1e376c08,0x2748774c,0x34b0bcb5,0x391c0cb3,0x4ed8aa4a,0x5b9cca4f,0x682e6ff3,0x748f82ee,0x78a5636f,0x84c87814,0x8cc70208,0x90befffa,0xa4506ceb,0xbef9a3f7,0xc67178f2];
      let H = [0x6a09e667,0xbb67ae85,0x3c6ef372,0xa54ff53a,0x510e527f,0x9b05688c,0x1f83d9ab,0x5be0cd19];
      const m = bytes.slice(); const l = m.length * 8;
      m.push(0x80); while (m.length % 64 !== 56) m.push(0);
      for (let i = 7; i >= 0; i--) m.push(i > 3 ? 0 : (l >>> (i * 8)) & 0xff);
      const r = (x, n) => (x >>> n) | (x << (32 - n));
      for (let o = 0; o < m.length; o += 64) {
        const w = [];
        for (let i = 0; i < 16; i++) w[i] = (m[o+i*4]<<24)|(m[o+i*4+1]<<16)|(m[o+i*4+2]<<8)|m[o+i*4+3];
        for (let i = 16; i < 64; i++) {
          const s0 = r(w[i-15],7)^r(w[i-15],18)^(w[i-15]>>>3), s1 = r(w[i-2],17)^r(w[i-2],19)^(w[i-2]>>>10);
          w[i] = (w[i-16]+s0+w[i-7]+s1)|0;
        }
        let [a,b,c,d,e,f,g,h] = H;
        for (let i = 0; i < 64; i++) {
          const t1 = (h+(r(e,6)^r(e,11)^r(e,25))+((e&f)^(~e&g))+K[i]+w[i])|0;
          const t2 = ((r(a,2)^r(a,13)^r(a,22))+((a&b)^(a&c)^(b&c)))|0;
          h=g; g=f; f=e; e=(d+t1)|0; d=c; c=b; b=a; a=(t1+t2)|0;
        }
        H = H.map((v, i) => (v + [a,b,c,d,e,f,g,h][i]) | 0);
      }
      const out = []; H.forEach(v => { for (let i = 3; i >= 0; i--) out.push((v >>> (i*8)) & 0xff); });
      return out;
    };

    const hex = (b) => b.map(x => x.toString(16).padStart(2, "0")).join("");

    const hmac = (key, msg) => {
      let k = utf8(key); if (k.length > 64) k = sha256(k);
      while (k.length < 64) k.push(0);
      const inner = sha256(k.map(x => x ^ 0x36).concat(utf8(msg)));
      return hex(sha256(k.map(x => x ^ 0x5c).concat(inner))).toUpperCase();
    };

    // Tuya-API-Aufruf mit HMAC-Signatur
    const call = async (method, path, body = "", token = "") => {
      const ts = String(Date.now());
      const strToSign = [method, hex(sha256(utf8(body))), "", path].join("\n");
      const sign = hmac(SECRET, ID + token + ts + strToSign);
      const headers = { client_id: ID, sign, t: ts, sign_method: "HMAC-SHA256", "Content-Type": "application/json" };
      if (token) headers.access_token = token;
      const res = await ctx.http.request({ url: HOST + path, method, headers, body: body || undefined });
      const json = JSON.parse(res.body);
      if (!json.success) throw new Error(json.msg || "Tuya-Fehler");
      return json.result;
    };

    // ===== TUYA-DECKENLAMPE STEUERN =====
    try {
      const token = (await call("GET", "/v1.0/token?grant_type=1")).access_token;
      const dev = `/v1.0/iot-03/devices/${DEV}/commands`;

      if (oben) {
        // Lampe an
        await call("POST", dev, JSON.stringify({ commands: [{ code: "switch_led", value: true }] }), token);

        // Helligkeit setzen (bright_value_v2: 10-1000, Fallback auf bright_value: 25-255)
        const wert = Math.round(10 + (prozent / 100) * 990);
        try {
          await call("POST", dev, JSON.stringify({ commands: [{ code: "bright_value_v2", value: wert }] }), token);
        } catch (e) {
          await call("POST", dev, JSON.stringify({ commands: [{ code: "bright_value", value: Math.round(25 + (prozent / 100) * 230) }] }), token);
        }
        ctx.log(`Decke an mit ${prozent}%`);
      } else {
        // Lampe aus
        await call("POST", dev, JSON.stringify({ commands: [{ code: "switch_led", value: false }] }), token);
        ctx.log("Decke aus");
      }
    } catch (e) {
      ctx.log(`FEHLER: ${e.message}`);
      await ctx.notify("Tuya-Fehler", e.message);
    }

    // ===== MeRGBW-LED-STREIFEN (BLUETOOTH) STEUERN =====
    // Paketformat: 55 CMD FF LEN DATA CHK (CHK = 0xFF - Summe aller Bytes & 0xFF)
    const paket = (cmd, daten) => {
      const b = [0x55, cmd, 0xff, daten.length + 5, ...daten];
      b.push((0xff - (b.reduce((a, x) => a + x, 0) & 0xff)) & 0xff);
      return b;
    };

    try {
      // Handshake: erforderlich einmal pro Verbindung (generische Protokollkonstante)
      await ctx.ble.notify(STREIFEN_MAC, "fff0", "fff4", true);
      await ctx.ble.write(STREIFEN_MAC, "fff0", "fff3", "550EFF0BA02A4863539733");

      if (oben) {
        // Streifen an (CMD 0x01, Wert 1)
        await ctx.ble.write(STREIFEN_MAC, "fff0", "fff3", paket(0x01, [1]));

        // Helligkeit setzen (CMD 0x05, 16-bit Wert 50-1000)
        const w = Math.round(50 + (prozent / 100) * 950);
        await ctx.ble.write(STREIFEN_MAC, "fff0", "fff3", paket(0x05, [w >> 8, w & 0xff]));
        ctx.log(`Streifen an mit ${prozent}%`);
      } else {
        // Streifen aus (CMD 0x01, Wert 0)
        await ctx.ble.write(STREIFEN_MAC, "fff0", "fff3", paket(0x01, [0]));
        ctx.log("Streifen aus");
      }
    } catch (e) {
      ctx.log(`Streifen-FEHLER: ${e.message}`);
    }
  }
})
