/*
 * Streifen umschalten (MeRGBW Bluetooth)
 *
 * Zweck:     Schaltet einen MeRGBW-Bluetooth-LED-Streifen per Knopfdruck um (an/aus).
 *            Der Zustand wird in ctx.vars gespeichert und beim nächsten Aufruf invertiert.
 * Auslöser:  manual() – Test-Button oder Quick-Tile
 * Ablauf:    1) Aktuellen Zustand aus ctx.vars lesen
 *            2) Zustand invertieren (an → aus, aus → an)
 *            3) MeRGBW-Handshake senden
 *            4) Ein/Aus-Befehl senden (CMD 0x01)
 *            5) Neuen Zustand in ctx.vars speichern
 * Voraussetzungen: Native Build von EveryMacro,
 *            Berechtigung "Geräte in der Nähe" für Bluetooth,
 *            nRF Connect und MeRGBW-App müssen geschlossen sein (Konflikt)
 * Gerät:     MeRGBW-Bluetooth-LED-Streifen (Service FFF0, Write FFF3, Notify FFF4)
 *            Protokoll: 55 CMD FF LEN DATA CHK (CHK = 0xFF - Summe aller Bytes & 0xFF)
 *            Quelle: github.com/NemoDam/MeRGBW_CLI
 *
 * Platzhalter unten ausfüllen (siehe README.md).
 */

// ===== EINSTELLUNGEN =====
const STREIFEN_MAC = "<STREIFEN_BT_MAC>";

macro({
  name: "Streifen umschalten (MeRGBW Bluetooth)",
  triggers: [ manual() ],
  actions: async (ctx) => {
    // ctx.vars API-Wrapper (für Kompatibilität mit verschiedenen EveryMacro-Versionen)
    const v = ctx.vars;
    const get = (k) => typeof v.get === "function" ? v.get(k) : v[k];
    const set = (k, x) => typeof v.set === "function" ? v.set(k, x) : (v[k] = x);

    // Zustand invertieren
    const an = !(await get("streifenAn"));

    // MeRGBW-Paket erstellen (55 CMD FF LEN DATA CHK)
    const b = [0x55, 0x01, 0xff, 0x06, an ? 1 : 0];
    b.push((0xff - (b.reduce((a, x) => a + x, 0) & 0xff)) & 0xff);

    try {
      // Handshake: erforderlich einmal pro Verbindung (generische Protokollkonstante)
      await ctx.ble.notify(STREIFEN_MAC, "fff0", "fff4", true);
      await ctx.ble.write(STREIFEN_MAC, "fff0", "fff3", "550EFF0BA02A4863539733");

      // Ein/Aus-Befehl senden
      await ctx.ble.write(STREIFEN_MAC, "fff0", "fff3", b);

      // Zustand speichern
      await set("streifenAn", an);
      ctx.log(an ? "Streifen an" : "Streifen aus");
    } catch (e) {
      ctx.log(`Streifen-FEHLER: ${e.message}`);
      await ctx.notify("Streifen-Fehler", e.message);
    }
  }
})
