# TagZero - 纯前端数据标注工具

TagZero 是一个基于 Web 的本地优先数据标注工具，旨在提供轻量、高效的图像标注体验。用户直接打开浏览器即可使用，数据存储在本地浏览器内存/硬盘中（IndexedDB），不依赖后端服务。

## ✨ 已实现功能 (Features)

### 🎨 核心标注
- **多图形支持**：
  - 矩形 (Rectangle)
  - 圆形 (Circle)
  - 三角形 (Triangle)
  - 多边形 (Polygon)
- **画布交互**：
  - 基于 Konva.js 的高性能渲染。
  - 支持画布缩放 (Zoom) 与平移 (Pan)。
  - **智能边界限制**：防止图形在拖拽或调整大小时超出图片边界。
  - **图层管理**：选中对象自动置顶，避免遮挡，优化操作体验。
  - **顶点编辑**：支持多边形和三角形的顶点拖拽调整。

### 🏷️ 标签管理系统
- **配置管理**：支持创建、编辑、删除多组标签集 (Label Sets)。
- **持久化存储**：集成 **IndexedDB**，确保标签配置数据在页面刷新后不丢失。
- **自定义属性**：支持自定义标签名称与颜色（内置 64 种高对比度预设颜色）。
- **同步模式**：
  - **本地模式**：使用临时标签集，灵活添加。
  - **实时同步模式**：模拟远程同步，支持标签集的实时更新与锁定。
- **交互优化**：
  - 标签列表支持空状态下的默认引导。
  - 新增标签时的颜色自动去重/随机分配。

### 🖥️ UI/UX 体验
- **游戏化视觉反馈**：选中标注时显示“游戏风格”的水平浮动光标，提供清晰的视觉指引。
- **高效列表视图**：
  - 紧凑型标注列表，去除冗余边距，实现边缘对齐。
  - 选中项高亮与渐变背景效果。
- **工具栏优化**：
  - 重新布局操作区，将撤销/重做、缩放控制整合至左侧，符合操作直觉。
  - **视觉升级**：引入胶囊式圆角按钮组设计，优化按钮状态与图标显示，提升界面现代感与一致性。
- **快捷操作**：
  - **右键菜单**：在画布上右键点击标注，可快速切换标签，支持颜色预览。
  - **悬停交互**：鼠标悬停在列表项上显示删除按钮，保持界面整洁。
- **文件处理**：支持多张图片及文件夹的本地加载（Blob URL 方案，无需上传服务器）。

### 📤 数据导出与验证 (Export & Validation)
- **多格式支持**：
  - **TagZero JSON** (原生完整数据)
  - **COCO** (JSON)
  - **YOLO** (TXT + Images Zip)
  - **Pascal VOC** (XML + Images Zip)
- **智能校验**：
  - 导出前自动检测未标注图片。
  - **视觉警示**：未标注图片的序号背景自动变红，导出弹窗内展示未标注数量及具体序号列表（红色高亮提示），防止无效数据流出。

### ⌨️ 快捷键 (Shortcuts)
- **编辑 (Editing)**
  - `Delete` / `Backspace`: 删除选中标注 (Delete selected annotation)
  - `Ctrl + Z` / `Cmd + Z`: 撤销 (Undo)
  - `Ctrl + Shift + Z` / `Cmd + Shift + Z`: 重做 (Redo)
  - `Ctrl + S` / `Cmd + S`: 导出数据 (Export data)
- **导航 (Navigation)**
  - `A` / `←`: 上一张图片 (Previous image)
  - `D` / `→`: 下一张图片 (Next image)
- **工具切换 (Tools)**
  - `R`: 矩形工具 (Rectangle)
  - `C`: 圆形工具 (Circle)
  - `T`: 三角形工具 (Triangle)
  - `P`: 多边形工具 (Polygon)
- **画布控制 (Canvas Control)**
  - `Esc`: 取消绘制 / 取消选中 (Cancel drawing / Deselect)
  - `Ctrl/Cmd + +`: 放大 (Zoom In)
  - `Ctrl/Cmd + -`: 缩小 (Zoom Out)
  - `Ctrl/Cmd + 0`: 重置缩放 (Reset Zoom)

## 📅 未来计划 (Roadmap)

### Phase 1: 基础完善 (Current Focus)
- [x] 核心图形绘制与编辑
- [x] 标签配置持久化 (IndexedDB)
- [x] 界面交互优化 (选中特效、列表对齐)
- [x] **数据导出**：支持标准格式 (COCO, Pascal VOC, YOLO) 导出。
- [x] **快捷键支持**：涵盖编辑、导航、工具切换、画布控制等全方位支持。

### Phase 2: 进阶体验
- [x] **撤销/重做 (Undo/Redo)**：实现完整的历史记录栈。
- [ ] **辅助对齐**：绘制时的智能吸附与辅助线。
- [ ] **放大镜工具**：细节标注时的局部放大功能。
- [ ] **多边形增强**：支持更复杂的顶点操作（增加/减少顶点）。

### Phase 3: 智能化与协作
- [ ] **AI 辅助标注**：接入 SAM (Segment Anything Model) 或其他轻量级模型进行前端推理。
- [ ] **后端集成**：提供 API 接口对接能力，支持云端存储与团队协作。
- [ ] **标注质检**：增加标注审核与自动检查流程。

## 🛠️ 技术栈 (Tech Stack)

- **Core**: Vue 3, TypeScript, Vite
- **State**: Pinia
- **UI**: Naive UI, Tailwind CSS (Utility classes)
- **Graphics**: Konva.js, vue-konva
- **Storage**: IndexedDB (idb wrapper)
- **I18n**: vue-i18n (中/英支持)

## 🚀 快速开始

```bash
# 安装依赖
npm install

# 启动开发服务器
npm run dev

# 构建生产版本
npm run build
```
