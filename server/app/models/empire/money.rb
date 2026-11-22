# frozen_string_literal: true

module Empire
  # Money as the Spree API states it: a decimal string in major units, with two
  # decimals for a currency that has them.
  #
  # `BigDecimal#to_s` renders `1250.0` as `0.125e4`, which is neither what the
  # Store API documents nor something a storefront can hand to `formatMoney`.
  # Every Empire serializer goes through here so a price leaving the API is a
  # plain decimal string exactly once.
  module Money
    module_function

    # @param amount [BigDecimal, Numeric, String, nil]
    # @return [String, nil] e.g. "1250.00"
    def format(amount)
      return nil if amount.nil?
      return nil unless amount.respond_to?(:to_d)

      value = amount.to_d
      format('%.2f', value)
    rescue ArgumentError, TypeError
      nil
    end
  end
end
