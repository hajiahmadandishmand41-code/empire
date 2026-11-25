# frozen_string_literal: true

require 'rails_helper'

# Volume pricing is what makes the B2B tier of the marketplace usable: a buyer
# needs to see what 50 cartons cost before filling a cart. The Store API's
# product payload only carries the price for the current context, so this
# endpoint asks Spree's own resolver for each tier quantity.
RSpec.describe 'Empire volume pricing API', type: :request do
  let(:product) { create(:product, store: empire_store, name: 'پارچه عمده') }
  let(:variant) { product.default_variant }
  let(:headers) { { 'X-Spree-Api-Key' => publishable_key.token } }

  before do
    variant.prices.where(currency: 'AFN').destroy_all
    create(:price, variant: variant, currency: 'AFN', amount: BigDecimal('1000'), min_quantity: 1)
    create(:price, variant: variant, currency: 'AFN', amount: BigDecimal('900'), min_quantity: 10)
    create(:price, variant: variant, currency: 'AFN', amount: BigDecimal('800'), min_quantity: 50)
  end

  it 'answers a guest with the ladder the pricing resolver would charge' do
    get "/api/v3/store/empire/variants/#{variant.prefixed_id}/volume_pricing", headers: headers
    expect_status!(200)

    expect(body_json['currency']).to eq('AFN')
    amounts = body_json['tiers'].to_h { |tier| [tier['min_quantity'], tier['amount']] }
    expect(amounts[1]).to eq('1000.00')
    expect(amounts[10]).to eq('900.00')
    expect(amounts[50]).to eq('800.00')
  end

  it 'resolves the price for a stated quantity' do
    get "/api/v3/store/empire/variants/#{variant.prefixed_id}/volume_pricing",
        params: { quantity: 50 }, headers: headers
    expect_status!(200)
    expect(body_json['resolved_amount']).to eq('800.00')
    expect(body_json['quantity_resolved']).to eq(50)
  end

  it 'ignores a nonsense quantity rather than pricing it' do
    get "/api/v3/store/empire/variants/#{variant.prefixed_id}/volume_pricing",
        params: { quantity: -4 }, headers: headers
    expect_status!(200)
    expect(body_json['quantity_resolved']).to be_nil
    expect(body_json['resolved_amount']).to eq('1000.00')
  end

  it "does not price another store's variant" do
    other_product = create(:product, store: create(:store, default: false))
    get "/api/v3/store/empire/variants/#{other_product.default_variant.prefixed_id}/volume_pricing",
        headers: headers
    expect_status!(404)
  end

  it 'refuses an unknown variant id' do
    get '/api/v3/store/empire/variants/variant_nope/volume_pricing', headers: headers
    expect_status!(404)
  end
end
