# frozen_string_literal: true

module Empire
  class Dispute < ApplicationRecord
    self.table_name = "empire_disputes"

    belongs_to :order, class_name: "Spree::Order", foreign_key: :order_id
    belongs_to :buyer, class_name: "Spree::User", foreign_key: :buyer_id
    belongs_to :empire_seller, class_name: "Empire::Seller", foreign_key: :empire_seller_id
    belongs_to :resolved_by, class_name: "Spree::User", foreign_key: :resolved_by_id, optional: true

    enum status: { open: 0, in_review: 1, resolved: 2, closed: 3 }

    validates :reason, presence: true

    def resolve!(admin_user, resolution)
      update!(status: :resolved, resolved_by: admin_user, resolved_at: Time.current, resolution: resolution)
    end
  end
end
