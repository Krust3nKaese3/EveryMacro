# Meine Makros (Backup)

Dokumentierte Sicherung meiner EveryMacro-Makros. Alle privaten Daten wurden durch Platzhalter ersetzt.

| Name | Datei | Zweck | Auslöser | Voraussetzungen |
|---|---|---|---|---|
| Decke automatisch (WLAN oben an, sonst aus) | [`decke-automatisch.js`](decke-automatisch.js) | Tuya-Deckenlampe an, wenn das Handy mit einem Access Point oben verbunden ist, sonst aus | `wifiChanged(WLAN_NAME)`, `manual()` (Test-Button) | Native Build, Standort „Immer zulassen“, Secret `TUYA_SECRET` |
| Decke umschalten (Tuya) | [`decke-umschalten.js`](decke-umschalten.js) | Tuya-Deckenlampe per Knopf umschalten (Status lesen, invertieren) | `manual()` | Secret `TUYA_SECRET` |
| Denon Musik (1Mii) | [`denon-musik-1mii.js`](denon-musik-1mii.js) | Denon-Receiver an + Eingang DVD + Lautstärke 50, wenn der 1Mii-Bluetooth-Sender verbunden wird; beim Trennen vorherige Quelle/Lautstärke wiederherstellen bzw. Standby | Bluetooth verbunden/getrennt, Quick-Tile „Denon Musik“ | Native Build, Denon im selben WLAN |

## Platzhalter ausfüllen

Oben in jeder Datei stehen Konstanten. Ersetze die Werte in `<…>`:

| Platzhalter | Bedeutung | Wo finde ich den Wert? |
|---|---|---|
| `<DEIN_WLAN_NAME>` | Name (SSID) deines Heim-WLANs | EveryMacro → Netzwerk-Info → „WLAN-Name“ |
| `<BSSID_OBEN_1>` … `<BSSID_OBEN_3>` | Funkadressen der Access Points/Repeater im Raum, in dem das Licht angehen soll (pro Funkband eine eigene) | Im jeweiligen Raum EveryMacro → Netzwerk-Info → „Access Point (BSSID)“; für 2,4 und 5 GHz einzeln ablesen. Nicht benötigte Einträge aus der Liste entfernen |
| `<TUYA_ACCESS_ID>` | Access ID / Client ID des Tuya-Cloud-Projekts | iot.tuya.com → Cloud → Projekt → Overview |
| `<TUYA_DEVICE_ID>` | Geräte-ID der Lampe | iot.tuya.com → Projekt → Devices (oder Smart-Life-App → Gerät → Geräteinformationen) |
| `<DENON_IP>` | IP-Adresse des Denon-Receivers | Router (z. B. FRITZ!Box → Heimnetz → Netzwerk); dort feste IP vergeben |
| `<1MII_BT_MAC>` | Bluetooth-Adresse des 1Mii-Senders | Android → Einstellungen → Verbundene Geräte → 1Mii → Details |

Das **Tuya Access Secret** gehört nie in den Code. Es wird als Secret `TUYA_SECRET` in EveryMacro gespeichert und im Makro über `ctx.secrets.TUYA_SECRET` gelesen.

## Wiederherstellen

1. Inhalt der `.js`-Datei kopieren und in EveryMacro als neues Makro einfügen.
2. Platzhalter oben in der Datei ausfüllen (siehe Tabelle).
3. Beim Speichern das Secret `TUYA_SECRET` eingeben (Tuya Access Secret aus iot.tuya.com → Projekt → Overview).
4. Für WLAN-Auslöser: Standortberechtigung auf „Immer zulassen“ stellen, sonst ist die BSSID im Hintergrund nicht lesbar.
5. Mit dem Test-Button prüfen und das Log ansehen.

## Tipp

Im Router allen Geräten (Denon, Hue, Shelly …) eine feste IP zuweisen, damit die Makros sie immer finden.
