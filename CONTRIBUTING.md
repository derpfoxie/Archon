<p align="right">
  <a href="CONTRIBUTING.en.md">English</a> | <b>简体中文</b>
</p>

# 贡献指南

感谢你有兴趣为 Archon 做贡献！

## 快速上手

1. Fork 本仓库
2. 克隆你的 fork
3. 安装依赖：`bun install`
4. 把 `.env.example` 复制为 `.env` 并按需配置
5. 启动开发：`bun run dev`

## 开发流程

### 代码质量

提交 PR 之前，请确保：

```bash
bun run check:bundled  # Bundled defaults are up to date (see note below)
bun run type-check     # TypeScript types
bun run lint           # ESLint
bun run format         # Prettier
bun run test           # All tests (per-package isolation)

# Or run the full validation suite:
bun run validate
```

**关于内置默认（bundled defaults）：** 如果你新增、删除或修改了
`.archon/commands/defaults/` 或 `.archon/workflows/defaults/` 下的文件，请在提交前运行
`bun run generate:bundled` 来刷新内嵌的 bundle。

**重要：** 使用 `bun run test`（**不要**在仓库根目录执行 `bun test`），以避免跨包的 mock 污染。

### 提交信息

- 使用现在时（"Add feature" 而不是 "Added feature"）
- 第一行不超过 72 字符
- 涉及 issue 时进行引用

### Pull Request

1. 从 `dev` 分支创建特性分支
2. 进行修改
3. 确保所有检查通过
4. 使用模板 [`.github/PULL_REQUEST_TEMPLATE.md`](./.github/PULL_REQUEST_TEMPLATE.md) 提交 PR。通过 GitHub Web UI 创建 PR 时模板会自动填入；如果你用 `gh pr create`，请把模板内容复制到 body 里——留空或填一半会拖慢评审。
5. 在描述里用 `Closes #<number>`（或 `Fixes #<number>` / `Resolves #<number>`）关联你修复的 issue，合并时会自动关闭。

## 代码风格

- 强制启用 TypeScript strict 模式
- 所有函数必须显式声明返回类型
- 不接受没有理由的 `any` 类型
- 遵循代码库中已有的模式

## 架构

详见 [CLAUDE.md](./CLAUDE.md)。

## 向 Marketplace 贡献工作流

把你的 Archon 工作流分享给社区——只需在 marketplace 注册表 [`packages/docs-web/src/data/marketplace.ts`](packages/docs-web/src/data/marketplace.ts) 里加一项即可。

### 提交方式

1. 把工作流放到一个**公开的 GitHub 仓库**——既可以是单个 YAML 文件，也可以是一个目录
2. 钉到一个具体的 commit SHA（保证 merge 后不可变）
3. Fork Archon，在 `packages/docs-web/src/data/marketplace.ts` 加一项
4. 提 PR——自动 lint 会在评审前校验你这一项

### 提交格式

**单文件工作流**——一个独立的 `.yaml` 文件：

```
sourceUrl: "https://github.com/you/repo/blob/main/my-workflow.yaml"
```

**目录工作流**——包含工作流 YAML 以及配套的 commands / scripts / skills：

```
sourceUrl: "https://github.com/you/repo/tree/main/my-workflow/"
```

约定目录结构：

```
my-workflow/
├── my-workflow.yaml   # 主工作流（文件名必须等于 slug，或者目录里只有这一个 .yaml）
├── commands/          # → 安装到 .archon/commands/
│   └── helper.md
├── scripts/           # → 安装到 .archon/scripts/
│   └── analyze.ts
└── skills/            # → 安装到 .archon/skills/
    └── my-skill/
```

如果你的工作流引用了用户本地需要的自定义 commands / scripts / 其他资源，请用目录形式。

### 条目要求

| 字段 | 要求 |
|------|------|
| `slug` | 全小写，仅允许连字符（如 `my-review-workflow`）——必须唯一 |
| `name` | 人类可读的展示名 |
| `author` | 你的 GitHub 用户名 |
| `description` | 1–3 句话：做什么、什么时候用 |
| `sourceUrl` | GitHub blob URL（单文件）或 tree URL（目录） |
| `sha` | 完整 40 字符 commit SHA，把版本钉死 |
| `tags` | 至少包含一个：`development`、`review`、`automation`、`planning` |
| `archonVersionCompat` | Semver 区间（如 `>=0.3.0`） |

### 自我声明

提交即代表你承诺：

- [ ] 该工作流不会窃取数据、凭据或机密
- [ ] 该工作流不会在未经用户确认的情况下执行破坏性操作
- [ ] 你有权公开分享该工作流
- [ ] 所钉的 SHA 指向一个已审查、稳定的版本

## 有问题？

请提一个 [issue](https://github.com/coleam00/Archon/issues) 或发起 [discussion](https://github.com/coleam00/Archon/discussions)。
