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
    // Reproduce Loon dropping the extended argument list: only the original
    // settings arrive, while plugin inputs remain available in persistence.
    $argument: {
      Types: "Translate",
      "Languages[0]": "EN",
      "Languages[1]": "ZH",
      Position: "Forward",
      Vendor: "LLM",
      ShowOnly: "false",
      LogLevel: "INFO",
    },
    $persistentStore: {
      read(key) {
        if (key !== "DualSubsLLMConfig") return null;
        return JSON.stringify({
          LLMEndpoint: "https://example.com/v1/chat/completions",
          LLMModel: "test-model",
          LLMAuth: "test-key",
          LLMTemperature: "0.2",
          LLMTimeout: "30000",
          LLMHeaders: "",
        });
      },
      write: () => true,
    },
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
