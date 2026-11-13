# frozen_string_literal: true

require 'rails_helper'

RSpec.describe Empire::CashOnDelivery, type: :model do
  it 'is an offline manual-capture method, not an upfront charge' do
    method = described_class.new(name: 'پرداخت هنگام تحویل', capture_method: 'manual')
    expect(method.resolved_capture_method).to eq('manual')
    expect(method.source_required?).to be(false)
    expect(method.session_required?).to be(false)
    expect(method.payment_profiles_supported?).to be(false)
    expect(method.partial_name).to eq('check')
    expect(described_class.provider_key).to eq('empire_cash_on_delivery')
  end
end
