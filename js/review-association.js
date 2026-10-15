"use strict";

function reviewSourceIdForPgn(sourceGameId, sourcePgn, submittedPgn) {
  if (sourceGameId == null) return null;
  const normalize = (value) => String(value ?? "").replace(/\s+/g, " ").trim();
  const source = normalize(sourcePgn);
  return source && source === normalize(submittedPgn) ? sourceGameId : null;
}

if (typeof window !== "undefined") window.reviewSourceIdForPgn = reviewSourceIdForPgn;
if (typeof module !== "undefined" && module.exports) module.exports = { reviewSourceIdForPgn };
