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
