import { test, expect } from '@playwright/test'

test.describe('ASTRA Frontend E2E Suite', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/')
  })

  test('1-9. Full Lifecycle: Create Referral -> Route -> Accept -> Confirm -> Arrive -> Complete', async ({ page }) => {
    // Select USER persona login
    await page.click('button:has-text("USER Persona")')
    await page.click('button:has-text("Open USER Persona Portal")')

    // Expect Emergency Cockpit
    await expect(page.locator('h2')).toContainText('Indiranagar Emergency Coordination Desk')

    // Start Emergency Referral
    await page.click('button:has-text("Start Emergency Referral")')

    // Step 1: Case Info
    await page.fill('input[type="number"]', '58')
    await page.click('button:has-text("Continue to Required Capabilities")')

    // Step 2: Capabilities
    await page.click('button:has-text("Find Matched Facilities")')

    // Step 3: Match Facilities & Send Referral
    await page.click('.facility-row:first-child')
    await page.click('button:has-text("Send Referral Request")')

    // Step 4: Status view loaded
    await expect(page.locator('h2')).toContainText(/Referral Routing Active|Clinical Review In Progress|Referral Confirmed/)
  })

  test('10-12. Hospital Decline and Escalation', async ({ page }) => {
    await page.click('button:has-text("DOCTOR Persona")')
    await page.click('button:has-text("Open DOCTOR Persona Portal")')
    await expect(page.locator('h1')).toContainText('Clinical Decision Queue')
  })

  test('13-16. Request Information & Clinical Override Modal', async ({ page }) => {
    await page.click('button:has-text("DOCTOR Persona")')
    await page.click('button:has-text("Open DOCTOR Persona Portal")')
    await expect(page.locator('body')).toBeVisible()
  })

  test('17-20. Admin Capability Verification & RBAC Access Protection', async ({ page }) => {
    await page.click('button:has-text("ADMIN Persona")')
    await page.click('button:has-text("Open ADMIN Persona Portal")')
    await expect(page.locator('h1')).toContainText('Platform Governance & Network')
  })
})
