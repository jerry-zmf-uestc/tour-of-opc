# yuque-maintainer

语雀知识库同步与维护工具 - 将语雀文档同步到本地 Obsidian Vault，保持完整的目录结构。

## 功能特性

- 🔄 **完整同步**：同步指定知识库及其所有子节点
- 📁 **保持结构**：完全保留语雀的目录层级结构
- 📝 **Markdown 导出**：转换为标准 Markdown 格式
- 🏷️ **元数据保留**：包含 YAML frontmatter（标题、时间、来源、URL）
- 🔄 **增量更新**：支持后续增量同步更新

## 安装

### 1. 克隆或复制技能

```bash
# 将 skills/yuque-maintainer 复制到你的项目
mkdir -p /your-project/skills/yuque-maintainer
# 复制 scripts 目录下的文件
```

### 2. 配置环境变量

在 `~/.zshrc` 或 `~/.bashrc` 中添加语雀 Token：

```bash
# 语雀 Personal Token
# 获取方式：登录语雀 → 头像 → 设置 → Token → 创建 Token
export YUQUE_PERSONAL_TOKEN="your-token-here"
```

然后加载配置：

```bash
source ~/.zshrc  # 或 source ~/.bashrc
```

## 使用方法

### 方式一：直接使用脚本

```bash
# 进入项目目录
cd /your-project

# 运行同步脚本
node skills/yuque-maintainer/scripts/sync-from-yuque.cjs
```

### 方式二：配置后使用（推荐）

编辑脚本中的配置部分：

```javascript
// 配置参数
const NAMESPACE = 'your-namespace/your-repo';  // 知识库路径
const TARGET_DIR = path.join(__dirname, '..', '..', 'obsidian-vault', 'articles');
const PARENT_DOC_UUID = 'your-doc-uuid';  // 要同步的根文档 UUID
```

## 目录结构说明

同步后的文件结构：

```
obsidian-vault/articles/
├── 根文档.md                    # 层级 0：直接保存为 .md
├── 一级目录/                    # 层级 1：创建文件夹
│   ├── index.md                # 文件夹的 index.md
│   └── 二级文档.md             # 层级 2+：放入对应文件夹
└── 另一个一级目录/
    ├── index.md
    └── 子文档.md
```

### 层级映射规则

| 语雀层级 | 本地存储方式 | 示例 |
|---------|-------------|------|
| 层级 0 | 根目录 .md 文件 | `The Way To AI Engineer.md` |
| 层级 1 | 创建文件夹 + index.md | `AI 基础学习/index.md` |
| 层级 2+ | 放入父文件夹 | `AI 基础学习/入门课程.md` |

## 文档元数据

每个同步的文档包含 YAML frontmatter：

```yaml
---
title: "文档标题"
created: "2025-12-27T15:30:10.000Z"
updated: "2026-03-19T02:28:00.000Z"
source: "语雀"
url: "https://www.yuque.com/namespace/repo/slug"
level: 0
---
```

## 配置详解

### 必需配置

在同步脚本中修改以下配置：

```javascript
const CONFIG = {
  // 语雀知识库命名空间（从语雀 URL 获取）
  // 格式: username/repo-name
  // 示例: jerry_zmf_uestc/learning
  NAMESPACE: 'your-namespace/your-repo',
  
  // 要同步的根文档 UUID
  // 获取方式：查看语雀文档 URL 或使用浏览器开发者工具
  PARENT_DOC_UUID: '3DYLHA8YzStD023H',
  
  // 目标目录（Obsidian Vault 下的路径）
  TARGET_DIR: path.join(__dirname, '..', '..', 'obsidian-vault', 'articles')
};
```

### 获取配置信息

#### 1. 获取 Namespace

- 打开语雀知识库
- 从 URL 提取：`https://www.yuque.com/namespace/repo`
- 或使用 API 获取：`https://www.yuque.com/api/v2/users/{login}/repos`

#### 2. 获取文档 UUID

```bash
# 通过 API 获取目录结构
curl -s "https://www.yuque.com/api/v2/repos/{namespace}/toc" \
  -H "X-Auth-Token: $YUQUE_PERSONAL_TOKEN" | python3 -m json.tool
```

在返回的数据中找到目标文档的 `uuid` 字段。

## 技术实现

### 核心流程

1. **获取目录结构**
   - 调用语雀 API: `GET /api/v2/repos/{namespace}/toc`
   - 解析树形结构，识别层级关系

2. **遍历文档树**
   - 从根文档开始递归遍历
   - 识别父子关系，建立层级映射

3. **下载文档内容**
   - 调用语雀 API: `GET /api/v2/repos/{namespace}/docs/{slug}`
   - 获取 Markdown 原文和元数据

4. **本地存储**
   - 根据层级创建文件夹结构
   - 写入 Markdown 文件
   - 添加 YAML frontmatter

### API 调用

```javascript
// 获取目录
GET https://www.yuque.com/api/v2/repos/{namespace}/toc

// 获取文档详情
GET https://www.yuque.com/api/v2/repos/{namespace}/docs/{slug}
```

请求头：
```
X-Auth-Token: your-personal-token
User-Agent: Yuque-Sync-Script
```

## 进阶用法

### 增量同步

修改脚本添加时间戳检查：

```javascript
// 检查本地文件更新时间
const localStat = fs.statSync(filepath);
const localUpdated = new Date(localStat.mtime);
const remoteUpdated = new Date(doc.updated_at);

// 仅同步更新的文档
if (remoteUpdated > localUpdated) {
  // 执行同步
}
```

### 选择性同步

添加过滤条件：

```javascript
// 只同步特定层级的文档
const MAX_LEVEL = 2;
if (doc.level > MAX_LEVEL) continue;

// 排除特定文档
const EXCLUDE_LIST = ['草稿', '临时笔记'];
if (EXCLUDE_LIST.includes(doc.title)) continue;
```

### 定时同步

添加 crontab 定时任务：

```bash
# 每小时同步一次
0 * * * * cd /your-project && node skills/yuque-maintainer/scripts/sync-from-yuque.cjs >> /var/log/yuque-sync.log 2>&1
```

## 常见问题

### Q: 如何获取语雀 Personal Token？

A: 
1. 登录语雀 → 点击右上角头像
2. 选择「设置」
3. 左侧菜单选择「Token」
4. 点击「新建 Token」
5. 勾选「读取」权限
6. 复制保存 Token（只显示一次）

### Q: 同步后图片无法显示？

A: 语雀文档中的图片使用 CDN 链接，需要：
1. 确保网络可以访问语雀 CDN
2. 或使用 Obsidian 的图片下载插件
3. 考虑使用 Web Clipper 重新剪藏

### Q: 如何同步多个知识库？

A: 创建多个配置文件或修改脚本支持多知识库：

```javascript
const REPOS = [
  { namespace: 'user/repo1', uuid: 'uuid1', target: 'folder1' },
  { namespace: 'user/repo2', uuid: 'uuid2', target: 'folder2' }
];
```

## 依赖

- Node.js >= 14.0
- 语雀 Personal Token

## 参考

- [语雀 API 文档](https://www.yuque.com/yuque/developer/api)
- [Obsidian 文档](https://help.obsidian.md/)

## License

MIT
