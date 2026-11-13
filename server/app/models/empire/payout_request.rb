# frozen_string_literal: true

module Empire
  # A request for review, not money and not a ledger entry. Only the native
  # Spree payout sweep may claim seller transfers and create a SellerPayout.
  class PayoutRequest < ApplicationRecord
    self.table_name = 'empire_payout_requests'

    belongs_to :seller, class_name: 'Spree::Seller'
    belongs_to :payout, class_name: 'Spree::SellerPayout', optional: true
    belongs_to :reviewed_by, class_name: 'Spree::AdminUser', optional: true

    enum :status, { requested: 0, approved: 1, rejected: 2 }, default: :requested
    validates :currency, presence: true
    validates :note, length: { maximum: 1000 }
    validate :seller_is_payable, on: :create

    private

    def seller_is_payable
      return if seller&.approved? && seller.payouts_enabled?

      errors.add(:seller, :invalid)
    end
  end
end
