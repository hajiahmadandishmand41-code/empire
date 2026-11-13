# frozen_string_literal: true

module Api
  module V3
    module Admin
      module Empire
        class PayoutsController < BaseController
          def index
            payouts = Empire::Payout.includes(:empire_seller).order(created_at: :desc)
            render json: payouts.map { |p|
              {
                id: p.id,
                seller: p.empire_seller.shop_name,
                status: p.status,
                net_amount: p.net_amount,
                currency: p.currency,
                created_at: p.created_at,
              }
            }
          end

          def approve
            payout = Empire::Payout.find(params[:id])
            payout.approve!(current_user)
            render json: { id: payout.id, status: payout.status }
          end

          def reject
            payout = Empire::Payout.find(params[:id])
            payout.reject!(params[:reason])
            render json: { id: payout.id, status: payout.status }
          end
        end
      end
    end
  end
end
