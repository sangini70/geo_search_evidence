import { createServer } from "node:http";
import { readFile } from "node:fs/promises";
import { extname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { config } from "../config/index.mjs";
import { collectMultiSource, collectResearchSession, runInitialDiscoveryForSession, createInitialDiscoveryEvaluationForSession, getInitialDiscoveryEvaluationForSession, createFollowUpResearchProjectionForSession, getFollowUpResearchProjectionForSession, createSessionEvidenceIntegration, saveSessionResearchContext, getSessionResearchContext, createSessionSearchDemandCompression, createSessionInterpretedSearchDemandCompression, createFinalPlannerHandoffForSession, getFinalPlannerHandoffState, getLatestPlannerDecisionBriefFile, getLatestPlannerDecisionBriefMetadata, getLatestCompletedResearchSession, createReviewSelection, createGeoHandoff, getGeoHandoff, getReviewSelection, getSearchEvidencePack, getStatus } from "./application.mjs";

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
      const researchContext = body.researchContext && typeof body.researchContext === "object" ? body.researchContext : null;
      const result = await collectMultiSource(seedKeyword, { researchContext });
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

  if (request.method === "POST" && requestUrl.pathname === "/research-session/collect") {
    try {
      const body = await readJsonBody(request, 256_000);
      const result = await collectResearchSession(body.researchSession);
      response.writeHead(200, { "content-type": "application/json; charset=utf-8" });
      response.end(JSON.stringify(result));
    } catch (error) {
      response.writeHead(400, { "content-type": "application/json; charset=utf-8" });
      response.end(JSON.stringify({ error: error?.message || "RESEARCH_SESSION_COLLECTION_FAILED" }));
    }
    return;
  }

  if (request.method === "POST" && requestUrl.pathname === "/research-session/initial-discovery/run") {
    try {
      const body = await readJsonBody(request, 1_000_000);
      const result = await runInitialDiscoveryForSession({
        collectionRequestProjection: body.collection_request_projection || body.collectionRequestProjection,
      });
      response.writeHead(200, { "content-type": "application/json; charset=utf-8" });
      response.end(JSON.stringify(result));
    } catch (error) {
      response.writeHead(400, { "content-type": "application/json; charset=utf-8" });
      response.end(JSON.stringify({ error: error?.message || "INITIAL_DISCOVERY_RUN_FAILED" }));
    }
    return;
  }

  if (request.method === "GET" && requestUrl.pathname === "/research-session/initial-discovery/evaluation") {
    const researchSessionId = requestUrl.searchParams.get("researchSessionId") || "";
    if (!/^research_session_[A-Za-z0-9_-]+$/.test(researchSessionId)) { response.writeHead(400, { "content-type": "application/json; charset=utf-8" }); response.end(JSON.stringify({ error: "INVALID_RESEARCH_SESSION_REFERENCE" })); return; }
    try {
      const evaluation = await getInitialDiscoveryEvaluationForSession(researchSessionId);
      if (!evaluation) { response.writeHead(404, { "content-type": "application/json; charset=utf-8" }); response.end(JSON.stringify({ error: "INITIAL_DISCOVERY_EVALUATION_NOT_FOUND" })); return; }
      response.writeHead(200, { "content-type": "application/json; charset=utf-8" });
      response.end(JSON.stringify(evaluation));
    } catch (error) { response.writeHead(500, { "content-type": "application/json; charset=utf-8" }); response.end(JSON.stringify({ error: error?.message || "INITIAL_DISCOVERY_EVALUATION_READ_FAILED" })); }
    return;
  }

  if (request.method === "POST" && requestUrl.pathname === "/research-session/initial-discovery/evaluation") {
    try {
      const body = await readJsonBody(request, 1_000_000);
      const result = await createInitialDiscoveryEvaluationForSession({ researchSessionId: body.research_session_id || body.researchSessionId, researchPlan: body.research_plan || body.researchPlan || null, initialDiscoveryRun: body.initial_discovery_run || body.initialDiscoveryRun || null });
      response.writeHead(201, { "content-type": "application/json; charset=utf-8" });
      response.end(JSON.stringify(result));
    } catch (error) { response.writeHead(400, { "content-type": "application/json; charset=utf-8" }); response.end(JSON.stringify({ error: error?.message || "INITIAL_DISCOVERY_EVALUATION_FAILED" })); }
    return;
  }

  if (request.method === "GET" && requestUrl.pathname === "/research-session/follow-up/projection") {
    const researchSessionId = requestUrl.searchParams.get("researchSessionId") || "";
    if (!/^research_session_[A-Za-z0-9_-]+$/.test(researchSessionId)) { response.writeHead(400, { "content-type": "application/json; charset=utf-8" }); response.end(JSON.stringify({ error: "INVALID_RESEARCH_SESSION_REFERENCE" })); return; }
    try {
      const projection = await getFollowUpResearchProjectionForSession(researchSessionId);
      if (!projection) { response.writeHead(404, { "content-type": "application/json; charset=utf-8" }); response.end(JSON.stringify({ error: "FOLLOW_UP_PROJECTION_NOT_FOUND" })); return; }
      response.writeHead(200, { "content-type": "application/json; charset=utf-8" }); response.end(JSON.stringify(projection));
    } catch (error) { response.writeHead(500, { "content-type": "application/json; charset=utf-8" }); response.end(JSON.stringify({ error: error?.message || "FOLLOW_UP_PROJECTION_READ_FAILED" })); }
    return;
  }

  if (request.method === "POST" && requestUrl.pathname === "/research-session/follow-up/projection") {
    try {
      const body = await readJsonBody(request, 1_000_000);
      const result = await createFollowUpResearchProjectionForSession({ researchSessionId: body.research_session_id || body.researchSessionId, researchPlan: body.research_plan || body.researchPlan || null, evaluation: body.evaluation || null });
      response.writeHead(201, { "content-type": "application/json; charset=utf-8" }); response.end(JSON.stringify(result));
    } catch (error) { response.writeHead(400, { "content-type": "application/json; charset=utf-8" }); response.end(JSON.stringify({ error: error?.message || "FOLLOW_UP_PROJECTION_FAILED" })); }
    return;
  }

  if (request.method === "POST" && requestUrl.pathname === "/research-session/integration") {
    try {
      const body = await readJsonBody(request, 256_000);
      const integration = await createSessionEvidenceIntegration({ researchSessionId: body.research_session_id, targetResults: body.target_results, researchContext: body.research_context || null });
      response.writeHead(201, { "content-type": "application/json; charset=utf-8" });
      response.end(JSON.stringify(integration));
    } catch (error) {
      response.writeHead(400, { "content-type": "application/json; charset=utf-8" });
      response.end(JSON.stringify({ error: error?.message || "RESEARCH_SESSION_INTEGRATION_FAILED" }));
    }
    return;
  }

  if (request.method === "GET" && requestUrl.pathname === "/research-session/context") {
    const researchSessionId = requestUrl.searchParams.get("researchSessionId") || "";
    if (!/^research_session_[A-Za-z0-9_-]+$/.test(researchSessionId)) { response.writeHead(400, { "content-type": "application/json; charset=utf-8" }); response.end(JSON.stringify({ error: "INVALID_RESEARCH_SESSION_REFERENCE" })); return; }
    try {
      const artifact = await getSessionResearchContext(researchSessionId);
      if (!artifact) { response.writeHead(404, { "content-type": "application/json; charset=utf-8" }); response.end(JSON.stringify({ error: "RESEARCH_SESSION_CONTEXT_NOT_FOUND" })); return; }
      response.writeHead(200, { "content-type": "application/json; charset=utf-8" });
      response.end(JSON.stringify(artifact));
    } catch (error) { response.writeHead(500, { "content-type": "application/json; charset=utf-8" }); response.end(JSON.stringify({ error: error?.message || "RESEARCH_SESSION_CONTEXT_READ_FAILED" })); }
    return;
  }

  if (request.method === "POST" && requestUrl.pathname === "/research-session/context") {
    try {
      const body = await readJsonBody(request, 256_000);
      const result = await saveSessionResearchContext({ researchSessionId: body.research_session_id, context: body.context });
      response.writeHead(201, { "content-type": "application/json; charset=utf-8" });
      response.end(JSON.stringify(result));
    } catch (error) {
      response.writeHead(400, { "content-type": "application/json; charset=utf-8" });
      response.end(JSON.stringify({ error: error?.message || "RESEARCH_SESSION_CONTEXT_SAVE_FAILED" }));
    }
    return;
  }

  if (request.method === "POST" && requestUrl.pathname === "/research-session/compression") {
    try {
      const body = await readJsonBody(request, 512_000);
      const result = await createSessionSearchDemandCompression(body.integration);
      response.writeHead(201, { "content-type": "application/json; charset=utf-8" });
      response.end(JSON.stringify(result));
    } catch (error) {
      response.writeHead(400, { "content-type": "application/json; charset=utf-8" });
      response.end(JSON.stringify({ error: error?.message || "SEARCH_DEMAND_COMPRESSION_FAILED" }));
    }
    return;
  }

  if (request.method === "POST" && requestUrl.pathname === "/research-session/compression/interpret") {
    try {
      const body = await readJsonBody(request, 768_000);
      const result = await createSessionInterpretedSearchDemandCompression({ compression: body.compression, integration: body.integration || null, researchContext: body.research_context || null });
      response.writeHead(201, { "content-type": "application/json; charset=utf-8" });
      response.end(JSON.stringify(result));
    } catch (error) {
      response.writeHead(400, { "content-type": "application/json; charset=utf-8" });
      response.end(JSON.stringify({ error: error?.message || "SEARCH_DEMAND_INTERPRETATION_FAILED" }));
    }
    return;
  }

  if (request.method === "GET" && requestUrl.pathname === "/final-planner-handoff") {
    const researchSessionId = requestUrl.searchParams.get("researchSessionId") || "";
    if (!/^research_session_[A-Za-z0-9_-]+$/.test(researchSessionId)) { response.writeHead(400, { "content-type": "application/json; charset=utf-8" }); response.end(JSON.stringify({ error: "INVALID_RESEARCH_SESSION_REFERENCE" })); return; }
    try { const result = await getFinalPlannerHandoffState(researchSessionId); response.writeHead(200, { "content-type": "application/json; charset=utf-8" }); response.end(JSON.stringify(result)); }
    catch (error) { response.writeHead(500, { "content-type": "application/json; charset=utf-8" }); response.end(JSON.stringify({ error: error?.message || "FINAL_PLANNER_HANDOFF_READ_FAILED" })); }
    return;
  }

  if (request.method === "POST" && requestUrl.pathname === "/final-planner-handoff") {
    try { const body = await readJsonBody(request, 32_000); if (!/^research_session_[A-Za-z0-9_-]+$/.test(body.researchSessionId || "")) throw new Error("INVALID_RESEARCH_SESSION_REFERENCE"); const result = await createFinalPlannerHandoffForSession(body.researchSessionId); response.writeHead(201, { "content-type": "application/json; charset=utf-8" }); response.end(JSON.stringify(result)); }
    catch (error) { response.writeHead(error?.code === "FINAL_PLANNER_HANDOFF_INPUT_NOT_READY" ? 409 : 400, { "content-type": "application/json; charset=utf-8" }); response.end(JSON.stringify({ error: error?.message || "FINAL_PLANNER_HANDOFF_CREATE_FAILED" })); }
    return;
  }

  if (request.method === "GET" && requestUrl.pathname === "/research-session/planner-decision-brief/download") {
    const researchSessionId = requestUrl.searchParams.get("researchSessionId") || "";
    if (!/^research_session_[A-Za-z0-9_-]+$/.test(researchSessionId)) { response.writeHead(400, { "content-type": "application/json; charset=utf-8" }); response.end(JSON.stringify({ error: "INVALID_RESEARCH_SESSION_REFERENCE" })); return; }
    try {
      const brief = await getLatestPlannerDecisionBriefFile(researchSessionId);
      if (!brief) { response.writeHead(404, { "content-type": "application/json; charset=utf-8" }); response.end(JSON.stringify({ error: "PLANNER_DECISION_BRIEF_NOT_FOUND" })); return; }
      response.writeHead(200, { "content-type": "application/json", "content-disposition": `attachment; filename=\"${brief.fileName}\"`, "content-length": brief.bytes.byteLength });
      response.end(brief.bytes);
    } catch (error) {
      const statusCode = error?.code === "ENOENT" ? 404 : 500;
      response.writeHead(statusCode, { "content-type": "application/json; charset=utf-8" });
      response.end(JSON.stringify({ error: statusCode === 404 ? "PLANNER_DECISION_BRIEF_NOT_FOUND" : "PLANNER_DECISION_BRIEF_READ_FAILED" }));
    }
    return;
  }

  if (request.method === "GET" && requestUrl.pathname === "/research-session/planner-decision-brief") {
    const researchSessionId = requestUrl.searchParams.get("researchSessionId") || "";
    if (!/^research_session_[A-Za-z0-9_-]+$/.test(researchSessionId)) { response.writeHead(400, { "content-type": "application/json; charset=utf-8" }); response.end(JSON.stringify({ error: "INVALID_RESEARCH_SESSION_REFERENCE" })); return; }
    try {
      const metadata = await getLatestPlannerDecisionBriefMetadata(researchSessionId);
      if (!metadata) { response.writeHead(404, { "content-type": "application/json; charset=utf-8" }); response.end(JSON.stringify({ error: "PLANNER_DECISION_BRIEF_NOT_FOUND" })); return; }
      response.writeHead(200, { "content-type": "application/json; charset=utf-8" });
      response.end(JSON.stringify(metadata));
    } catch {
      response.writeHead(500, { "content-type": "application/json; charset=utf-8" });
      response.end(JSON.stringify({ error: "PLANNER_DECISION_BRIEF_READ_FAILED" }));
    }
    return;
  }

  if (request.method === "GET" && requestUrl.pathname === "/research-sessions/recent-completed") {
    try {
      const session = await getLatestCompletedResearchSession();
      if (!session) { response.writeHead(404, { "content-type": "application/json; charset=utf-8" }); response.end(JSON.stringify({ error: "COMPLETED_RESEARCH_SESSION_NOT_FOUND" })); return; }
      response.writeHead(200, { "content-type": "application/json; charset=utf-8" });
      response.end(JSON.stringify({ ...session, download_url: `/research-session/planner-decision-brief/download?researchSessionId=${encodeURIComponent(session.research_session_id)}` }));
    } catch {
      response.writeHead(500, { "content-type": "application/json; charset=utf-8" });
      response.end(JSON.stringify({ error: "RECENT_RESEARCH_SESSION_READ_FAILED" }));
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
