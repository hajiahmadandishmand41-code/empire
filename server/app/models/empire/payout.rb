# frozen_string_literal: true

module Empire
  class Payout < ApplicationRecord
    self.table_name = "empire_payouts"

    belongs_to :empire_seller, class_name: "Empire::Seller", foreign_key: :empire_seller_id
    has_many :commissions, class_name: "Empire::Commission", foreign_key: :payout_id
    belongs_to :approved_by, class_name: "Spree::User", foreign_key: :approved_by_id, optional: true

    enum status: { requested: 0, approved: 1, paid: 2, rejected: 3 }

    validates :total_amount, :commission_deducted, :net_amount, presence: true
    validates :net_amount, numericality: { greater_than_or_equal_to: 0 }

    def request!
      update!(status: :requested, requested_at: Time.current)
    end

    def approve!(admin_user)
      update!(status: :approved, approved_by: admin_user, approved_at: Time.current)
    end

    def pay!
      update!(status: :paid, paid_at: Time.current)
    end

    def reject!(reason)
      update!(status: :rejected, rejection_reason: reason)
    end
  end
end
