# frozen_string_literal: true

module Empire
  class Quote < ApplicationRecord
    self.table_name = "empire_quotes"

    belongs_to :empire_rfq, class_name: "Empire::Rfq", foreign_key: :empire_rfq_id
    belongs_to :empire_seller, class_name: "Empire::Seller", foreign_key: :empire_seller_id

    enum status: { pending: 0, accepted: 1, rejected: 2, withdrawn: 3 }

    validates :amount, presence: true, numericality: { greater_than: 0 }

    def accept!
      ActiveRecord::Base.transaction do
        update!(status: :accepted, responded_at: Time.current)
        empire_rfq.update!(status: :accepted)
        empire_rfq.quotes.where.not(id: id).update_all(status: :rejected)
      end
    end

    def reject!
      update!(status: :rejected, responded_at: Time.current)
    end
  end
end
