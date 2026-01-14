# TagZero 技术架构决策文档

## 1. 技术栈选型：Vue 还是 React？

**推荐结论：React (Next.js + TypeScript)**

### 核心理由：
1.  **Canvas 生态统治力**：
    *   在图形编辑和数据标注领域，React 拥有 `react-konva`、`react-three-fiber` 等成熟的**声明式**封装库。
    *   Vue 虽然也有对应封装，但社区活跃度和深度（特别是处理复杂交互如拖拽、缩放、层级管理时）不如 React 生态。
2.  **复杂状态管理**：
    *   标注工具本质是管理极其复杂的“状态”（成千上万个点的坐标、选中状态、历史记录 Undo/Redo）。
    *   React 的单向数据流配合 `Zustand` 或 `Redux` 在处理这种大规模状态时更加可预测。
3.  **竞品参考**：
    *   主流开源标注工具（如 Label Studio, CVAT）大多采用 React。这意味着你可以参考甚至复用大量现成的逻辑（如 Bounding Box 变换算法）。

### Vue 实现路径（如果必须选 Vue）：
如果团队更擅长 Vue，完全可以实现，但需要注意以下**特定挑战与策略**：

#### A. 核心图形库选择
1.  **Vue-Konva**：
    *   `Konva` 的官方 Vue 封装。
    *   **优点**：声明式写法（`<v-layer>`, `<v-rect>`），符合 Vue 直觉。
    *   **缺点**：相比 React 版，更新略慢，某些高级特性（如严格模式下的 Ref 转发）可能需要折腾。
2.  **Fabric.js (手动封装)**：
    *   **策略**：不使用现成的 Vue 封装库，直接在 `onMounted` 中初始化 `fabric.Canvas`。
    *   **优点**：Fabric.js 对象模型非常强大，适合做矢量编辑。
    *   **缺点**：命令式编程，需要手动同步 Vue State 和 Canvas 画面。

#### B. 致命性能陷阱：响应式代理 (Reactivity Overhead)
*   **问题**：Vue 3 使用 `Proxy` 代理对象。如果你把一个巨大的 Canvas 实例（或包含成千上万个点的 Konva 节点对象）直接赋值给 `ref` 或 `reactive`，Vue 会试图递归代理这个对象。
*   **后果**：内存爆炸，操作卡顿（FPS 跌至个位数）。
*   **解决方案**：
    *   使用 `shallowRef()`：只监听引用变化，不深层代理对象内部属性。
    *   使用 `markRaw()`：明确告诉 Vue "永远不要代理这个对象"。
    *   **代码示例**：
        ```javascript
        import { shallowRef, markRaw, onMounted } from 'vue';
        import Konva from 'konva';

        export default {
          setup() {
            // 关键：使用 shallowRef 避免深层代理
            const stageRef = shallowRef(null);

            onMounted(() => {
              // 关键：使用 markRaw 标记第三方实例
              const stage = markRaw(new Konva.Stage({ ... }));
              stageRef.value = stage;
            });

            return { stageRef };
          }
        };
        ```

#### C. 逻辑复用：Composition API
*   Vue 3 的 Composition API (`useDraggable`, `useZoom`) 在逻辑复用上比 React Hooks 更灵活，非常适合拆分复杂的画布交互逻辑。

---

## 2. 团队协作：如何让新人快速上手？

为了解决“新人一脸懵”的问题，我们需要建立**标准化工程体系**：

### A. 强制类型约束 (TypeScript)
*   **作用**：代码即文档。新人不需要猜 `annotation` 对象里到底是有 `x` 还是 `left`，TS 类型定义会直接告诉他。
*   **策略**：开启 `strict: true`，禁止 `any`。

### B. 统一开发环境 (Docker Compose)
*   **痛点**：“我的电脑上能跑，你的不行”。
*   **方案**：提供 `docker-compose.yml`，一键启动后端 (Python/FastAPI)、数据库 (PostgreSQL)、缓存 (Redis) 和对象存储 (MinIO)。
*   **新人指令**：`git clone` -> `docker-compose up` -> 开始干活。

### C. 模块化架构 (Monorepo)
*   **工具**：TurboRepo 或 Nx。
*   **结构**：
    ```text
    apps/
      web/          (Next.js/Nuxt.js 前端)
      api/          (Python/FastAPI 后端 - 用于模型训练)
    packages/
      ui/           (通用的 UI 组件库)
      core-logic/   (纯计算逻辑，如几何算法，不依赖框架)
      types/        (前后端共享的 TS 类型定义)
    ```
*   **优势**：新人只需要关注他负责的那个 `app` 或 `package`，认知负担低。

### D. 交互式文档 (Storybook)
*   对于 UI 组件和标注画布组件，使用 Storybook 编写文档。新人可以直接在浏览器里调试组件，而不是去读晦涩的代码。

---

## 3. Canvas 性能瓶颈与优化方案

**回答**：是的，Canvas 实现如果简单粗暴，**一定会**遇到严重的性能问题。

### 常见性能陷阱：
1.  **全量重绘**：鼠标移动一下，整个画布（包括背景高清图和几千个框）全部擦除重画。
2.  **事件监听爆炸**：给 5000 个多边形每个都绑定 `mousemove` 事件。
3.  **响应式开销**：把巨大的 Canvas 对象（如 ImageBitmap）放入 Vue/React 的响应式数据中，导致代理拦截造成卡顿。

### TagZero 的优化策略：

#### 策略一：分层渲染 (Layering)
不要把所有东西画在一个 Canvas 上。至少分为三层：
1.  **背景层 (Background Layer)**：渲染原始图片。**几乎不重绘**（除非缩放/平移）。
2.  **对象层 (Object Layer)**：渲染所有已完成的标注。**低频重绘**（只在添加/删除/修改完成时重绘）。
3.  **交互层 (Interaction/Draft Layer)**：渲染当前正在画的框、鼠标悬停高亮、拖拽手柄。**高频重绘**。

#### 策略二：空间索引 (Spatial Indexing)
*   **问题**：鼠标点击时，如何判断点中了哪个框？遍历 10000 个框计算几何相交太慢。
*   **解法**：使用 **R-Tree** 或 **QuadTree** (四叉树)。只检测鼠标附近的几个对象。
*   **库支持**：`Konva.js` 内置了类似机制（颜色拾取法），`Fabric.js` 也有优化。

#### 策略三：视口裁剪 (Viewport Culling)
*   当图片放大 10 倍时，只绘制屏幕可见区域内的标注对象。屏幕外的对象直接跳过渲染。

#### 策略四：WebWorker 离线计算
*   如果需要进行自动标注（如 Magic Wand 魔棒工具），涉及大量像素级计算，必须放在 WebWorker 中，避免阻塞主线程（UI 线程）。

### 推荐图形库：Konva.js (配合 react-konva / vue-konva)
*   **理由**：它天生支持分层 (Layering)、事件委托、缓存 (Cache as Bitmap)，是做 2D 标注工具的“甜点级”选择。
*   **备选**：如果涉及到 3D 点云标注 (LiDAR)，则必须使用 **Three.js** 或 **Deck.gl**。

---

## 4. 深度性能对比：React vs Vue (在 Canvas 场景下)

如果团队双栈都会，**在极限性能要求下，React 略胜一筹**。

### A. 渲染机制差异
*   **React (`react-konva`)**:
    *   **原理**：React 仅仅是作为“配置生成器”。它计算出 Virtual DOM，然后 `react-konva` 直接去修改 Canvas 节点。
    *   **优势**：React 的 Fiber 架构在处理大量节点（如 10,000 个矩形）更新时，可以通过 `memo` 精准控制只更新这 1 个矩形，甚至完全绕过 React 渲染周期直接操作 Ref，达到 **0 overhead**。
    *   **生态**：`react-konva` 是 Konva 作者官方首推的封装，更新最快，优化最深。
*   **Vue (`vue-konva`)**:
    *   **原理**：Vue 组件实例比较“重”。每个组件实例都需要创建 Proxy 监听器、Effect Scope 等。
    *   **劣势**：初始化渲染 10,000 个组件时，Vue 的内存占用和 CPU 耗时通常比 React 高 30%~50%（因为要创建海量的 Proxy 对象）。虽然可以通过 `functional component` 优化，但心智负担较大。

### B. 极限优化能力 (Escape Hatch)
*   **React**: 使用 `useRef` 可以非常容易地拿到 Konva 节点实例，进行命令式操作（比如拖拽时不走 React 状态更新，直接改节点 x/y，松手时再同步状态）。这是高性能 Canvas 应用的标准做法。
*   **Vue**: 虽然也可以用 `ref`，但 Vue 的数据流倾向于“响应式驱动”，如果你绕过响应式系统直接改 DOM/Canvas，容易造成数据与视图不同步的诡异 Bug。

### C. 结论
*   **普通场景 (标注数量 < 2000)**：React 和 Vue **没有肉眼可见的区别**。选团队开发效率最高的。
*   **极限场景 (标注数量 > 10000, 像素级操作)**：**选 React**。它的运行时开销更小，且更方便做到底层的极致优化。
