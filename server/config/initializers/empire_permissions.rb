# frozen_string_literal: true

# Empire access control — supplements Spree's built-in permissions.
# Sellers can only see their own orders/products; company buyers are
# scoped to their company; admin has full access.

module Empire
  module Ability
    def self.permissions(user)
      return {} if user.nil?

      perms = {
        read_own_profile: true,
        manage_own_addresses: true,
        create_rfq: true,
        create_bank_transfer: true,
      }

      if user.seller?
        perms[:manage_own_shop] = true
        perms[:manage_own_products] = true
        perms[:view_own_orders] = true
        perms[:view_own_commissions] = true
        perms[:request_payout] = true
      end

      if user.has_spree_role?("admin")
        perms[:manage_all] = true
      end

      if user.respond_to?(:empire_company_users) && user.empire_company_users.any?
        perms[:view_company_orders] = true
        perms[:manage_company_catalog] = user.empire_company_users.any? { |cu| cu.company_admin? || cu.order_approver? }
      end

      perms
    end
  end
end
