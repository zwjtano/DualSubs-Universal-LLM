import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import vm from "node:vm";

const source = await readFile(
  new URL("../Scripts/DualSubs/Translate.response.bundle.js", import.meta.url),
  "utf8",
);

const requestBodies = [];
let output;

const completed = new Promise((resolve, reject) => {
  const context = {
    console,
    setTimeout,
    clearTimeout,
    $loon: "1",
    $script: { startTime: Date.now() },
    $request: {
      url: "https://example.com/subtitle.vtt?subtype=Translate&lang=EN&tlang=ZH",
      headers: {},
    },
    $response: {
      headers: { "Content-Type": "text/vtt" },
      body: "WEBVTT\n\n00:00:00.000 --> 00:00:02.000\nHello world\n",
    },
    // Loon supplies plugin `argument=[...]` values as a positional array.
    $argument: [
      "Translate",
      "EN",
      "ZH",
      "Forward",
      "LLM",
      "https://example.com/v1/chat/completions",
      "test-model",
      "test-key",
      "0.2",
      "30000",
      "",
      "false",
      "INFO",
    ],
    $persistentStore: { read: () => null, write: () => true },
    $notification: { post: () => {} },
    $httpClient: {
      post(options, callback) {
        requestBodies.push(JSON.parse(options.body));
        callback(
          null,
          { status: 200, statusCode: 200 },
          JSON.stringify({
            choices: [
              {
                message: {
                  content: JSON.stringify([{ id: 0, text: "你好，世界" }]),
                },
              },
            ],
          }),
        );
      },
    },
    $done(value) {
      output = value;
      resolve();
    },
  };

  try {
    vm.runInNewContext(source, context, { timeout: 10_000 });
  } catch (error) {
    reject(error);
  }
});

await Promise.race([
  completed,
  new Promise((_, reject) =>
    setTimeout(() => reject(new Error("translate response timed out")), 12_000),
  ),
]);

assert.equal(requestBodies.length, 1, "LLM API should be called exactly once");
assert.equal(requestBodies[0].model, "test-model");
assert.match(output.body, /Hello world/);
assert.match(output.body, /你好，世界/);

console.log("subtitle translation integration test passed");
