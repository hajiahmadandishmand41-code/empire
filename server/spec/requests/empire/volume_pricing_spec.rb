# frozen_string_literal: true

require 'rails_helper'

# Volume pricing is what makes the B2B tier usable: a buyer needs to see what 50
# cartons cost before filling a cart. Spree 6 keeps a variant's ladder as rows on
# a price list, and a list reaches a buyer through their company's catalog — so
# the specs pin down both the ladder and the entitlement.
RSpec.describe 'Empire volume pricing API', type: :request do
  let(:product) { create(:product, store: empire_store, name: 'پارچه عمده') }
  let(:variant) { product.default_variant }
  let(:guest_headers) { { 'X-Spree-Api-Key' => publishable_key.token } }

  before do
    variant.prices.where(currency: 'AFN').destroy_all
    # The shop price: what anyone without an agreement pays.
    create(:price, variant: variant, currency: 'AFN', amount: BigDecimal('1000'))
  end

  # A negotiated ladder on a list reached through a company catalog, in the shape
  # the admin API creates it: a percentage off the base price, plus bands that
  # replace that percentage from a quantity up. This is the same payload the
  # end-to-end journey sends.
  def company_catalog_ladder(customer)
    company = create(:company, store: empire_store)
    create(:company_membership, company: company, customer: customer)

    catalog = create(:catalog, store: empire_store, name: 'عمده', active: true)
    # The catalog is the audience: assigned to the company, it reaches that
    # company's buyers and nobody else.
    create(:catalog_assignment, catalog: catalog, assignable: company)

    price_list = create(:price_list, store: empire_store, name: 'عمده', status: 'active',
                                     catalog: catalog, match_policy: 'all',
                                     price_adjustment_percentage: BigDecimal('-10'))
    price_list.price_adjustment_tiers.create!(min_quantity: 10, percentage: BigDecimal('-20'))

    { company: company, catalog: catalog, price_list: price_list }
  end

  # A ladder written as explicit rows instead — a negotiated amount per band,
  # which Spree reads through the same resolver.
  def explicit_row_ladder(customer)
    terms = company_catalog_ladder(customer)
    list = terms[:price_list]
    list.update!(price_adjustment_percentage: nil)
    list.price_adjustment_tiers.destroy_all
    create(:price, variant: variant, currency: 'AFN', amount: BigDecimal('1000'),
                   min_quantity: 1, price_list: list)
    create(:price, variant: variant, currency: 'AFN', amount: BigDecimal('850'),
                   min_quantity: 25, price_list: list)
    terms
  end

  it 'reports only the shop price to a guest, with no ladder' do
    company_catalog_ladder(create(:customer))

    get "/api/v3/store/empire/variants/#{variant.prefixed_id}/volume_pricing", headers: guest_headers
    expect_status!(200)

    expect(body_json['currency']).to eq('AFN')
    expect(body_json['resolved_amount']).to eq('1000.00')
    # A guest has no agreement, so there is no ladder to show — and in
    # particular no glimpse of the discount another buyer negotiated.
    expect(body_json['price_list_applied']).to be(false)
    expect(body_json['tiers']).to eq([])
  end

  it 'gives a company buyer the rungs their own agreement grants' do
    customer = create(:customer)
    terms = company_catalog_ladder(customer)
    cart = create(:cart, store: empire_store, customer: customer, company: terms[:company],
                         currency: 'AFN')

    get "/api/v3/store/empire/variants/#{variant.prefixed_id}/volume_pricing",
        params: { quantity: 50, cart_id: cart.prefixed_id }, headers: store_headers(customer)
    expect_status!(200)

    expect(body_json['price_list_applied']).to be(true)
    # The quotient at fifty units is the deepest band: -20% off the shop price.
    expect(body_json['resolved_amount']).to eq('800.00')
    amounts = body_json['tiers'].to_h { |tier| [tier['min_quantity'], tier['amount']] }
    # -10% for one unit, then -20% from ten.
    expect(amounts[1]).to eq('900.00')
    expect(amounts[10]).to eq('800.00')
  end

  it 'reads a ladder written as explicit rows on the list too' do
    customer = create(:customer)
    terms = explicit_row_ladder(customer)
    cart = create(:cart, store: empire_store, customer: customer, company: terms[:company],
                         currency: 'AFN')

    get "/api/v3/store/empire/variants/#{variant.prefixed_id}/volume_pricing",
        params: { quantity: 25, cart_id: cart.prefixed_id }, headers: store_headers(customer)
    expect_status!(200)

    expect(body_json['resolved_amount']).to eq('850.00')
    expect(body_json['tiers'].map { |tier| tier['min_quantity'] }).to eq([1, 25])
  end

  it 'treats a band that changes nothing as no offer at all' do
    customer = create(:customer)
    terms = company_catalog_ladder(customer)
    cart = create(:cart, store: empire_store, customer: customer, company: terms[:company],
                         currency: 'AFN')
    # A second band at the same percentage is a plateau, not a volume offer.
    terms[:price_list].price_adjustment_tiers.create!(min_quantity: 100, percentage: BigDecimal('-20'))

    get "/api/v3/store/empire/variants/#{variant.prefixed_id}/volume_pricing",
        params: { cart_id: cart.prefixed_id }, headers: store_headers(customer)
    expect_status!(200)
    expect(body_json['tiers'].map { |tier| tier['min_quantity'] }).to eq([1, 10])
  end

  it 'never shows one company the ladder of another' do
    terms = company_catalog_ladder(create(:customer))
    outsider = create(:customer)
    cart = create(:cart, store: empire_store, customer: outsider, currency: 'AFN')

    get "/api/v3/store/empire/variants/#{variant.prefixed_id}/volume_pricing",
        params: { quantity: 50, cart_id: cart.prefixed_id }, headers: store_headers(outsider)
    expect_status!(200)

    expect(body_json['price_list_applied']).to be(false)
    expect(body_json['tiers']).to eq([])
    expect(body_json['resolved_amount']).to eq('1000.00')
    expect(terms[:price_list].name).to eq('عمده')
  end

  it "refuses another buyer's cart rather than pricing for them" do
    customer = create(:customer)
    company_catalog_ladder(customer)
    cart = create(:cart, store: empire_store, customer: customer, currency: 'AFN')

    # 403, not 404: Spree's own cart authorization decides this, and its answer
    # for a cart that exists but is not yours is "not for you" rather than "no
    # such cart". Reusing that decision keeps this endpoint's leaks identical to
    # every other cart read.
    get "/api/v3/store/empire/variants/#{variant.prefixed_id}/volume_pricing",
        params: { cart_id: cart.prefixed_id }, headers: store_headers(create(:customer))
    expect_status!(403)
  end

  it 'refuses a cart id that does not exist' do
    get "/api/v3/store/empire/variants/#{variant.prefixed_id}/volume_pricing",
        params: { cart_id: 'cart_nope' }, headers: guest_headers
    expect_status!(404)
  end

  it 'answers a guest cart and includes the ordering terms' do
    get "/api/v3/store/empire/variants/#{variant.prefixed_id}/volume_pricing", headers: guest_headers
    expect_status!(200)
    expect(body_json.keys).to include('minimum_order_quantity', 'order_multiple', 'units_per_carton')
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
