# frozen_string_literal: true

module Empire
  class Commission < ApplicationRecord
    self.table_name = "empire_commissions"

    belongs_to :empire_seller, class_name: "Empire::Seller", foreign_key: :empire_seller_id
    belongs_to :order, class_name: "Spree::Order", foreign_key: :order_id
    belongs_to :payout, class_name: "Empire::Payout", foreign_key: :payout_id, optional: true

    enum settlement_status: { unsettled: 0, settled: 1, paid: 2 }

    validates :commission_rate, :commission_amount, :platform_share, :seller_share, presence: true

    def self.calculate!(order, seller)
      rate = seller.commission_rate
      total = order.total
      commission_amount = (total * rate).round(2)
      create!(
        empire_seller: seller,
        order: order,
        order_total: total,
        commission_rate: rate,
        commission_amount: commission_amount,
        platform_share: total - commission_amount,
        seller_share: commission_amount,
        currency: order.currency,
      )
    end
  end
end
