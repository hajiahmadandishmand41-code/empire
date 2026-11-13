# frozen_string_literal: true

module Empire
  class Rfq < ApplicationRecord
    self.table_name = "empire_rfqs"

    belongs_to :user, class_name: "Spree::User", foreign_key: :user_id
    belongs_to :company, class_name: "Empire::Company", foreign_key: :company_id, optional: true
    has_many :quotes, class_name: "Empire::Quote", foreign_key: :empire_rfq_id, dependent: :destroy

    enum status: { open: 0, quoted: 1, accepted: 2, rejected: 3, closed: 4 }

    validates :title, presence: true
    validates :currency, presence: true

    def open?
      status == "open"
    end

    def expired?
      expires_at.present? && Time.current > expires_at
    end
  end
end
