# frozen_string_literal: true

module Empire
  class District < ApplicationRecord
    self.table_name = "empire_districts"

    belongs_to :province,
               class_name: "Empire::Province",
               foreign_key: :province_id,
               inverse_of: :districts

    validates :name, presence: true
    validates :name_ps, presence: true
    validates :name_en, presence: true

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
