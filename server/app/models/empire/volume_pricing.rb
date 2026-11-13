# frozen_string_literal: true

module Empire
  class VolumePricing < ApplicationRecord
    self.table_name = "empire_volume_pricing"

    belongs_to :variant, class_name: "Spree::Variant", foreign_key: :variant_id
    belongs_to :empire_company, class_name: "Empire::Company", foreign_key: :empire_company_id, optional: true

    validates :min_quantity, presence: true, numericality: { greater_than: 0 }
    validates :price, presence: true, numericality: { greater_than: 0 }

    scope :active, -> { where(active: true) }
    scope :for_company, ->(company) { where(empire_company: company) }
    scope :global, -> { where(empire_company_id: nil) }

    def applicable?(quantity)
      active && quantity >= min_quantity && (max_quantity.nil? || quantity <= max_quantity)
    end
  end
end
