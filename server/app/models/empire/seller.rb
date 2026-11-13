# frozen_string_literal: true

module Empire
  class Seller < ApplicationRecord
    self.table_name = "empire_sellers"

    belongs_to :user, class_name: "Spree::User", inverse_of: :empire_seller
    has_many :commissions, class_name: "Empire::Commission", foreign_key: :empire_seller_id, dependent: :destroy
    has_many :payouts, class_name: "Empire::Payout", foreign_key: :empire_seller_id, dependent: :destroy
    has_many :quotes, class_name: "Empire::Quote", foreign_key: :empire_seller_id, dependent: :destroy
    has_many :order_splits, class_name: "Empire::OrderSplit", foreign_key: :empire_seller_id, dependent: :destroy

    enum verification_status: { pending: 0, verified: 1, rejected: 2, suspended: 3 }

    validates :shop_name, presence: true, uniqueness: true
    validates :commission_rate, presence: true, numericality: { greater_than_or_equal_to: 0, less_than_or_equal_to: 1 }

    def verified?
      verification_status == "verified"
    end

    def pending?
      verification_status == "pending"
    end

    def suspended?
      verification_status == "suspended"
    end
  end
end
