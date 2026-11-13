# frozen_string_literal: true

module Api
  module V3
    module Admin
      module Empire
        class SellersController < BaseController
          def index
            sellers = Empire::Seller.includes(:user).order(created_at: :desc)
            render json: sellers.map { |s|
              {
                id: s.id,
                shop_name: s.shop_name,
                user_email: s.user.email,
                verification_status: s.verification_status,
                commission_rate: s.commission_rate,
              }
            }
          end

          def verify
            seller = Empire::Seller.find(params[:id])
            if seller.update(verification_status: :verified, verified_by: current_user, verified_at: Time.current)
              render json: { id: seller.id, verification_status: seller.verification_status }
            else
              render json: { errors: seller.errors.full_messages }, status: :unprocessable_entity
            end
          end

          def reject
            seller = Empire::Seller.find(params[:id])
            if seller.update(verification_status: :rejected, rejection_reason: params[:reason])
              render json: { id: seller.id, verification_status: seller.verification_status }
            else
              render json: { errors: seller.errors.full_messages }, status: :unprocessable_entity
            end
          end

          def suspend
            seller = Empire::Seller.find(params[:id])
            seller.update!(verification_status: :suspended)
            render json: { id: seller.id, verification_status: seller.verification_status }
          end
        end
      end
    end
  end
end
