# frozen_string_literal: true

require 'rails_helper'

# The buyer's half of the RFQ workflow: raising a request, reading it back with
# its negotiation history, and accepting an offer.
RSpec.describe 'Empire buyer RFQ API', type: :request do
  let(:customer) { create(:customer, first_name: 'زلیخا', last_name: 'احمدی') }
  let(:headers) { store_headers(customer) }
  let(:product) { create(:product, store: empire_store, name: 'پارچه عمده') }

  def create_rfq(overrides = {})
    post '/api/v3/store/empire/rfqs',
         params: { title: 'پارچه برای عروسی', requested_quantity: 12, unit: 'carton',
                   variant_id: product.default_variant.prefixed_id,
                   description: 'رنگ سفید' }.merge(overrides).to_json,
         headers: headers
  end

  it 'records the request in its own history as its first event' do
    create_rfq
    expect_status!(201)

    rfq = Empire::Rfq.last
    expect(rfq.events.pluck(:event)).to eq(['created'])
    expect(rfq.events.first.to_status).to eq('open')
    expect(rfq.events.first.actor).to eq(customer)
  end

  it 'keeps the unit the buyer asked in, rather than a bare number' do
    create_rfq
    expect_status!(201)
    expect(body_json['unit']).to eq('carton')
    expect(body_json['requested_quantity']).to eq(12)
    expect(Empire::Rfq.last.unit).to eq('carton')
  end

  it 'shows the buyer the negotiation as it happens' do
    create_rfq
    rfq_id = body_json['id']
    seller = create(:seller, :approved, store: empire_store)
    quote = create(:empire_quote, rfq: Empire::Rfq.find(rfq_id), seller: seller, amount: '900.00')
    Empire::Rfq.find(rfq_id).record_event!(event: 'quoted', quote: quote, to: 'quoted')

    get "/api/v3/store/empire/rfqs/#{rfq_id}", headers: headers
    expect_status!(200)
    expect(body_json['events'].map { |event| event['event'] }).to eq(%w[created quoted])
    expect(body_json['quotes'].length).to eq(1)
    expect(body_json['quoteable']).to be(true)
  end

  it 'tells the buyer why a request was closed' do
    create_rfq
    rfq = Empire::Rfq.find(body_json['id'])
    rfq.close!(reason: 'بودجه کافی نبود')

    get "/api/v3/store/empire/rfqs/#{rfq.id}", headers: headers
    expect_status!(200)
    expect(body_json['status_reason']).to eq('بودجه کافی نبود')
    expect(body_json['quoteable']).to be(false)
    expect(body_json['closed_at']).to be_present
    expect(body_json['events'].map { |event| event['event'] }).to include('closed')
  end

  it "does not show one buyer another buyer's request" do
    create_rfq
    rfq_id = body_json['id']

    get "/api/v3/store/empire/rfqs/#{rfq_id}", headers: store_headers(create(:customer))
    expect_status!(404)
  end

  it 'rejects a request without a title or a positive quantity' do
    create_rfq(title: '')
    expect_status!(422)

    create_rfq(title: 'ok', requested_quantity: 0)
    expect_status!(422)
    expect(Empire::Rfq.count).to eq(0)
  end
end
