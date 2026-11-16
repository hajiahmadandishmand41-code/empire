# frozen_string_literal: true

module Api
  module V3
    module Admin
      module Empire
        class RfqsController < BaseController
          scoped_resource :rfqs

          def index
            render json: { data: ::Empire::Rfq.where(store: current_store).order(created_at: :desc).map { |rfq|
              { id: rfq.id, title: rfq.title, customer_id: rfq.customer.prefixed_id,
                company_id: rfq.company&.prefixed_id, status: rfq.status, currency: rfq.currency }
            } }
          end
        end
      end
    end
  end
end
