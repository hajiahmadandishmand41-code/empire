# frozen_string_literal: true

require 'rails_helper'

RSpec.describe Empire::ReviewPayoutRequest, type: :service do
  let(:store) do
    (Spree::Store.default || create(:store, default: true)).tap do |record|
      record.update!(name: 'Empire', default_currency: 'AFN', supported_currencies: 'AFN',
                     default_locale: 'fa', supported_locales: 'en,fa', default_country_code: 'AF')
    end
  end
  let(:seller) { create(:seller, :approved, store: store) }
  let(:reviewer) { create(:admin_user) }
  let(:request) { create(:empire_payout_request, seller: seller, currency: 'AFN') }

  def earn(amount)
    create(:seller_transfer, seller: seller, store: store, currency: 'AFN', amount: amount, status: 'completed',
           order: create(:completed_order_with_totals, store: store, seller: seller, currency: 'AFN'))
  end

  it 'requires a staff reviewer, never a customer or seller principal' do
    expect { described_class.call(request: request, reviewer: create(:customer), approve: true) }.to raise_error(ArgumentError)
  end

  it 'approves through the native sweep and links the resulting pending payout' do
    transfer = earn('1080.00')
    result = described_class.call(request: request, reviewer: reviewer, approve: true)
    expect(result).to be_success
    expect(request.reload).to be_approved
    expect(request.reviewed_by).to eq(reviewer)
    expect(request.payout).to be_a(Spree::SellerPayout)
    expect(request.payout.amount).to eq(BigDecimal('1080.00'))
    expect(request.payout.status).to eq('pending')
    expect(transfer.reload.payout).to eq(request.payout)
    expect(seller.balance('AFN')).to eq(BigDecimal('1080.00')) # not paid until staff completes the payout
  end

  it 'does not approve when there is nothing payable' do
    result = described_class.call(request: request, reviewer: reviewer, approve: true)
    expect(result).not_to be_success
    expect(request.reload).to be_requested
    expect(Spree::SellerPayout.count).to eq(0)
  end

  it 'records a rejection and refuses a second review' do
    result = described_class.call(request: request, reviewer: reviewer, approve: false, reason: 'Bank details need correction')
    expect(result).to be_success
    expect(request.reload).to be_rejected
    expect(request.rejection_reason).to eq('Bank details need correction')
    again = described_class.call(request: request, reviewer: reviewer, approve: true)
    expect(again).not_to be_success
    expect(request.reload).to be_rejected
  end
end
