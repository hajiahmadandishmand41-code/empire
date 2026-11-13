# frozen_string_literal: true

module Empire
  class Quote < ApplicationRecord
    self.table_name = 'empire_quotes'

    belongs_to :rfq, class_name: 'Empire::Rfq'
    belongs_to :seller, class_name: 'Spree::Seller'

    enum :status, { pending: 0, accepted: 1, rejected: 2, withdrawn: 3 }, default: :pending

    before_validation { self.currency ||= rfq&.currency }
    validates :amount, presence: true, numericality: { greater_than: 0 }
    validates :seller_id, uniqueness: { scope: :rfq_id }
    validate :seller_may_quote

    private

    def seller_may_quote
      return if rfq.nil? || seller.nil?
      return if seller.approved? && seller.store_id == rfq.store_id &&
                (rfq.seller_id.nil? || rfq.seller_id == seller.id) && rfq.open? && !rfq.expired?

      errors.add(:base, I18n.t('empire.quote_unavailable'))
    end
  end
end
