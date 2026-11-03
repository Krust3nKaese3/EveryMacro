/*
 * Denon Musik (1Mii)
 *
 * Zweck: Wenn sich das Handy per Bluetooth mit dem 1Mii-Empfänger verbindet,
 *        schaltet der Denon-Receiver automatisch auf Musik (Eingang DVD, an dem
 *        der 1Mii per Cinch hängt) und stellt eine angenehme Lautstärke ein.
 *
 * Auslöser:
 *   - bluetoothConnected(1Mii)    -> Musik an (außer der Denon läuft schon)
 *   - bluetoothDisconnected(1Mii) -> vorherigen Zustand wiederherstellen
 *   - quickTile("Denon Musik")    -> "Force": Musik an, auch wenn der Denon schon läuft
 *
 * Ablauf:
 *   Verbinden: Läuft der Denon schon (z. B. jemand schaut TV), passiert nichts
 *     ("Ok, ich bin raus"). Sonst: einschalten, 4 s warten, Eingang DVD, Lautstärke 50.
 *     Vorherige Quelle/Lautstärke wird in ctx.vars gemerkt.
 *   Kachel: nur wenn das Handy mit dem 1Mii verbunden ist. Ist DVD schon aktiv,
 *     wird nur die Lautstärke auf 50 gesetzt.
 *   Trennen: nur wenn das Makro selbst umgeschaltet hat. War der Denon vorher an,
 *     zurück zur alten Quelle und Lautstärke (dB -> MV-Wert: dB + 80), sonst Standby.
 *
 * Voraussetzungen:
 *   - Denon-AVR mit fester IP im Router (DHCP-Reservierung)
 *   - Quick-Tile-Trigger braucht den nativen EveryApp-Build
 *
 * Platzhalter ausfüllen:
 *   DENON_IP    -> IP des Receivers (FRITZ!Box > Heimnetz > Netzwerk)
 *   MII_BT_MAC  -> Bluetooth-MAC des 1Mii (Android: Bluetooth > Gerätedetails)
 */
const DENON_IP = "<DENON_IP>";
const MII_BT_MAC = "<1MII_BT_MAC>";

macro({
  name: "Denon Musik (1Mii)",
  triggers: [
    bluetoothConnected(MII_BT_MAC),
    bluetoothDisconnected(MII_BT_MAC),
    quickTile("Denon Musik")
  ],
  actions: async (ctx) => {
    const MAC = MII_BT_MAC;
    const base = "http://" + DENON_IP + "/goform/";
    const cmd = (c) => ctx.http.get(base + "formiPhoneAppDirect.xml?" + c);
    const art = ctx.trigger.type;

    const status = async () => {
      const xml = (await ctx.http.get(base + "formMainZone_MainZoneXml.xml")).body;
      const q = xml.match(/<InputFuncSelect><value>([^<]*)<\/value>/);
      const v = xml.match(/<MasterVolume><value>([^<]*)<\/value>/);
      return {
        an: !xml.includes("<Power><value>STANDBY</value>"),
        quelle: q ? q[1].trim() : "",
        lautDb: v ? parseFloat(v[1]) : null
      };
    };

    const mvBefehl = (db) => {
      const stufe = Math.round((db + 80) * 2) / 2;
      return "MV" + (Number.isInteger(stufe)
        ? String(stufe).padStart(2, "0")
        : String(Math.floor(stufe)).padStart(2, "0") + "5");
    };

    const musikAn = async (s) => {
      ctx.vars.warAn = s.an;
      ctx.vars.vorherQuelle = s.quelle;
      ctx.vars.vorherLautDb = s.an ? s.lautDb : null;
      if (!s.an) { await cmd("ZMON"); await ctx.wait(4000); }
      await cmd("SIDVD");
      await ctx.wait(1000);
      await cmd("MV50");
      ctx.vars.vonUnsGeschaltet = true;
    };

    try {
      if (art === "bluetoothConnected") {
        const s = await status();
        if (s.an) {
          ctx.vars.vonUnsGeschaltet = false;
          await ctx.notify("Denon", `Denon läuft schon (${s.quelle}). Ok, ich bin raus.`);
          return;
        }
        await musikAn(s);
      }

      else if (art === "quickTile") {
        if (!(await ctx.bluetooth.isConnected(MAC))) {
          await ctx.notify("Denon", "Handy ist nicht mit dem 1Mii verbunden.");
          return;
        }
        const s = await status();
        if (s.an && s.quelle.toUpperCase() === "DVD") {
          await cmd("MV50");
          return;
        }
        await musikAn(s);
        await ctx.notify("Denon", "Force: Musik an");
      }

      else if (art === "bluetoothDisconnected") {
        if (!ctx.vars.vonUnsGeschaltet) return;
        ctx.vars.vonUnsGeschaltet = false;
        const q = ctx.vars.vorherQuelle;
        if (ctx.vars.warAn && q && q.toUpperCase() !== "DVD") {
          await cmd("SI" + q);
          if (ctx.vars.vorherLautDb !== null && ctx.vars.vorherLautDb !== undefined) {
            await ctx.wait(1000);
            await cmd(mvBefehl(ctx.vars.vorherLautDb));
          }
        } else {
          await cmd("PWSTANDBY");
        }
      }
    } catch (e) {
      await ctx.notify("Denon-Fehler", e.message);
    }
  }
})
