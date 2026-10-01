import assert from "node:assert/strict";
import { getStatus } from "../src/app/application.mjs";
import { collectorContract } from "../src/collectors/collector-contract.mjs";
import { derivedMetricContract } from "../src/metrics/metric-contract.mjs";
import { repositoryContract } from "../src/repositories/repository-contract.mjs";
import { getNaverPreflight } from "../src/config/index.mjs";

function testApplicationStatus() {
  const status = getStatus();
  assert.equal(status.status, "READY_FOR_COLLECTION");
  assert.equal(status.competitionRatio.formula, "NOT_CONFIGURED");
  assert.equal(status.competitionRatio.formulaVersion, "NOT_CONFIGURED");
}

function testModuleBoundaries() {
  assert.deepEqual(collectorContract.stages, ["SOURCE_PREFLIGHT", "COLLECTOR", "RAW_RESPONSE"]);
  assert.equal(derivedMetricContract.input, "VALIDATED_EVIDENCE");
  assert.equal(repositoryContract.storage, "LOCAL_FIRST");
  assert.equal(repositoryContract.status, "INTERFACE_ONLY");
  assert.ok(["READY", "BLOCKED"].includes(getNaverPreflight("달러").status));
}

testApplicationStatus();
testModuleBoundaries();
console.log("Skeleton contract tests passed.");
