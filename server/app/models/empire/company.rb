# frozen_string_literal: true

module Empire
  class Company < ApplicationRecord
    self.table_name = "empire_companies"

    has_many :company_users, class_name: "Empire::CompanyUser", foreign_key: :empire_company_id, dependent: :destroy
    has_many :users, through: :company_users, source: :user, class_name: "Spree::User"
    has_many :orders, class_name: "Spree::Order", foreign_key: :empire_company_id
    has_many :volume_pricing, class_name: "Empire::VolumePricing", foreign_key: :empire_company_id, dependent: :destroy

    validates :name, presence: true
    validates :registration_number, uniqueness: true, allow_nil: true

    def buyers
      company_users.buyer.includes(:user)
    end

    def admins
      company_users.company_admin.includes(:user)
    end
  end
end
