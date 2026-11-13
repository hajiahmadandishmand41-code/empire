# frozen_string_literal: true

module Api
  module V3
    module Admin
      module Empire
        class RfqsController < BaseController
          def index
            rfqs = Empire::Rfq.includes(:user).order(created_at: :desc)
            render json: rfqs.map { |r|
              { id: r.id, title: r.title, buyer: r.user.email, status: r.status, created_at: r.created_at }
            }
          end
        end
      end
    end
  end
end
