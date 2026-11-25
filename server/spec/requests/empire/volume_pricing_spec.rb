# frozen_string_literal: true

require 'rails_helper'

# Volume pricing is what makes the B2B tier usable: a buyer needs to see what 50
# cartons cost before filling a cart. Spree 6 expresses a quantity break as a
# band on a price list, and a list applies only to the buyer it was written for —
# which is exactly the property these specs pin down.
RSpec.describe 'Empire volume pricing API', type: :request do
  let(:product) { create(:product, store: empire_store, name: 'پارچه عمده') }
  let(:variant) { product.default_variant }
  let(:guest_headers) { { 'X-Spree-Api-Key' => publishable_key.token } }

  before do
    variant.prices.where(currency: 'AFN').destroy_all
    create(:price, variant: variant, currency: 'AFN', amount: BigDecimal('1000'))
  end

  # A list with bands, attached to a company the buyer belongs to.
  def company_ladder(customer: nil)
    company = create(:company, store: empire_store)
    create(:company_membership, company: company, customer: customer) if customer

    price_list = create(:price_list, store: empire_store, name: 'عمده', status: 'active',
                                     currency: 'AFN', price_adjustment_percentage: BigDecimal('-10'))
    price_list.price_adjustment_tiers.create!(min_quantity: 10, percentage: BigDecimal('-20'))
    price_list.price_adjustment_tiers.create!(min_quantity: 50, percentage: BigDecimal('-30'))
    create(:price, variant: variant, currency: 'AFN', amount: nil, price_list: price_list)
    company
  end

  it 'reports only the buyer price to a guest, with no ladder' do
    company_ladder

    get "/api/v3/store/empire/variants/#{variant.prefixed_id}/volume_pricing", headers: guest_headers
    expect_status!(200)

    expect(body_json['currency']).to eq('AFN')
    expect(body_json['resolved_amount']).to eq('1000.00')
    # A guest has no agreement, so there is no ladder to show — and in particular
    # no glimpse of the discount another buyer negotiated.
    expect(body_json['price_list_applied']).to be(false)
    expect(body_json['tiers']).to eq([])
  end

  it 'gives a company buyer the bands their own agreement grants' do
    customer = create(:customer)
    company = company_ladder(customer: customer)

    # The buyer is identified the way checkout identifies them: a store JWT plus
    # a cart that carries the company. Pricing has no other way to know who is
    # asking, which is the whole reason a guest gets a single price.
    cart = create(:cart, store: empire_store, customer: customer, company: company, currency: 'AFN')
    get "/api/v3/store/empire/variants/#{variant.prefixed_id}/volume_pricing",
        params: { quantity: 50, cart_id: cart.prefixed_id }, headers: store_headers(customer)
    expect_status!(200)

    expect(body_json['price_list_applied']).to be(true)
    expect(body_json['resolved_amount']).to eq('700.00')
    amounts = body_json['tiers'].to_h { |tier| [tier['min_quantity'], tier['amount']] }
    expect(amounts[50]).to eq('700.00')
  end

  it 'formats every amount as a plain decimal string' do
    company_ladder

    get "/api/v3/store/empire/variants/#{variant.prefixed_id}/volume_pricing", headers: guest_headers
    expect_status!(200)
    expect(body_json['resolved_amount']).to match(/\A\d+\.\d{2}\z/)
  end

  it 'ignores a nonsense quantity rather than pricing it' do
    get "/api/v3/store/empire/variants/#{variant.prefixed_id}/volume_pricing",
        params: { quantity: -4 }, headers: guest_headers
    expect_status!(200)
    expect(body_json['quantity_resolved']).to be_nil
    expect(body_json['resolved_amount']).to eq('1000.00')
  end

  it "does not price another store's variant" do
    other_product = create(:product, store: create(:store, default: false))
    get "/api/v3/store/empire/variants/#{other_product.default_variant.prefixed_id}/volume_pricing",
        headers: guest_headers
    expect_status!(404)
  end

  it 'refuses an unknown variant id' do
    get '/api/v3/store/empire/variants/variant_nope/volume_pricing', headers: guest_headers
    expect_status!(404)
  end
end
