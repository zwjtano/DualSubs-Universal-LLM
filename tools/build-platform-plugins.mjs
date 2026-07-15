import { mkdir, readFile, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";

const root = resolve(import.meta.dirname, "..");
const llmVersion = "1.0.0";
const translateUrl = `https://raw.githubusercontent.com/zwjtano/DualSubs-Universal-LLM/main/Scripts/DualSubs/Translate.response.bundle.js?v=${llmVersion}`;
const validateUrl = "https://raw.githubusercontent.com/zwjtano/DualSubs-Universal-LLM/main/Scripts/DualSubs/ValidateModel.js";

const platforms = [
  {
    name: "YouTube",
    source: "https://github.com/DualSubs/YouTube/releases/latest/download/DualSubs.YouTube.plugin",
    fallback: "C:/tmp/dualsubs-platforms/DualSubs.YouTube.plugin",
    output: "Plugins/DualSubs.YouTube.LLM.plugin",
  },
  {
    name: "Netflix",
    source: "https://github.com/DualSubs/Netflix/releases/latest/download/DualSubs.Netflix.plugin",
    fallback: "C:/tmp/dualsubs-platforms/DualSubs.Netflix.plugin",
    output: "Plugins/DualSubs.Netflix.LLM.plugin",
  },
  {
    name: "Spotify",
    source: "https://github.com/DualSubs/Spotify/releases/latest/download/DualSubs.Spotify.plugin",
    fallback: "C:/tmp/dualsubs-platforms/DualSubs.Spotify.plugin",
    output: "Plugins/DualSubs.Spotify.LLM.plugin",
  },
];

async function load(url, fallback) {
  try {
    return await readFile(fallback, "utf8");
  } catch {}
  const response = await fetch(url, { redirect: "follow" });
  if (!response.ok) throw new Error(`download failed ${response.status}: ${url}`);
  return response.text();
}

function patchPlugin(source, platform) {
  const upstreamVersion = source.match(/^#!version\s*=\s*(.+)$/m)?.[1]?.trim();
  if (!upstreamVersion) throw new Error(`${platform}: missing upstream version`);
  // The YouTube LLM fork has its own release line. Keep the upstream
  // platform version only for the other generated plugins.
  const version = platform === "YouTube" ? "1.0.0" : `${upstreamVersion}.5`;

  source = source
    .replace(/^(#!name\s*=\s*.+)$/m, `$1 LLM v${version}`)
    .replace(/^(#!desc\s*=\s*.+)$/m, `$1\\nLLM 翻译版 v${version}`)
    .replace(/^#!author\s*=\s*.+$/m, "#!author = zwjtano[https://github.com/zwjtano]")
    .replace(/^#!homepage\s*=\s*.+$/m, "#!homepage = https://github.com/zwjtano/DualSubs-Universal-LLM")
    .replace(/^#!version\s*=\s*.+$/m, `#!version = ${version}`)
    .replace(
      /^Vendor\s*=\s*select,"Google","Microsoft",(.*)$/m,
      [
        'Vendor = select,"LLM","Google","Microsoft",$1',
        'LLMEndpoint = input,"https://api.openai.com/v1/chat/completions",tag=[大模型] API 地址',
        'LLMModel = input,"gpt-4.1-mini",tag=[大模型] 模型名称',
        'LLMAuth = input,"",tag=[大模型] API Key',
        'LLMTemperature = input,"0.2",tag=[大模型] 温度',
        'LLMTimeout = input,"120000",tag=[大模型] 超时毫秒',
        'LLMHeaders = input,"",tag=[大模型] 附加请求头,desc=可选 JSON 对象',
      ].join("\n"),
    )
    .replace(
      /https:\/\/github\.com\/DualSubs\/Universal\/releases\/(?:latest\/download|download\/v[^/]+)\/Translate\.response\.bundle\.js/g,
      translateUrl,
    )
    .replace(
      "[Script]\n",
      `[Script]\ngeneric script-path=${validateUrl},tag=🧪 验证大模型,timeout=60,img-url=checkmark.seal.fill,argument=[{LLMEndpoint},{LLMModel},{LLMAuth},{LLMTimeout},{LLMHeaders}],enable=true\n\n`,
    );

  if (platform === "YouTube") {
    source = source.replace(
      'Type = select,"Official","Translate",',
      'Type = select,"Translate","Official",',
    );
  }

  source = source
    .split("\n")
    .map((line) => {
      if (!line.includes(translateUrl)) return line;
      if (!/\btimeout\s*=/.test(line)) {
        line = line.includes("requires-body=1,")
          ? line.replace("requires-body=1,", "requires-body=1, timeout=180,")
          : line.replace("script-path=", "timeout=180, script-path=");
      }
      const llmArguments = "{LLMEndpoint},{LLMModel},{LLMAuth},{LLMTemperature},{LLMTimeout},{LLMHeaders}";
      if (!line.includes("{LLMEndpoint}")) {
        if (/argument=\[([^\]]*)\]/.test(line)) {
          line = line.replace(/argument=\[([^\]]*)\]/, (_, args) =>
            `argument=[${args},${llmArguments}]`,
          );
        } else {
          line += `, argument=[${llmArguments}]`;
        }
      }
      return line;
    })
    .join("\n");

  if (!source.includes(translateUrl)) throw new Error(`${platform}: translate script was not replaced`);
  if (!source.includes("LLMEndpoint = input")) throw new Error(`${platform}: LLM settings were not added`);
  if (platform === "YouTube" && !source.includes('Type = select,"Translate","Official",')) {
    throw new Error("YouTube: Translate is not the default subtitle type");
  }
  return source;
}

for (const platform of platforms) {
  const output = resolve(root, platform.output);
  const source = await load(platform.source, platform.fallback);
  await mkdir(dirname(output), { recursive: true });
  await writeFile(output, patchPlugin(source, platform.name));
  console.log(`generated ${platform.output}`);
}
