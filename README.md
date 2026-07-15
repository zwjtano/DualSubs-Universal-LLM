<div align="center">

<img src="https://github.com/DualSubs/Universal/raw/main/src/assets/icon_rounded.png" width="120" alt="DualSubs LLM">

# DualSubs LLM

### 大模型驱动的双语字幕与歌词

基于 DualSubs 官方平台适配能力，为 Loon 增加 OpenAI 兼容的上下文字幕翻译。

[快速开始](#快速开始) · [选择插件](#选择插件) · [支持的模型服务](#支持的模型服务) · [排错](#排错)

</div>

---

## 选择插件

| 插件 | 用途 | 当前版本 | 安装 |
| --- | --- | --- | --- |
| 🔣 **Universal** | 为 Apple TV+、Disney+、Prime Video、Max 等 HLS 平台添加翻译字幕 | `1.0.4` | [在 Loon 中安装](https://raw.githubusercontent.com/zwjtano/DualSubs-Universal-LLM/main/Plugins/DualSubs.Universal.LLM.plugin) |
| 🇳 **Netflix** | Netflix 兼容模式双语翻译字幕 | `0.5.7.5` | [在 Loon 中安装](https://raw.githubusercontent.com/zwjtano/DualSubs-Universal-LLM/main/Plugins/DualSubs.Netflix.LLM.plugin) |

> Universal 不包含 Netflix 的专用规则，如需使用 Netflix，请另外安装对应插件。

## 快速开始

1. 点击上表中的安装链接，在 Loon 中添加插件。
2. 打开插件设置，将“服务商 API”选择为 `LLM`。
3. 填写 API 地址、模型 ID 和 API Key。
4. 保存设置，进入 Loon 的脚本页面。
5. 手动运行一次 `🧪 验证大模型`，看到“✅ 模型可用”。
6. 回到播放器，选择新增的“翻译字幕”或翻译歌词选项。

验证脚本会保存已验证的模型配置，供字幕响应脚本读取。更换 API 地址、模型或密钥后，需要重新运行一次验证。

## 核心能力

- **上下文翻译**：按批次把相邻字幕交给大模型，改善指代、语气和专有名词一致性。
- **严格行序校验**：使用带编号的 JSON 输入输出，检查漏行、乱序和数量不一致。
- **多格式支持**：保留上游 VTT、XML、JSON 和 Protobuf 处理链路。
- **双语合成**：将原文和译文重新写回字幕或歌词响应，保持原播放器体验。
- **模型验证**：区分连接、鉴权、模型、额度、限流和响应格式问题。
- **配置保护**：日志对 API Key 脱敏；密钥仅传给用户配置的模型服务。

## 支持的模型服务

支持提供 OpenAI 兼容 Chat Completions API 的服务，例如：

- OpenAI
- OpenRouter
- 硅基流动
- Ollama
- 其他兼容 `/v1/chat/completions` 的自建或第三方服务

API 地址既可以填写完整接口：

```text
https://example.com/v1/chat/completions
```

也可以填写以 `/v1` 结尾的基础地址，插件会自动补全路径。

## 工作原理

```text
播放器请求字幕
    ↓
DualSubs 识别平台与字幕格式
    ↓
提取并分批整理字幕文本
    ↓
调用用户配置的 LLM
    ↓
校验译文数量与顺序
    ↓
合并原文和译文并返回播放器
```

## 使用要求

- Loon 已启用脚本、复写与 MitM。
- 目标 App 和字幕域名已按插件要求完成 HTTPS 解密。
- 播放器中主动选择“翻译字幕”；安装插件不会自动替换当前字幕轨道。
- 第三方模型服务的额度、速率限制和内容政策由对应服务商决定。

## 排错

### 没有出现“翻译字幕”

检查插件是否启用、MitM 是否生效，以及是否安装了对应平台的专用插件。

### 验证模型失败

根据提示检查 API 地址、模型 ID、API Key、账户额度和附加请求头。

### 验证成功但没有译文

1. 确认已选择播放器中的“翻译字幕”。
2. 把日志等级改为 `INFO`。
3. 重新播放并查看日志是否出现 `vendor: LLM`。
4. 更新配置后再次运行 `🧪 验证大模型`。

## 开发与验证

重新生成 Universal LLM 插件：

```bash
node tools/build-dualsubs-llm.mjs
```

重新生成 Netflix LLM 插件：

```bash
node tools/build-platform-plugins.mjs
```

运行全部测试：

```bash
node --test tests/*.test.mjs
```

## 安全提示

- 不要提交或分享包含 API Key 的插件导出文件或日志。
- 建议日常使用 `WARN` 日志等级，排错时临时切换到 `INFO`。
- 使用第三方兼容接口前，请确认其数据处理和隐私政策。

## 上游与许可

字幕解析、播放器适配和双语合成能力来自 [DualSubs](https://dualsubs.github.io/index.html) 及其开源仓库：

- [DualSubs/Universal](https://github.com/DualSubs/Universal)
- [DualSubs/Netflix](https://github.com/DualSubs/Netflix)

本项目由 [zwjtano](https://github.com/zwjtano) 维护，并保留上游 Apache License 2.0 许可文件。
