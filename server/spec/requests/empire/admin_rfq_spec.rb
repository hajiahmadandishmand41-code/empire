# frozen_string_literal: true

require 'rails_helper'

# Staff RFQ administration: detail with every offer and the full history, and
# the state changes a marketplace operator actually needs (close, cancel,
# reopen, reject an offer).
RSpec.describe 'Empire admin RFQ management', type: :request do
  let(:admin) { create(:admin_user, :without_admin_role).tap { |user| empire_store.add_user(user) } }
  let(:buyer) { create(:customer) }
  let(:seller) { create(:seller, :approved, store: empire_store) }
  let(:other_seller) { create(:seller, :approved, store: empire_store) }
  let(:rfq) do
    create(:empire_rfq, store: empire_store, customer: buyer, title: 'درخواست عمده', requested_quantity: 20,
                        expires_at: 3.days.from_now)
  end
  let!(:mine) { create(:empire_quote, rfq: rfq, seller: seller, amount: '500.00') }
  let!(:theirs) { create(:empire_quote, rfq: rfq, seller: other_seller, amount: '550.00') }

  it 'shows every offer and the audit trail to staff' do
    get "/api/v3/admin/empire/rfqs/#{rfq.id}", headers: admin_headers(admin)
    expect_status!(200)
    expect(body_json['quotes'].map { |row| row['amount'] }).to contain_exactly('500.00', '550.00')
    expect(body_json['quote_count']).to eq(2)
    expect(body_json['events']).to be_an(Array)
  end

  it 'closes a request with a reason and records who did it' do
    patch "/api/v3/admin/empire/rfqs/#{rfq.id}/close",
          params: { reason: 'بودجه کافی نیست' }.to_json, headers: admin_headers(admin)
    expect_status!(200)
    expect(rfq.reload).to be_closed
    expect(rfq.status_reason).to eq('بودجه کافی نیست')
    expect(rfq.closed_at).to be_present

    event = rfq.events.last
    expect(event.event).to eq('closed')
    expect(event.actor).to eq(admin)
    expect(event.note).to eq('بودجه کافی نیست')
  end

  it 'refuses a quote on a closed request' do
    patch "/api/v3/admin/empire/rfqs/#{rfq.id}/cancel", params: { reason: 'buyer withdrew' }.to_json,
          headers: admin_headers(admin)
    expect_status!(200)
    post '/api/v3/seller/empire/quotes',
         params: { rfq_id: rfq.id, amount: '400.00' }.to_json,
         headers: seller_headers(create(:admin_user, :without_admin_role).tap { |u| seller.add_user(u) }, seller)
    expect_status!(404)
  end

  it 'rejects an individual offer without editing it' do
    patch "/api/v3/admin/empire/rfqs/#{rfq.id}/quotes/#{mine.id}/reject",
          params: { reason: 'قیمت بالاست' }.to_json, headers: admin_headers(admin)
    expect_status!(200)
    expect(mine.reload).to be_rejected
    # The seller's amount is untouched: staff decline, they do not re-price.
    expect(mine.amount.to_s).to eq('500.00')
    expect(theirs.reload).to be_pending
  end

  it 'reopens a closed request with no accepted offer' do
    rfq.close!(reason: 'hold', actor: admin)
    patch "/api/v3/admin/empire/rfqs/#{rfq.id}/reopen", headers: admin_headers(admin)
    expect_status!(200)
    expect(rfq.reload).to be_open
    expect(rfq.closed_at).to be_nil
  end

  it 'filters the index by status' do
    rfq.close!(reason: 'done', actor: admin)
    get '/api/v3/admin/empire/rfqs', params: { status: 'closed' }, headers: admin_headers(admin)
    expect_status!(200)
    expect(body_json['data'].map { |row| row['id'] }).to eq([rfq.id])

    get '/api/v3/admin/empire/rfqs', params: { status: 'open' }, headers: admin_headers(admin)
    expect(body_json['data']).to be_empty
  end

  it 'refuses a buyer token and a caller without write permission' do
    patch "/api/v3/admin/empire/rfqs/#{rfq.id}/close", params: { reason: 'x' }.to_json,
          headers: store_headers(buyer)
    expect_status!(401)

    limited = create(:admin_user, :without_admin_role)
    empire_store.add_user(limited, create(:role, name: 'Read only', resource: empire_store, permissions: %w[read_rfqs]))
    patch "/api/v3/admin/empire/rfqs/#{rfq.id}/close", params: { reason: 'x' }.to_json,
          headers: admin_headers(limited)
    expect_status!(403)
    expect(rfq.reload).to be_open
  end
end

RSpec.describe 'Empire admin seller application review', type: :request do
  let(:admin) { create(:admin_user, :without_admin_role).tap { |user| empire_store.add_user(user) } }
  let(:application) do
    Empire::ApplySeller.call(
      store: empire_store,
      attributes: { shop_name: 'فروشگاه آزمایشی', email: 'review.me@example.com',
                    password: 'SecurePass123!', password_confirmation: 'SecurePass123!',
                    phone: '0700123456', city: 'هرات', categories: ['پارچه'] }
    ).application
  end

  it 'admits the applicant through the native approval workflow' do
    application
    patch "/api/v3/admin/empire/seller_applications/#{application.id}/approve",
          params: { override_requirements: true }.to_json, headers: admin_headers(admin)
    expect_status!(200)
    expect(application.reload).to be_approved
    expect(application.seller.reload).to be_approved
    expect(application.reviewed_by).to eq(admin)
  end

  it 'rejects with a reason and closes the provisioned seller' do
    application
    patch "/api/v3/admin/empire/seller_applications/#{application.id}/reject",
          params: { reason: 'مدارک ناقص است' }.to_json, headers: admin_headers(admin)
    expect_status!(200)
    expect(application.reload).to be_rejected
    expect(application.rejection_reason).to eq('مدارک ناقص است')
    expect(application.seller.reload).to be_rejected
  end

  it 'requires a reason to reject and a permission to decide' do
    application
    patch "/api/v3/admin/empire/seller_applications/#{application.id}/reject",
          params: { reason: '' }.to_json, headers: admin_headers(admin)
    expect_status!(422)
    expect(application.reload).to be_pending

    limited = create(:admin_user, :without_admin_role)
    empire_store.add_user(limited, create(:role, name: 'Reader', resource: empire_store, permissions: %w[read_sellers]))
    patch "/api/v3/admin/empire/seller_applications/#{application.id}/approve",
          params: { override_requirements: true }.to_json, headers: admin_headers(limited)
    expect_status!(403)
    expect(application.reload).to be_pending
  end
end
