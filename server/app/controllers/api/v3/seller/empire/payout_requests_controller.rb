# frozen_string_literal: true

module Api
  module V3
    module Seller
      module Empire
        class PayoutRequestsController < Spree::Api::V3::Seller::BaseController
          scoped_resource :payout_requests

          def index
            render json: { data: ::Empire::PayoutRequest.where(seller: current_seller).order(created_at: :desc).map { |request| serialize(request) } }
          end

          def create
            unless current_seller.approved? && current_seller.balances.any? { |balance| balance.balance.positive? }
              return render_error(code: 'no_payable_balance', message: I18n.t('empire.no_payable_balance'), status: :unprocessable_content)
            end

            request = ::Empire::PayoutRequest.create!(seller: current_seller, currency: current_store.default_currency,
                                                     note: params[:note].to_s.presence)
            render json: serialize(request), status: :created
          rescue ActiveRecord::RecordInvalid, ActiveRecord::RecordNotUnique
            render_error(code: 'payout_request_invalid', message: I18n.t('empire.payout_request_invalid'), status: :unprocessable_content)
          end

          private

          def serialize(request)
            { id: request.id, status: request.status, currency: request.currency, note: request.note,
              payout_id: request.payout&.prefixed_id, created_at: request.created_at }
          end
        end
      end
    end
  end
end
