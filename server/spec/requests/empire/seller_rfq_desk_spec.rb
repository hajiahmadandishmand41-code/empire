# frozen_string_literal: true

require 'rails_helper'

# The seller half of the RFQ workflow. Before this existed a seller could POST a
# quote but had no endpoint to discover the requests they were allowed to quote
# on, could not see their own offer again, and could not correct or withdraw it.
RSpec.describe 'Empire seller RFQ desk', type: :request do
  let(:seller) { create(:seller, :approved, store: empire_store) }
  let(:seller_user) { create(:admin_user, :without_admin_role).tap { |user| seller.add_user(user) } }
  let(:other_seller) { create(:seller, :approved, store: empire_store) }
  let(:customer) { create(:customer, first_name: 'زلیخا', last_name: 'احمدی') }

  let(:open_rfq) do
    create(:empire_rfq, store: empire_store, customer: customer, title: 'عمده پارچه', unit: 'carton',
                        requested_quantity: 50, expires_at: 5.days.from_now)
  end
  let(:targeted_rfq) { create(:empire_rfq, store: empire_store, customer: customer, seller: seller) }
  let(:foreign_rfq) { create(:empire_rfq, store: empire_store, customer: customer, seller: other_seller) }
  let(:expired_rfq) do
    create(:empire_rfq, store: empire_store, customer: customer, expires_at: 1.day.ago)
  end

  def headers
    seller_headers(seller_user, seller)
  end

  it 'lists only requests this seller may quote on' do
    open_rfq
    targeted_rfq
    foreign_rfq
    expired_rfq

    get '/api/v3/seller/empire/rfqs', headers: headers
    expect_status!(200)
    ids = body_json['data'].map { |row| row['id'] }
    expect(ids).to include(open_rfq.id, targeted_rfq.id)
    # A request addressed to a competitor is invisible; an expired one is not
    # offered because it can no longer be quoted.
    expect(ids).not_to include(foreign_rfq.id)
    expect(ids).not_to include(expired_rfq.id)
  end

  it 'shows a request with the volume, unit and deadline the seller needs' do
    get "/api/v3/seller/empire/rfqs/#{open_rfq.id}", headers: headers
    expect_status!(200)
    expect(body_json).to include('title' => 'عمده پارچه', 'requested_quantity' => 50, 'unit' => 'carton',
                                 'quoteable' => true, 'buyer_name' => 'زلیخا احمدی')
  end

  it "cannot read another seller's private request" do
    get "/api/v3/seller/empire/rfqs/#{foreign_rfq.id}", headers: headers
    expect_status!(404)
  end

  it 'records an offer and refuses a second one for the same request' do
    post '/api/v3/seller/empire/quotes',
         params: { rfq_id: open_rfq.id, amount: '1250.00', notes: 'تحویل تا یک هفته' }.to_json, headers: headers
    expect_status!(201)
    quote = Empire::Quote.last
    expect(quote.quantity).to eq(50)
    expect(quote.unit).to eq('carton')
    expect(open_rfq.reload).to be_quoted

    post '/api/v3/seller/empire/quotes',
         params: { rfq_id: open_rfq.id, amount: '1200.00' }.to_json, headers: headers
    expect_status!(422)
    expect(Empire::Quote.where(rfq: open_rfq, seller: seller).count).to eq(1)

    # The first offer's revision is the seller's own history, visible to them.
    get "/api/v3/seller/empire/rfqs/#{open_rfq.id}", headers: headers
    expect(body_json.dig('my_quote', 'amount')).to eq('1250.00')
    expect(body_json['my_quotes'].length).to eq(1)
  end

  it 'rejects a non-canonical amount rather than rounding it' do
    post '/api/v3/seller/empire/quotes',
         params: { rfq_id: open_rfq.id, amount: '1.2345' }.to_json, headers: headers
    expect_status!(422)
    expect(Empire::Quote.count).to eq(0)
  end

  it 'refuses a quote on an expired or foreign request' do
    post '/api/v3/seller/empire/quotes',
         params: { rfq_id: expired_rfq.id, amount: '100.00' }.to_json, headers: headers
    expect_status!(404)

    post '/api/v3/seller/empire/quotes',
         params: { rfq_id: foreign_rfq.id, amount: '100.00' }.to_json, headers: headers
    expect_status!(404)
  end

  it 'lets a seller correct and then withdraw a still-pending offer' do
    post '/api/v3/seller/empire/quotes',
         params: { rfq_id: open_rfq.id, amount: '1250.00' }.to_json, headers: headers
    quote_id = body_json.fetch('id')

    patch "/api/v3/seller/empire/quotes/#{quote_id}",
          params: { amount: '1190.00', notes: 'تخفیف برای پرداخت نقدی' }.to_json, headers: headers
    expect_status!(200)
    expect(Empire::Quote.find(quote_id).amount.to_s).to eq('1190.00')

    patch "/api/v3/seller/empire/quotes/#{quote_id}/withdraw", headers: headers
    expect_status!(200)
    expect(Empire::Quote.find(quote_id)).to be_withdrawn

    # A withdrawn offer cannot be edited back into life.
    patch "/api/v3/seller/empire/quotes/#{quote_id}",
          params: { amount: '900.00' }.to_json, headers: headers
    expect_status!(422)
  end

  it "never exposes another seller's quote amount" do
    create(:empire_quote, rfq: open_rfq, seller: other_seller, amount: '777.00')
    get "/api/v3/seller/empire/rfqs/#{open_rfq.id}", headers: headers
    expect_status!(200)
    expect(response.body).not_to include('777')
    expect(body_json['quote_count']).to eq(1)
    expect(body_json['my_quote']).to be_nil
  end

  it 'does not let a seller read or edit another seller quote by id' do
    quote = create(:empire_quote, rfq: open_rfq, seller: other_seller)
    get "/api/v3/seller/empire/quotes/#{quote.id}", headers: headers
    expect_status!(404)
    patch "/api/v3/seller/empire/quotes/#{quote.id}", params: { amount: '1.00' }.to_json, headers: headers
    expect_status!(404)
    expect(quote.reload.amount.to_s).to eq('950.00')
  end

  it 'refuses an unauthenticated caller' do
    get '/api/v3/seller/empire/rfqs', headers: { 'Content-Type' => 'application/json' }
    expect_status!(401)
  end
end
