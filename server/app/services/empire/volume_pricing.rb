# frozen_string_literal: true

module Empire
  # The volume price ladder a buyer would actually be charged.
  #
  # Spree 6 has no per-variant quantity rows: a quantity break is a *band* on a
  # price list (`spree_price_adjustment_tiers`, each a percentage off the base
  # price from a minimum quantity), and a list only applies to a buyer it was
  # written for — a company's catalog, a customer group, a channel. The Store
  # API's product payload carries the single price for the current context, so a
  # wholesale buyer cannot see what 50 cartons would cost before filling a cart.
  #
  # Two rules keep this honest rather than optimistic:
  #
  # 1. Every number comes from `Spree::Pricing::PriceResolution` — the same
  #    resolver checkout uses — asked once per band. A discount that does not
  #    apply to this buyer is simply not shown, because it is not returned.
  # 2. A ladder is only reported when a price list actually applies to this
  #    buyer. Without one, a guest sees their own single price and no bands: this
  #    endpoint is not a back door into another company's negotiated agreement.
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

    # @return [Hash] the ladder, the buyer's own price, and the ordering rules a
    #   buyer must respect when building a cart
    def call
      ladder = bands.map { |band| band.merge(amount: Money.format(band[:amount])) }
      {
        variant_id: @variant.prefixed_id,
        currency: @currency,
        # Volume terms are part of the same agreement as the price, so a buyer
        # reading a ladder sees the case size and minimum in the same breath.
        minimum_order_quantity: @variant.minimum_order_quantity,
        order_multiple: @variant.order_multiple,
        units_per_carton: @variant.units_per_carton,
        purchase_unit: @variant.purchase_unit,
        # What this buyer pays right now, whatever their quantity: the number
        # checkout would charge, spelled as a decimal string.
        resolved_amount: Money.format(resolved_price&.amount),
        quantity_resolved: @quantity,
        price_list_applied: applicable_price_list.present?,
        tiers: ladder
      }
    end

    private

    # The bands of the list that prices this buyer, with the exact amount the
    # resolver returns at each break point. A band whose quantity resolves to the
    # same price as the one before it adds nothing a buyer can act on, so it is
    # dropped rather than padding the ladder with a plateau.
    def bands
      @bands ||= begin
        list = applicable_price_list
        return [] if list.nil?

        quantities = list.price_adjustment_tiers.filter_map { |tier| tier.min_quantity }.uniq.sort
        base = price_at(1)
        seen = []
        previous = base&.amount

        quantities.first(MAX_TIERS).filter_map do |min_quantity|
          price = price_at(min_quantity)
          next if price.nil? || price.amount.nil?
          next if price.amount == previous

          previous = price.amount
          seen << { min_quantity: min_quantity, amount: price.amount,
                    percentage: list.adjustment_percentage_for(min_quantity)&.to_f,
                    currency: price.currency }
        end
      end
    end

    # The price list Spree's resolver picked for this buyer, if it picked one at
    # all. Read off the resolved price rather than re-deriving eligibility: the
    # resolver already decided, and a second opinion here could disagree with the
    # amount charged.
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
