macro({
  id: "popup-test",
  name: "Popup Test (Logs)",
  ui: [tile({ label: "PopupTest", icon: "bug_report", popup: {
    id: "ptest",
    title: "Popup Test",
    style: { position: "bottom", width: "90%", height: "auto", background: "#202020", cornerRadius: 24, animation: "slide", margin: 12 },
    html: `<!doctype html><html><body style="margin:0;color:#fff;font:14px sans-serif;background:transparent">
<div style="padding:16px">
  <button id="b" style="font-size:16px;padding:10px 16px">Knopf</button>
  <input id="s" type="range" min="0" max="100" value="50" style="width:100%;margin:16px 0">
  <pre id="l" style="white-space:pre-wrap;font-size:12px;background:#000;padding:8px;max-height:220px;overflow:auto"></pre>
</div>
<script>
  var L = document.getElementById("l");
  function log(t){ L.textContent = new Date().toLocaleTimeString() + " " + t + "\\n" + L.textContent; }
  window.onerror = function(m){ log("JS-FEHLER: " + m); };
  var P = window.EveryAppPopup;
  log("EveryAppPopup vorhanden: " + !!P + (P ? " | id=" + P.id + " | send=" + typeof P.send : ""));
  function send(e, v){
    if (!window.EveryAppPopup) { log("KEIN Bridge, " + e + " nicht gesendet"); return; }
    try { window.EveryAppPopup.send(e, v); log("gesendet: " + e + " = " + JSON.stringify(v)); }
    catch (x) { log("send-FEHLER: " + x.message); }
  }
  if (P && P.onMessage) P.onMessage(function(d){ log("vom Makro: " + JSON.stringify(d)); });
  if (P && P.onDiag) P.onDiag(function(t){ log("ANDROID: " + t); }); else log("onDiag nicht verfügbar (alter Build?)");
  document.getElementById("b").onclick = function(){ send("knopf", true); };
  document.getElementById("s").oninput = function(e){ send("slide", Number(e.target.value)); };
  document.getElementById("s").onchange = function(e){ send("slideEnde", Number(e.target.value)); };
  send("open", true);
</script></body></html>`
  } })],
  triggers: [popupEvent(), manual()],
  actions: async (ctx) => {
    const t = ctx.trigger || {};
    const info = `Typ ${t.type} | popupId ${t.popupId} | Event ${t.event} | Wert ${JSON.stringify(t.value)}`;
    ctx.log("Popup-Test ausgelöst: " + info);
    try { await ctx.notify("Popup-Test", info); } catch (e) { ctx.log("notify-Fehler: " + e.message); }
    if (t.type === "popup" && t.event !== "close") {
      try { await ctx.popup.send("ptest", { echo: t.event, value: t.value }); ctx.log("Echo ans Popup gesendet"); }
      catch (e) { ctx.log("ctx.popup.send-Fehler: " + e.message); }
    }
  }
});
