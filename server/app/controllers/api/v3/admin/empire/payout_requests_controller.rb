# frozen_string_literal: true

module Api
  module V3
    module Admin
      module Empire
        class PayoutRequestsController < BaseController
          scoped_resource :payout_requests
          before_action :require_current_user!, only: %i[approve reject]

          def index
            render json: { data: scoped_requests.order(created_at: :desc).map { |request| serialize(request) } }
          end

          def approve
            review(approve: true)
          end

          def reject
            review(approve: false)
          end

          private

          def scoped_requests
            ::Empire::PayoutRequest.joins(:seller).where(spree_sellers: { store_id: current_store.id })
          end

          def review(approve:)
            request = scoped_requests.find(params[:id])
            result = ::Empire::ReviewPayoutRequest.call(request: request, reviewer: current_user,
                                                       approve: approve, reason: params[:reason])
            if result.success?
              render json: serialize(result.request)
            else
              render_error(code: 'payout_review_failed', message: result.error, status: :unprocessable_content)
            end
          end

          def serialize(request)
            { id: request.id, seller_id: request.seller.prefixed_id, status: request.status,
              currency: request.currency, payout_id: request.payout&.prefixed_id,
              reviewed_by_id: request.reviewed_by&.prefixed_id, reviewed_at: request.reviewed_at }
          end
        end
      end
    end
  end
end
