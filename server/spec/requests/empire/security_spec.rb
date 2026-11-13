# frozen_string_literal: true

require 'rails_helper'

RSpec.describe 'Empire backend authorization', type: :request do
  let(:buyer) { create(:customer) }
  let(:admin) { create(:admin_user, :without_admin_role).tap { |user| empire_store.add_user(user) } }
  let(:seller) { create(:seller, :approved, store: empire_store) }
  let(:other_seller) { create(:seller, :approved, store: empire_store) }
  let(:seller_user) { create(:admin_user, :without_admin_role).tap { |user| seller.add_user(user) } }
  let(:company) { create(:company, store: empire_store) }
  let(:other_company) { create(:company, store: empire_store) }
  let(:rate) { create(:commission_rate, store: empire_store, value: 10) }
  let(:payout_request) { create(:empire_payout_request, seller: seller) }

  def earn_for(target_seller)
    create(:seller_transfer, seller: target_seller, store: empire_store, currency: 'AFN', amount: '1080.00', status: 'completed',
           order: create(:completed_order_with_totals, store: empire_store, seller: target_seller, currency: 'AFN'))
  end

  it 'rejects an anonymous customer JWT path and an anonymous admin path' do
    get '/api/v3/store/customers/me', headers: { 'X-Spree-Api-Key' => publishable_key.token }
    expect_status!(401)
    get '/api/v3/admin/orders'
    expect_status!(401)
    get '/api/v3/store/empire/rfqs', headers: { 'X-Spree-Api-Key' => publishable_key.token }
    expect_status!(401)
  end

  it 'does not accept a buyer token on the admin API' do
    get '/api/v3/admin/orders', headers: admin_headers(buyer)
    expect_status!(401)
    get '/api/v3/admin/empire/payout_requests', headers: admin_headers(buyer)
    expect_status!(401)
  end

  it 'does not accept a seller token on the admin API' do
    get '/api/v3/admin/commission_rates', headers: admin_headers(seller_user)
    expect_status!(401)
    patch "/api/v3/admin/sellers/#{other_seller.prefixed_id}/approve", params: { override_requirements: true }.to_json,
          headers: admin_headers(seller_user)
    expect_status!(401)
  end

  it "hides another seller's order" do
    mine = create(:completed_order_with_totals, store: empire_store, seller: seller)
    theirs = create(:completed_order_with_totals, store: empire_store, seller: other_seller)
    get '/api/v3/seller/orders', headers: seller_headers(seller_user, seller)
    expect_status!(200)
    expect(body_json['data'].map { |row| row['id'] }).to include(mine.prefixed_id).and exclude(theirs.prefixed_id)
    get "/api/v3/seller/orders/#{theirs.prefixed_id}", headers: seller_headers(seller_user, seller)
    expect_status!(404)
  end

  it 'has no seller commission write and ignores commission fields on profile writes' do
    expect(patch: "/api/v3/seller/commission_rates/#{rate.id}").not_to be_routable
    patch '/api/v3/seller/profile', params: { name: 'Updated shop', commission_rate: 0 }.to_json,
          headers: seller_headers(seller_user, seller)
    expect_status!(200)
    expect(rate.reload.value).to eq(10)
  end

  it 'lets a seller request settlement but never review it' do
    earn_for(seller)
    post '/api/v3/seller/empire/payout_requests', params: { note: 'Please review', status: 'approved' }.to_json,
         headers: seller_headers(seller_user, seller)
    expect_status!(201)
    request = Empire::PayoutRequest.find(body_json.fetch('id'))
    expect(request.status).to eq('requested')
    patch "/api/v3/admin/empire/payout_requests/#{request.id}/approve", headers: seller_headers(seller_user, seller)
    expect_status!(401)
    expect(request.reload.status).to eq('requested')
  end

  it 'requires the explicit staff permission for payout review' do
    limited = create(:admin_user, :without_admin_role)
    empire_store.add_user(limited, create(:role, name: 'Read only', resource: empire_store, permissions: %w[read_orders]))
    request = Empire::PayoutRequest.create!(seller: seller, currency: 'AFN')
    earn_for(seller)
    patch "/api/v3/admin/empire/payout_requests/#{request.id}/approve", headers: admin_headers(limited)
    expect_status!(403)
    patch "/api/v3/admin/empire/payout_requests/#{request.id}/approve", headers: admin_headers(admin)
    expect_status!(200)
    expect(request.reload.status).to eq('approved')
    expect(request.payout).to be_present
  end

  it 'isolates company records and company RFQs' do
    create(:company_membership, company: company, customer: buyer)
    get '/api/v3/store/account/companies', headers: store_headers(buyer)
    expect_status!(200)
    expect(body_json['data'].map { |row| row['id'] }).to eq([company.prefixed_id])
    get "/api/v3/store/companies/#{other_company.prefixed_id}", headers: store_headers(buyer)
    expect_status!(404)
    post '/api/v3/store/empire/rfqs', params: { title: 'Cross-tenant attempt', requested_quantity: 1,
                                                company_id: other_company.prefixed_id }.to_json, headers: store_headers(buyer)
    expect_status!(422)
  end

  it 'allows only an authorized operator to approve a seller' do
    pending = create(:seller, store: empire_store, status: 'pending')
    patch "/api/v3/admin/sellers/#{pending.prefixed_id}/approve", params: { override_requirements: true }.to_json,
          headers: store_headers(buyer)
    expect_status!(401)
    patch "/api/v3/admin/sellers/#{pending.prefixed_id}/approve", params: { override_requirements: true }.to_json,
          headers: admin_headers(admin)
    expect_status!(200)
    expect(pending.reload.status).to eq('approved')
  end
end
