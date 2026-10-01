export const repositoryContract = Object.freeze({
  storage: "LOCAL_FIRST",
  implementations: ["CollectionRepository", "EvidenceRepository", "SourceRepository", "SnapshotRepository", "ErrorRegistry"],
  status: "INTERFACE_ONLY",
});
