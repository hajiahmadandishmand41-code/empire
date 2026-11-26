# frozen_string_literal: true

module Empire
  # The volume price ladder a buyer would actually be charged.
  #
  # Spree 6 keeps a variant's quantity ladder as rows on a *price list*: each row
  # is a `min_quantity` with its own amount, and `min_quantity: 1` is the bottom
  # rung. The list reaches a buyer through their company's catalog — a negotiated
  # agreement — or through the list's own rules; a list nobody is entitled to
  # does not price anybody. The Store API's product payload carries only the one
  # price for the current context, so a wholesale buyer cannot see what 50 cartons
  # cost before filling a cart.
  #
  # The ladder is read from the list the resolver actually chose for this caller,
  # and every rung's amount is what `Spree::Pricing::PriceResolution` returns at
  # that quantity — the same code that charges the cart. Nothing here re-derives a
  # discount, so the number shown and the number charged cannot disagree.
  class VolumePricing
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

    # @return [Hash] the ladder, the caller's own price, and the ordering terms
    def call
      {
        variant_id: @variant.prefixed_id,
        currency: @currency,
        # Volume terms belong beside the price: a buyer reading a ladder needs
        # the case size and minimum in the same breath.
        minimum_order_quantity: @variant.minimum_order_quantity,
        order_multiple: @variant.order_multiple,
        units_per_carton: @variant.units_per_carton,
        purchase_unit: @variant.purchase_unit,
        # What this caller would pay at the quantity they stated — or for one
        # unit when they stated none, which is the honest default rather than
        # the deepest discount on the page.
        resolved_amount: Money.format(resolved_price&.amount),
        quantity_resolved: @quantity,
        # False means "you have no agreement here": the amount is the shop price
        # and there is no ladder, because there is nothing to negotiate against.
        price_list_applied: applicable_price_list.present?,
        tiers: tiers
      }
    end

    private

    # The rungs of the applicable list, in ascending quantity.
    def tiers
      @tiers ||= applicable_price_list ? ladder_for(applicable_price_list) : []
    end

    # Spree expresses a ladder in two shapes, and a list may use either:
    #
    # * explicit rows — a `spree_prices` row per `min_quantity` on the list, which
    #   is a negotiated amount per volume band;
    # * a derived percentage — the list's own `price_adjustment_percentage` plus
    #   its `price_adjustment_tiers` bands, each a percentage *off the base
    #   price*, which is how the admin API's `price_list` payload creates one.
    #
    # Both are read the same way: collect the quantity where the price changes,
    # then ask the resolver what it would charge there. Nothing computes a
    # discount here, so a derived percentage and a stored row cannot disagree
    # with the cart.
    def ladder_for(list)
      previous = nil
      candidate_quantities(list).first(MAX_TIERS).filter_map do |min_quantity|
        price = price_at(min_quantity)
        next if price.nil? || price.amount.nil?
        # A band that changes nothing is a plateau, not a volume offer.
        next if price.amount == previous

        previous = price.amount
        { min_quantity: min_quantity, amount: Money.format(price.amount),
          compare_at_amount: Money.format(price.compare_at_amount) }
      end
    end

    def candidate_quantities(list)
      quantities = [1]
      quantities.concat(@variant.prices.where(currency: @currency, price_list_id: list.id)
                                .where.not(amount: nil).pluck(:min_quantity))
      quantities.concat(list.price_adjustment_tiers.pluck(:min_quantity))
      quantities.compact.select(&:positive?).uniq.sort
    end

    # The list Spree's resolver picked for this caller, if it picked one at all.
    # Read off the resolved price rather than re-deriving eligibility: the
    # resolver already decided, and a second opinion here could disagree with the
    # amount actually charged.
    def applicable_price_list
      return @applicable_price_list if defined?(@applicable_price_list)

      @applicable_price_list = resolved_price&.price_list
    end

    def price_at(quantity)
      @variant.price_for(context(quantity))
    rescue StandardError
      nil
    end

    def resolved_price
      return @resolved_price if defined?(@resolved_price)

      @resolved_price = price_at(@quantity || 1)
    end

    def context(quantity)
      Spree::Pricing::Context.new(
        variant: @variant, currency: @currency, quantity: quantity,
        user: @user, company: @company
      )
    end
  end
end
