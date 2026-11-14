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
    load Rails.root.join('db/seeds/empire_seed.rb')
    store = Spree::Store.default
    product = store.products.find_by!(slug: 'empire-demo-handmade-basket')
    expect(product.reload).to be_purchasable
    expect(product.default_variant.total_on_hand).to be >= 100
    expect(Spree::ProductPublication.where(product: product, channel: store.default_channel)).to exist
    standard = store.delivery_methods.find_by!(name: 'Standard')
    expect(standard).to be_available_to_sellers
    expect(standard).to be_storefront_visible
    expect(standard.calculator.amount_for('AFN')).to eq(BigDecimal('150'))
  end

  it 'makes an Afghan address valid without inventing a postal code' do
    address = build(:address, country: Spree::Country.by_iso('AF'), postal_code: nil,
                    state_name: 'کابل', city: 'کابل', address1: 'کوچه آزمایشی، خانه ۱')
    expect(address).to be_valid
    expect(Spree::Country.by_iso('US')).to be_zipcode_required
  end
end
