# frozen_string_literal: true

module Empire
  class Province < ApplicationRecord
    self.table_name = 'empire_provinces'
    has_many :districts, class_name: 'Empire::District', dependent: :destroy, inverse_of: :province

    validates :name, :name_en, presence: true
    validates :code, presence: true, uniqueness: true
    scope :active, -> { where(active: true) }

    def localized_name(locale = I18n.locale)
      locale.to_s == 'en' ? name_en : name
    end
  end
end
