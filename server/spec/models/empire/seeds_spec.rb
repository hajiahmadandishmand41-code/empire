# frozen_string_literal: true

require 'rails_helper'

RSpec.describe 'Empire reference seeds', type: :model do
  around do |example|
    previous = ENV['EMPIRE_SEED_DEMO']
    ENV['EMPIRE_SEED_DEMO'] = 'false'
    example.run
  ensure
    ENV['EMPIRE_SEED_DEMO'] = previous
  end

  it 'is idempotent and never offers unreviewed Pashto' do
    load Rails.root.join('db/seeds/empire_seed.rb')
    expect { load Rails.root.join('db/seeds/empire_seed.rb') }.not_to change { Empire::Province.count }
    expect(Empire::Province.count).to eq(34)
    expect(Empire::Province.where.not(name_ps: nil)).to be_empty
    expect(Empire::District.where.not(name_ps: nil)).to be_empty
    expect(Spree::Store.default.name).to eq('Empire')
    expect(Spree::Store.default.default_currency).to eq('AFN')
    expect(Empire::CashOnDelivery.where(active: true).count).to eq(1)
    expect(I18n.available_locales).not_to include(:'ps-AF')
  end

  it 'seeds a demo catalog that is published, in stock and deliverable by sellers' do
    ENV['EMPIRE_SEED_DEMO'] = 'true'
    admin_email = ENV.fetch('ADMIN_EMAIL', 'admin@empire.test')
    Spree.admin_user_class.find_by(email: admin_email) || create(:admin_user, email: admin_email)
    store = Spree::Store.default
    # The test database is migrated, not seeded. Mirror the first-run store
    # provisioning that Spree's admin seed performs in a real installation.
    Spree::Stores::ProvisionDefaults.call(store: store, country: Spree::Country.by_iso('AF'), locale: 'fa', currency: 'AFN')
    load Rails.root.join('db/seeds/empire_seed.rb')
    product = store.products.find_by!(slug: 'empire-demo-handmade-basket')
    expect(product.reload).to be_purchasable
    expect(product.default_variant.total_on_hand).to be >= 100
    expect(Spree::ProductPublication.where(product: product, channel: store.default_channel)).to exist
    standard = store.delivery_methods.find_by!(name: 'Standard')
    expect(standard).to be_available_to_sellers
    expect(standard).to be_storefront_visible
    expect(standard.calculator.amount_for('AFN')).to eq(BigDecimal('150'))

    # Prove the whole native chain, not just the flags: seller stock must be
    # allocated into a fulfillment that actually quotes the shared AFN rate.
    address = build(:address, country: Spree::Country.by_iso('AF'), postal_code: nil,
                    state_name: 'کابل', city: 'کابل', address1: 'کوچه آزمایشی، خانه ۱')
    cart = create(:cart, store: store, currency: 'AFN')
    added = Spree.cart_add_item_workflow.call(cart: cart, variant: product.default_variant, quantity: 1)
    expect(added).to be_success
    cart.update!(ship_address: address, bill_address: address)
    cart.rebuild_fulfillments!
    expect(cart.fulfillments.count).to eq(1)
    rates = cart.fulfillments.first.delivery_rates
    expect(rates.map { |rate| rate.delivery_method.name }).to include('Standard')
    expect(rates.find { |rate| rate.delivery_method.name == 'Standard' }.cost).to eq(BigDecimal('150'))
  end

  it 'makes an Afghan address valid without inventing a postal code' do
    address = build(:address, country: Spree::Country.by_iso('AF'), postal_code: nil,
                    state_name: 'کابل', city: 'کابل', address1: 'کوچه آزمایشی، خانه ۱')
    expect(address).to be_valid
    expect(Spree::Country.by_iso('US')).to be_zipcode_required
  end
end
