# frozen_string_literal: true

module Empire
  class Province < ApplicationRecord
    self.table_name = "empire_provinces"

    has_many :districts,
             class_name: "Empire::District",
             foreign_key: :province_id,
             inverse_of: :province,
             dependent: :destroy

    validates :name, presence: true
    validates :name_ps, presence: true
    validates :name_en, presence: true
    validates :code, presence: true, uniqueness: true

    scope :active, -> { where(active: true) }

    def localized_name(locale = I18n.locale)
      case locale.to_s
      when "ps-AF" then name_ps
      when "en" then name_en
      else name
      end
    end
  end
end
