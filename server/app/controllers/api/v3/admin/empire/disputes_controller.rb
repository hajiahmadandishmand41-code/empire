# frozen_string_literal: true

module Api
  module V3
    module Admin
      module Empire
        class DisputesController < BaseController
          def index
            disputes = Empire::Dispute.includes(:buyer, :empire_seller).order(created_at: :desc)
            render json: disputes.map { |d|
              {
                id: d.id,
                order_id: d.order_id,
                buyer: d.buyer.email,
                seller: d.empire_seller.shop_name,
                status: d.status,
                created_at: d.created_at,
              }
            }
          end
        end
      end
    end
  end
end
