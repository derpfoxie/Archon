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

## 有问题？

请提一个 [issue](https://github.com/coleam00/Archon/issues) 或发起 [discussion](https://github.com/coleam00/Archon/discussions)。
