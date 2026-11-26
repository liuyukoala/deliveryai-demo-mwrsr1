# Review Summary

- 本次需求: 为首页第一屏推荐菜模块提供技术契约、改动范围、验证策略和风险控制。
- 需求类型: frontend implementation / static data / i18n / UX quality。
- 变更面: `src/data/menu.ts`、`src/i18n.ts`、`src/components/HomeView.tsx`，可选新增 E2E；不涉及: reducer、路由状态机、购物车、订单、后端、存储、公开 API、依赖升级；待确认: 无阻塞性技术待确认。
- 变更面判断依据: `HomeView` 是首页视图；`menu.ts` 已包含 p1、p2、p3、p5 与图片/文案 key；`i18n.ts` 是 zh/en 资源入口；仓库约定所有业务数据为前端内存态且不引入后端 API。
- 差异判断: 产品形态 / 站点 / 环境 / 版本差异: 不涉及；依据: 单站点 React SPA，hash 路由适配 GitHub Pages 子路径，前端静态数据无多环境契约。
- 本次变更关键信息:
  - 新增显式推荐菜数据选择，锁定 `p1、p2、p3、p5`。
  - 新增推荐模块标题与说明的 zh/en 文案。
  - 在 `HomeView` 第一屏插入纯展示卡片，复用 `money()` 与现有 Tailwind 色板。
  - 不改 reducer、路由、购物车动作和外部契约。
- Review 重点:
  - 导出契约兼容性、i18n key 完整性、首屏布局高度和图片异常降级。
  - 不引入新依赖、后端请求或购物车副作用。
  - lint、typecheck、build 和可选 E2E 覆盖。

# 技术规格书（Spec）: 首页第一屏推荐菜

## 1. 输入与基线

- 产品契约: 同目录 `产品 Spec.md` 的 REQ-001 至 REQ-004。
- Git 基线: `feat/ee16c3a2-wv68` / `c5dc9277b54436ec51449ded8968115603e6fc9c`。
- 仓库约定: React 18 + TypeScript + Vite + Tailwind；页面组件在 `src/components`；新增文案在 `src/i18n.ts` zh/en 同步；不引入 CSS Modules、新 UI 库或后端 API。

## 2. 前端改动范围

| 文件 | 改动 | 契约要求 |
|---|---|---|
| `src/data/menu.ts` | 新增推荐菜选择逻辑或导出 | 首版显式使用 `['p1', 'p2', 'p3', 'p5']`；导出类型为现有 `Product[]`；找不到 ID 时过滤，不新增默认假数据。 |
| `src/i18n.ts` | 新增模块文案 | 新增 `bind.recommend_title` 和 `bind.recommend_desc`，zh/en 同步；不得改变既有 key。 |
| `src/components/HomeView.tsx` | 首屏插入推荐菜模块 | 只读取静态数据和 `t()`；不调用 `onBind()` 以外的导航副作用；不派发购物车 action。 |
| `e2e/home-recommendations.spec.ts` | 可选新增 | 覆盖首屏可见、无卡片跳转/加购副作用、语言切换和桌台入口可用。 |

不修改：`App.tsx`、`useViewRoute`、`orderReducer`、菜单页、购物车、订单、结账、服务呼叫、Tailwind 配置、依赖清单和 `server/`。

## 3. 内部数据契约

- 推荐导出建议命名为 `recommendedProducts`，类型沿用现有 `Product[]`。
- 推荐集合显式声明为 `['p1', 'p2', 'p3', 'p5']`，不按 `badge` 自动过滤。
- 每个元素必须能提供 `id`、`name`、`description`、`image`、`price`、`badge`。当前四项均满足；若未来元素缺 `badge`，UI 需安全省略徽章，不产生运行时错误。
- 价格展示必须复用 `src/lib/utils.ts` 的 `money()`，保持现有人民币格式。

示例契约：

```ts
const recommendedProductIds = ['p1', 'p2', 'p3', 'p5'] as const

export const recommendedProducts = recommendedProductIds
  .map((id) => getProduct(id))
  .filter((product): product is Product => Boolean(product))
```

## 4. UI 与状态实现规则

1. 在 `HomeView` 第一屏渲染 `<section>`，标题使用 `bind.recommend_title`，说明使用 `bind.recommend_desc`。
2. 卡片内容使用 `t(product.name)`、`t(product.description)`、`t(product.badge)` 和 `money(product.price)`。
3. `<img>` 的 `alt` 使用 `t(product.name)`，`src` 使用现有本地导入图片；可使用 `loading="lazy"` 或 `decoding="async"`，不新增远端资源。
4. 推荐卡不使用 `<button>` 语义声明“加购/下单”，也不注册路由跳转；可仅作静态展示或无副作用 hover 反馈。
5. 图片加载失败可用 `onError` 隐藏图片并保留文本卡片；不得阻断组件树或桌台卡片渲染。
6. 桌面端建议 4 列或 2x2 紧凑网格；移动端建议横向滑动或 2 列小卡，避免纵向卡片堆叠把桌台入口推得过低。
7. 样式仅使用现有 Tailwind 类和自定义色板，不新增 CSS 文件、CSS Modules、UI 库或 dark mode。

## 5. i18n 契约

| Key | zh | en |
|---|---|---|
| `bind.recommend_title` | `今日推荐菜` | `Today’s Recommendations` |
| `bind.recommend_desc` | `选好桌台后，可在点餐页加入购物车` | `Choose a table, then add dishes in the menu` |

菜品名称、描述和徽章继续使用 `menu.*` 既有 key；价格由 `money()` 渲染，不将价格写入翻译资源。

## 6. API / 后端 / 存储

- 不新增 HTTP API、RPC、SDK、Webhook 或环境变量。
- 不修改 localStorage key、Cookie、server 端点或数据库。
- 不新增 feature flag；功能随前端版本发布，如需应急处理可直接回滚前端 commit。

## 7. 测试策略

### 必须执行
- `npm run lint`
- `npx tsc -b --noEmit`
- `npm run build`

若依赖未安装，先按仓库约定执行 `npm ci` 或 `npm install`。

### E2E 验收建议
- 打开 `/#/home`，断言推荐模块、四道推荐菜的关键信息和推荐标签可见。
- 断言“快速进入 A08 桌”等桌台入口仍可见、可点击且行为不变。
- 切换 zh/en，断言推荐模块文案更新且页面不重载。
- 模拟推荐图片加载失败，断言名称、价格、标签和桌台入口仍可用。
- 如实现卡片区分为可点击元素，断言点击后 URL 仍为 `/#/home` 且购物车数量不变。

### 手工检查
- 常见移动、平板、桌面视口检查首屏可读性。
- 老人模式开启后检查文字层级与可读性。
- Network 面板确认未新增后端或外站请求。

## 8. 部署与回滚

- 无独立数据库迁移、环境配置或 feature flag。
- 前端构建产物继续按现有 GitHub Pages /静态部署流程发布。
- 回滚方式为回退包含本需求的前端 commit 并重新构建发布；无数据回填或兼容性迁移动作。

## 9. 风险与控制

| 风险 | 影响 | 控制 |
|---|---|---|
| 按徽章自动过滤导致未来推荐内容变化 | 首屏内容不可控 | 使用显式 ID 列表并过滤不存在的 ID。 |
| 首屏高度增加挤压桌台入口 | 影响主流程可用性 | 移动端使用紧凑卡/横向滑动，并加入首屏与入口可见性验收。 |
| 图片加载失败或重复图片导致体验下降 | 模块可读性受损 | 文本降级保留核心信息；如需视觉差异另走设计确认。 |
| 文案 zh/en 缺失或 key 拼写错误 | 用户看到原始 key | lint/typecheck 之外增加语言切换手工或 E2E 检查。 |
| 误加购物车或路由副作用 | 绕过桌台绑定 | 首页推荐卡只渲染展示信息，不绑定 order/cart action。 |
