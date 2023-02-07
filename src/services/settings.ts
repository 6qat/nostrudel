import { BehaviorSubject } from "rxjs";
import db from "./db";

function log(message: string) {
  console.log(`Settings: ${message}`);
}

const settings = {
  relays: new BehaviorSubject<string[]>([]),
  corsProxy: new BehaviorSubject<string>(""),
};

async function loadSettings() {
  let loading = true;
  const relays = await db.get("settings", "relays");
  if (relays) settings.relays.next(relays);
  settings.relays.subscribe((newUrls) => {
    if (loading) return;
    log("saving relay urls");
    db.put("settings", newUrls, "relays");
  });

  const corsProxy = await db.get("settings", "cors-proxy");
  if (corsProxy) settings.corsProxy.next(corsProxy);
  settings.corsProxy.subscribe((newUrl) => {
    if (loading) return;
    log("saving cors-proxy url");
    db.put("settings", newUrl, "cors-proxy");
  });

  loading = false;
  log("loaded");
}
await loadSettings();

export default settings;