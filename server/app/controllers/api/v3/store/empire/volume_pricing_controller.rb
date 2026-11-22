# frozen_string_literal: true

module Api
  module V3
    module Store
      module Empire
        # Volume pricing for one variant, resolved through Spree's own pricing
        # provider. Public: a guest sees the base tier, a signed-in buyer sees
        # whatever their company, catalog or customer group actually entitle
        # them to, because the resolver is asked rather than the rows read.
        class VolumePricingController < BaseController
          skip_before_action :require_authentication!
          allow_guest_storefront_access!

          # GET /api/v3/store/empire/variants/:variant_id/volume_pricing?quantity=50
          def show
            variant = Spree::Variant.joins(:product)
                                    .where(spree_products: { store_id: current_store.id }, deleted_at: nil)
                                    .find_by_prefix_id!(params[:variant_id])

            render json: ::Empire::VolumePricing.call(
              variant: variant,
              currency: current_currency,
              user: current_user,
              company: current_user && resolved_company,
              quantity: quantity_param
            )
          end

          private

          def quantity_param
            value = params[:quantity]
            return nil if value.blank?

            number = Integer(value.to_s, exception: false)
            number if number&.positive? && number <= 1_000_000
          end

          # The buyer's standing company for this store, if any. A guest has
          # none, and `company_standing` is the same scoped lookup the RFQ API
          # uses, so pricing and RFQ agree on which agreement applies.
          def resolved_company
            current_user.company_standing(store: current_store).first&.company
          end
        end
      end
    end
  end
end
