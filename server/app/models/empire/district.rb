# frozen_string_literal: true

module Empire
  class District < ApplicationRecord
    self.table_name = 'empire_districts'
    belongs_to :province, class_name: 'Empire::Province', inverse_of: :districts

    validates :name, :name_en, presence: true
    validates :name, uniqueness: { scope: :province_id }
    scope :active, -> { where(active: true) }

    def localized_name(locale = I18n.locale)
      locale.to_s == 'en' ? name_en : name
    end
  end
end
