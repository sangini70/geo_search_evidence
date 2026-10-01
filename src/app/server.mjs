import { createServer } from "node:http";
import { readFile } from "node:fs/promises";
import { extname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { config } from "../config/index.mjs";
import { collectMultiSource, createReviewSelection, createGeoHandoff, getGeoHandoff, getReviewSelection, getSearchEvidencePack, getStatus } from "./application.mjs";

const root = join(fileURLToPath(new URL("..", import.meta.url)), "ui");
const researchRoot = join(fileURLToPath(new URL("..", import.meta.url)), "research");
const contentTypes = { ".html": "text/html; charset=utf-8", ".css": "text/css; charset=utf-8", ".js": "text/javascript; charset=utf-8", ".mjs": "text/javascript; charset=utf-8" };

async function readJsonBody(request, maxBytes = 16_000) {
  let body = "";
  for await (const chunk of request) body += chunk;
  if (body.length > maxBytes) throw new Error("REQUEST_TOO_LARGE");
  return JSON.parse(body || "{}");
}

const server = createServer(async (request, response) => {
  const requestUrl = new URL(request.url, "http://localhost");

  if (request.method === "GET" && requestUrl.pathname === "/status") {
    response.writeHead(200, { "content-type": "application/json; charset=utf-8" });
    response.end(JSON.stringify(getStatus("달러")));
    return;
  }

  if (request.method === "GET" && requestUrl.pathname === "/pack") {
    const collectionId = requestUrl.searchParams.get("collectionId") || "";
    const packVersion = requestUrl.searchParams.get("packVersion") || "1";
    if (!/^col_[A-Za-z0-9_-]+$/.test(collectionId) || !/^\d+$/.test(packVersion)) {
      response.writeHead(400, { "content-type": "application/json; charset=utf-8" });
      response.end(JSON.stringify({ error: "INVALID_PACK_REFERENCE" }));
      return;
    }
    try {
      const pack = await getSearchEvidencePack(collectionId, { packVersion: Number(packVersion) });
      response.writeHead(200, { "content-type": "application/json; charset=utf-8" });
      response.end(JSON.stringify(pack));
    } catch (error) {
      const statusCode = error?.code === "ENOENT" ? 404 : 500;
      response.writeHead(statusCode, { "content-type": "application/json; charset=utf-8" });
      response.end(JSON.stringify({ error: statusCode === 404 ? "PACK_NOT_FOUND" : "PACK_READ_FAILED" }));
    }
    return;
  }

  if (request.method === "GET" && requestUrl.pathname === "/review") {
    const collectionId = requestUrl.searchParams.get("collectionId") || "";
    const version = requestUrl.searchParams.get("version");
    if (!/^col_[A-Za-z0-9_-]+$/.test(collectionId) || (version && !/^\d+$/.test(version))) {
      response.writeHead(400, { "content-type": "application/json; charset=utf-8" });
      response.end(JSON.stringify({ error: "INVALID_REVIEW_REFERENCE" }));
      return;
    }
    try {
      const result = await getReviewSelection(collectionId, version ? { reviewVersion: Number(version) } : {});
      response.writeHead(200, { "content-type": "application/json; charset=utf-8" });
      response.end(JSON.stringify(result));
    } catch {
      response.writeHead(500, { "content-type": "application/json; charset=utf-8" });
      response.end(JSON.stringify({ error: "REVIEW_READ_FAILED" }));
    }
    return;
  }

  if (request.method === "POST" && requestUrl.pathname === "/review") {
    try {
      const body = await readJsonBody(request, 256_000);
      if (!/^col_[A-Za-z0-9_-]+$/.test(body.collectionId || "")) throw new Error("INVALID_REVIEW_REFERENCE");
      const result = await createReviewSelection({ collectionId: body.collectionId, packVersion: body.packVersion || 1, reviewerSelection: body.reviewerSelection, reviewerId: body.reviewerId || null });
      response.writeHead(201, { "content-type": "application/json; charset=utf-8" });
      response.end(JSON.stringify(result));
    } catch (error) {
      response.writeHead(400, { "content-type": "application/json; charset=utf-8" });
      response.end(JSON.stringify({ error: error?.message || "REVIEW_SAVE_FAILED" }));
    }
    return;
  }

  if (request.method === "GET" && requestUrl.pathname === "/handoff") {
    const collectionId = requestUrl.searchParams.get("collectionId") || "";
    const version = requestUrl.searchParams.get("version");
    if (!/^col_[A-Za-z0-9_-]+$/.test(collectionId) || (version && !/^\d+$/.test(version))) { response.writeHead(400, { "content-type": "application/json; charset=utf-8" }); response.end(JSON.stringify({ error: "INVALID_HANDOFF_REFERENCE" })); return; }
    try { const result = await getGeoHandoff(collectionId, version ? { handoffVersion: Number(version) } : {}); response.writeHead(200, { "content-type": "application/json; charset=utf-8" }); response.end(JSON.stringify(result)); }
    catch { response.writeHead(500, { "content-type": "application/json; charset=utf-8" }); response.end(JSON.stringify({ error: "HANDOFF_READ_FAILED" })); }
    return;
  }

  if (request.method === "POST" && requestUrl.pathname === "/handoff") {
    try { const body = await readJsonBody(request, 32_000); if (!/^col_[A-Za-z0-9_-]+$/.test(body.collectionId || "")) throw new Error("INVALID_HANDOFF_REFERENCE"); const result = await createGeoHandoff({ collectionId: body.collectionId, reviewVersion: body.reviewVersion == null ? null : Number(body.reviewVersion), packVersion: body.packVersion || 1 }); response.writeHead(201, { "content-type": "application/json; charset=utf-8" }); response.end(JSON.stringify(result)); }
    catch (error) { const statusCode = error?.code === "REVIEW_NOT_FOUND" ? 404 : 400; response.writeHead(statusCode, { "content-type": "application/json; charset=utf-8" }); response.end(JSON.stringify({ error: error?.message || "HANDOFF_CREATE_FAILED" })); }
    return;
  }

  if (request.method === "POST" && request.url === "/collect") {
    console.log("[collect] request_received");
    try {
      const body = await readJsonBody(request);
      const seedKeyword = typeof body.seedKeyword === "string" ? body.seedKeyword : "";
      console.log("[collect] seed_parsed", { seedKeyword });
      if (!seedKeyword.trim()) throw new Error("SEED_KEYWORD_REQUIRED");
      console.log("[collect] orchestrator_start");
      const result = await collectMultiSource(seedKeyword);
      console.log("[collect] orchestrator_complete", {
        collectionId: result.collectionId,
        status: result.snapshot?.status,
        sourceRuns: result.sourceRuns?.length ?? 0,
        evidence: result.evidence?.length ?? 0,
        derivedMetrics: result.derivedMetrics?.length ?? 0,
      });
      const collectionStatus = result.snapshot?.status;
      response.writeHead(collectionStatus === "SUCCESS" || collectionStatus === "PARTIAL_SUCCESS" ? 200 : 422, { "content-type": "application/json; charset=utf-8" });
      response.end(JSON.stringify(result));
    } catch (error) {
      console.log("[collect] error", { name: error?.name || "Error", message: error?.message || "Unknown error" });
      response.writeHead(400, { "content-type": "application/json; charset=utf-8" });
      response.end(JSON.stringify({ status: "PREFLIGHT_FAILED", error: { error_type: "PREFLIGHT_FAILED", message: "Collection request was invalid." } }));
    }
    return;
  }

  const requested = requestUrl.pathname === "/" ? "/index.html" : requestUrl.pathname;
  const isResearchModule = requested.startsWith("/research/");
  const staticRoot = isResearchModule ? researchRoot : root;
  const relativePath = isResearchModule ? requested.replace(/^\/research\/+/, "") : requested.replace(/^\/+/, "");
  const filePath = join(staticRoot, relativePath);
  try {
    const body = await readFile(filePath);
    response.writeHead(200, { "content-type": contentTypes[extname(filePath)] || "application/octet-stream" });
    response.end(body);
  } catch {
    response.writeHead(404, { "content-type": "text/plain; charset=utf-8" });
    response.end("Not found");
  }
});

server.listen(config.port, () => {
  console.log(`GEO skeleton listening on http://localhost:${config.port}`);
});
