# frozen_string_literal: true

module Empire
  class CompanyUser < ApplicationRecord
    self.table_name = "empire_company_users"

    belongs_to :user, class_name: "Spree::User", foreign_key: :user_id
    belongs_to :empire_company, class_name: "Empire::Company", foreign_key: :empire_company_id

    enum role: { buyer: 0, company_admin: 1, order_approver: 2 }

    validates :user_id, uniqueness: { scope: :empire_company_id }
  end
end
