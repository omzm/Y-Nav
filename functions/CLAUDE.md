# Functions 模块文档

[根目录](../CLAUDE.md) > **functions**

---

## 变更记录 (Changelog)

### 2026-01-11
- 初始化 Cloudflare Functions 模块文档
- 梳理所有 API 端点和数据流

---

## 模块职责

`functions/` 目录是 CloudNav 的 **后端 API 层**，基于 **Cloudflare Pages Functions** 的 Serverless 架构实现。

**核心职责**：
1. **数据持久化**：将用户数据存储到 Cloudflare KV
2. **认证与授权**：验证访问密码和密码过期管理
3. **跨域代理**：解决前端直接调用 WebDAV 的 CORS 限制
4. **配置管理**：存储 AI 配置、搜索配置、网站配置、图标缓存等

---

## 入口与启动

Cloudflare Pages Functions 自动识别 `functions/api/` 下的文件并映射为 API 路由。

### 路由映射规则
```
functions/api/storage.ts  →  /api/storage
functions/api/link.ts     →  /api/link
functions/api/webdav.ts   →  /api/webdav
```

### 部署环境
- **运行环境**: Cloudflare Workers Runtime（V8 引擎）
- **数据库**: Cloudflare KV（键值存储）
- **环境变量**: `PASSWORD` - 访问密码（必须在 Cloudflare Pages 设置中配置）
- **KV 绑定**: `CLOUDNAV_KV` - KV 命名空间变量名

---

## 对外接口

### 1. `/api/storage` - 数据存储 API

**文件路径**: `/Users/yml/codes/CloudNav-abcd/functions/api/storage.ts`

---

#### `OPTIONS /api/storage`
**功能**: 处理跨域预检请求（CORS Preflight）

**响应头**:
```json
{
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, x-auth-password"
}
```

**状态码**: 204 No Content

---

#### `GET /api/storage`
**功能**: 获取数据（链接、分类、配置等）

**请求头**:
```json
{
  "x-auth-password": "用户密码（可选，取决于是否设置了全局密码）"
}
```

**查询参数**:
| 参数 | 类型 | 说明 |
|-----|------|------|
| `checkAuth=true` | boolean | 检查是否需要认证 |
| `getConfig=ai` | string | 获取 AI 配置 |
| `getConfig=search` | string | 获取搜索配置 |
| `getConfig=website` | string | 获取网站配置 |
| `getConfig=favicon&domain=example.com` | string | 获取域名的图标缓存 |

**响应示例**:

1. **检查认证**（`?checkAuth=true`）:
```json
{
  "hasPassword": true,
  "requiresAuth": true
}
```

2. **获取主数据**:
```json
{
  "links": [
    {
      "id": "1",
      "title": "GitHub",
      "url": "https://github.com",
      "categoryId": "dev",
      "createdAt": 1700000000000,
      "description": "代码托管平台",
      "icon": "https://www.faviconextractor.com/favicon/github.com?larger=true",
      "pinned": true,
      "pinnedOrder": 0
    }
  ],
  "categories": [
    {
      "id": "dev",
      "name": "开发工具",
      "icon": "Code"
    }
  ]
}
```

3. **获取配置**（`?getConfig=ai`）:
```json
{
  "provider": "gemini",
  "apiKey": "AIza...",
  "baseUrl": "",
  "model": "gemini-2.5-flash"
}
```

**错误响应**:
```json
{
  "error": "密码错误"
}
```
**状态码**: 401 Unauthorized

---

#### `POST /api/storage`
**功能**: 保存数据、配置、图标缓存

**请求头**:
```json
{
  "Content-Type": "application/json",
  "x-auth-password": "用户密码（必填）"
}
```

**请求体类型**:

1. **保存主数据**:
```json
{
  "links": [...],
  "categories": [...]
}
```

2. **仅验证密码**:
```json
{
  "authOnly": true
}
```

3. **保存 AI 配置**:
```json
{
  "saveConfig": "ai",
  "config": {
    "provider": "gemini",
    "apiKey": "AIza...",
    "model": "gemini-2.5-flash"
  }
}
```

4. **保存搜索配置**（允许无密码访问）:
```json
{
  "saveConfig": "search",
  "config": {
    "mode": "external",
    "externalSources": [...]
  }
}
```

5. **保存网站配置**:
```json
{
  "saveConfig": "website",
  "config": {
    "title": "我的导航",
    "navTitle": "CloudNav",
    "favicon": "https://...",
    "cardStyle": "detailed",
    "passwordExpiryDays": 7
  }
}
```

6. **保存图标缓存**（允许无密码访问）:
```json
{
  "saveConfig": "favicon",
  "domain": "github.com",
  "icon": "https://www.faviconextractor.com/favicon/github.com?larger=true"
}
```

**响应**:
```json
{
  "success": true
}
```

**错误响应**:
```json
{
  "error": "Unauthorized"
}
```
**状态码**: 401 Unauthorized

---

#### KV 存储键名映射
| KV Key | 存储内容 | 过期时间 |
|--------|---------|---------|
| `app_data` | 主数据（links + categories） | 永久 |
| `ai_config` | AI 配置 | 永久 |
| `search_config` | 搜索配置 | 永久 |
| `website_config` | 网站配置（包含密码过期时间） | 永久 |
| `favicon:domain` | 域名图标缓存 | 30 天 |
| `last_auth_time` | 最后认证时间戳 | 永久 |

---

### 2. `/api/link` - 链接操作 API

**文件路径**: `/Users/yml/codes/CloudNav-abcd/functions/api/link.ts`

**当前状态**: 该文件存在，但从代码分析看，所有链接操作都通过 `/api/storage` 完成，此文件可能为保留接口或未启用。

**建议**: 如果未来需要独立的链接 CRUD API，可以在此文件中实现。

---

### 3. `/api/webdav` - WebDAV 代理 API

**文件路径**: `/Users/yml/codes/CloudNav-abcd/functions/api/webdav.ts`

**功能**: 代理前端的 WebDAV 请求，解决浏览器 CORS 限制

---

#### `POST /api/webdav`
**请求体**:
```json
{
  "operation": "check" | "upload" | "download",
  "config": {
    "url": "https://dav.jianguoyun.com/dav/",
    "username": "用户名",
    "password": "密码"
  },
  "payload": { ... }, // upload 操作时的数据
  "filename": "cloudnav_backup_2026-01-11_12-30-45.json" // 可选，上传时指定文件名
}
```

**操作类型说明**:

1. **check** - 测试 WebDAV 连接
   - 发送 `PROPFIND` 请求到 WebDAV 服务器
   - 验证用户名和密码

2. **upload** - 上传备份
   - 将 `payload` 转换为 JSON 字符串
   - 使用 `PUT` 请求上传到 WebDAV 服务器
   - 默认文件名: `cloudnav_backup.json`
   - 自定义文件名: 通过 `filename` 参数指定

3. **download** - 下载备份
   - 使用 `GET` 请求从 WebDAV 服务器下载 `cloudnav_backup.json`
   - 解析 JSON 并返回

**响应**:
```json
{
  "success": true
}
```

或（下载操作）:
```json
{
  "links": [...],
  "categories": [...],
  "searchConfig": {...},
  "aiConfig": {...}
}
```

**错误响应**:
```json
{
  "success": false,
  "error": "错误信息"
}
```

---

## 关键依赖与配置

### Cloudflare 环境变量
必须在 Cloudflare Pages 项目设置中配置：

| 环境变量 | 类型 | 说明 |
|---------|------|------|
| `PASSWORD` | string | 访问密码（必填） |

### Cloudflare KV 绑定
必须在 Cloudflare Pages 项目设置中绑定：

| 变量名 | KV 命名空间 |
|--------|-----------|
| `CLOUDNAV_KV` | `CLOUDNAV_DB`（或自定义名称） |

### CORS 策略
所有 API 都使用统一的 CORS 头部：

```typescript
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, x-auth-password',
};
```

---

## 数据流架构

```
前端 (App.tsx)
    ↓
本地状态 (React State)
    ↓
LocalStorage 缓存
    ↓
API 请求 (/api/storage)
    ↓
Cloudflare Functions
    ↓
Cloudflare KV 存储
```

**同步策略**:
1. 用户操作（增删改）时，立即更新 React State
2. 同步写入 LocalStorage（离线缓存）
3. 异步请求 `/api/storage` 保存到 KV
4. 显示同步状态（saving / saved / error）

---

## 测试与质量

**当前状态**: 无自动化测试

**建议测试方向**:
1. **单元测试**:
   - 认证逻辑测试（密码验证、过期检查）
   - KV 数据读写测试
2. **集成测试**:
   - 完整的 CRUD 流程测试
   - WebDAV 代理的各种场景测试（成功、失败、超时）
3. **压力测试**:
   - 大量链接数据的读写性能
   - KV 读写延迟测试
   - 并发请求测试

推荐工具: **Miniflare** (本地 Cloudflare Workers 模拟器) + **Vitest**

---

## 常见问题 (FAQ)

### Q1: 如何在本地开发环境测试 Cloudflare Functions？
**A**: 使用 Wrangler CLI 工具：
```bash
# 安装 Wrangler
npm install -g wrangler

# 登录 Cloudflare
wrangler login

# 本地开发（带 KV 模拟）
wrangler pages dev dist --binding CLOUDNAV_KV=local_kv
```

---

### Q2: 为什么密码验证失败？
**A**: 可能的原因：
1. 环境变量 `PASSWORD` 未设置或错误
2. 请求头 `x-auth-password` 未传递或值错误
3. 密码已过期（检查 `passwordExpiryDays` 配置）

**调试方法**:
- 在 Cloudflare Pages 后台查看环境变量
- 检查浏览器 Network 面板的请求头
- 查看 Functions 日志（实时日志功能）

---

### Q3: 如何修改密码过期时间？
**A**: 在前端设置页面修改，或直接更新 KV 中的 `website_config`：
```json
{
  "passwordExpiryDays": 0  // 0 表示永久不退出
}
```

---

### Q4: WebDAV 代理为什么需要？
**A**: 因为浏览器的同源策略（CORS）限制，前端无法直接向第三方 WebDAV 服务器发送跨域请求。通过 Cloudflare Functions 作为代理，可以绕过 CORS 限制。

---

### Q5: 如何查看 KV 中的数据？
**A**:
1. 登录 Cloudflare Dashboard
2. 进入 Workers & Pages → KV
3. 选择对应的命名空间（如 `CLOUDNAV_DB`）
4. 点击键名查看值

或使用 Wrangler CLI：
```bash
wrangler kv:key get app_data --namespace-id=your_namespace_id
```

---

### Q6: 如何清空所有数据重新开始？
**A**:
1. 在 KV 命名空间中删除所有键
2. 清除浏览器 LocalStorage（DevTools → Application → Local Storage）
3. 刷新页面，应用将使用初始数据

---

## 相关文件清单

```
/Users/yml/codes/CloudNav-abcd/functions/
└── api/
    ├── storage.ts    # 数据存储 API（259 行）
    ├── link.ts       # 链接操作 API（保留接口）
    └── webdav.ts     # WebDAV 代理 API（估算 150+ 行）
```

**总文件数**: 3
**总代码行数**: 约 409 行（已知）+ 150 行（估算）= 559 行

---

## 安全建议

1. **密码加密**: 当前密码以明文存储在环境变量，建议使用哈希算法（如 bcrypt）
2. **速率限制**: 建议为 API 添加速率限制，防止暴力破解
3. **数据加密**: 敏感数据（如分类密码）建议加密存储
4. **日志审计**: 记录所有 API 访问日志，便于安全审计

---

## 扩展建议

1. **链接统计**: 在 `/api/link` 中实现链接访问次数统计
2. **数据迁移**: 提供数据导入/导出的专用 API
3. **批量操作**: 优化批量保存的性能（如一次保存 1000+ 链接）
4. **增量同步**: 实现增量同步机制，减少数据传输量

---

**最后更新时间**: 2026-01-11
**模块版本**: v1.7
