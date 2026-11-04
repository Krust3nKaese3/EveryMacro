macro({
  id: "popup-decke",
  name: "Deckenlicht Popup",
  secrets: [{ key: "TUYA_CLIENT_ID", label: "Tuya Client ID / Access ID" }, { key: "TUYA_SECRET", label: "Tuya Access Secret", hint: "iot.tuya.com → Projekt → Overview" }, { key: "TUYA_DEVICE_ID", label: "Decke Geräte-ID" }],
  ui: [tile({ label: "Decke", icon: "lightbulb", popup: {
    id: "decke",
    title: "Deckenlicht",
    throttleMs: 300,
    style: { position: "bottom", width: "90%", height: "auto", background: "#2A1512", backgroundAlpha: 0.9, cornerRadius: 28, blur: 24, scrimAlpha: 0.25, elevation: 8, animation: "slide", margin: 12 },
    html: `<!doctype html><html><head><meta name="viewport" content="width=device-width,initial-scale=1,maximum-scale=1,user-scalable=no"><style>
      html,body{margin:0;background:transparent;color:#F7E6E1;font:15px "Google Sans",Roboto,system-ui,sans-serif;-webkit-user-select:none;user-select:none}
      .w{padding:18px 18px 20px}
      .top{display:flex;align-items:center;gap:12px;margin-bottom:16px}
      .pill{flex:1;display:flex;align-items:center;gap:12px;height:64px;border-radius:32px;padding:0 20px;background:#4A2E28;transition:background .2s,color .2s}
      .pill.on{background:#F4A08A;color:#3B1810}
      .ic{width:24px;height:24px;flex:none}
      .pt{font-weight:600}.ps{font-size:13px;opacity:.8}
      .sl{position:relative;height:56px;border-radius:28px;background:#4A2E28;overflow:hidden;touch-action:none;margin-bottom:14px}
      .fill{position:absolute;left:0;top:0;bottom:0;background:#F4A08A;border-radius:28px;min-width:56px}
      .sl .ic{position:absolute;left:16px;top:16px;color:#3B1810}
      .pc{position:absolute;right:20px;top:18px;font-size:14px;opacity:.85}
      .hue{position:relative;height:40px;border-radius:20px;touch-action:none;background:linear-gradient(90deg,#f00,#ff0,#0f0,#0ff,#00f,#f0f,#f00)}
      .kn{position:absolute;top:4px;width:32px;height:32px;margin-left:-16px;border-radius:50%;border:3px solid #fff;box-sizing:border-box;box-shadow:0 1px 4px rgba(0,0,0,.5)}
      .row{display:flex;gap:10px;margin-top:14px}
      .b{flex:1;height:44px;border-radius:22px;background:#4A2E28;display:flex;align-items:center;justify-content:center;font-weight:500}
      .b.sel{background:#F4A08A;color:#3B1810}
      .lb{font-size:13px;opacity:.75;margin:2px 4px 8px}
      .er{font-size:12px;color:#F4A08A;opacity:.85;text-align:center;margin-top:8px;min-height:0}.er:empty{display:none}
    </style></head><body><div class="w">
      <div class="top"><div class="pill" id="pw"><svg class="ic" viewBox="0 0 24 24" fill="currentColor"><path d="M9 21h6v-1H9v1zm3-19a7 7 0 0 0-4 12.7V17h8v-2.3A7 7 0 0 0 12 2z"/></svg><div><div class="pt">Decke</div><div class="ps" id="ps">…</div></div></div></div>
      <div class="sl" id="sl"><div class="fill" id="fi"></div><svg class="ic" viewBox="0 0 24 24" fill="currentColor"><path d="M12 7a5 5 0 1 0 0 10 5 5 0 0 0 0-10zM11 1h2v3h-2zM11 20h2v3h-2zM1 11h3v2H1zM20 11h3v2h-3z"/></svg><div class="pc" id="pc"></div></div>
      <div class="lb">Farbe</div>
      <div class="hue" id="hu"><div class="kn" id="kn"></div></div>
      <div class="row"><div class="b" id="bw">Weiß</div><div class="b" id="bc">Farbe</div></div>
      <div class="er" id="st"></div>
    </div><script>
    (function(){
      var stub = { state: {}, send: function(){}, onMessage: function(){}, close: function(){} };
      var B = function(){ return window.EveryAppPopup || stub; };
      var P = B();
      var stt = function(t){ var el = document.getElementById("st"); if (el) el.textContent = t; };
      var raw = function(e, v){
        var msg = { type: "popup", popupId: "decke", event: e, value: v };
        if (window.EveryAppPopup && typeof window.EveryAppPopup.send === "function") { window.EveryAppPopup.send(e, v); return "EveryAppPopup"; }
        if (window.ReactNativeWebView && window.ReactNativeWebView.postMessage) { window.ReactNativeWebView.postMessage(JSON.stringify(msg)); return "RNWebView"; }
        if (window.EveryApp && typeof window.EveryApp.send === "function") { window.EveryApp.send(e, v); return "EveryApp"; }
        if (window.parent && window.parent !== window) { window.parent.postMessage(msg, "*"); return "parent"; }
        return "";
      };
      var s = Object.assign({ on: false, bright: 80, hue: 20, mode: "white" }, P.state || {});
      var go = function(e, v){ var w = ""; try { w = raw(e, v); } catch (x) { stt("Fehler: " + x.message); return; } stt(w ? "" : "Keine Verbindung zu EveryApp"); };
      var $ = function(i){ return document.getElementById(i); };
      var last = {}, timer = {};
      function send(e, v, now){ var t = Date.now(); clearTimeout(timer[e]); if (now || !last[e] || t - last[e] > 300) { last[e] = t; go(e, v); } else { timer[e] = setTimeout(function(){ last[e] = Date.now(); go(e, v); }, 300); } }
      function draw(){
        $("pw").classList.toggle("on", !!s.on);
        $("ps").textContent = s.on ? (s.mode === "colour" ? "Farbe · " : "Weiß · ") + s.bright + " %" : "Aus";
        $("fi").style.width = s.bright + "%";
        $("fi").style.opacity = s.on ? 1 : .45;
        $("pc").textContent = s.bright + " %";
        $("kn").style.left = (s.hue / 360 * 100) + "%";
        $("kn").style.background = "hsl(" + s.hue + ",100%,50%)";
        $("bw").classList.toggle("sel", s.mode !== "colour");
        $("bc").classList.toggle("sel", s.mode === "colour");
        if (P.resize) P.resize();
      }
      function drag(el, fn, done){
        el.addEventListener("pointerdown", function(e){ el.setPointerCapture(e.pointerId); fn(e); });
        el.addEventListener("pointermove", function(e){ if (e.buttons) fn(e); });
        el.addEventListener("pointerup", function(e){ fn(e); done(); });
      }
      function frac(el, e){ var r = el.getBoundingClientRect(); return Math.max(0, Math.min(1, (e.clientX - r.left) / r.width)); }
      $("pw").onclick = function(){ s.on = !s.on; draw(); send("on", s.on, true); };
      drag($("sl"), function(e){ s.bright = Math.max(10, Math.round(frac($("sl"), e) * 100)); s.on = true; draw(); send("bright", s.bright); }, function(){ send("bright", s.bright, true); });
      drag($("hu"), function(e){ s.hue = Math.round(frac($("hu"), e) * 360) % 360; s.mode = "colour"; s.on = true; draw(); send("hue", s.hue); }, function(){ send("hue", s.hue, true); });
      $("bw").onclick = function(){ s.mode = "white"; s.on = true; draw(); send("white", true, true); };
      $("bc").onclick = function(){ s.mode = "colour"; s.on = true; draw(); send("hue", s.hue, true); };
      var hooked = false;
      var hook = function(){ var b = window.EveryAppPopup; if (hooked || !b || typeof b.onMessage !== "function") return; hooked = true; if (b.state) Object.assign(s, b.state); b.onMessage(function(d){ Object.assign(s, d || {}); if (d && d.fehler) stt(d.fehler); draw(); }); draw(); };
      hook();
      draw();
      var tries = 0;
      var start = function(){ hook(); if (window.EveryAppPopup || tries++ > 10) go("open", true); else setTimeout(start, 150); };
      start();
    })();
    </script></body></html>`
  } })],
  triggers: [popupEvent("decke"), manual()],
  actions: async (ctx) => {
    const ID = ctx.secrets.TUYA_CLIENT_ID;
    const SECRET = ctx.secrets.TUYA_SECRET;
    const DEV = ctx.secrets.TUYA_DEVICE_ID;
    const HOST = "https://openapi.tuyaeu.com";
    const t = ctx.trigger || {};
    const { event, value } = t;
    ctx.log(`Popup-Makro gestartet | Auslöser ${t.type} | popupId ${t.popupId} | Event ${event} | Wert ${JSON.stringify(value)}`);
    if (t.popupId && t.popupId !== "decke") { ctx.log("Anderes Popup, ignoriert"); return; }
    if (!event || event === "close") return;
    const zumPopup = async (d) => { try { await ctx.popup.send("decke", d); } catch (e) { ctx.log("ctx.popup.send fehlgeschlagen: " + e.message); } };
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
      if (path.indexOf("/token") < 0) ctx.log(`TUYA ${method} ${path} body=${body} -> ${res.body}`);
      if (!json.success) throw new Error(json.msg || "Tuya-Fehler");
      return json.result;
    };
    const v = ctx.vars;
    const get = async (k) => typeof v.get === "function" ? await v.get(k) : v[k];
    const set = async (k, x) => typeof v.set === "function" ? await v.set(k, x) : (v[k] = x);
    try {
      const token = (await call("GET", "/v1.0/token?grant_type=1")).access_token;
      const dev = `/v1.0/iot-03/devices/${DEV}/commands`;
      const cmd = (list) => call("POST", dev, JSON.stringify({ commands: list }), token);
      const zuWert = (p) => Math.round(10 + (Math.max(10, Math.min(100, p)) - 10) / 90 * 990);
      if (event === "open") {
        const st = await call("GET", `/v1.0/iot-03/devices/${DEV}/status`, "", token);
        ctx.log("TUYA status: " + JSON.stringify(st));
        const w = (c) => (st.find(x => x.code === c) || {}).value;
        const mode = w("work_mode") === "colour" ? "colour" : "white";
        let roh = w("bright_value_v2"), hue = (await get("popupHue")) || 20;
        if (mode === "colour") { const cd = w("colour_data_v2"); const o = typeof cd === "string" ? JSON.parse(cd) : (cd || {}); roh = o.v; hue = o.h; }
        const bright = typeof roh === "number" ? Math.max(10, Math.min(100, Math.round(10 + (roh - 10) / 990 * 90))) : 80;
        await set("popupHue", hue); await set("popupBright", bright);
        await zumPopup({ on: !!w("switch_led"), mode, bright, hue });
        return;
      }
      if (event === "on") { await cmd([{ code: "switch_led", value: !!value }]); return; }
      if (event === "white") { await cmd([{ code: "switch_led", value: true }, { code: "work_mode", value: "white" }]); return; }
      if (event === "bright") {
        await set("popupBright", value);
        const st = await call("GET", `/v1.0/iot-03/devices/${DEV}/status`, "", token);
        const modus = (st.find(x => x.code === "work_mode") || {}).value;
        if (modus === "colour") await cmd([{ code: "switch_led", value: true }, { code: "colour_data_v2", value: { h: (await get("popupHue")) || 0, s: 1000, v: zuWert(value) } }]);
        else await cmd([{ code: "switch_led", value: true }, { code: "bright_value_v2", value: zuWert(value) }]);
        return;
      }
      if (event === "hue") {
        await set("popupHue", value);
        const b = (await get("popupBright")) || 80;
        await cmd([{ code: "switch_led", value: true }, { code: "work_mode", value: "colour" }, { code: "colour_data_v2", value: { h: value, s: 1000, v: zuWert(b) } }]);
      }
    } catch (e) {
      ctx.log(`FEHLER: ${e.message}`);
      await zumPopup({ fehler: "Fehler: " + e.message });
      await ctx.notify("Tuya-Fehler", e.message);
    }
  }
});
