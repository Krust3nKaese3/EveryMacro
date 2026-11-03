# Meine Makros (Backup)

Dokumentierte Sicherung meiner EveryMacro-Makros. Alle privaten Daten wurden durch Platzhalter ersetzt.

| Name | Datei | Zweck | Auslöser | Voraussetzungen |
|---|---|---|---|---|
| Decke automatisch (WLAN oben, Dämmerung) | [`decke-automatisch.js`](decke-automatisch.js) | Tuya-Deckenlampe + MeRGBW-LED-Streifen automatisch steuern: an bei oben + dunkel mit gradueller Helligkeitsanpassung basierend auf Sonnenhöhe, aus sonst | `wifiChanged(WLAN_NAME)`, `manual()` (Test-Button) | Native Build, Standort „Immer zulassen", Berechtigung „Geräte in der Nähe", nRF Connect/MeRGBW-App geschlossen, Secret `TUYA_SECRET` |
| Streifen umschalten (MeRGBW Bluetooth) | [`streifen-umschalten.js`](streifen-umschalten.js) | MeRGBW-LED-Streifen per Knopf umschalten (an/aus, Zustand in ctx.vars) | `manual()` | Native Build, Berechtigung „Geräte in der Nähe", nRF Connect/MeRGBW-App geschlossen |
| Decke umschalten (Tuya) | [`decke-umschalten.js`](decke-umschalten.js) | Tuya-Deckenlampe per Knopf umschalten (Status lesen, invertieren) | `manual()` | Secret `TUYA_SECRET` |
| Denon Musik (1Mii) | [`denon-musik-1mii.js`](denon-musik-1mii.js) | Denon-Receiver an + Eingang DVD + Lautstärke 50, wenn der 1Mii-Bluetooth-Sender verbunden wird; beim Trennen vorherige Quelle/Lautstärke wiederherstellen bzw. Standby | Bluetooth verbunden/getrennt, Quick-Tile „Denon Musik" | Native Build, Denon im selben WLAN |

## Einstellungen

### Decke automatisch (Dämmerungssteuerung)

Die graduelle Helligkeitsanpassung basiert auf dem Sonnenstand und kann über die `EINSTELLUNGEN` im Makro angepasst werden:

| Einstellung | Standardwert | Bedeutung |
|---|---|---|
| `startSonneGrad` | 6 | Sonnenhöhe in Grad, ab der die Dämmerung beginnt (Licht schaltet sich ein) |
| `vollDunkelSonneGrad` | -6 | Sonnenhöhe in Grad, bei der es voll dunkel ist (100% Helligkeit erreicht) |
| `minHelligkeitProzent` | 20 | Minimale Helligkeit bei `startSonneGrad` (%) |
| `maxHelligkeitProzent` | 100 | Maximale Helligkeit bei `vollDunkelSonneGrad` (%) |

**Funktionsweise:** Die Helligkeit wird linear zwischen `startSonneGrad` und `vollDunkelSonneGrad` interpoliert. Bei Sonnenhöhe > `startSonneGrad` und WLAN oben passiert nichts (noch hell genug). Die Koordinaten (Frankfurt) können im Makro angepasst werden.

## MeRGBW-Bluetooth-LED-Streifen Protokoll

Die MeRGBW-LED-Streifen verwenden ein proprietäres Bluetooth-Protokoll über GATT:

- **Service:** `FFF0`
- **Write Characteristic:** `FFF3`
- **Notify Characteristic:** `FFF4`

### Paketformat

Alle Befehle haben das Format: `55 CMD FF LEN DATA CHK`

- `55` – Header (fest)
- `CMD` – Befehlscode (siehe unten)
- `FF` – Konstante
- `LEN` – Länge des gesamten Pakets (inkl. Header, = DATA-Länge + 5)
- `DATA` – Nutzdaten (variabel)
- `CHK` – Prüfsumme: `CHK = 0xFF - (Summe aller Bytes) & 0xFF`

### Handshake

**Erforderlich einmal pro Verbindung** (muss vor jedem ersten Befehl gesendet werden):

```
550EFF0BA02A4863539733
```

Dies ist eine generische Protokollkonstante.

### Befehle

| Befehl | CMD | DATA | Beispiel | Beschreibung |
|---|---|---|---|---|
| Ein | `01` | `01` | `5501FF0601A3` | Streifen einschalten |
| Aus | `01` | `00` | `5501FF0600A4` | Streifen ausschalten |
| Helligkeit | `05` | `HH LL` (16-bit, 50-1000) | `5505FF0700C803AC` (Helligkeit 200) | Helligkeit setzen |
| Farbe | `03` | `HH LL BB` (Hue 0-360, Brightness) | `5503FF0800B400C8F5` (Hue 180, Helligkeit 200) | Farbe und Helligkeit setzen |

### Voraussetzungen

- **Berechtigung:** „Geräte in der Nähe" (Android)
- **Apps:** nRF Connect und MeRGBW-App müssen geschlossen sein (sonst Verbindungskonflikt)

### Quelle

Das Protokoll stammt aus dem Reverse-Engineering-Projekt: [github.com/NemoDam/MeRGBW_CLI](https://github.com/NemoDam/MeRGBW_CLI)

## Platzhalter ausfüllen

Oben in jeder Datei stehen Konstanten. Ersetze die Werte in `<…>`:

| Platzhalter | Bedeutung | Wo finde ich den Wert? |
|---|---|---|
| `<DEIN_WLAN_NAME>` | Name (SSID) deines Heim-WLANs | EveryMacro → Netzwerk-Info → „WLAN-Name" |
| `<BSSID_OBEN_1>` … `<BSSID_OBEN_3>` | Funkadressen der Access Points/Repeater im Raum, in dem das Licht angehen soll (pro Funkband eine eigene) | Im jeweiligen Raum EveryMacro → Netzwerk-Info → „Access Point (BSSID)"; für 2,4 und 5 GHz einzeln ablesen. Nicht benötigte Einträge aus der Liste entfernen |
| `<TUYA_ACCESS_ID>` | Access ID / Client ID des Tuya-Cloud-Projekts | iot.tuya.com → Cloud → Projekt → Overview |
| `<TUYA_DEVICE_ID>` | Geräte-ID der Lampe | iot.tuya.com → Projekt → Devices (oder Smart-Life-App → Gerät → Geräteinformationen) |
| `<STREIFEN_BT_MAC>` | Bluetooth-Adresse des MeRGBW-LED-Streifens | Android → Einstellungen → Verbundene Geräte → Streifen → Details (oder nRF Connect scannen) |
| `<DENON_IP>` | IP-Adresse des Denon-Receivers | Router (z. B. FRITZ!Box → Heimnetz → Netzwerk); dort feste IP vergeben |
| `<1MII_BT_MAC>` | Bluetooth-Adresse des 1Mii-Senders | Android → Einstellungen → Verbundene Geräte → 1Mii → Details |

Das **Tuya Access Secret** gehört nie in den Code. Es wird als Secret `TUYA_SECRET` in EveryMacro gespeichert und im Makro über `ctx.secrets.TUYA_SECRET` gelesen.

## Wiederherstellen

1. Inhalt der `.js`-Datei kopieren und in EveryMacro als neues Makro einfügen.
2. Platzhalter oben in der Datei ausfüllen (siehe Tabelle).
3. Beim Speichern das Secret `TUYA_SECRET` eingeben (Tuya Access Secret aus iot.tuya.com → Projekt → Overview) – nur für Tuya-Makros.
4. Für WLAN-Auslöser: Standortberechtigung auf „Immer zulassen" stellen, sonst ist die BSSID im Hintergrund nicht lesbar.
5. Für Bluetooth-Makros: Berechtigung „Geräte in der Nähe" erteilen, nRF Connect und MeRGBW-App schließen.
6. Mit dem Test-Button prüfen und das Log ansehen.

## Tipp

Im Router allen Geräten (Denon, Hue, Shelly …) eine feste IP zuweisen, damit die Makros sie immer finden.
