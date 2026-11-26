# frozen_string_literal: true

module Api
  module V3
    module Store
      module Empire
        # Volume pricing for one variant, resolved through Spree's own pricing
        # provider.
        #
        # A quantity break is a band on a price list, and a price list applies to
        # the buyer it was written for — a company's catalog, a customer group, a
        # channel. So the question "what does 50 cartons cost?" has no answer
        # without knowing who is asking. The caller that does know passes their
        # cart: `?cart_id=cart_…` carries the company, the customer and the
        # quantity already in it, and the cart is authorized exactly as a cart
        # read is, so this endpoint cannot be used to read someone else's
        # agreement. Without a cart a guest gets their own single price and no
        # ladder, which is the truthful answer rather than a helpful guess.
        class VolumePricingController < BaseController
          include Spree::Api::V3::CartResolvable

          skip_before_action :require_authentication!
          allow_guest_storefront_access!

          # GET /api/v3/store/empire/variants/:variant_id/volume_pricing
          #   [?quantity=50][&cart_id=cart_…]
          def show
            # Scoped to this store's catalogue *and* to a live product: a variant
            # of a foreign store, or of a deleted product, is not priced for this
            # buyer and answers 404 like any other unknown id.
            variant = Spree::Variant.joins(:product)
                                    .where(spree_products: { store_id: current_store.id,
                                                             deleted_at: nil })
                                    .where(deleted_at: nil)
                                    .find_by_prefix_id!(params[:variant_id])

            cart = find_cart if params[:cart_id].present?

            render json: ::Empire::VolumePricing.call(
              variant: variant,
              currency: cart&.currency.presence || current_currency,
              user: cart&.customer || current_user,
              company: cart&.company,
              quantity: quantity_param || cart&.line_items&.find_by(variant: variant)&.quantity
            )
          end

          private

          def quantity_param
            value = params[:quantity]
            return nil if value.blank?

            number = Integer(value.to_s, exception: false)
            number if number&.positive? && number <= 1_000_000
          end
        end
      end
    end
  end
end
