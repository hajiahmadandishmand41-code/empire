# frozen_string_literal: true

require 'rails_helper'

RSpec.describe Empire::AfghanPhone do
  describe '.normalize' do
    {
      '+93700123456' => '+93700123456',
      '0093700123456' => '+93700123456',
      '93700123456' => '+93700123456',
      '0700123456' => '+93700123456',
      '+93 700 123 456' => '+93700123456',
      '+93-700-123-456' => '+93700123456',
      '(0700) 123 456' => '+93700123456',
      '۰۷۰۰۱۲۳۴۵۶' => '+93700123456',
      '+9320123456' => '+9320123456'
    }.each do |input, expected|
      it "normalises #{input.inspect} to #{expected}" do
        expect(described_class.normalize(input)).to eq(expected)
      end
    end

    ['+15551234567', '+93', '070012', '70012345', 'not-a-phone', '', nil, '+93000123456'].each do |input|
      it "rejects #{input.inspect}" do
        expect(described_class.normalize(input)).to be_nil
        expect(described_class.valid?(input)).to be(false)
      end
    end
  end
end

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
  end

  it 'refuses to reopen a request whose offer was accepted' do
    rfq = create(:empire_rfq, store: store, customer: customer)
    seller = create(:seller, :approved, store: store)
    quote = create(:empire_quote, rfq: rfq, seller: seller)
    Empire::AcceptQuote.call(rfq: rfq, quote: quote)
    rfq.reload
    rfq.update_column(:status, Empire::Rfq.statuses[:closed])
    expect { rfq.reopen! }.to raise_error(ActiveRecord::RecordInvalid)
  end
end
