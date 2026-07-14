# DualSubs Universal LLM

这是 [DualSubs Universal](https://github.com/DualSubs/Universal) 的大模型字幕翻译适配版，用于 Loon。

在保留原有字幕解析、平台识别和双语合成能力的基础上，新增 OpenAI 兼容的 Chat Completions 翻译接口。

## 安装

在 Loon 中添加以下插件地址：

```text
https://raw.githubusercontent.com/zwjtano/DualSubs-Universal-LLM/main/Plugins/DualSubs.Universal.LLM.plugin
```

安装后打开插件设置：

1. 将“服务商 API”选择为 `LLM`。
2. 填写 API 地址，例如 `https://api.openai.com/v1/chat/completions`。
3. 填写服务商支持的模型 ID。
4. 填写 API Key。

API 地址可以是完整的 `/v1/chat/completions` 地址，也可以是以 `/v1` 结尾的基础地址。

## 功能

- 支持 OpenAI、OpenRouter、硅基流动、Ollama，以及其他 OpenAI 兼容接口
- 可配置 API 地址、模型、API Key、温度、超时和附加请求头
- 按 40 条字幕分批翻译
- 使用带编号的 JSON 输入输出校验，防止漏行和乱序
- 保留 VTT、XML、JSON、YouTube/Spotify Protobuf 等上游处理链路
- API Key 只传给本仓库的翻译脚本，并在设置调试日志中脱敏
- 仍可选择 Google 或 Microsoft 翻译

## 安全提示

- 不要提交或分享填写了 API Key 的插件导出文件。
- 建议保持日志等级为默认的 `WARN`。
- 使用第三方兼容接口时，请自行确认其数据处理和隐私政策。

## 更新上游版本

构建工具会下载最新的 DualSubs Universal 插件及对应翻译脚本，再应用 LLM 补丁：

```bash
node tools/build-dualsubs-llm.mjs
```

生成文件：

- `Plugins/DualSubs.Universal.LLM.plugin`
- `Scripts/DualSubs/Translate.response.bundle.js`

## 验证

```bash
node --check tools/build-dualsubs-llm.mjs
node --check Scripts/DualSubs/Translate.response.bundle.js
```

## 致谢与许可

字幕解析和平台适配逻辑来自 [DualSubs Universal](https://github.com/DualSubs/Universal)。本仓库保留上游 Apache License 2.0 许可文件。
