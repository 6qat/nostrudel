import db from "./db";
import { fetchWithProxy } from "../helpers/request";
import { isHexKey } from "../helpers/nip19";
import { validateRelayURL } from "../helpers/relay";
import { AbstractRelay } from "nostr-tools/abstract-relay";

export type RelayInformationDocument = {
  name: string;
  description: string;
  icon?: string;
  pubkey?: string;
  contact: string;
  supported_nips?: number[];
  software: string;
  version: string;
  payments_url?: string;
};

function sanitizeInfo(info: RelayInformationDocument) {
  if (info.pubkey && !isHexKey(info.pubkey)) {
    delete info.pubkey;
  }
  return info;
}

async function fetchInfo(relay: string) {
  const url = validateRelayURL(relay);
  url.protocol = url.protocol === "ws:" ? "http" : "https";

  const infoDoc = await fetchWithProxy(url, { headers: { Accept: "application/nostr+json" } }).then(
    (res) => res.json() as Promise<RelayInformationDocument>,
  );

  sanitizeInfo(infoDoc);

  memoryCache.set(relay, infoDoc);
  await db.put("relayInfo", infoDoc, relay);

  return infoDoc;
}

const memoryCache = new Map<string, RelayInformationDocument>();
async function getInfo(relay: string, alwaysFetch = false) {
  const url = validateRelayURL(relay).toString();
  if (memoryCache.has(url) && !alwaysFetch) return memoryCache.get(url)!;

  const cached = await db.get("relayInfo", url);
  if (cached && !alwaysFetch) {
    memoryCache.set(url, cached);
    return cached as RelayInformationDocument;
  }

  return fetchInfo(relay);
}

const pending: Record<string, ReturnType<typeof getInfo> | undefined> = {};
function dedupedGetIdentity(relay: string | AbstractRelay, alwaysFetch = false) {
  relay = typeof relay === "string" ? relay : relay.url;

  const request = pending[relay];
  if (request) return request;
  return (pending[relay] = getInfo(relay, alwaysFetch).then((v) => {
    delete pending[relay];
    return v;
  }));
}

export const relayInfoService = {
  cache: memoryCache,
  fetchInfo,
  getInfo: dedupedGetIdentity,
};

if (import.meta.env.DEV) {
  // @ts-ignore
  window.relayInfoService = relayInfoService;
}

export default relayInfoService;
