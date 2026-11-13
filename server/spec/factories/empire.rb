# frozen_string_literal: true

FactoryBot.define do
  factory :empire_rfq, class: 'Empire::Rfq' do
    store { Spree::Store.default || create(:store) }
    customer
    title { 'درخواست قیمت آزمایشی' }
    requested_quantity { 10 }
    currency { 'AFN' }
  end

  factory :empire_quote, class: 'Empire::Quote' do
    association :rfq, factory: :empire_rfq
    association :seller, factory: [:seller, :approved], store: rfq.store
    amount { '950.00' }
    currency { 'AFN' }
  end

  factory :empire_payout_request, class: 'Empire::PayoutRequest' do
    association :seller, factory: [:seller, :approved]
    currency { 'AFN' }
  end
end
