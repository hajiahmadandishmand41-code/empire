# frozen_string_literal: true

module Api
  module V3
    module Store
      module Empire
        class PayoutsController < BaseController
          def index
            seller = current_user.empire_seller
            render json: { error: "no seller profile" }, status: :not_found and return unless seller

            payouts = seller.payouts.order(created_at: :desc)
            render json: payouts.map { |p|
              { id: p.id, status: p.status, net_amount: p.net_amount, currency: p.currency, created_at: p.created_at }
            }
          end

          def create
            seller = current_user.empire_seller
            render json: { error: "no seller profile" }, status: :not_found and return unless seller

            payout = seller.payouts.build
            payout.request!
            render json: { id: payout.id, status: payout.status }, status: :created
          end
        end
      end
    end
  end
end
