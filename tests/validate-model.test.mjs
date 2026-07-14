import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import vm from "node:vm";

const source = await readFile(new URL("../Scripts/DualSubs/ValidateModel.js", import.meta.url), "utf8");

async function run(statusCode, data) {
  const notices = [];
  const requests = [];
  const settings = {
    LLMEndpoint: "https://example.com/v1",
    LLMModel: "test-model",
    LLMAuth: "top-secret-value",
    LLMTimeout: "30000",
    LLMHeaders: '{"X-Test":"yes"}',
  };

  await new Promise((resolve, reject) => {
    const context = {
      $persistentStore: { read: (key) => settings[key] ?? null },
      $notification: { post: (...args) => notices.push(args) },
      $httpClient: {
        post: (request, callback) => {
          requests.push(request);
          queueMicrotask(() => callback(null, { statusCode }, data));
        },
      },
      $done: resolve,
      console: { log() {} },
      queueMicrotask,
    };
    try {
      vm.runInNewContext(source, context);
    } catch (error) {
      reject(error);
    }
  });

  return { notices, requests };
}

const success = await run(200, JSON.stringify({ choices: [{ message: { content: "OK" } }] }));
assert.equal(success.requests[0].url, "https://example.com/v1/chat/completions");
assert.equal(success.requests[0].headers.Authorization, "Bearer top-secret-value");
assert.equal(success.requests[0].headers["X-Test"], "yes");
assert.match(success.notices[0][1], /模型可用/);
assert.doesNotMatch(JSON.stringify(success.notices), /top-secret-value/);

const unauthorized = await run(401, JSON.stringify({ error: { message: "bad key" } }));
assert.match(unauthorized.notices[0][1], /鉴权失败/);
assert.doesNotMatch(JSON.stringify(unauthorized.notices), /top-secret-value/);

console.log("model validator integration tests passed");
