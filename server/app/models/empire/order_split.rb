# frozen_string_literal: true

module Empire
  class OrderSplit < ApplicationRecord
    self.table_name = "empire_order_splits"

    belongs_to :order, class_name: "Spree::Order", foreign_key: :order_id
    belongs_to :empire_seller, class_name: "Empire::Seller", foreign_key: :empire_seller_id

    enum status: { pending: 0, fulfilled: 1, cancelled: 2 }

    validates :subtotal, :commission_amount, :seller_payable, presence: true
  end
end
