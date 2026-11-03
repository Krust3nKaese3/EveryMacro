/*
 * Decke umschalten (Tuya)
 *
 * Zweck: Schaltet die Tuya/Smart-Life-Deckenlampe per Knopfdruck um
 *        (an -> aus, aus -> an) über die Tuya-Cloud-API.
 *
 * Auslöser: manual() – Test-Button bzw. manueller Start in EveryMacro
 *
 * Ablauf: Token holen -> aktuellen Status lesen (switch_led) -> invertieren -> Befehl senden.
 *         Signatur (HMAC-SHA256) ist in reinem JS implementiert.
 *
 * Voraussetzungen:
 *   - Internet (läuft über die Tuya-Cloud, Rechenzentrum EU)
 *   - Secret TUYA_SECRET in EveryMacro hinterlegen (wird beim ersten Start abgefragt)
 *
 * Platzhalter ausfüllen:
 *   TUYA_ACCESS_ID  -> iot.tuya.com > Cloud > Projekt > Overview (Access ID)
 *   TUYA_DEVICE_ID  -> iot.tuya.com > Projekt > Devices (Geräte-ID der Lampe)
 */
const TUYA_ACCESS_ID = "<TUYA_ACCESS_ID>";
const TUYA_DEVICE_ID = "<TUYA_DEVICE_ID>";

macro({
  name: "Decke umschalten (Tuya)",
  secrets: [{ key: "TUYA_SECRET", label: "Tuya Access Secret", hint: "iot.tuya.com → Projekt → Overview" }],
  triggers: [ manual() ],
  actions: async (ctx) => {
    const ID = TUYA_ACCESS_ID;
    const SECRET = ctx.secrets.TUYA_SECRET;
    const DEV = TUYA_DEVICE_ID;
    const HOST = "https://openapi.tuyaeu.com";

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

    try {
      const token = (await call("GET", "/v1.0/token?grant_type=1")).access_token;
      const status = await call("GET", `/v1.0/iot-03/devices/${DEV}/status`, "", token);
      const sw = status.find(s => s.code === "switch_led");
      const neu = !(sw && sw.value);
      await call("POST", `/v1.0/iot-03/devices/${DEV}/commands`,
        JSON.stringify({ commands: [{ code: "switch_led", value: neu }] }), token);
      ctx.log(`Decke ${neu ? "an" : "aus"}. Status: ${JSON.stringify(status)}`);
    } catch (e) {
      ctx.log(`Fehler: ${e.message}`);
      await ctx.notify("Tuya-Fehler", e.message);
    }
  }
})
