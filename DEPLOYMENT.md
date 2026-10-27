# 构建、验证与部署

Coze 原项目通过 `.coze` 调用 `scripts/coze-build.sh` 和 `scripts/coze-start.sh`，复用本文验证的生产构建与 Next.js 启动命令。只读取平台已有的工作目录、部署端口及模型身份，不重新设置系统或用户环境变量。CI 直接验证这两个入口。

使用 Node.js 24 和 pnpm 9.0.0。不要使用全局 pnpm 11；可直接通过 `corepack pnpm` 执行以下命令。

```sh
corepack pnpm install --frozen-lockfile
corepack pnpm test:unit
corepack pnpm lint:build
corepack pnpm build
corepack pnpm audit --prod
corepack pnpm start --port 5100
```

另一个终端运行 `corepack pnpm exec playwright install chromium`，然后 `node tests/browser.cjs`。测试使用生产页面，拦截 AI 接口提供确定性 SSE 测试数据；覆盖成功、流提前结束、服务端错误、HTTP 失败、取消及保留图片重试。它不代表真实模型计费调用已经通过。

Windows 可复用已有 Edge：`node tests/browser.cjs playwright "C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe"`。

服务端必须部署到支持 Node.js 长连接/SSE 的平台。构建命令为 `corepack pnpm install --frozen-lockfile && corepack pnpm build`，启动命令为 `corepack pnpm start`。平台默认端口可由 Next.js 的 PORT 配置提供，或在启动参数中明确 `--port`。

保留 Coze SDK 服务端集成；离开原 Coze 项目后必须配置该个人项目可用的模型访问身份。Supabase 存储另需个人项目的数据库配置。所有密钥通过托管平台秘密配置提供，不提交到 Git。没有实际模型身份和线上验证前，不将页面构建成功等同于完整部署成功。
