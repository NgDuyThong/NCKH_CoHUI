/**
 * E2E Test Helpers
 * Utilities cho Playwright tests
 */

/**
 * Login helper
 */
export async function login(page, email, password) {
  await page.goto('/login');
  await page.fill('input[name="email"]', email);
  await page.fill('input[name="password"]', password);
  await page.click('button[type="submit"]');
  await page.waitForLoadState('networkidle');
}

/**
 * Login as admin
 */
export async function loginAsAdmin(page) {
  await login(page, 'admin@test.com', 'Admin123!');
}

/**
 * Login as customer
 */
export async function loginAsCustomer(page) {
  await login(page, 'customer@test.com', 'Customer123!');
}

/**
 * Logout helper
 */
export async function logout(page) {
  await page.click('button:has-text("Đăng xuất")');
  await page.waitForURL('**/login');
}

/**
 * Add product to cart
 */
export async function addToCart(page, productId) {
  await page.goto(`/products/${productId}`);
  await page.click('button:has-text("Thêm vào giỏ")');
  await page.waitForTimeout(1000);
}

/**
 * Wait for toast message
 */
export async function waitForToast(page, message) {
  await page.waitForSelector(`.Toastify__toast:has-text("${message}")`);
}

/**
 * Clear cart
 */
export async function clearCart(page) {
  await page.goto('/cart');
  const removeButtons = await page.locator('button:has-text("Xóa")').all();
  for (const button of removeButtons) {
    await button.click();
    await page.click('button:has-text("Xác nhận")');
  }
}
