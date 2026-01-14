# TagZero 项目规划文档 (Phase 1)

## 1. 核心目标
构建一个**纯前端、本地优先**的数据标注工具。用户直接打开浏览器即可使用，数据存储在本地浏览器内存/硬盘中，不依赖后端服务。

**一期范围 (MVP)**：
*   ✅ **输入**：支持本地图片批量上传 (Drag & Drop)。
*   ✅ **标注**：支持矩形框 (Bounding Box) 绘制、调整、移动、删除。
*   ✅ **输出**：支持标注结果导出为标准 JSON 格式 (COCO/VOC)。
*   ❌ **暂不包含**：AI 辅助标注、模型训练、后端存储、多用户协作。

## 2. 技术栈架构 (Vue 3 实现版)

### 2.1 核心技术选型
*   **框架**: Vue 3 (Script Setup) + TypeScript + Vite
*   **状态管理**: Pinia (处理标注数据、撤销重做栈)
*   **图形引擎**: Konva.js + vue-konva (分层渲染)
*   **UI 组件库**: Naive UI (高性能，TypeScript 支持极好)
*   **工具库**: VueUse (处理键盘快捷键、窗口大小监听)

### 2.2 模块化设计 (高内聚，低耦合)
为了实现“功能独立”，我们将系统拆分为三个层次：

#### 层级 1: 核心逻辑层 (`packages/core` - 纯 TS，无 Vue)
*   不依赖任何 UI 框架，只负责几何计算。
*   `Geometry.ts`: 计算点与矩形的碰撞、包含关系。
*   `Transformer.ts`: 计算缩放、旋转后的坐标变换。
*   `Exporter.ts`: 将内部数据格式转换为 COCO/YOLO 格式。

#### 层级 2: 业务逻辑层 (`apps/web/composables` - Vue Hooks)
*   将交互逻辑封装为可复用的 Hooks。
*   `useCanvas`: 管理画布的缩放 (Scale)、平移 (Offset)。
*   `useTools`: 管理当前选中的工具 (DrawRect, Select, Hand)。
*   `useHistory`: 管理 Undo/Redo 栈。

#### 层级 3: 视图组件层 (`apps/web/components`)
*   **Workspace (主工作台)**
    *   `ToolBar`: 左侧工具栏 (纯 UI，只发射事件)。
    *   `CanvasBoard`: 中间画板 (负责渲染 Konva 节点)。
    *   `AttributePanel`: 右侧属性面板 (修改标签、颜色)。
    *   `DataList`: 底部/右侧图片列表。

## 3. 功能详细规划 (Phase 1)

### F1. 图片加载模块
*   **功能**: 支持拖拽上传文件夹或多张图片。
*   **实现**: 使用 `FileSystemAccessAPI` (如果浏览器支持) 或传统的 `<input type="file">`。
*   **优化**: 图片不直接转 Base64 (太卡)，而是使用 `URL.createObjectURL(file)` 生成 Blob URL，内存占用低且加载快。

### F2. 画布交互模块
*   **缩放/平移**: 鼠标滚轮缩放 (以鼠标为中心)，空格键+拖拽平移。
*   **分层渲染**:
    *   `Layer 1`: 背景图 (Image)。
    *   `Layer 2`: 标注对象 (Rects)。
    *   `Layer 3`: 交互辅助 (当前正在画的红框、十字准星)。

### F3. 矩形标注工具
*   **绘制**: 鼠标按下 -> 拖拽 -> 松开，生成矩形。
*   **编辑**: 选中矩形后，显示 Transformer (8个控制点)，支持调整大小。
*   **属性**: 每个矩形包含 `id`, `label`, `x`, `y`, `width`, `height`, `color`。

### F4. 数据导出
*   **格式**: 自定义 JSON 格式 (TagZero Native) + COCO 导出。
*   **操作**: 点击“导出”按钮，触发浏览器下载行为。

## 4. 开发路线图 (Roadmap)

| 阶段 | 任务 | 预计产出 |
| :--- | :--- | :--- |
| **Step 1** | **项目脚手架搭建** | Monorepo 结构，配置好 Vue3+TS+Konva 环境 |
| **Step 2** | **核心画布实现** | 能加载图片，能缩放/平移画布 |
| **Step 3** | **标注工具实现** | 实现矩形绘制、选中、删除 |
| **Step 4** | **状态管理接入** | 接入 Pinia，实现标注数据的增删改查 |
| **Step 5** | **UI 完善与导出** | 加上工具栏、属性面板，实现 JSON 导出 |

