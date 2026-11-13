import { expect, test } from 'vitest'
import lock from '../pnpm-lock.yaml?raw'
import routes from './routeTree.gen.ts?raw'

test.each([
  '/$storeId/sellers',
  '/$storeId/sellers/commission-rates',
  '/$storeId/sellers/payouts',
  '/$storeId/companies',
  '/$storeId/products/catalogs',
])('native Spree 6 admin route is composed: %s', (path) => {
  expect(routes).toContain(`'${path}'`)
})

test('the admin shell is locked to the audited Spree release', () => {
  expect(lock).toContain("'@spree/dashboard@6.0.4")
  expect(lock).toContain("'@spree/admin-sdk@6.0.4")
})
