"use strict";

// Child-process doubles keep the real CLI offline and prevent filesystem writes.
const fs = require("node:fs");
const https = require("node:https");
const childProcess = require("node:child_process");
const { EventEmitter } = require("node:events");
const scenario = JSON.parse(process.env.TRIAGE_FIXTURE);

const readFileSync = fs.readFileSync;
fs.readFileSync = (file, ...args) => {
  if (String(file).endsWith("team.md")) return scenario.team || "";
  if (String(file).endsWith("routing.md")) return scenario.routing || "";
  return readFileSync.call(fs, file, ...args);
};
fs.mkdirSync = () => {};
fs.writeFileSync = (file, content) => {
  console.log(`FIXTURE_OUTPUT ${JSON.stringify({ file, content })}`);
};
childProcess.execSync = () =>
  scenario.remote || "https://github.example/org/repo.git";
https.request = (url, options, callback) => {
  const request = new EventEmitter();
  request.end = () => {
    process.nextTick(() => {
      if (scenario.networkError) {
        request.emit("error", new Error("offline network failure"));
        return;
      }
      const page = Number(url.searchParams.get("page"));
      console.log(
        `FIXTURE_REQUEST ${JSON.stringify({ url: String(url), method: options.method })}`,
      );
      const response = new EventEmitter();
      response.statusCode = scenario.status || 200;
      response.setEncoding = () => {};
      callback(response);
      response.emit(
        "data",
        scenario.rawBody ??
          JSON.stringify((scenario.pages || [])[page - 1] ?? []),
      );
      response.emit("end");
    });
  };
  return request;
};
