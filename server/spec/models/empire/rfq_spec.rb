# frozen_string_literal: true

require 'rails_helper'

RSpec.describe Empire::Rfq do
  let(:store) { Spree::Store.default || create(:store, default: true) }
  let(:customer) { create(:customer) }

  it 'reports an expired request as not quoteable' do
    rfq = create(:empire_rfq, store: store, customer: customer, expires_at: 1.minute.ago)
    expect(rfq).to be_expired
    expect(rfq).not_to be_quoteable
  end

  it 'records an event for every transition it makes' do
    rfq = create(:empire_rfq, store: store, customer: customer)
    rfq.close!(reason: 'no budget')
    expect(rfq.events.pluck(:event)).to eq(['closed'])
    expect(rfq.events.last.from_status).to eq('open')
    expect(rfq.events.last.to_status).to eq('closed')
    expect(rfq.reload.closed_at).to be_present
  end

  it 'narrows visibility to the seller, their store and an unexpired request' do
    seller = create(:seller, :approved, store: store)
    other_seller = create(:seller, :approved, store: store)
    mine = create(:empire_rfq, store: store, customer: customer)
    targeted = create(:empire_rfq, store: store, customer: customer, seller: seller)
    foreign = create(:empire_rfq, store: store, customer: customer, seller: other_seller)
    expired = create(:empire_rfq, store: store, customer: customer, expires_at: 1.hour.ago)

    visible = described_class.visible_to_seller(seller).quoteable
    expect(visible).to include(mine, targeted)
    expect(visible).not_to include(foreign, expired)
  end

  it 'refuses to reopen a request whose offer was accepted' do
    rfq = create(:empire_rfq, store: store, customer: customer)
    seller = create(:seller, :approved, store: store)
    quote = create(:empire_quote, rfq: rfq, seller: seller)
    Empire::AcceptQuote.call(rfq: rfq, quote: quote)
    # Put the request back into `closed` as an operator would, without touching
    # the accepted offer — the state a naive reopen would break.
    rfq.update_column(:status, Empire::Rfq.statuses[:closed])
    expect { rfq.reopen! }.to raise_error(ActiveRecord::RecordInvalid)
    expect(rfq.reload).to be_closed
  end
end

RSpec.describe Empire::Quote do
  let(:store) { Spree::Store.default || create(:store, default: true) }
  let(:customer) { create(:customer) }
  let(:rfq) { create(:empire_rfq, store: store, customer: customer, requested_quantity: 12, unit: 'carton') }
  let(:seller) { create(:seller, :approved, store: store) }

  it 'inherits the requested volume and unit when the seller states none' do
    quote = create(:empire_quote, rfq: rfq, seller: seller, quantity: nil, unit: nil)
    expect(quote.quantity).to eq(12)
    expect(quote.unit).to eq('carton')
    expect(quote.total_amount).to eq(BigDecimal('950.00') * 12)
  end

  it 'refuses an offer that outlives the request' do
    rfq.update!(expires_at: 2.days.from_now)
    quote = build(:empire_quote, rfq: rfq, seller: seller, valid_until: 5.days.from_now)
    expect(quote).not_to be_valid
    expect(quote.errors[:valid_until]).to be_present
  end

  it 'refuses a re-quote once the request is closed' do
    quote = create(:empire_quote, rfq: rfq, seller: seller)
    rfq.close!(reason: 'done')
    quote.amount = '100.00'
    expect(quote).not_to be_valid
    expect(quote.errors[:base]).to be_present
  end

  it 'formats its amount as a decimal string, not scientific notation' do
    expect(Empire::Money.format(BigDecimal('1250.00'))).to eq('1250.00')
    expect(Empire::Money.format(BigDecimal('1250'))).to eq('1250.00')
    expect(Empire::Money.format(nil)).to be_nil
  end
end
