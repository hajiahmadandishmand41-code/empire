# frozen_string_literal: true

module Empire
  class BankTransfer < ApplicationRecord
    self.table_name = "empire_bank_transfers"

    belongs_to :order, class_name: "Spree::Order", foreign_key: :order_id
    belongs_to :user, class_name: "Spree::User", foreign_key: :user_id
    belongs_to :verified_by, class_name: "Spree::User", foreign_key: :verified_by_id, optional: true

    enum status: { pending: 0, verified: 1, rejected: 2 }

    validates :bank_name, :account_number, :account_holder, :branch, presence: true
    validates :amount, presence: true, numericality: { greater_than: 0 }
    validates :reference_number, presence: true, uniqueness: true

    def verify!(admin_user)
      update!(status: :verified, verified_by: admin_user, verified_at: Time.current)
    end

    def reject!(reason)
      update!(status: :rejected, rejection_reason: reason)
    end
  end
end
