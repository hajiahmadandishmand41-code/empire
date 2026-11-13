# frozen_string_literal: true

module Api
  module V3
    module Store
      module Empire
        class SellersController < BaseController
          def me
            seller = current_user.empire_seller
            render json: { error: "no seller profile" }, status: :not_found and return unless seller

            render json: {
              id: seller.id,
              shop_name: seller.shop_name,
              shop_description: seller.shop_description,
              verification_status: seller.verification_status,
              commission_rate: seller.commission_rate,
              created_at: seller.created_at,
            }
          end

          def update_profile
            seller = current_user.empire_seller
            render json: { error: "no seller profile" }, status: :not_found and return unless seller

            if seller.update(shop_profile_params)
              render json: { id: seller.id, shop_name: seller.shop_name }
            else
              render json: { errors: seller.errors.full_messages }, status: :unprocessable_entity
            end
          end

          private

          def shop_profile_params
            params.permit(:shop_name, :shop_description)
          end
        end
      end
    end
  end
end
