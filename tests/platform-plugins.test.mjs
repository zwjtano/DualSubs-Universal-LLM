import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

for (const platform of ["YouTube", "Netflix", "Spotify"]) {
  const source = await readFile(
    new URL(`../Plugins/DualSubs.${platform}.LLM.plugin`, import.meta.url),
    "utf8",
  );
  assert.match(source, new RegExp(`#!name = .*${platform}.* LLM v`));
  if (platform === "YouTube") {
    assert.match(source, /^#!version = 1\.0\.2$/m);
  } else {
    assert.match(source, /^#!version = \d+(?:\.\d+){3}$/m);
  }
  assert.match(source, /^#!author = zwjtano\[https:\/\/github\.com\/zwjtano\]$/m);
  assert.match(source, /^#!homepage = https:\/\/github\.com\/zwjtano\/DualSubs-Universal-LLM$/m);
  assert.match(source, /Vendor = select,"LLM","Google","Microsoft"/);
  assert.match(source, /LLMEndpoint = input/);
  assert.match(source, /🧪 验证大模型/);
  assert.match(source, /LLMHeaders = input,"",/);
  assert.match(
    source,
    /generic script-path=https:\/\/raw\.githubusercontent\.com\/zwjtano\/DualSubs-Universal-LLM\/main\/Scripts\/DualSubs\/ValidateModel\.js,tag=🧪 验证大模型/,
  );
  assert.match(
    source,
    /DualSubs-Universal-LLM\/main\/Scripts\/DualSubs\/Translate\.response\.bundle\.js\?v=1\.0\.2/,
  );
  for (const line of source.split("\n").filter((line) => line.includes("Translate.response.bundle.js"))) {
    assert.match(line, /timeout=180/);
    assert.match(
      line,
      /\{LLMEndpoint\},\{LLMModel\},\{LLMAuth\},\{LLMTemperature\},\{LLMTimeout\},\{LLMHeaders\}/,
    );
  }
  if (platform === "YouTube") {
    assert.match(source, /^#!name = .*YouTube.* LLM v1\.0\.2$/m);
    assert.match(source, /^Type = select,"Translate","Official",/m);
  }
}

console.log("platform plugin tests passed");
