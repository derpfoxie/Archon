<p align="right">
  <a href="README.md">English</a> | <b>简体中文</b>
</p>

<p align="center">
  <img src="assets/logo.png" alt="Archon" width="160" />
</p>

<h1 align="center">Archon</h1>

<p align="center">
  首个面向 AI 编码的开源 harness 构建器。让 AI 编码变得确定可控、可复现。
</p>

<p align="center">
  <a href="https://trendshift.io/repositories/13964" target="_blank"><img src="https://trendshift.io/api/badge/repositories/13964" alt="coleam00%2FArchon | Trendshift" style="width: 250px; height: 55px;" width="250" height="55"/></a>
</p>

<p align="center">
  <a href="LICENSE"><img src="https://img.shields.io/badge/License-MIT-blue.svg" alt="License: MIT" /></a>
  <a href="https://github.com/coleam00/Archon/actions/workflows/test.yml"><img src="https://github.com/coleam00/Archon/actions/workflows/test.yml/badge.svg" alt="CI" /></a>
  <a href="https://archon.diy"><img src="https://img.shields.io/badge/docs-archon.diy-blue" alt="Docs" /></a>
</p>

---

Archon 是一个面向 AI 编码 agent 的工作流引擎。把你的开发流程定义为 YAML 工作流——规划、实现、验证、代码评审、PR 创建——并在你的所有项目中可靠地运行。

正如 Dockerfile 之于基础设施、GitHub Actions 之于 CI/CD，Archon 之于 AI 编码工作流。可以理解为"软件开发版的 n8n"。

## 为什么需要 Archon？

当你让一个 AI agent "修一下这个 bug" 时，结果完全取决于模型当下的"状态"。它可能跳过规划环节，可能忘了跑测试，可能写出一份完全无视你 PR 模板的描述。每一次运行结果都不一样。

Archon 解决的就是这个问题。把你的开发流程编码成一个工作流：工作流定义阶段、验证关卡和产物，AI 在每一步填入"智能"部分，但整体结构由你掌控、确定可控。

- **可重复** — 同一个工作流，每次都按同样的顺序执行：规划、实现、验证、评审、提 PR。
- **隔离** — 每次工作流运行都跑在独立的 git worktree 里。可以并行跑 5 个修复任务，互不冲突。
- **发起即走** — 启动一个工作流后就可以做别的事，回来时已经有一份带评审意见的成品 PR 在等你。
- **可组合** — 把确定性节点（bash 脚本、测试、git 操作）与 AI 节点（规划、代码生成、评审）混合编排，AI 只在真正能产生价值的环节运行。
- **可移植** — 在 `.archon/workflows/` 中定义一次工作流并提交到仓库，CLI、Web UI、Slack、Telegram 或 GitHub 上的行为完全一致。

## 长这样

下面是一个 Archon 工作流的例子：先规划，再循环实现直到测试通过，然后等你审批，最后提 PR：

```yaml
# .archon/workflows/build-feature.yaml
nodes:
  - id: plan
    prompt: 'Explore the codebase and create an implementation plan'

  - id: implement
    depends_on: [plan]
    loop: # AI loop - iterate until done
      prompt: 'Read the plan. Implement the next task. Run validation.'
      until: ALL_TASKS_COMPLETE
      fresh_context: true # Fresh session each iteration

  - id: run-tests
    depends_on: [implement]
    bash: 'bun run validate' # Deterministic - no AI

  - id: review
    depends_on: [run-tests]
    prompt: 'Review all changes against the plan. Fix any issues.'

  - id: approve
    depends_on: [review]
    loop: # Human approval gate
      prompt: 'Present the changes for review. Address any feedback.'
      until: APPROVED
      interactive: true # Pauses and waits for human input

  - id: create-pr
    depends_on: [approve]
    prompt: 'Push changes and create a pull request'
```

告诉你的编码 agent 你想做什么，Archon 把剩下的事接管：

```
你：用 archon 在设置页加个深色模式

Agent：好的，我会用 archon-idea-to-pr 工作流来做。
       → 在 archon/task-dark-mode 分支上创建独立 worktree...
       → 规划中...
       → 实现中（任务 1/4）...
       → 实现中（任务 2/4）...
       → 测试失败——继续迭代...
       → 2 轮迭代后测试通过
       → 代码评审完成——0 个问题
       → PR 已就绪：https://github.com/you/project/pull/47
```

## 上一版本

在找最初基于 Python 的 Archon（任务管理 + RAG）？它完整保留在 [`archive/v1-task-management-rag`](https://github.com/coleam00/Archon/tree/archive/v1-task-management-rag) 分支中。

## 快速开始

> **大多数用户应从 [Full Setup](#full-setup-5-minutes) 开始** —— 它会引导你配置凭据、把 Archon skill 装进项目、并提供 Web 控制台。
>
> **已经在用 Claude Code、只想要 CLI？** 直接跳到 [Quick Install](#quick-install-30-seconds)。

### Full Setup（5 分钟）

克隆仓库并使用引导式安装向导。它会配置凭据、平台集成，并把 Archon skill 复制到你的目标项目中。

<details>
<summary><b>前置依赖</b> —— Bun、Claude Code 与 GitHub CLI</summary>

**Bun** —— [bun.sh](https://bun.sh)

```bash
# macOS/Linux
curl -fsSL https://bun.sh/install | bash

# Windows (PowerShell)
irm bun.sh/install.ps1 | iex
```

**GitHub CLI** —— [cli.github.com](https://cli.github.com/)

```bash
# macOS
brew install gh

# Windows (via winget)
winget install GitHub.cli

# Linux (Debian/Ubuntu)
sudo apt install gh
```

**Claude Code** —— [claude.ai/code](https://claude.ai/code)

```bash
# macOS/Linux/WSL
curl -fsSL https://claude.ai/install.sh | bash

# Windows (PowerShell)
irm https://claude.ai/install.ps1 | iex
```

</details>

```bash
git clone https://github.com/coleam00/Archon
cd Archon
bun install
claude
```

然后输入：**"Set up Archon"**

安装向导会引导你完成所有步骤：CLI 安装、认证、平台选择，并把 Archon skill 复制到目标仓库。

### Quick Install（30 秒）

已经搭好 Claude Code？直接安装独立 CLI 二进制，跳过向导。

**macOS / Linux**

```bash
curl -fsSL https://archon.diy/install | bash
```

**Windows (PowerShell)**

```powershell
irm https://archon.diy/install.ps1 | iex
```

**Homebrew**

```bash
brew install coleam00/archon/archon
```

> **编译版二进制需要 `CLAUDE_BIN_PATH`。** Quick install 提供的二进制
> 不内置 Claude Code。请单独安装后，把 Archon 指向它：
>
> ```bash
> # macOS / Linux / WSL
> curl -fsSL https://claude.ai/install.sh | bash
> export CLAUDE_BIN_PATH="$HOME/.local/bin/claude"
>
> # Windows (PowerShell)
> irm https://claude.ai/install.ps1 | iex
> $env:CLAUDE_BIN_PATH = "$env:USERPROFILE\.local\bin\claude.exe"
> ```
>
> 或者在 `~/.archon/config.yaml` 中设置 `assistants.claude.claudeBinaryPath`。
> Docker 镜像已预装 Claude Code。详见 [AI Assistants → Binary path configuration](https://archon.diy/docs/getting-started/ai-assistants/#binary-path-configuration-compiled-binaries-only)。

### 开始使用 Archon

完成上面任一种安装后，进入你的项目开始工作：

```bash
cd /path/to/your/project
claude
```

```
Use archon to fix issue #42
```

```
What archon workflows do I have? When would I use each one?
```

编码 agent 会替你处理工作流选择、分支命名和 worktree 隔离。项目第一次被使用时会自动注册。

> **重要：** 始终在你的目标仓库下运行 Claude Code，而不是在 Archon 仓库里运行。安装向导会把 Archon skill 复制到你的项目里，从那里就能正常使用。

## Web UI

Archon 自带一个 Web 控制台，用来与编码 agent 对话、运行工作流、监控活动。二进制安装：运行 `archon serve` 即可一键下载并启动 Web UI。源码安装：让你的编码 agent 在 Archon 仓库下启动前端，或自己在仓库根目录运行 `bun run dev`。

在聊天侧边栏的 "Project" 旁点击 **+** 注册一个项目——填入 GitHub URL 或本地路径，然后开始对话、调用工作流，并实时观察进度。

**核心页面：**

- **Chat** —— 对话界面，支持实时流式输出与工具调用可视化
- **Dashboard** —— 任务总控台，监控正在运行的工作流，可按项目、状态和日期过滤历史记录
- **Workflow Builder** —— 可视化拖拽编辑器，用于创建带循环节点的 DAG 工作流
- **Workflow Execution** —— 任意正在运行或已完成工作流的逐步进度视图

**统一监控入口：** 侧边栏会显示**所有平台**的会话——不仅仅是 Web。从 CLI 启动的工作流、Slack 或 Telegram 的消息、GitHub issue 上的互动——所有内容都会汇聚在这里。

完整文档见 [Web UI Guide](https://archon.diy/adapters/web/)。

## 你能自动化什么？

Archon 内置了一批针对常见开发任务的工作流：

| Workflow                         | 作用                                                               |
| -------------------------------- | ------------------------------------------------------------------ |
| `archon-assist`                  | 通用问答、调试、探索——配齐所有工具的 Claude Code agent             |
| `archon-fix-github-issue`        | 分类 issue → 调研/规划 → 实现 → 验证 → 提 PR → 智能评审 → 自我修复 |
| `archon-idea-to-pr`              | 功能想法 → 规划 → 实现 → 验证 → 提 PR → 5 路并行评审 → 自我修复    |
| `archon-plan-to-pr`              | 执行已有计划 → 实现 → 验证 → 提 PR → 评审 → 自我修复               |
| `archon-issue-review-full`       | 针对 GitHub issue 的完整修复 + 全套多 agent 评审流水线             |
| `archon-smart-pr-review`         | 评估 PR 复杂度 → 调度针对性的评审 agent → 汇总结论                 |
| `archon-comprehensive-pr-review` | 多 agent PR 评审（5 路并行评审者）并自动修复问题                   |
| `archon-create-issue`            | 分类问题 → 收集上下文 → 调研 → 创建 GitHub issue                   |
| `archon-validate-pr`             | 在主分支与功能分支上分别测试，进行严密的 PR 验证                   |
| `archon-resolve-conflicts`       | 检测合并冲突 → 分析两侧改动 → 解决 → 验证 → 提交                   |
| `archon-feature-development`     | 根据计划实现功能 → 验证 → 创建 PR                                  |
| `archon-architect`               | 架构梳理、复杂度精简、代码库健康度提升                             |
| `archon-refactor-safely`         | 带类型检查 hook 与行为校验的安全重构                               |
| `archon-ralph-dag`               | PRD 实现循环——按 story 迭代直到全部完成                            |
| `archon-remotion-generate`       | 用 AI 生成或修改 Remotion 视频组合                                 |
| `archon-test-loop-dag`           | 循环节点测试工作流——计数器迭代直至完成                             |
| `archon-piv-loop`                | 带人工评审的 Plan-Implement-Validate 引导循环                      |

Archon 内置 17 个默认工作流——执行 `archon workflow list`，或直接描述你想做什么，路由器会挑出合适的那一个。

**也可以自定义。** 默认工作流是不错的起点——从 `.archon/workflows/defaults/` 拷一份出来改即可。工作流是 `.archon/workflows/` 下的 YAML 文件，命令是 `.archon/commands/` 下的 markdown 文件。仓库里同名文件会覆盖内置默认。把它们提交到仓库——你的整个团队就跑在同一套流程上。

参见 [Authoring Workflows](https://archon.diy/guides/authoring-workflows/) 与 [Authoring Commands](https://archon.diy/guides/authoring-commands/)。

## 接入聊天平台

Web UI 与 CLI 开箱即用。如果需要远程访问，可以选配一个聊天平台：

| 平台                | 配置时间 | 指南                                                            |
| ------------------- | -------- | --------------------------------------------------------------- |
| **Telegram**        | 5 分钟   | [Telegram Guide](https://archon.diy/adapters/telegram/)         |
| **Slack**           | 15 分钟  | [Slack Guide](https://archon.diy/adapters/slack/)               |
| **GitHub Webhooks** | 15 分钟  | [GitHub Guide](https://archon.diy/adapters/github/)             |
| **Discord**         | 5 分钟   | [Discord Guide](https://archon.diy/adapters/community/discord/) |

## 架构

```
┌─────────────────────────────────────────────────────────┐
│  Platform Adapters (Web UI, CLI, Telegram, Slack,       │
│                    Discord, GitHub)                     │
└──────────────────────────┬──────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────┐
│                     Orchestrator                        │
│          (Message Routing & Context Management)         │
└─────────────┬───────────────────────────┬───────────────┘
              │                           │
      ┌───────┴────────┐          ┌───────┴────────┐
      │                │          │                │
      ▼                ▼          ▼                ▼
┌───────────┐  ┌────────────┐  ┌──────────────────────────┐
│  Command  │  │  Workflow  │  │    AI Assistant Clients  │
│  Handler  │  │  Executor  │  │   (Claude / Codex / Pi)  │
│  (Slash)  │  │  (YAML)    │  │                          │
└───────────┘  └────────────┘  └──────────────────────────┘
      │              │                      │
      └──────────────┴──────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────┐
│              SQLite / PostgreSQL (7 Tables)             │
│   Codebases • Conversations • Sessions • Workflow Runs  │
│    Isolation Environments • Messages • Workflow Events  │
└─────────────────────────────────────────────────────────┘
```

## 文档

完整文档见 **[archon.diy](https://archon.diy)**。

| 主题                                                                  | 说明                            |
| --------------------------------------------------------------------- | ------------------------------- |
| [Getting Started](https://archon.diy/getting-started/overview/)       | 安装指南（Web UI 或 CLI）       |
| [The Book of Archon](https://archon.diy/book/)                        | 10 章叙事式教程                 |
| [CLI Reference](https://archon.diy/reference/cli/)                    | 完整 CLI 参考                   |
| [Authoring Workflows](https://archon.diy/guides/authoring-workflows/) | 创建自定义 YAML 工作流          |
| [Authoring Commands](https://archon.diy/guides/authoring-commands/)   | 创建可复用的 AI 命令            |
| [Configuration](https://archon.diy/reference/configuration/)          | 全部配置项、环境变量、YAML 设置 |
| [AI Assistants](https://archon.diy/getting-started/ai-assistants/)    | Claude、Codex、Pi 的安装细节    |
| [Deployment](https://archon.diy/deployment/)                          | Docker、VPS、生产环境部署       |
| [Architecture](https://archon.diy/reference/architecture/)            | 系统设计与内部原理              |
| [Troubleshooting](https://archon.diy/reference/troubleshooting/)      | 常见问题与解决方案              |

## 遥测

Archon 会在每次工作流启动时发送一个匿名事件 —— `workflow_invoked` —— 让维护者能看到哪些工作流真正被使用，从而合理排定优先级。**永不收集任何 PII。**

**收集的内容：** 工作流名称、工作流描述（这两项都是你在 YAML 里自己写的）、触发它的平台（`cli`、`web`、`slack` 等）、Archon 版本号，以及一个保存在 `~/.archon/telemetry-id` 的随机安装 UUID。仅此而已。

\***\*不会**收集：\*\* 你的代码、提示词、消息、git remote、文件路径、用户名、token、AI 输出、工作流节点细节——一概不收。

**关闭遥测：** 在环境变量中设置以下任一项：

```bash
ARCHON_TELEMETRY_DISABLED=1
DO_NOT_TRACK=1        # de facto standard honored by Astro, Bun, Prisma, Nuxt, etc.
```

也可以通过设置 `POSTHOG_API_KEY` 与 `POSTHOG_HOST` 来自托管 PostHog 或使用其他项目。

## 贡献

欢迎贡献！可在公开 [issues](https://github.com/coleam00/Archon/issues) 中挑选感兴趣的事情来做。

提 PR 前请阅读 [CONTRIBUTING.md](CONTRIBUTING.zh-CN.md)。

## Star 趋势

[![Star History Chart](https://api.star-history.com/chart?repos=coleam00/Archon&type=date&legend=top-left)](https://www.star-history.com/?repos=coleam00%2FArchon&type=date&legend=top-left)

## 许可证

[MIT](LICENSE)
