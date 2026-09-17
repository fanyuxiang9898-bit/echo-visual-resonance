# Echo：次元共鸣 - AI 视觉互动网页

## 项目概览

极简主义风格的 AI 视觉互动网页，用户通过拍摄或上传图片，AI 会对图片进行意境理解，并以诗意文字和呼应图片进行回应。采用磨砂玻璃质感 Banner、单列卡片式布局、呼吸灯 Loading 动画等设计语言。

### 版本技术栈

- **Framework**: Next.js 16 (App Router)
- **Core**: React 19
- **Language**: TypeScript 5
- **UI 组件**: shadcn/ui (基于 Radix UI)
- **Styling**: Tailwind CSS 4
- **AI**: coze-coding-dev-sdk (LLM Vision + Text + Image Generation)
- **Database**: Supabase (echo_records 表)

## 目录结构

```
├── public/                     # 静态资源
├── scripts/                    # 构建与启动脚本
├── src/
│   ├── app/
│   │   ├── api/echo/route.ts   # AI 呼应接口 (SSE 流式, 感知-决策-生成-存储)
│   │   ├── globals.css         # 全局样式 (含玻璃拟态、呼吸灯动画)
│   │   ├── layout.tsx          # 根布局
│   │   └── page.tsx            # 主页面 (客户端组件)
│   ├── components/ui/          # Shadcn UI 组件库
│   ├── hooks/                  # 自定义 Hooks
│   ├── lib/utils.ts            # 通用工具函数
│   └── storage/database/       # Supabase 数据库
│       ├── supabase-client.ts  # Supabase 客户端
│       └── shared/schema.ts    # Drizzle 表结构定义
├── next.config.ts
├── package.json
└── tsconfig.json
```

## 核心功能 - Echo_Image_Flow 工作流

### Step 1: 感知 (Perception)
- Vision 模型 (`doubao-seed-1-6-vision-250815`) 分析图片
- 提取：人物姿态、情绪关键词、背景环境、整体意境描述

### Step 2: 决策 (Decision)
- 严肃/高颜照片 → `epic` 风格 (唯美史诗风，如赛博朋克、古风剑客)
- 搞怪/夸张表情 → `playful` 风格 (趣味魔性风，如美漫夸张、萌宠拟人)
- 生成：风格标签、英文生图 Prompt、共鸣文案

### Step 3: 生图 (Generation)
- Image Generation (`doubao-seedream-5-0-260128`) + Image-to-Image
- 将原图 URL 与决策风格描述一并传入，确保姿势/情绪呼应
- SSE 事件类型：`status` / `perception` / `decision` / `text` / `image` / `done` / `error`

### Step 4: 存储 (Storage)
- Supabase `echo_records` 表插入记录
- 字段：`user_input_url`、`generated_image_url`、`interaction_style`、`created_at`

### 前端 (`src/app/page.tsx`)
- **Banner**: 磨砂玻璃质感，莫兰迪色系微渐变，Noto Serif SC 优雅字体
- **双输入源**: 摄像头拍摄 (`getUserMedia`) + 文件上传
- **图片预览**: 本地 Base64 预览，可删除重选
- **Loading**: 呼吸灯 + 状态文字 (感知画面.../寻找共鸣.../生成呼应...)
- **响应展示**: 感知卡片(情绪/姿态标签) → 共鸣文案卡片(风格标签) → 呼应图片

## 构建与测试命令

```bash
pnpm ts-check      # TypeScript 类型检查
pnpm lint:build    # ESLint 静态检查
pnpm build         # 生产构建
pnpm dev           # 开发环境 (端口 5000, HMR)
```

## 数据库

### echo_records 表
| 字段 | 类型 | 说明 |
|------|------|------|
| id | varchar(36) PK | UUID |
| user_input_url | text NOT NULL | 原图 URL/Base64 |
| generated_image_url | text | 生成图 URL |
| interaction_style | varchar(50) NOT NULL | epic / playful |
| created_at | timestamptz | 创建时间 |

- RLS: 已启用，使用 service_role_key (无需 policy)

## 设计规范

- **背景**: #F8F9FA 极浅高级灰
- **文字**: #2D3436 深灰 / #636E72 中灰 / #B2BEC3 浅灰
- **主字体**: Noto Serif SC (标题) / PingFang SC (正文)
- **动画**: breathe 呼吸灯 2.4s / fadeInUp 入场 / typewriter-cursor 闪烁
- **卡片**: 圆角 2xl，极轻阴影 `0_2px_16px_rgba(0,0,0,0.04)`
- **风格色**: epic=灰调(#636E72) / playful=暖黄(#FDE68A)

## 开发规范

- 默认 TypeScript `strict` 模式
- 禁止隐式 `any`，所有函数参数和返回值须有明确类型
- `coze-coding-dev-sdk` 只能在后端代码使用，禁止暴露到客户端
- 数据库字段名使用 snake_case
- 仅使用 pnpm 管理依赖
