import type { Express } from "express";
import { ENV } from "./env";

// Server-side in-memory cache for signed URLs
// Signed URLs expire in ~1 hour, so we cache for 55 minutes
const CACHE_TTL_MS = 55 * 60 * 1000; // 55 minutes
const signedUrlCache = new Map<string, { url: string; expiresAt: number }>();

async function getSignedUrl(key: string): Promise<string> {
  const now = Date.now();
  const cached = signedUrlCache.get(key);
  if (cached && cached.expiresAt > now) {
    return cached.url;
  }

  const forgeUrl = new URL(
    "v1/storage/presign/get",
    ENV.forgeApiUrl!.replace(/\/+$/, "") + "/",
  );
  forgeUrl.searchParams.set("path", key);

  const forgeResp = await fetch(forgeUrl, {
    headers: { Authorization: `Bearer ${ENV.forgeApiKey}` },
  });

  if (!forgeResp.ok) {
    const body = await forgeResp.text().catch(() => "");
    throw new Error(`forge error: ${forgeResp.status} ${body}`);
  }

  const { url } = (await forgeResp.json()) as { url: string };
  if (!url) throw new Error("Empty signed URL from backend");

  signedUrlCache.set(key, { url, expiresAt: now + CACHE_TTL_MS });
  return url;
}

export function registerStorageProxy(app: Express) {
  app.get("/manus-storage/*", async (req, res) => {
    const key = (req.params as Record<string, string>)[0];
    if (!key) {
      res.status(400).send("Missing storage key");
      return;
    }

    if (!ENV.forgeApiUrl || !ENV.forgeApiKey) {
      res.status(500).send("Storage proxy not configured");
      return;
    }

    try {
      const url = await getSignedUrl(key);
      // Allow browser to cache the redirect for 30 minutes
      res.set("Cache-Control", "public, max-age=1800");
      res.redirect(307, url);
    } catch (err) {
      console.error("[StorageProxy] failed:", err);
      res.status(502).send("Storage proxy error");
    }
  });
}
