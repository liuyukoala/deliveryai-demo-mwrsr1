# Review Summary

- 本次需求: 在火锅点单演示应用首页 `#/home` 第一屏新增推荐菜模块，使用户进入首页后无需滚动即可看到推荐菜。
- 需求类型: UX / frontend change。
- 变更面: 首页第一屏推荐菜模块的展示、状态、文案、响应式与可访问性；不涉及: 菜单页、购物车、订单、履约、结账、服务呼叫、对外 API、后端存储、埋点；待确认: 最终推荐清单是否由业务方另行指定、推荐卡是否需要后续点击直达点餐页。
- 变更面判断依据: 需求描述明确指向首页第一屏；`src/components/HomeView.tsx` 是首页视图且当前无菜品展示；`src/data/menu.ts` 已有 p1、p2、p3、p5 的名称、价格、描述、图片和推荐徽章；`src/i18n.ts` 已有 zh/en 与推荐语义标签。
- 差异判断: 产品形态 / 站点 / 环境 / 版本差异: 不涉及；依据: 目标仓库为单站点 React SPA 演示应用，数据为前端内存态，无多站点或版本化后端契约。
- 本次变更关键信息:
  - 新增第一屏推荐菜模块，首版默认展示 p1、p2、p3、p5。
  - 推荐卡仅展示引导信息，不提供首页加购、不跳转、不绕过桌台绑定。
  - 图片加载失败时保留名称、价格和推荐标签；推荐模块不可用时桌台入口继续可用。
  - 新增模块标题与说明文案必须同步 zh/en。
- Review 重点:
  - 首屏推荐菜可见性是否会挤压桌台选择与快速进入入口。
  - p1、p2、p3、p5 是否符合业务预期。
  - 中英文切换、图片异常降级、移动端布局与可访问性。

## Scope Note

- Implemented sections: Context, Goals and Non-Goals, Functional Requirements, UX Design, NFR / DFX。
- Not involved: API Design, Backend/Data, Metrics, Traceability。
- Needs confirmation: 最终推荐菜清单、推荐卡后续点击行为。
- Reason: 需求和仓库证据表明这是首页前端 UX 变更；静态菜单已提供推荐数据，未发现后端、公开 API、存储或指标变更证据。

# Spec: 首页第一屏增加推荐菜

## 1. Context

- 上游输入: 「需求澄清 spec」与「PRD 文档」已确认目标、范围、业务规则、边界和首版推荐候选。
- 本 Spec 增量: 将“第一屏可见”细化为首屏渲染后无需滚动即可识别推荐模块和关键信息；明确图片异常降级、语言切换、桌台入口保底和可访问性验收；确认推荐菜只做展示引导。
- 用户价值: 顾客进入首页即可了解门店特色菜，降低进入菜单后的选择成本。
- 代码基线: `feat/ee16c3a2-wv68` / `c5dc927`。`HomeView` 当前只包含品牌、亮点、门店、桌台与快速进入内容；`menu.ts` 中 p1、p2、p3、p5 已带 `popular`、`signature`、`chef`、`new` 推荐语义徽章。

## 2. Goals and Non-Goals

### Goals
- 沿用需求澄清文档目标：首屏展示推荐菜，保持中英文可读和常见设备适配。
- Spec 阶段新增收窄：推荐菜模块只负责第一屏引导，不承载加购或导航职责。
- 桌台绑定仍是进入点餐前的核心动作，推荐模块不得阻断该流程。

### Non-Goals
- 沿用需求澄清文档的非目标：不改菜单页、购物车、订单、履约、结账和服务呼叫；不做推荐算法、运营后台或远程配置。
- Spec 阶段补充排除：不做首页直接加购、自动跳转、新公开 API、埋点和新增业务数据存储。

## 3. Functional Requirements

### REQ-001: 首屏可见的推荐菜模块

- User Story: 作为进入首页的顾客，我希望无需滚动就能看到推荐菜，以便更快了解门店特色并准备点餐。
- Priority: P0
- Description: `#/home` 完成渲染后，第一屏应展示推荐菜模块。首版展示 p1、p2、p3、p5；每张卡片至少展示图片、本地化名称、价格和推荐标签，可展示一句话卖点。

Acceptance Requirements (EARS):
- REQ-001.1: The system shall render the recommendation module within the initial viewport of `#/home` without requiring page scroll.
- REQ-001.2: When p1、p2、p3、p5 exist in the static menu, the system shall display each dish's image, localized name, price, and localized recommendation badge.
- REQ-001.3: If a recommendation image fails to load, the system shall retain the dish name, price, and badge so the module remains readable and does not block table binding.

Gherkin:
```gherkin
Scenario: 用户进入首页即可看到推荐菜
  Given 用户打开 "#/home"
  When 首页完成渲染且用户未滚动
  Then 用户能看到推荐菜模块
  And 模块内展示 p1、p2、p3、p5 的名称、价格和推荐标签
  When 用户查看任意推荐图片
  Then 图片具有与菜品名称一致的替代文本
```

### REQ-002: 推荐菜为展示引导，不改变下单主流程

- User Story: 作为门店用户，我需要先绑定桌台再进入点餐，以便购物车和订单归属到正确桌台。
- Priority: P0
- Description: 推荐菜卡片不得创建购物车项、自动导航或绕过桌台绑定；现有桌台选择和快速进入 A08 桌流程保持不变。

Acceptance Requirements (EARS):
- REQ-002.1: The system shall not create a cart item from the home recommendation module.
- REQ-002.2: When the user interacts with a recommendation card, the system shall keep the user on `#/home`.
- REQ-002.3: When the user selects a table or uses quick entry for A08, the system shall preserve the existing table-binding flow.
- REQ-002.4: If the recommendation module cannot render, the system shall continue to show and operate the table-binding entry points.

Gherkin:
```gherkin
Scenario: 推荐菜不绕过桌台绑定
  Given 用户在首页看到推荐菜卡片
  When 用户点击某个推荐菜卡片
  Then 系统不创建购物车项
  And 系统不进入点餐页
  When 用户选择桌台或点击快速进入 A08 桌
  Then 系统按现有流程绑定桌台并进入后续流程
```

### REQ-003: 中英文文案与推荐标签复用

- User Story: 作为中文或英文用户，我希望推荐菜信息使用我能理解的语言和标签，以便理解推荐理由。
- Priority: P1
- Description: 菜品名称、描述、价格和推荐标签复用现有数据与 i18n 机制；模块标题和引导说明新增文案必须同步 zh/en，并跟随当前语言切换。

Acceptance Requirements (EARS):
- REQ-003.1: When the app language is zh or en, the system shall display localized recommendation title, helper copy, dish name, badge, and selling point.
- REQ-003.2: When the user switches language on `#/home`, the system shall update recommendation copy without reloading the application.

Gherkin:
```gherkin
Scenario: 切换语言后推荐菜文案同步更新
  Given 用户在 "#/home" 看到推荐菜模块
  When 用户将应用语言从中文切换到英文
  Then 模块标题、说明、菜品名称和推荐标签更新为英文
  And 页面不重载且模块保持可见
```

### REQ-004: 响应式与可访问性

- User Story: 作为不同设备和能力的用户，我希望推荐菜在常见屏幕上清晰可读，并可被辅助技术识别。
- Priority: P1
- Description: 推荐模块应适配常见移动端和桌面视口，保持现有浅色主题、色板和老人模式能力；图片使用本地化替代文本，卡片信息语义清晰。

Acceptance Requirements (EARS):
- REQ-004.1: The system shall keep recommendation text legible on common mobile and desktop viewport widths.
- REQ-004.2: The system shall keep table selection and quick entry visible and operable after the recommendation module is added.
- REQ-004.3: When a recommendation image is rendered, the system shall provide meaningful alternative text for the dish image.
- REQ-004.4: If the recommendation module is hidden or degraded, the system shall preserve the existing home routing and table-binding behavior.

Gherkin:
```gherkin
Scenario: 移动端首屏可读且桌台入口可用
  Given 用户使用常见移动视口打开 "#/home"
  When 首页完成渲染
  Then 推荐菜模块的关键信息清晰可读
  And 桌台选择或快速进入入口仍可操作
```

## 4. UX Design

### 体验目标与原则
- 首屏同时传达“门店有推荐菜”和“选桌后才能点餐”两个信息。
- 模块轻量、清晰，不遮挡或替代桌台选择；不使用“立即加购”“去下单”等可能误导用户的按钮文案。
- 建议模块标题为“今日推荐菜 / Today’s Recommendations”，说明为“选好桌台后，可在点餐页加入购物车 / Choose a table, then add dishes in the menu”。

### 页面与模块范围
- 仅修改 `#/home` 第一屏。
- 推荐模块可放置在品牌亮点与门店/桌台卡片之间，或门店卡片内的上方区域；最终布局以不挤压桌台入口为准。
- 卡片内容：图片、菜品名、价格、推荐标签、一句话卖点。推荐标签沿用：
  - `menu.badge.popular` = 人气 No.1 / Popular No.1。
  - `menu.badge.signature` = 招牌 / Signature。
  - `menu.badge.chef` = 主厨推荐 / Chef's Pick。
  - `menu.badge.new` = 新品 / New。

### 核心路径
1. 用户打开 `#/home`。
2. 首屏识别推荐菜名称、价格和推荐理由。
3. 用户选择桌台或快速进入 A08 桌。
4. 系统进入现有 welcome/menu 流程，用户在点餐页完成加购。

### 分支路径与状态
- 数据状态：使用现有静态菜单，无 loading、远端失败和空态请求流程。
- 图片异常：保留文本或使用占位视觉，保持卡片可读。
- 模块不可用：桌台入口和路由行为不受影响。
- 老人模式：沿用现有全局字号、对比度和过渡行为，不新增独立开关。

### 视觉与响应式约束
- 使用现有 rice、charcoal、chili、amber 色板、圆角、阴影和 Tailwind 风格。
- 桌面端可用 4 列或 2x2 紧凑网格；移动端可用 2 列紧凑网格或横向滑动，优先保证模块与桌台入口都可理解。
- 不引入 dark mode、CSS Modules、额外 UI 库或远端图片。

## 5. Backend/Data

本需求不涉及后端行为、数据结构、存储、权限、状态流转或迁移变更。

## 6. API Design

本需求不涉及对外 API、SDK、Webhook、CLI 或客户集成契约变更。

## 7. Metrics

本需求不涉及新增或变更埋点、日志、Dashboard 或指标口径。

## 8. NFR / DFX

| 类别 | 要求 | 验收方法 |
|---|---|---|
| 性能 | 复用现有静态数据和本地图片资源，不新增远端请求、新 UI 依赖或重量级首屏资源。 | 检查实现 diff 与网络面板，确认无新增 API、CDN 或 dependency。 |
| 兼容性 | 保持现有 hash 路由、深链接、zh/en 切换、老人模式和响应式行为。 | 在 `#/home` 和语言/老人模式/常见视口切换下验证。 |
| 可用性 | 推荐模块不阻断桌台绑定；图片或模块异常时可降级。 | 模拟图片加载失败并验证桌台入口可操作。 |
| 可访问性 | 图片提供替代文本，标题、卡片和文本保持语义层级与可读对比度。 | 检查 alt、标题层级和关键文本对比度。 |

## 9. Open Questions

| ID | 问题 | 影响 | 建议负责人 |
|---|---|---|---|
| OQ-001 | 首版推荐菜是否最终确定为 p1、p2、p3、p5？ | 首屏内容与业务预期；当前按澄清文档默认清单执行 | PM |
| OQ-002 | 推荐卡是否需要在后续版本点击直达点餐页并定位菜品？ | 当前交互范围；当前按不跳转执行 | PM / RD |

## 10. 技术侧重点评估事项

- 推荐数据建议使用显式 `p1、p2、p3、p5` 列表，而不是按徽章自动过滤，避免后续新增徽章菜品导致首页内容意外变化。
- 需评估移动端新增卡片后的首屏高度，必要时使用横向滑动或紧凑卡片保住桌台入口可见性。
- p1 和 p5 当前共用 hotpot 图片，若业务要求视觉差异，需由设计侧确认；本 Spec 不要求新增图片资产。
- E2E 建议覆盖首屏可见、卡片无导航/无加购、zh/en 切换、图片异常降级和桌台入口可用。
