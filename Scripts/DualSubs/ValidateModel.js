const TITLE = "DualSubs LLM 模型验证";

function readSetting(name, index) {
  const stored = $persistentStore.read(name);
  if (stored !== null && stored !== undefined && String(stored).trim() !== "") return stored;
  if (typeof $argument === "object" && $argument !== null) {
    if ($argument[name] !== undefined) return $argument[name];
    if (Array.isArray($argument) && $argument[index] !== undefined) return $argument[index];
  }
  return "";
}

function normalizeEndpoint(value) {
  let endpoint = String(value || "").trim().replace(/\/+$/, "");
  if (!endpoint) throw new Error("未填写 API 地址");
  if (!/^https?:\/\//i.test(endpoint)) throw new Error("API 地址必须以 http:// 或 https:// 开头");
  if (!/\/(chat\/completions|responses)$/i.test(endpoint)) {
    endpoint += /\/v1$/i.test(endpoint) ? "/chat/completions" : "/v1/chat/completions";
  }
  return endpoint;
}

function notify(subtitle, message) {
  console.log(TITLE + ": " + subtitle + " - " + message);
  $notification.post(TITLE, subtitle, message);
}

function errorMessage(data) {
  try {
    const parsed = JSON.parse(data || "{}");
    return String(parsed?.error?.message || parsed?.message || "").slice(0, 180);
  } catch {
    return String(data || "").slice(0, 180);
  }
}

try {
  const endpoint = normalizeEndpoint(readSetting("LLMEndpoint", 0));
  const model = String(readSetting("LLMModel", 1) || "").trim();
  const auth = String(readSetting("LLMAuth", 2) || "").trim();
  const timeout = Number(readSetting("LLMTimeout", 3) || 30000);
  const extraHeaders = readSetting("LLMHeaders", 4);
  if (!model) throw new Error("未填写模型名称");

  const headers = {
    "Content-Type": "application/json",
    Accept: "application/json",
    "User-Agent": "DualSubs-LLM-Validator",
  };
  if (auth) headers.Authorization = "Bearer " + auth;
  if (extraHeaders) {
    const parsed = typeof extraHeaders === "string" ? JSON.parse(extraHeaders) : extraHeaders;
    if (!parsed || Array.isArray(parsed) || typeof parsed !== "object") throw new Error("附加请求头必须是 JSON 对象");
    Object.assign(headers, parsed);
  }
  $persistentStore.write(
    JSON.stringify({ LLMEndpoint: endpoint, LLMModel: model, LLMAuth: auth, LLMTimeout: timeout, LLMHeaders: extraHeaders || "" }),
    "DualSubsLLMConfig",
  );

  $httpClient.post(
    {
      url: endpoint,
      timeout: Number.isFinite(timeout) && timeout > 0 ? Math.min(timeout, 60000) : 30000,
      headers,
      body: JSON.stringify({
        model,
        messages: [{ role: "user", content: "Reply with exactly: OK" }],
        temperature: 0,
      }),
    },
    (error, response, data) => {
      if (error) {
        notify("❌ 连接失败", String(error).slice(0, 180));
        return $done();
      }
      const status = Number(response?.statusCode || response?.status || 0);
      const detail = errorMessage(data);
      if (status === 401 || status === 403) notify("❌ 鉴权失败", "HTTP " + status + "，请检查 API Key");
      else if (status === 404) notify("❌ 地址或模型不存在", "HTTP 404，检查 API 地址和模型 ID" + (detail ? "：" + detail : ""));
      else if (status === 429) notify("⚠️ 请求受限", "HTTP 429，额度不足或请求过快" + (detail ? "：" + detail : ""));
      else if (status < 200 || status >= 300) notify("❌ 模型不可用", "HTTP " + (status || "未知") + (detail ? "：" + detail : ""));
      else {
        try {
          const parsed = JSON.parse(data || "{}");
          const content = parsed?.choices?.[0]?.message?.content ?? parsed?.output_text ?? parsed?.output?.[0]?.content?.[0]?.text;
          if (typeof content !== "string" || !content.trim()) throw new Error("接口没有返回文本内容");
          notify("✅ 模型可用", model + " 已成功返回响应");
        } catch (parseError) {
          notify("⚠️ 接口可达但格式不兼容", String(parseError.message || parseError).slice(0, 180));
        }
      }
      $done();
    },
  );
} catch (error) {
  notify("❌ 配置错误", String(error.message || error).slice(0, 180));
  $done();
}
