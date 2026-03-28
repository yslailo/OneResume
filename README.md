# OneResume

OneResume 是一个极简免登录、本地优先的在线简历生成器。数据默认保存在浏览器本地，不依赖账号系统，支持多份简历切换、Markdown/JSON 导入导出、头像本地持久化和浏览器打印导出 PDF。

## 技术栈

- Vue 3 + TypeScript + Vite
- Pinia
- Tailwind CSS 4
- Vue Router
- IndexedDB + localStorage
- Vitest

## 本地开发

```bash
npm install
npm run dev
```

## 常用脚本

```bash
npm run test
npm run typecheck
npm run build
```

## 当前 MVP 能力

- 免登录直接进入工作台
- 本地多份简历管理
- 基础信息、教育、工作、项目、技能、自定义模块编辑
- 模块显隐、模块重命名、拖拽排序
- 3 套模板切换：`minimal`、`modern`、`classic-sidebar`
- 全局样式调节：主题色、字体、字号、行距、页边距
- JSON 工程导入导出
- Markdown 导入导出
- 头像本地持久化
- 打印视图导出 PDF

## 说明

- 本项目当前以桌面端编辑体验为优先。
- PDF 导出采用浏览器打印能力，目标是保证文字可选中、链接可点击。
- 详细阶段记录见 [docs/progress.md](./docs/progress.md)。
