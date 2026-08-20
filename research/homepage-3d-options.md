# Lightweight 3D options for the homepage

Research date: 2026-08-17

## 中文结论摘要

- 用户描述的“保存若干三维点，随鼠标改变相机，再把点投影到二维平面并连线、填色”在技术上通常可称为**软件 3D 投影器 / 轻量软件光栅化器**。它不要求 3D 引擎，甚至不要求 WebGL：JavaScript 完成三维变换、透视除法和深度排序，Canvas 2D 只负责画最终的线段与多边形。几个长方体、抽象线框、透明色块和鼠标视差完全在它的舒适区。
- 决策关键不是几何复杂度，而是“玻璃”和“虚化”的真实性。半透明面、渐变高光、背景模糊等**风格化玻璃**可以用 Canvas/CSS 伪造；需要正确遮挡、折射背景、Fresnel 高光或基于深度的景深时，就进入 GPU、多渲染目标和后处理的范围。
- 对当前首页，建议先做两个可替换的实验，而不是立即引入通用 3D 引擎：
  1. **原生 Canvas 2D 投影版**：验证线框、视差、抽象玻璃是否已经足够；零第三方运行时。
  2. **OGL + WebGL 版**：只在第一版无法达到材质目标时，用一个小型自定义 shader 验证真折射/轻景深。OGL 官方给出的完整 Core + Math + Extras 指引值为 29 KB min+gzip，实际按需构建可更小（[OGL 官方仓库](https://github.com/oframe/ogl)）。
- 如果追求最快出视觉结果而不优先控制体积，Three.js 的 `MeshPhysicalMaterial`、`PerspectiveCamera` 和 `BokehPass` 最直接；但不应在没有证据的情况下为几个方块默认承担整个 Three.js 与多 pass 后处理。
- CSS 3D 是一个很好的“零库中间态”，适合少量 DOM 立方体和玻璃卡片；PixiJS 是 2D 引擎，Spline 是设计/嵌入工作流，两者都不是本项目轻量真 3D 的默认答案。预渲染图像/视频则适合视觉固定、只需极轻微视差的最终方案。

## 先定义需求中的三个不同问题

### 1. 三维几何和相机投影

长方体只需要 8 个顶点和 12 条边。每帧可依次执行：

1. 把物体局部坐标乘以模型旋转/位移矩阵；
2. 乘以相机视图矩阵；
3. 用透视关系把相机空间点投影到屏幕，例如 `screenX = centerX + focal * x / z`、`screenY = centerY - focal * y / z`；
4. 用各面的平均 `z` 做 painter's algorithm 深度排序；
5. 在 Canvas 2D 上用 `moveTo()`、`lineTo()`、`fill()`、`stroke()` 画面和边。

Canvas 2D 本身只提供二维绘图和二维仿射变换，并没有三维相机；三维数学由我们的代码完成。Canvas 的路径 API 可以直接绘制矩形、三角形、线、弧和曲线（[MDN：Drawing shapes with canvas](https://developer.mozilla.org/en-US/docs/Web/API/Canvas_API/Tutorial/Drawing_shapes)）。因此这不是“假装使用某个 3D 命令”，而是一个小型、明确、可控的软件 3D renderer。

鼠标移动只需要更新目标 yaw/pitch 或相机位置，再用阻尼插值逐帧靠近目标。物体数量只有个位数时，矩阵与排序开销很小；真正的像素成本来自大面积模糊、玻璃折射和高 DPR，而不是那 8 个顶点。

### 2. 焦距和景深并不是同一个效果

- **焦距 / FOV** 决定透视压缩感和视野大小，单纯用投影公式或透视矩阵即可完成。Three.js 的 `PerspectiveCamera` 也明确区分 FOV、film gauge 与 focal length（[官方文档](https://threejs.org/docs/pages/PerspectiveCamera.html)）。
- **焦点距离、光圈与景深（DoF）**决定哪些深度清晰、哪些深度形成散景。通常需要先渲染颜色和深度，再按每个像素与焦平面的距离做额外后处理。Three.js 的 WebGL 路线把它放在单独导入的 `BokehPass` 中（[官方文档](https://threejs.org/docs/pages/BokehPass.html)）。

所以“改变相机焦距”很便宜，“真实镜头虚化”不便宜。若首页只有两三个明确的深度层，可按物体层级施加不同模糊，视觉上可能已经足够，无需全屏 DoF pass。

### 3. “玻璃”至少有三个等级

1. **装饰性透明**：半透明填色、渐变高光、细描边、轻阴影。Canvas 2D、SVG、CSS 都能做。
2. **背景磨砂**：看见并模糊后方页面。CSS `backdrop-filter` 可作用于元素背后的像素，现代浏览器从 2024 年起已进入 Baseline；但 backdrop root 的形成规则会影响模糊范围（[MDN](https://developer.mozilla.org/en-US/docs/Web/CSS/Reference/Properties/backdrop-filter)）。Canvas 也可把背景先画到离屏画布再裁切/模糊，但 `CanvasRenderingContext2D.filter` 仍不是 MDN 的 Baseline 特性，不宜成为关键兼容路径（[MDN](https://developer.mozilla.org/en-US/docs/Web/API/CanvasRenderingContext2D/filter)）。
3. **折射玻璃**：根据法线扭曲背景、带 Fresnel 反射、厚度与正确遮挡。它要求先得到“玻璃后面的画面”，通常使用 render target 再在 fragment shader 中采样；这应交给 WebGL/WebGPU。Three.js 的 `MeshPhysicalMaterial` 内置 `transmission` 与 `thickness`，同时官方明确提醒这些物理特性具有更高的逐像素成本（[官方文档](https://threejs.org/docs/pages/MeshPhysicalMaterial.html)）。

## 方案比较

| 方案 | 第三方首屏 JS | 简单几何 | 玻璃 | 景深 | 鼠标视差 | 工程与维护判断 |
| --- | ---: | --- | --- | --- | --- | --- |
| Canvas 2D + 自写投影 | 0 | 很适合 | 风格化近似 | 分层近似 | 很适合 | 推荐的第一原型；代码小且行为完全可控 |
| CSS 3D transforms | 0 | 适合少量盒子 | CSS 磨砂近似 | 按层 `blur()` | 很适合 | 最快验证 DOM 立体构图，但缺少深度缓冲 |
| 原生 WebGL | 0 | 很适合 | 可做真折射 | 可做真 DoF | 很适合 | 依赖最小，但 buffer、shader、矩阵、资源释放都要自己维护 |
| OGL + WebGL | 完整库指引值 29 KB minzip；按需更小 | 很适合 | 自写 shader | 自写 pass | 很适合 | **推荐 GPU 路线**；轻、低抽象、零依赖 |
| Three.js WebGLRenderer | 官方无稳定 gzip 承诺，应以本项目构建产物实测 | 很适合 | 内置物理材质 | BokehPass | 很适合 | 功能最全、交付最快，体积与像素成本更高 |
| Three.js WebGPURenderer | 同上，且新栈 | 很适合 | 节点材质 | 新后处理栈 | 很适合 | 当前仍 experimental，不适合作为小首页首选 |
| PixiJS | 官方无稳定字节承诺 | 2.5D 合适 | 自定义 filter | 2D blur | 很适合 | 官方定位是 2D 引擎，缺少常规 3D 相机/深度场景 |
| Spline Viewer/runtime | runtime + scene，严格预算不透明 | 很适合 | 编辑器内置 | 编辑器内置 | 内置 Follow/Look At | 最快视觉探索，但不是极致轻量或完全自控路线 |
| 预渲染 AVIF/WebP/视频 | 几乎无 JS，代价转为媒体字节 | 固定画面 | 离线可做到最好 | 离线可做到最好 | 仅分层近似 | 最稳定省电；不能自由改变真实视角 |

表中没有给 Three.js、PixiJS 或 Spline 填写来自第三方测量的固定体积，因为它们没有对当前版本做稳定的官方 gzip 字节承诺。真正进入候选后，应在本仓库按实际 imports 构建并读取 gzip/Brotli 产物，避免拿旧版本数字做预算。

## 各方案详评

### A. 原生 Canvas 2D 投影：最贴近用户描述

这是当前的默认推荐。适合的视觉语言包括：

- 线框、消失点、向焦点延伸的辅助线；
- 若干平面组成的低多边形长方体；
- 随深度改变颜色、透明度、线宽与模糊程度；
- 鼠标驱动几度范围内的相机 yaw/pitch；
- 以渐变、合成模式和高光线伪造玻璃。

边界也很明确：Canvas 是立即模式位图，一旦绘制，图形不再是可独立操作的 DOM 对象，动画时需要由代码清理并重画（[MDN：Drawing graphics](https://developer.mozilla.org/en-US/docs/Learn_web_development/Extensions/Client-side_APIs/Drawing_graphics)）。面与面可以按平均深度排序，但相交物体、透明面互相穿插、逐像素遮挡无法靠简单 painter 排序完全正确。折射玻璃和真实 DoF 会把一个几 KB 的几何程序逐步变成自制渲染引擎，此时应停止扩张并切 GPU。

性能策略：只在指针改变后启动 `requestAnimationFrame()`，阻尼收敛后停帧；静止页面不应保持 60/120 FPS。Canvas 官方优化建议包括用 `requestAnimationFrame()`、预渲染重复图元、分层 canvas、批量路径、避免 `shadowBlur`，并正确处理 DPR（[MDN：Optimizing canvas](https://developer.mozilla.org/en-US/docs/Web/API/Canvas_API/Tutorial/Optimizing_canvas)）。

### B. CSS 3D transforms：零库、少量盒子的另一条捷径

用六个绝对定位的 DOM 面，加 `perspective`、`translateZ()`、`rotateX/Y()` 和 `transform-style: preserve-3d` 即可形成盒子。相关能力已广泛可用；`transform-style` 决定子元素保留三维位置还是被压平（[MDN](https://developer.mozilla.org/en-US/docs/Web/CSS/Reference/Properties/transform-style)）。鼠标事件只需更新父级 CSS variables。

优点是 DOM/CSS 易调、零图形库、与首页现有 HTML 风格一致。缺点是没有真正深度缓冲，复杂透明排序与交叉几何会露馅；并且 `opacity < 1`、`filter`、`clip-path`、`mix-blend-mode` 等 grouping 值可能迫使三维后代 flatten。它很适合 1–3 个玻璃卡片/盒子，不适合逐步演化成小型场景引擎。

### C. OGL：轻量 GPU 路线

OGL 官方定位是低抽象、零依赖的 ES module WebGL 库，保留原生 WebGL 的思维方式，同时提供 Renderer、Camera、Transform、Mesh、Box、Program、Texture 与 RenderTarget。官方列出的完整下载指引值为 Core 8 KB、Math 6 KB、Extras 15 KB、总计 29 KB min+gzip，并称 tree-shaking 后可以更小（[官方仓库](https://github.com/oframe/ogl)）。官方示例覆盖 wireframe、refraction、PBR 和 DoF，可作为实现参考（[OGL examples](https://oframe.github.io/ogl/examples/)）。

它不会像 Three.js 那样直接给出“一行参数得到物理玻璃”的完整高层材质；优势恰恰是我们只带所需基础设施，自己写很短的 vertex/fragment shader。对于当前首页，这比裸 WebGL 更易维护，又比通用引擎更容易守住包体。

景深仍然不是免费功能：需要至少一个颜色 render target、一个深度来源和一个后处理 pass。建议先只做按深度调节 roughness/alpha/边缘柔度；只有视觉评审明确需要散景时才加入 DoF。

### D. Three.js：视觉迭代最快的完整路线

Three.js 的优势是需求几乎都有官方构件：PerspectiveCamera、BoxGeometry、EdgesGeometry/LineSegments、`MeshPhysicalMaterial.transmission`、EffectComposer 和 BokehPass。安装指南推荐 ESM，并要求 controls/loaders/postprocessing 等 addons 显式导入（[官方安装指南](https://threejs.org/manual/en/installation.html)）；当前包也把 addons 与 WebGPU/TSL 入口分开导出（[官方 `package.json`](https://github.com/mrdoob/three.js/blob/dev/package.json)）。

若选择它，应该：

- 使用生产上仍被官方推荐的 `WebGLRenderer`；
- 只导入实际类和实际 addons；
- 仅首页动态加载 3D chunk；
- 限制 drawing buffer 的像素比；
- 下调 transmission render target 分辨率。Three 的 `WebGLRenderer.transmissionResolutionScale` 文档明确指出降低该比例能显著改善 transmission 性能（[官方文档](https://threejs.org/docs/pages/WebGLRenderer.html)）。

`WebGPURenderer` 能自动退回 WebGL 2，并有新的 MRT 与后处理系统；但官方仍将其描述为 experimental，且纯 WebGL 2 应用目前仍推荐 `WebGLRenderer`（[Three WebGPURenderer 指南](https://threejs.org/manual/en/webgpurenderer)）。WebGPU 规范本身还特别提供 `low-power` adapter 偏好，并建议简单几何或小 canvas 优先省电模式（[W3C WebGPU](https://www.w3.org/TR/webgpu/)）。为这个首页直接押注 WebGPU 没有现实收益。

### E. PixiJS：能做，但方向不对

PixiJS 官方定义为 GPU 加速的 **2D** 引擎，WebGL renderer 稳定推荐、WebGPU renderer 仍在成熟（[官方 renderer 指南](https://pixijs.com/8.x/guides/components/renderers)）。它的 Graphics、Mesh、BlurFilter、DisplacementFilter 和自定义 shader 很适合 2.5D 层、粒子和图像扭曲；但没有为普通 3D 场景提供与 OGL/Three 相同的相机、深度和物理材质抽象。

官方还提示 filters 会增加内存与运行成本，应谨慎使用（[Scene Objects](https://pixijs.com/8.x/guides/components/scene-objects)）。如果未来方案转成大量 2D 粒子/图形而不是真正盒子，PixiJS 才值得重新进入候选。

### F. Spline：适合设计原型，不适合严格体积预算

Spline Viewer 是可嵌入的 web component，支持页面全局鼠标 Follow/Look At 与滚动事件，默认 lazy-load canvas（[官方 Viewer 文档](https://docs.spline.design/exporting-your-scene/web/exporting-as-spline-viewer)）。React runtime 还提供默认开启的 `renderOnDemand`（[官方仓库](https://github.com/splinetool/react-spline)）。它能最快做出材质、灯光、玻璃与 DoF，用于视觉方向确认很有价值。

但 Spline 自己的性能指南仍要求减少多边形、对象、材质、灯光与后处理，避免多个 embed，并指出复杂 3D 比普通 2D 页面需要更多处理（[官方优化指南](https://docs.spline.design/exporting-your-scene/how-to-optimize-your-scene)）。runtime 与场景资源也比几行点线数据更难设置严格预算。因此更适合做视觉基准；方向定稿后，再评估保留 Viewer 还是重做为 OGL/Canvas。

### G. 预渲染图像或视频

Spline 可直接导出 PNG/JPG/MP4（[官方 FAQ](https://docs.spline.design/basics/faq)）。如果最终交互只是几像素的鼠标漂移，可以离线渲染高质量玻璃/DoF，再把前景、中景、背景拆成透明 AVIF/WebP 层，用 CSS translate 做视差。这样运行时最稳定、耗电最低，缺点是视角变化不是真正三维，媒体字节可能高于一个小程序。

视频能保留复杂光学动画，但不能随鼠标自由改相机；应该有静态 poster，并避免把大视频阻塞在首屏关键路径。它是“视觉固定”之后的优化方向，不是现在的探索主线。

## 运行时与无障碍预算

不论最终选择哪条路线，都应采用同一套约束：

1. **渐进增强**：先渲染当前首页和静态构图，再加载 3D。3D 失败时，导航卡片与文字完全可用。
2. **只在首页加载**：几何数据、renderer 与 shader 不进入笔记页公共脚本。
3. **按需帧循环**：pointer move 更新目标值并唤醒循环；达到误差阈值后取消下一帧。浏览器通常会暂停后台标签页的 rAF，但我们也应监听可见性（[MDN `requestAnimationFrame`](https://developer.mozilla.org/en-US/docs/Web/API/window/requestAnimationFrame)，[Page Visibility API](https://developer.mozilla.org/en-US/docs/Web/API/Page_Visibility_API)）。
4. **离屏停机**：用 Intersection Observer 在 hero 离开视口时停止更新；它正适合根据用户能否看到结果决定是否执行动画（[MDN](https://developer.mozilla.org/en-US/docs/Web/API/Intersection_Observer_API)）。
5. **限制像素比**：例如 `min(devicePixelRatio, 1.5)`，移动端或低功耗档可以为 1。后处理成本近似随像素数增长。
6. **尊重 reduced motion**：`prefers-reduced-motion: reduce` 时固定镜头，停止鼠标跟随和持续旋转（[MDN](https://developer.mozilla.org/en-US/docs/Web/CSS/Reference/At-rules/%40media/prefers-reduced-motion)）。若存在超过 5 秒、与内容并行且非必要的持续运动，还应提供暂停/停止/隐藏机制（[WCAG 2.2 Pause, Stop, Hide](https://www.w3.org/WAI/WCAG22/Understanding/pause-stop-hide.html)）。
7. **装饰与交互分离**：纯装饰 canvas 使用 `role="presentation"` 或 `aria-hidden="true"`，链接继续使用真实 DOM。若 3D 本身传递信息，则提供 fallback 文本或静态图；Canvas 官方无障碍指南明确要求 fallback content（[MDN](https://developer.mozilla.org/en-US/docs/Web/API/Canvas_API/Tutorial/Basic_usage)）。
8. **自适应档位**：移动端禁用 DoF、降低渲染分辨率；WebGL context 创建失败时直接保留 poster/CSS 版本。

## 与当前 Quartz 站点的集成方式

当前首页已经由 [`PrototypeHome.tsx`](../quartz/components/PrototypeHome.tsx) 单独渲染，并通过组件的 `afterDOMLoaded` 在 Quartz 的 SPA `nav` 事件后初始化。适合的落点是：

- 在 `PrototypeHome` 内添加一个纯装饰 `<canvas>` 或 3D 容器，放在文案/卡片之后的独立层；
- 把渲染实现放进独立的 homepage 脚本模块，不继续扩大 JSX 内的模板字符串；
- 初始化必须幂等，并把 rAF、pointer listener、ResizeObserver、IntersectionObserver、WebGL resources 全部挂入 Quartz 的 `window.addCleanup()`，否则 SPA 导航回来会重复创建；
- 让 canvas `pointer-events: none`，鼠标位置监听 hero/root，避免再次制造现有卡片区曾遇到的鼠标状态闪烁；
- 3D chunk 仅在检测到首页容器后动态导入。静态站和 GitHub Pages 不需要服务端支持；构建阶段仍输出普通 JS/CSS/静态资源。

无论 Canvas 还是 OGL，建议 3D 层不承载导航点击。这样降级时无需在 canvas 里重建 hit-testing 与无障碍 DOM，现有卡片仍然是真实链接。

## 建议的原型验收标准

### 原型 1：Canvas 2D software projection

- 2–4 个长方体/平面，线与面全部实时计算；
- 鼠标最大只改变约 3–6° 视角，带阻尼；
- 风格化透明、边缘高光、最多 3 个离散虚化层；
- 静止 300–500 ms 后停止 rAF；
- reduced-motion 下完全静止；
- 无第三方依赖，构建后新增 gzip JS 设一个小预算（建议先以 10 KB 为警戒线，而非承诺值）。

如果这个版本已经达到视觉目标，选型到此结束。

### 原型 2：OGL refractive material

只有在原型 1 的玻璃明显不够时再做：

- 相同构图和鼠标交互；
- 一个 scene color render target + 一个折射 shader；
- 第一轮不做全屏 DoF，只按深度调柔度；
- 动态导入，测量实际 gzip/Brotli chunk、首屏 LCP、移动端温升和空闲功耗；
- 若必须加入 DoF，再测第二个后处理 pass 的增量，而不是把它与基础版本混在一起。

## 最终推荐

**当前先选“原生 Canvas 2D + 自写三维投影”，并把 OGL 保留为清晰的升级边界。**

这不是因为 Canvas 能实现所有 3D 材质，而是因为现阶段已知需求里，几何很简单、视觉偏点线构成、鼠标只需微调视角；这些恰好是软件投影最有优势的区域。先用它判断“风格化玻璃 + 分层虚化”能否满足设计，比一开始引入通用引擎更符合本站轻量目标。

当且仅当视觉评审确认需要**背景随法线真实扭曲的折射**或**连续深度的散景**时，升级到 **OGL + WebGL shader**。Three.js/Spline 可以用于快速寻找视觉参考，但不作为当前默认生产实现。
