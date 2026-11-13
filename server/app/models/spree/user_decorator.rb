# frozen_string_literal: true

# Extends Spree::User with Empire-specific associations.
module Spree
  User.prepend(Module.new do
    def self.prepended(base)
      base.has_one :empire_seller,
                   class_name: "Empire::Seller",
                   foreign_key: :user_id,
                   inverse_of: :user,
                   dependent: :destroy
      base.has_many :empire_company_users,
                    class_name: "Empire::CompanyUser",
                    foreign_key: :user_id,
                    inverse_of: :user,
                    dependent: :destroy
      base.has_many :empire_companies,
                    through: :empire_company_users,
                    source: :empire_company,
                    class_name: "Empire::Company"
      base.has_many :bank_transfers,
                    class_name: "Empire::BankTransfer",
                    foreign_key: :user_id,
                    inverse_of: :user,
                    dependent: :destroy
      base.has_many :rfqs,
                    class_name: "Empire::Rfq",
                    foreign_key: :user_id,
                    inverse_of: :user,
                    dependent: :destroy
    end

    def seller?
      empire_seller.present?
    end

    def seller_verified?
      empire_seller&.verified?
    end
  end)
end
