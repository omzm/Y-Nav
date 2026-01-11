# Components 模块文档

[根目录](../CLAUDE.md) > **components**

---

## 变更记录 (Changelog)

### 2026-01-11
- 初始化组件模块文档
- 梳理所有 React 组件职责和依赖关系

---

## 模块职责

`components/` 目录是 CloudNav 的 **React UI 组件库**，负责所有用户界面的渲染和交互逻辑。

**核心职责**：
1. 提供模态框组件（Modal）：认证、链接编辑、分类管理、备份恢复、设置等
2. 提供功能性组件：右键菜单、二维码显示、图标选择器
3. 提供通用 UI 组件：Icon 图标包装器

---

## 入口与启动

该模块无独立入口，所有组件通过 `App.tsx` 导入并在主应用中渲染。

### 组件导入示例（来自 App.tsx）
```tsx
import LinkModal from './components/LinkModal';
import AuthModal from './components/AuthModal';
import CategoryManagerModal from './components/CategoryManagerModal';
import BackupModal from './components/BackupModal';
import SettingsModal from './components/SettingsModal';
// ... 更多组件导入
```

---

## 对外接口（组件列表）

### 1. 认证相关组件

#### `AuthModal.tsx`
**职责**: 主应用登录认证模态框
**Props 接口**:
```typescript
interface AuthModalProps {
  isOpen: boolean;
  onLogin: (password: string) => Promise<boolean>;
}
```
**使用场景**: 用户首次访问或密码过期时弹出

---

#### `CategoryAuthModal.tsx`
**职责**: 分类目录密码解锁模态框
**Props 接口**:
```typescript
interface CategoryAuthModalProps {
  isOpen: boolean;
  category: Category | null;
  onClose: () => void;
  onUnlock: (catId: string) => void;
}
```
**使用场景**: 访问有密码保护的分类目录时弹出

---

#### `CategoryActionAuthModal.tsx`
**职责**: 分类操作（编辑/删除）密码验证
**Props 接口**:
```typescript
interface CategoryActionAuthModalProps {
  isOpen: boolean;
  action: 'edit' | 'delete';
  categoryId: string;
  categoryName: string;
  onClose: () => void;
  onVerifyPassword: (password: string) => Promise<boolean>;
}
```
**使用场景**: 编辑或删除存量分类时需要再次输入访问密码

---

### 2. 数据管理组件

#### `LinkModal.tsx`
**职责**: 链接的新增/编辑模态框
**关键功能**:
- 自动获取网站图标
- AI 生成描述和推荐分类
- URL 自动补全 https://
- 置顶链接设置

**Props 接口**:
```typescript
interface LinkModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: Omit<LinkItem, 'id' | 'createdAt'>) => void;
  onDelete?: (id: string) => void;
  categories: Category[];
  initialData?: LinkItem;
  aiConfig: AIConfig;
  defaultCategoryId?: string;
}
```

---

#### `CategoryManagerModal.tsx`
**职责**: 分类目录管理（新增、编辑、删除、排序）
**关键功能**:
- 分类拖拽排序
- 设置分类密码保护
- 自定义分类图标（Lucide 图标）

**Props 接口**:
```typescript
interface CategoryManagerModalProps {
  isOpen: boolean;
  onClose: () => void;
  categories: Category[];
  onUpdateCategories: (newCats: Category[]) => void;
  onDeleteCategory: (catId: string) => void;
  onVerifyPassword: (password: string) => Promise<boolean>;
}
```

---

#### `BackupModal.tsx`
**职责**: 数据备份与恢复（本地 + WebDAV）
**关键功能**:
- 导出 JSON 格式备份（包含链接、分类、搜索配置、AI 配置）
- 导出 HTML 书签（兼容浏览器导入）
- WebDAV 上传备份（支持带时间戳的双重备份）
- 从 WebDAV 下载恢复

**Props 接口**:
```typescript
interface BackupModalProps {
  isOpen: boolean;
  onClose: () => void;
  links: LinkItem[];
  categories: Category[];
  onRestore: (links: LinkItem[], categories: Category[]) => void;
  webDavConfig: WebDavConfig;
  onSaveWebDavConfig: (config: WebDavConfig) => void;
  searchConfig: SearchConfig;
  onRestoreSearchConfig: (config: SearchConfig) => void;
  aiConfig: AIConfig;
  onRestoreAIConfig: (config: AIConfig) => void;
}
```

---

#### `ImportModal.tsx`
**职责**: 导入数据（Chrome 书签、JSON 备份）
**关键功能**:
- 解析 Chrome/Edge 书签 HTML 文件
- 智能去重（基于 URL 和标题）
- 导入 JSON 备份文件

**Props 接口**:
```typescript
interface ImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  existingLinks: LinkItem[];
  categories: Category[];
  onImport: (newLinks: LinkItem[], newCategories: Category[]) => void;
  onImportSearchConfig: (config: SearchConfig) => void;
  onImportAIConfig: (config: AIConfig) => void;
}
```

---

### 3. 设置与配置组件

#### `SettingsModal.tsx`
**职责**: 应用设置（AI 配置、网站配置、扩展工具）
**关键功能**:
- AI 服务配置（Gemini / OpenAI 兼容）
- 网站标题、图标、卡片样式设置
- 密码过期时间设置
- Chrome 扩展插件代码生成
- AI 一键批量补全所有链接描述

**Props 接口**:
```typescript
interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  config: AIConfig;
  siteSettings: SiteSettings;
  onSave: (config: AIConfig, siteSettings?: SiteSettings) => void;
  links: LinkItem[];
  categories: Category[];
  onUpdateLinks: (newLinks: LinkItem[]) => void;
  authToken: string;
}
```

---

#### `SearchConfigModal.tsx`
**职责**: 站外搜索源管理
**关键功能**:
- 新增/编辑/删除搜索源
- 启用/禁用搜索源
- 自定义搜索源 URL 模板（{query} 占位符）

**Props 接口**:
```typescript
interface SearchConfigModalProps {
  isOpen: boolean;
  onClose: () => void;
  sources: ExternalSearchSource[];
  onSave: (sources: ExternalSearchSource[]) => void;
}
```

---

### 4. 功能性组件

#### `QRCodeModal.tsx`
**职责**: 生成链接的二维码
**依赖**: `qrcode` 库

**Props 接口**:
```typescript
interface QRCodeModalProps {
  isOpen: boolean;
  url: string;
  title: string;
  onClose: () => void;
}
```

---

#### `ContextMenu.tsx`
**职责**: 右键菜单（复制链接、显示二维码、编辑、删除、置顶/取消置顶）

**Props 接口**:
```typescript
interface ContextMenuProps {
  isOpen: boolean;
  position: { x: number; y: number };
  onClose: () => void;
  onCopyLink: () => void;
  onShowQRCode: () => void;
  onEditLink: () => void;
  onDeleteLink: () => void;
  onTogglePin: () => void;
}
```

---

#### `Icon.tsx`
**职责**: 通用图标包装器，动态加载 lucide-react 图标

**Props 接口**:
```typescript
interface IconProps {
  name: string; // Lucide 图标名称
  size?: number;
  className?: string;
}
```

---

#### `IconSelector.tsx`
**职责**: 图标选择器（用于分类管理）

**Props 接口**:
```typescript
interface IconSelectorProps {
  value: string;
  onChange: (iconName: string) => void;
}
```

---

## 关键依赖与配置

### 外部依赖
- **lucide-react**: 图标库
- **@dnd-kit/core + @dnd-kit/sortable**: 拖拽排序
- **qrcode**: 二维码生成
- **@google/genai**: Google AI 集成
- **jszip**: JSON 备份压缩（可能用于导出）

### 与 App.tsx 的数据流
```
App.tsx (State)
    ↓ Props
Components (UI)
    ↓ Callbacks
App.tsx (updateData → sync to KV)
```

所有组件都是**受控组件**，状态由 `App.tsx` 统一管理，组件通过回调函数通知父组件更新数据。

---

## 数据模型

组件使用的数据类型定义在 `/Users/yml/codes/CloudNav-abcd/types.ts`，关键接口：

```typescript
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

interface WebDavConfig {
  url: string;
  username: string;
  password: string;
  enabled: boolean;
}

interface AIConfig {
  provider: 'gemini' | 'openai';
  apiKey: string;
  baseUrl: string;
  model: string;
}

interface SearchConfig {
  mode: 'internal' | 'external';
  externalSources: ExternalSearchSource[];
  selectedSource?: ExternalSearchSource | null;
}
```

---

## 测试与质量

**当前状态**: 无自动化测试

**建议测试方向**:
1. **单元测试**:
   - IconSelector 的图标列表渲染
   - ContextMenu 的位置计算逻辑
2. **集成测试**:
   - LinkModal 的表单验证和提交流程
   - BackupModal 的 WebDAV 连接测试
   - ImportModal 的书签解析逻辑
3. **E2E 测试**:
   - 完整的认证流程（AuthModal → 登录 → 数据加载）
   - 链接的增删改查流程
   - 分类的创建、锁定、解锁流程

推荐工具: **React Testing Library** + **Vitest**

---

## 常见问题 (FAQ)

### Q1: 如何为组件添加新的 Props？
**A**: 在组件文件顶部定义 `interface XxxProps`，然后在 `App.tsx` 中传递新的 Props。如果涉及全局状态，需同步更新 `types.ts`。

---

### Q2: 为什么组件状态不能直接修改？
**A**: CloudNav 采用**单向数据流**架构，所有状态由 `App.tsx` 统一管理，组件通过 `onSave` 等回调通知父组件更新。这样可以确保数据同步到 LocalStorage 和 Cloudflare KV。

---

### Q3: 如何调试组件渲染问题？
**A**:
1. 使用 React DevTools 检查组件树和 Props
2. 在组件内添加 `console.log(props)` 查看传入数据
3. 检查 `App.tsx` 中对应的状态管理逻辑

---

### Q4: 如何自定义模态框样式？
**A**: 所有模态框使用 Tailwind CSS 类名，可以直接修改组件文件中的 `className`。注意保持暗色模式兼容（`dark:` 前缀）。

---

### Q5: 如何新增一个模态框组件？
**A**:
1. 在 `components/` 下创建 `NewModal.tsx`
2. 定义 Props 接口和组件逻辑
3. 在 `App.tsx` 中导入并添加状态控制 `isNewModalOpen`
4. 在 JSX 中渲染 `<NewModal isOpen={isNewModalOpen} ... />`

---

## 相关文件清单

```
/Users/yml/codes/CloudNav-abcd/components/
├── AuthModal.tsx
├── BackupModal.tsx
├── CategoryActionAuthModal.tsx
├── CategoryAuthModal.tsx
├── CategoryManagerModal.tsx
├── ContextMenu.tsx
├── Icon.tsx
├── IconSelector.tsx
├── ImportModal.tsx
├── LinkModal.tsx
├── QRCodeModal.tsx
├── SearchConfigModal.tsx
└── SettingsModal.tsx
```

**总文件数**: 13
**总代码行数**: 约 3000 行（估算）

---

**最后更新时间**: 2026-01-11
**模块版本**: v1.7
