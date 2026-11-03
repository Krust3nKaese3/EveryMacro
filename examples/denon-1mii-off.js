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
