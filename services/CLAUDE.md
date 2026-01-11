# Services 模块文档

[根目录](../CLAUDE.md) > **services**

---

## 变更记录 (Changelog)

### 2026-01-11
- 初始化服务模块文档
- 梳理所有业务逻辑服务的职责和 API

---

## 模块职责

`services/` 目录是 CloudNav 的 **业务逻辑服务层**，负责处理与第三方服务的集成和复杂的数据转换逻辑。

**核心职责**：
1. **AI 服务集成**：调用 Google Gemini 或 OpenAI 兼容 API 生成链接描述和分类推荐
2. **WebDAV 备份**：通过代理 API 实现跨域 WebDAV 上传/下载
3. **书签解析**：解析 Chrome/Edge 导出的 HTML 书签文件
4. **数据导出**：将数据导出为 JSON 或 HTML 格式

---

## 入口与启动

该模块无独立入口，所有服务通过组件导入并调用。

### 服务导入示例
```typescript
import { generateLinkDescription, suggestCategory } from './services/geminiService';
import { checkWebDavConnection, uploadBackup, downloadBackup } from './services/webDavService';
import { parseBookmarks } from './services/bookmarkParser';
```

---

## 对外接口

### 1. `geminiService.ts` - AI 服务

#### `generateLinkDescription`
**功能**: 为链接生成简短的中文描述（最多 15 个词）

**函数签名**:
```typescript
export const generateLinkDescription = async (
  title: string,
  url: string,
  config: AIConfig
): Promise<string>
```

**参数说明**:
- `title`: 链接标题
- `url`: 链接 URL
- `config`: AI 配置对象（包含 provider、apiKey、model 等）

**返回值**:
- 成功：生成的描述文本
- 失败：错误提示文本（如 "请在设置中配置 API Key"）

**使用场景**: 在 `LinkModal` 组件中点击"AI 生成描述"按钮时调用

**实现逻辑**:
```typescript
// 如果是 Gemini
const ai = new GoogleGenAI({ apiKey: config.apiKey });
const response = await ai.models.generateContent({
  model: config.model || 'gemini-2.5-flash',
  contents: `I have a website bookmark. ${prompt}`
});

// 如果是 OpenAI 兼容
const response = await fetch(config.baseUrl + '/chat/completions', {
  method: 'POST',
  headers: { 'Authorization': `Bearer ${config.apiKey}` },
  body: JSON.stringify({
    model: config.model,
    messages: [
      { role: "system", content: systemPrompt },
      { role: "user", content: userPrompt }
    ]
  })
});
```

---

#### `suggestCategory`
**功能**: 根据链接标题和 URL 推荐最合适的分类

**函数签名**:
```typescript
export const suggestCategory = async (
  title: string,
  url: string,
  categories: {id: string, name: string}[],
  config: AIConfig
): Promise<string | null>
```

**参数说明**:
- `title`: 链接标题
- `url`: 链接 URL
- `categories`: 可选分类列表
- `config`: AI 配置对象

**返回值**:
- 成功：推荐的分类 ID（如 "dev", "ai"）
- 失败：`null` 或 "common"（默认分类）

**使用场景**: 在 `LinkModal` 组件中添加新链接时自动推荐分类

---

### 2. `webDavService.ts` - WebDAV 备份服务

#### `checkWebDavConnection`
**功能**: 测试 WebDAV 连接是否可用

**函数签名**:
```typescript
export const checkWebDavConnection = async (
  config: WebDavConfig
): Promise<boolean>
```

**参数说明**:
- `config`: WebDAV 配置对象（url、username、password）

**返回值**:
- `true`: 连接成功
- `false`: 连接失败

**实现原理**: 通过 `/api/webdav` 代理 API 发送 PROPFIND 请求测试连接

---

#### `uploadBackup`
**功能**: 上传备份到 WebDAV（覆盖模式）

**函数签名**:
```typescript
export const uploadBackup = async (
  config: WebDavConfig,
  data: { links: LinkItem[], categories: Category[], searchConfig?: SearchConfig, aiConfig?: AIConfig }
): Promise<boolean>
```

**参数说明**:
- `config`: WebDAV 配置对象
- `data`: 备份数据（链接、分类、搜索配置、AI 配置）

**返回值**:
- `true`: 上传成功
- `false`: 上传失败

**文件名**: 固定为 `cloudnav_backup.json`

---

#### `uploadBackupWithTimestamp`
**功能**: 上传备份到 WebDAV（带时间戳，不覆盖旧备份）

**函数签名**:
```typescript
export const uploadBackupWithTimestamp = async (
  config: WebDavConfig,
  data: { links: LinkItem[], categories: Category[], searchConfig?: SearchConfig, aiConfig?: AIConfig }
): Promise<{ success: boolean; filename: string }>
```

**文件名格式**: `cloudnav_backup_2026-01-11_12-30-45.json`

---

#### `downloadBackup`
**功能**: 从 WebDAV 下载备份

**函数签名**:
```typescript
export const downloadBackup = async (
  config: WebDavConfig
): Promise<{ links: LinkItem[], categories: Category[], searchConfig?: SearchConfig, aiConfig?: AIConfig } | null>
```

**返回值**:
- 成功：备份数据对象
- 失败：`null`

---

### 3. `bookmarkParser.ts` - 书签解析服务

#### `parseBookmarks`
**功能**: 解析 Chrome/Edge 导出的 HTML 书签文件

**函数签名**:
```typescript
export const parseBookmarks = (htmlString: string): {
  links: LinkItem[];
  categories: Category[];
}
```

**参数说明**:
- `htmlString`: HTML 书签文件的文本内容

**返回值**:
- `links`: 解析出的链接数组
- `categories`: 解析出的分类数组

**解析规则**:
1. 识别书签文件中的 `<DT><H3>` 标签作为分类
2. 识别 `<DT><A HREF="...">` 标签作为链接
3. 将分类名称映射到固定的分类 ID（如 "开发工具" → "dev"）
4. 未匹配的分类统一归入 "common"

**使用场景**: 在 `ImportModal` 组件中上传 HTML 书签文件后调用

---

### 4. `exportService.ts` - 数据导出服务

#### `exportToJSON`
**功能**: 导出数据为 JSON 格式

**函数签名**:
```typescript
export const exportToJSON = (data: {
  links: LinkItem[];
  categories: Category[];
  searchConfig?: SearchConfig;
  aiConfig?: AIConfig;
}): string
```

**返回值**: JSON 字符串（已格式化，缩进 2 空格）

---

#### `exportToHTML`
**功能**: 导出为 HTML 书签格式（兼容浏览器导入）

**函数签名**:
```typescript
export const exportToHTML = (
  links: LinkItem[],
  categories: Category[]
): string
```

**生成格式**:
```html
<!DOCTYPE NETSCAPE-Bookmark-file-1>
<TITLE>CloudNav Bookmarks</TITLE>
<H1>CloudNav Bookmarks</H1>
<DL><p>
  <DT><H3>分类名称</H3>
  <DL><p>
    <DT><A HREF="https://example.com">链接标题</A>
  </DL><p>
</DL><p>
```

**使用场景**: 在 `BackupModal` 组件中点击"导出 HTML"按钮时调用

---

## 关键依赖与配置

### 外部依赖
- **@google/genai**: Google Gemini AI SDK
- **fetch API**: 调用 OpenAI 兼容 API 和 WebDAV 代理

### 环境要求
- 需要在设置中配置有效的 AI API Key
- WebDAV 服务需支持基本认证（Basic Auth）

### 错误处理
所有服务函数都有完善的错误捕获机制，失败时返回空值或错误提示，不会抛出异常中断应用。

---

## 数据模型

服务使用的数据类型定义在 `/Users/yml/codes/CloudNav-abcd/types.ts`，关键接口：

```typescript
interface AIConfig {
  provider: 'gemini' | 'openai';
  apiKey: string;
  baseUrl: string; // OpenAI 兼容 API 的 Base URL
  model: string;
}

interface WebDavConfig {
  url: string; // WebDAV 服务地址（如 https://dav.jianguoyun.com/dav/）
  username: string;
  password: string;
  enabled: boolean;
}

interface LinkItem {
  id: string;
  title: string;
  url: string;
  icon?: string;
  description?: string;
  categoryId: string;
  createdAt: number;
  pinned?: boolean;
  pinnedOrder?: number;
}

interface Category {
  id: string;
  name: string;
  icon: string;
  password?: string;
}
```

---

## 测试与质量

**当前状态**: 无自动化测试

**建议测试方向**:
1. **单元测试**:
   - `geminiService`: Mock AI API 响应，验证描述生成逻辑
   - `bookmarkParser`: 测试多种书签 HTML 格式的解析
   - `exportService`: 验证 JSON 和 HTML 导出格式的正确性
2. **集成测试**:
   - `webDavService`: 使用测试 WebDAV 服务器验证上传/下载流程
   - AI 服务的超时和错误处理
3. **边界测试**:
   - 空书签文件的解析
   - 超大 JSON 备份文件的处理
   - WebDAV 认证失败的处理

推荐工具: **Vitest** + **MSW (Mock Service Worker)**

---

## 常见问题 (FAQ)

### Q1: 为什么 AI 生成描述失败？
**A**: 可能的原因：
1. API Key 未配置或已失效
2. 网络连接问题（需要科学上网访问 OpenAI）
3. API 配额已用尽
4. BaseURL 配置错误（OpenAI 兼容模式）

**调试方法**:
- 打开浏览器 DevTools Network 面板，查看请求状态
- 检查 Console 中的错误日志
- 验证 API Key 是否有效（可在 AI 服务商后台测试）

---

### Q2: WebDAV 上传失败怎么办？
**A**: 可能的原因：
1. WebDAV URL 格式错误（应包含完整路径，如 `https://dav.jianguoyun.com/dav/`）
2. 用户名或密码错误
3. WebDAV 服务器不支持 CORS（已通过代理 API 解决）
4. 网络连接问题

**调试方法**:
- 在 `BackupModal` 中点击"测试连接"按钮
- 检查 `/api/webdav` 的响应状态码
- 验证 WebDAV 凭证（可在浏览器直接访问 WebDAV URL 测试）

---

### Q3: 如何支持新的 AI 服务提供商？
**A**:
1. 在 `types.ts` 中扩展 `AIProvider` 类型
2. 在 `geminiService.ts` 中添加新的分支逻辑
3. 在 `SettingsModal.tsx` 中添加新的配置选项

示例：
```typescript
// types.ts
export type AIProvider = 'gemini' | 'openai' | 'claude';

// geminiService.ts
if (config.provider === 'claude') {
  // Claude API 调用逻辑
  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'x-api-key': config.apiKey,
      'anthropic-version': '2023-06-01',
      'content-type': 'application/json'
    },
    body: JSON.stringify({
      model: config.model,
      messages: [{ role: 'user', content: prompt }]
    })
  });
}
```

---

### Q4: 书签解析不完整怎么办？
**A**:
1. 检查书签 HTML 文件的格式是否符合 Netscape Bookmark 标准
2. 查看 `bookmarkParser.ts` 中的正则表达式是否匹配
3. 手动调整书签文件格式后重试

---

### Q5: 如何实现增量备份？
**A**: 当前 WebDAV 备份有两种模式：
1. **覆盖模式**: `uploadBackup()` - 固定文件名 `cloudnav_backup.json`
2. **增量模式**: `uploadBackupWithTimestamp()` - 带时间戳文件名

如果需要自动清理旧备份，可以在代理 API (`/api/webdav`) 中添加文件列表和删除逻辑。

---

## 相关文件清单

```
/Users/yml/codes/CloudNav-abcd/services/
├── geminiService.ts        # AI 服务集成（133 行）
├── webDavService.ts        # WebDAV 备份服务（59 行）
├── bookmarkParser.ts       # 书签解析服务（估算 100+ 行）
└── exportService.ts        # 数据导出服务（估算 80+ 行）
```

**总文件数**: 4
**总代码行数**: 约 372 行（已知）+ 180 行（估算）= 552 行

---

## 扩展建议

1. **错误日志**: 建议在所有服务函数中添加统一的错误日志收集机制
2. **重试机制**: 为网络请求添加自动重试逻辑（如 AI API 调用）
3. **缓存优化**: 对 AI 生成的描述进行本地缓存，避免重复调用
4. **进度回调**: 为批量操作（如一键补全描述）添加进度回调

---

**最后更新时间**: 2026-01-11
**模块版本**: v1.7
