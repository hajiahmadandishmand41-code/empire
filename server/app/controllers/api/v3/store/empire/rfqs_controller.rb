# frozen_string_literal: true

module Api
  module V3
    module Store
      module Empire
        class RfqsController < BaseController
          def index
            rfqs = spree_current_user.rfqs.order(created_at: :desc)
            render json: rfqs.map { |r|
              { id: r.id, title: r.title, status: r.status, currency: r.currency, created_at: r.created_at }
            }
          end

          def create
            rfq = spree_current_user.rfqs.build(rfq_params)
            if rfq.save
              render json: { id: rfq.id, status: rfq.status }, status: :created
            else
              render json: { errors: rfq.errors.full_messages }, status: :unprocessable_entity
            end
          end

          private

          def rfq_params
            params.permit(:title, :description, :budget_min, :budget_max, :currency, :company_id, :expires_at)
          end
        end
      end
    end  end
end
