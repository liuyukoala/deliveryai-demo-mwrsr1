import { test, expect } from '@playwright/test'

test.describe('首页推荐菜 - E2E 验收测试', () => {
  test('REQ-001: 首页第一屏渲染推荐菜模块和四道推荐菜', async ({ page }) => {
    await page.goto('/#/home')
    const recommendations = page.getByRole('region', { name: '今日推荐菜' })
    await expect(recommendations.getByRole('heading', { name: '今日推荐菜' })).toBeVisible()
    await expect(recommendations.getByText('选好桌台后，可在点餐页加入购物车').first()).toBeVisible()

    for (const name of ['鎏金番茄鸳鸯锅', '牛油麻辣锅', '琥珀嫩牛肉', '鲜虾滑']) {
      const dish = recommendations.getByRole('heading', { name })
      await expect(dish).toBeVisible()
      await expect(dish).toBeInViewport()
      await expect(recommendations.getByRole('img', { name })).toBeVisible()
    }
  })

  test('REQ-002: 推荐菜点击不跳转且桌台快速进入流程不变', async ({ page }) => {
    await page.goto('/#/home')
    const recommendations = page.getByRole('region', { name: '今日推荐菜' })
    const dish = recommendations.getByRole('heading', { name: '鎏金番茄鸳鸯锅' })
    await dish.click()
    await expect(page).toHaveURL(/#\/home$/)
    await expect(page.getByRole('heading', { name: '想吃什么，一起点。' })).not.toBeVisible()

    await page.getByRole('button', { name: '快速进入 A08 桌' }).click()
    await expect(page).toHaveURL(/#\/welcome$/)
  })

  test('REQ-003: 切换英文后推荐菜文案同步更新且不重载', async ({ page }) => {
    await page.addInitScript(() => localStorage.setItem('i18nextLng', 'en'))
    await page.goto('/#/home')
    const recommendations = page.getByRole('region', { name: "Today's Recommendations" })

    await expect(recommendations.getByRole('heading', { name: "Today's Recommendations" })).toBeVisible()
    await expect(recommendations.getByText('Choose a table, then add dishes in the menu').first()).toBeVisible()
    await expect(recommendations.getByRole('heading', { name: 'Golden Tomato Dual-Flavor Pot' })).toBeVisible()
    await expect(page).toHaveURL(/#\/home$/)
  })

  test('REQ-004: 推荐图片加载失败时保留名称、价格和标签', async ({ page }) => {
    await page.route('**/*.jpg', route => route.abort())
    await page.goto('/#/home')
    const recommendations = page.getByRole('region', { name: '今日推荐菜' })
    await expect(recommendations.getByText('鎏金番茄鸳鸯锅')).toBeVisible()
    await expect(recommendations.getByText('¥68.00')).toBeVisible()
    await expect(recommendations.getByText('人气 No.1')).toBeVisible()
    await expect(recommendations.getByText('琥珀嫩牛肉')).toBeVisible()
    await expect(recommendations.getByText('主厨推荐')).toBeVisible()
    await expect(page.getByRole('button', { name: '快速进入 A08 桌' })).toBeVisible()
  })
})
