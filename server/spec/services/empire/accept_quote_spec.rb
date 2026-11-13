# frozen_string_literal: true

require 'rails_helper'

RSpec.describe Empire::AcceptQuote, type: :service do
  let(:store) { Spree::Store.default || create(:store, default: true) }
  let(:customer) { create(:customer) }
  let(:rfq) { create(:empire_rfq, store: store, customer: customer, status: :quoted) }
  let(:seller) { create(:seller, :approved, store: store) }
  let(:other_seller) { create(:seller, :approved, store: store) }
  let!(:quote) { create(:empire_quote, rfq: rfq, seller: seller) }
  let!(:other_quote) { create(:empire_quote, rfq: rfq, seller: other_seller) }

  it 'accepts one quote and rejects the competing pending quotes atomically' do
    result = described_class.call(rfq: rfq, quote: quote)
    expect(result).to eq(quote)
    expect(rfq.reload).to be_accepted
    expect(quote.reload).to be_accepted
    expect(other_quote.reload).to be_rejected
  end

  it 'cannot accept a quote belonging to another RFQ' do
    other_rfq = create(:empire_rfq, store: store, customer: customer)
    expect { described_class.call(rfq: other_rfq, quote: quote) }.to raise_error(ActiveRecord::RecordInvalid)
    expect(rfq.reload).to be_quoted
    expect(quote.reload).to be_pending
  end

  it 'cannot accept twice or accept an expired request' do
    described_class.call(rfq: rfq, quote: quote)
    expect { described_class.call(rfq: rfq.reload, quote: quote.reload) }.to raise_error(ActiveRecord::RecordInvalid)
    rfq.update!(status: :open, expires_at: 1.minute.ago)
    expect { described_class.call(rfq: rfq, quote: other_quote) }.to raise_error(ActiveRecord::RecordInvalid)
  end
end
