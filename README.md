# OneResume

OneResume 是一个免登录、本地优先的在线简历编辑器。

它面向“打开就能写、数据留在本地、导出结果稳定可控”这三个核心目标设计，适合在浏览器里快速整理、修改、预览和导出简历。

## 核心特点

- 免登录，首页与工作台分离，点击后快速进入编辑器
- 本地优先，简历数据默认保存在浏览器本地
- 支持多份简历切换与独立管理
- 左侧结构化编辑，右侧 A4 实时预览
- 支持模板切换与样式微调
- 支持头像本地上传与持久化
- 支持导入 `PDF / HTML / Markdown / TXT / JSON`
- 支持导出 `PDF / 工程文件 / 原始 HTML`
- PDF 导入支持纯前端智能结构解析，并带回退方案

## 技术栈

- Vue 3
- TypeScript
- Vite
- Pinia
- Tailwind CSS 4
- Vue Router
- IndexedDB + localStorage
- pdfjs-dist
- Vitest

## 当前能力

### 编辑体验

- 基础信息编辑
- 教育背景、工作经历、项目经历、专业技能、自定义模块编辑
- 模块显隐、重命名、排序
- 条目增删改与排序
- Markdown 描述输入
- 常用文本加粗辅助

### 模板与预览

- 内置模板：
  - `minimal`
  - `modern`
  - `classic-sidebar`
  - `classic-blue`
- 模板切换不影响结构化数据
- 支持主题色、字体、字号、行高、页边距等样式调节
- 支持上传 HTML 简历并保留原模板预览
- 支持 HTML 模板同步预览

### 导入导出

- 导入：
  - `PDF`
  - `HTML / HTM`
  - `Markdown / TXT`
  - `JSON`
- 导出：
  - `PDF`
  - `JSON 工程文件`
  - `原始 HTML`
- PDF 导出基于浏览器打印链路，文本可选中

## 本地开发

```bash
npm install
npm run dev
```

默认开发地址通常为：

```bash
http://localhost:5173
```

## 常用脚本

```bash
npm run dev
npm run test
npm run typecheck
npm run build
```

## 数据存储

- 简历文本与配置：`localStorage`
- 头像资源：`IndexedDB`

项目默认不依赖后端服务，不上传用户简历内容。

## 使用说明

### 新建与编辑

1. 打开首页后先进入极简首页，再一键进入工作台
2. 点击顶部“新建”创建简历
3. 在左侧编辑内容，右侧实时查看 A4 预览
4. 需要时切换模板或调整样式

### 导入已有简历

可直接从顶部“导入”选择：

- PDF 简历
- HTML 简历
- Markdown / TXT 简历
- JSON 工程文件

其中 PDF 导入会优先尝试更智能的结构解析；若识别效果一般，会自动回退到较稳妥的纯文本解析方案。

### 导出

顶部“导出”支持：

- 导出 PDF
- 导出工程文件
- 导出原始 HTML

## 适用场景

- 本地快速改简历
- 在不同模板之间切换排版
- 把旧 Markdown / HTML / PDF 简历整理成结构化数据
- 导出适合投递的 PDF 简历

## 说明

- 当前版本以桌面端编辑体验为主
- Safari 与移动端以基础可用为目标，不承诺完全一致的打印表现
- 导入复杂 PDF 时，结果仍建议人工复查

## License

仅供个人项目开发与学习使用；如需补充正式许可证，可在后续添加 `LICENSE` 文件。
