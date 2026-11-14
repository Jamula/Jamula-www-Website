const fs = require("node:fs");
const crypto = require("node:crypto");

const BASELINE = "0.1.0";
const SHA = /^[0-9a-f]{40}$/;

function parseVersion(value) {
  const match = /^(0|[1-9]\d*)\.(0|[1-9]\d*)\.(0|[1-9]\d*)$/.exec(value);
  if (!match) throw new Error(`Invalid release version: ${value}`);
  const parts = match.slice(1).map(Number);
  if (parts.some((part) => !Number.isSafeInteger(part)))
    throw new Error(`Release version exceeds safe integer range: ${value}`);
  return parts;
}

function compare(a, b) {
  const aa = parseVersion(a);
  const bb = parseVersion(b);
  for (let i = 0; i < 3; i++) if (aa[i] !== bb[i]) return aa[i] - bb[i];
  return 0;
}

function selectRelease(tags, releases, classification, revision) {
  if (!["material", "fix"].includes(classification))
    throw new Error("Invalid change classification");
  if (!SHA.test(revision)) throw new Error("Invalid revision");
  const versionTags = tags.filter((tag) => tag.name.startsWith("v"));
  const seen = new Set();
  for (const tag of versionTags) {
    const version = tag.name.slice(1);
    parseVersion(version);
    if (
      compare(version, BASELINE) < 0 ||
      seen.has(tag.name) ||
      !SHA.test(tag.commit?.sha)
    )
      throw new Error(`Invalid or duplicate release tag: ${tag.name}`);
    seen.add(tag.name);
  }
  const published = new Set();
  for (const release of releases) {
    if (!release.tag_name.startsWith("v")) continue;
    parseVersion(release.tag_name.slice(1));
    if (
      release.draft ||
      release.prerelease ||
      !seen.has(release.tag_name) ||
      published.has(release.tag_name)
    )
      throw new Error(`Invalid release history: ${release.tag_name}`);
    published.add(release.tag_name);
  }
  if (published.size !== seen.size)
    throw new Error("Release tag without a published release");
  const history = {
    tags: versionTags.map(({ name, commit }) => [name, commit.sha]).sort(),
    releases: releases
      .filter((release) => published.has(release.tag_name))
      .map((release) => [release.tag_name, release.id ?? null])
      .sort((a, b) => a[0].localeCompare(b[0])),
  };
  const fingerprint = crypto
    .createHash("sha256")
    .update(JSON.stringify(history))
    .digest("hex");
  if (!versionTags.length) {
    if (classification === "fix")
      throw new Error(
        "No release exists; select material to establish the baseline",
      );
    return { version: BASELINE, releaseSha: "", fingerprint };
  }
  versionTags.sort((a, b) => compare(b.name.slice(1), a.name.slice(1)));
  const releaseSha = versionTags[0].commit.sha;
  if (classification === "fix")
    return { version: versionTags[0].name.slice(1), releaseSha, fingerprint };
  if (releaseSha === revision)
    throw new Error("Current revision is already the latest release");
  const parts = parseVersion(versionTags[0].name.slice(1));
  parts[2]++;
  if (!Number.isSafeInteger(parts[2])) throw new Error("Version overflow");
  return { version: parts.join("."), releaseSha, fingerprint };
}

function metadata(version, revision, run, attempt) {
  parseVersion(version);
  if (
    !SHA.test(revision) ||
    !/^[1-9]\d*$/.test(run) ||
    !/^[1-9]\d*$/.test(attempt)
  )
    throw new Error("Invalid release metadata");
  return { version, revision, run, attempt };
}

function verifyMetadata(actual, expected) {
  if (
    !actual ||
    typeof actual !== "object" ||
    Object.keys(expected).some((key) => actual[key] !== expected[key])
  )
    throw new Error("Live release metadata does not match this deployment");
}

if (require.main === module) {
  const [command, ...args] = process.argv.slice(2);
  if (command === "select") {
    const [tagsFile, releasesFile, classification, revision] = args;
    const readPages = (file) =>
      JSON.parse(fs.readFileSync(file, "utf8")).flat();
    console.log(
      JSON.stringify(
        selectRelease(
          readPages(tagsFile),
          readPages(releasesFile),
          classification,
          revision,
        ),
      ),
    );
  } else if (command === "write" || command === "verify") {
    const [file, version, revision, run, attempt] = args;
    const expected = metadata(version, revision, run, attempt);
    if (command === "write")
      fs.writeFileSync(file, JSON.stringify(expected) + "\n");
    else verifyMetadata(JSON.parse(fs.readFileSync(file, "utf8")), expected);
  } else {
    throw new Error("Unknown release command");
  }
}

module.exports = { selectRelease, metadata, verifyMetadata };
