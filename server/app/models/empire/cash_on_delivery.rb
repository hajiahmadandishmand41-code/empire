# frozen_string_literal: true

module Empire
  # Spree 6.0.4 has an offline Check method but no COD provider. Reuse its
  # offline payment implementation; manual capture means an order is never
  # reported paid merely because the shopper selected COD.
  class CashOnDelivery < Spree::PaymentMethod::Check
    def self.provider_key
      'empire_cash_on_delivery'
    end

    def partial_name
      'check'
    end

    def payment_profiles_supported?
      false
    end
  end
end
