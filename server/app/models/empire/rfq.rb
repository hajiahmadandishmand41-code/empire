# frozen_string_literal: true

module Empire
  class Rfq < ApplicationRecord
    self.table_name = 'empire_rfqs'

    belongs_to :store, class_name: 'Spree::Store'
    belongs_to :customer, class_name: 'Spree::Customer'
    belongs_to :company, class_name: 'Spree::Company', optional: true
    belongs_to :variant, class_name: 'Spree::Variant', optional: true
    belongs_to :seller, class_name: 'Spree::Seller', optional: true
    has_many :quotes, class_name: 'Empire::Quote', dependent: :destroy

    enum :status, { open: 0, quoted: 1, accepted: 2, closed: 3 }, default: :open

    before_validation { self.currency ||= store&.default_currency }
    validates :title, presence: true, length: { maximum: 200 }
    validates :requested_quantity, numericality: { only_integer: true, greater_than: 0 }
    validates :currency, presence: true
    validates :budget_min, :budget_max, numericality: { greater_than_or_equal_to: 0 }, allow_nil: true
    validate :budget_range
    validate :company_membership
    validate :store_references

    def expired?
      expires_at.present? && Time.current >= expires_at
    end

    def readable_by?(customer)
      self.customer == customer || (company.present? && customer.standing_for?(company))
    end

    private

    def budget_range
      return if budget_min.nil? || budget_max.nil? || budget_max >= budget_min

      errors.add(:budget_max, :greater_than_or_equal_to, count: budget_min)
    end

    def company_membership
      return if company.nil? || customer&.standing_for?(company)

      errors.add(:company, :invalid)
    end

    def store_references
      errors.add(:company, :invalid) if company.present? && company.store_id != store_id
      errors.add(:variant, :invalid) if variant.present? && variant.product.store_id != store_id
      errors.add(:seller, :invalid) if seller.present? && (seller.store_id != store_id || !seller.approved?)
    end
  end
end
