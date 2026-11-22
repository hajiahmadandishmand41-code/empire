# frozen_string_literal: true

module Empire
  # The volume price ladder a buyer would actually be charged.
  #
  # Spree 6 keeps quantity tiers in `spree_prices.min_quantity` and resolves the
  # applicable one through `Spree::Pricing::PriceResolution` — the same resolver
  # the cart uses. The Store API's product payload exposes only the single price
  # for the current context, so a wholesale buyer cannot see what 50 cartons
  # would cost before filling a cart.
  #
  # This asks the real resolver for each tier quantity instead of reading the
  # price rows directly: a price-list tier that does not apply to this buyer (a
  # different company's agreement, another channel) is simply not returned, so
  # the ladder never shows a price checkout would refuse to honour.
  class VolumePricing
    Tier = Struct.new(:min_quantity, :amount, :compare_at_amount, :currency, :price_list_id, keyword_init: true)

    MAX_TIERS = 20

    def self.call(variant:, currency:, user: nil, company: nil, quantity: nil)
      new(variant: variant, currency: currency, user: user, company: company, quantity: quantity).call
    end

    def initialize(variant:, currency:, user: nil, company: nil, quantity: nil)
      @variant = variant
      @currency = currency
      @user = user
      @company = company
      @quantity = quantity
    end

    # @return [Hash] the ladder plus the ordering rules a buyer must respect
    def call
      {
        variant_id: @variant.prefixed_id,
        currency: @currency,
        minimum_order_quantity: @variant.minimum_order_quantity,
        order_multiple: @variant.order_multiple,
        units_per_carton: @variant.units_per_carton,
        purchase_unit: @variant.purchase_unit,
        quantity_resolved: @quantity,
        resolved_amount: Money.format(resolved_price&.amount),
        tiers: tiers.map { |tier| { min_quantity: tier.min_quantity, amount: Money.format(tier.amount),
                                    compare_at_amount: Money.format(tier.compare_at_amount),
                                    currency: tier.currency } }
      }
    end

    private

    def tiers
      @tiers ||= candidate_quantities.filter_map do |quantity|
        price = price_at(quantity)
        next if price.nil? || price.amount.nil?

        Tier.new(min_quantity: quantity, amount: price.amount,
                 compare_at_amount: price.compare_at_amount,
                 currency: price.currency, price_list_id: price.price_list_id)
      end
    end

    # Base quantity plus every tier the variant defines in this currency. Rows
    # that belong to a price list a guest cannot be entitled to are included in
    # the candidate list because the resolver, not this list, decides whether
    # they apply; a non-applicable tier resolves to the base price at that
    # quantity, which is reported as-is.
    def candidate_quantities
      quantities = [1]
      quantities.concat(@variant.prices.where(currency: @currency, deleted_at: nil).pluck(:min_quantity))
      quantities.compact.select { |value| value.positive? }.uniq.sort.first(MAX_TIERS)
    end

    def price_at(quantity)
      @variant.price_for(context(quantity))
    rescue StandardError
      nil
    end

    def resolved_price
      price_at(@quantity || 1)
    end

    def context(quantity)
      Spree::Pricing::Context.new(
        variant: @variant, currency: @currency, quantity: quantity,
        user: @user, company: @company
      )
    end
  end
end
