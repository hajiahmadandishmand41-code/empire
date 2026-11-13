# frozen_string_literal: true

require 'spree/api/testing_support/v3/base'

module EmpireRequestHelpers
  def empire_store
    @empire_store ||= begin
      store = Spree::Store.default || create(:store, default: true)
      store.update!(default_currency: 'AFN', supported_currencies: 'AFN', default_locale: 'fa', supported_locales: 'en,fa')
      store
    end
  end

  def publishable_key
    @publishable_key ||= empire_store.api_keys.active.publishable.first ||
      empire_store.api_keys.create!(name: 'Request specs', key_type: 'publishable')
  end

  def store_headers(customer = nil)
    headers = { 'X-Spree-Api-Key' => publishable_key.token, 'Content-Type' => 'application/json' }
    headers['Authorization'] = "Bearer #{Spree::Api::V3::TestingSupport.generate_jwt(customer)}" if customer
    headers
  end

  def admin_headers(user)
    { 'Authorization' => "Bearer #{Spree::Api::V3::TestingSupport.generate_jwt(user, audience: Spree::Api::V3::JwtAuthentication::JWT_AUDIENCE_ADMIN)}",
      'Content-Type' => 'application/json' }
  end

  def seller_headers(user, seller)
    { 'Authorization' => "Bearer #{Spree::Api::V3::TestingSupport.generate_jwt(user, audience: Spree::Api::V3::JwtAuthentication::JWT_AUDIENCE_SELLER)}",
      'X-Spree-Seller-Id' => seller.prefixed_id, 'Content-Type' => 'application/json' }
  end

  def body_json
    JSON.parse(response.body)
  end

  def expect_status!(status)
    expect(response.status).to eq(status), "Expected HTTP #{status}, got #{response.status}: #{response.body}"
  end
end

RSpec.configure do |config|
  config.include EmpireRequestHelpers, type: :request
  config.before(:each, type: :request) do
    Spree::Current.reset
    empire_store
  end
end
