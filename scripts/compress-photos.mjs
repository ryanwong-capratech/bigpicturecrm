/**
 * Batch compress all existing student photos.
 * Uses the correct Forge API endpoints from server/storage.ts:
 *   GET  v1/storage/presign/get?path=KEY  → signed download URL
 *   GET  v1/storage/presign/put?path=KEY  → signed upload URL (PUT to S3)
 *
 * Target: ≤ 300KB, max 900px longest side, JPEG quality 80
 */

import mysql from "mysql2/promise";
import sharp from "sharp";
import crypto from "crypto";

const TARGET_SIZE = 300 * 1024; // 300KB
const MAX_DIM = 900;

const DATABASE_URL = process.env.DATABASE_URL;
const FORGE_API_URL = (process.env.BUILT_IN_FORGE_API_URL || "").replace(/\/+$/, "");
const FORGE_API_KEY = process.env.BUILT_IN_FORGE_API_KEY;

if (!DATABASE_URL || !FORGE_API_URL || !FORGE_API_KEY) {
  console.error("Missing env vars: DATABASE_URL, BUILT_IN_FORGE_API_URL, BUILT_IN_FORGE_API_KEY");
  process.exit(1);
}

function normalizeKey(photoUrl) {
  // /manus-storage/some/key.jpg → some/key.jpg
  return photoUrl.replace(/^\/manus-storage\//, "").replace(/^\/+/, "");
}

async function getSignedDownloadUrl(key) {
  const url = new URL("v1/storage/presign/get", FORGE_API_URL + "/");
  url.searchParams.set("path", key);
  const res = await fetch(url, { headers: { Authorization: `Bearer ${FORGE_API_KEY}` } });
  if (!res.ok) throw new Error(`presign/get failed: ${res.status} ${await res.text()}`);
  const { url: signedUrl } = await res.json();
  return signedUrl;
}

async function uploadCompressed(key, buffer) {
  // Get presigned PUT URL
  const presignUrl = new URL("v1/storage/presign/put", FORGE_API_URL + "/");
  presignUrl.searchParams.set("path", key);
  const presignRes = await fetch(presignUrl, { headers: { Authorization: `Bearer ${FORGE_API_KEY}` } });
  if (!presignRes.ok) throw new Error(`presign/put failed: ${presignRes.status} ${await presignRes.text()}`);
  const { url: s3Url } = await presignRes.json();

  // PUT to S3
  const uploadRes = await fetch(s3Url, {
    method: "PUT",
    headers: { "Content-Type": "image/jpeg" },
    body: buffer,
  });
  if (!uploadRes.ok) throw new Error(`S3 upload failed: ${uploadRes.status}`);
  return `/manus-storage/${key}`;
}

async function compressBuffer(inputBuffer) {
  let maxDim = MAX_DIM;

  while (maxDim >= 200) {
    let q = 80;
    while (q >= 35) {
      const out = await sharp(inputBuffer)
        .rotate() // auto-rotate based on EXIF
        .resize(maxDim, maxDim, { fit: "inside", withoutEnlargement: true })
        .jpeg({ quality: q })
        .toBuffer();
      if (out.length <= TARGET_SIZE) return out;
      q -= 8;
    }
    maxDim = Math.floor(maxDim / 1.5);
  }

  // Last resort
  return await sharp(inputBuffer)
    .resize(200, 200, { fit: "inside", withoutEnlargement: true })
    .jpeg({ quality: 35 })
    .toBuffer();
}

async function main() {
  const pool = mysql.createPool(DATABASE_URL);
  const [rows] = await pool.query(
    "SELECT id, nickname, photoUrl FROM students WHERE photoUrl IS NOT NULL AND photoUrl != ''"
  );

  console.log(`Found ${rows.length} students with photos\n`);
  let success = 0;
  let skipped = 0;
  let failed = 0;

  for (const student of rows) {
    const { id, nickname, photoUrl } = student;
    try {
      const key = normalizeKey(photoUrl);

      // Get signed download URL
      const signedUrl = await getSignedDownloadUrl(key);

      // Download original
      const dlRes = await fetch(signedUrl);
      if (!dlRes.ok) {
        console.log(`[SKIP] ${id} ${nickname} - download failed ${dlRes.status}`);
        skipped++;
        continue;
      }
      const origBuffer = Buffer.from(await dlRes.arrayBuffer());
      const origSize = origBuffer.length;

      // Skip if already small enough
      if (origSize <= TARGET_SIZE) {
        console.log(`[SKIP] ${id} ${nickname} - already ${(origSize/1024).toFixed(0)}KB ✓`);
        skipped++;
        continue;
      }

      // Compress
      const compressed = await compressBuffer(origBuffer);
      const newSize = compressed.length;

      // Upload with new key (keep same path structure)
      const hash = crypto.randomUUID().replace(/-/g, "").slice(0, 8);
      const newKey = `student-photos/${id}-c-${hash}.jpg`;
      const newUrl = await uploadCompressed(newKey, compressed);

      // Update DB
      await pool.query("UPDATE students SET photoUrl = ? WHERE id = ?", [newUrl, id]);

      console.log(`[OK] ${id} ${nickname}: ${(origSize/1024).toFixed(0)}KB → ${(newSize/1024).toFixed(0)}KB`);
      success++;

      // Small delay to avoid rate limiting
      await new Promise(r => setTimeout(r, 300));
    } catch (err) {
      console.error(`[FAIL] ${id} ${nickname}: ${err.message}`);
      failed++;
    }
  }

  console.log(`\n=== Done: ${success} compressed, ${skipped} skipped (already small), ${failed} failed ===`);
  await pool.end();
}

main().catch(console.error);
