import { expect, test } from 'vitest'
import lock from '../pnpm-lock.yaml?raw'
import routes from './routeTree.gen.ts?raw'

test.each(['/$sellerId/orders', '/$sellerId/products', '/$sellerId/payouts', '/$sellerId/profile'])(
  'native Spree 6 seller route is composed: %s',
  (path) => {
    expect(routes).toContain(`'${path}'`)
  },
)

test('the seller shell is locked to the audited Spree release', () => {
  expect(lock).toContain("'@spree/seller-dashboard@6.0.4")
  expect(lock).toContain("'@spree/seller-sdk@6.0.4")
})
