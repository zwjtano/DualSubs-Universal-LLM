import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const source = await readFile(
  new URL("../Experimental/YouTubeSubtitlesTranslation.LLM.lpx", import.meta.url),
  "utf8",
);

assert.match(source, /^#!name=YouTube双语翻译 LLM v1\.0\.0$/m);
assert.match(source, /^#!version=1\.0\.0$/m);
assert.match(source, /tag=🧪 验证大模型/);
assert.match(source, /YouTube_Subtitles_request\.js/);
assert.match(source, /YouTube_Subtitles_response\.js/);
assert.match(source, /YouTube_Composite_Subtitles_response\.js/);
assert.equal((source.match(/Translate\.response\.bundle\.js\?v=1\.0\.4/g) || []).length, 3);

const translateLines = source
  .split("\n")
  .filter((line) => line.includes("Translate.response.bundle.js"));
assert.equal(translateLines.length, 3);
for (const line of translateLines) {
  assert.match(line, /requires-body=true/);
  assert.match(line, /timeout=180/);
  assert.match(
    line,
    /argument=\[\{Types\},\{Languages\[0\]\},\{Languages\[1\]\},\{Position\},\{Vendor\},\{LLMEndpoint\},\{LLMModel\},\{LLMAuth\},\{LLMTemperature\},\{LLMTimeout\},\{LLMHeaders\},\{ShowOnly\},\{LogLevel\}\]/,
  );
}

assert.match(
  source,
  /^hostname=www\.youtube\.com, m\.youtube\.com, tv\.youtube\.com, music\.youtube\.com, youtubei\.googleapis\.com$/m,
);

console.log("experimental Kelee YouTube LLM plugin tests passed");
