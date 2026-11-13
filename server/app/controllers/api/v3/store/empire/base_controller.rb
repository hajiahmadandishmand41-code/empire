# frozen_string_literal: true

module Api
  module V3
    module Store
      module Empire
        # Base controller for Empire storefront API endpoints.
        # Requires a authenticated Spree customer user.
        class BaseController < ApplicationController
          before_action :authenticate_user!

          private

          def current_store
            @current_store ||= Spree::Store.current
          end

          def require_seller!
            render json: { error: "seller account required" }, status: :forbidden unless current_user&.seller?
          end

          def require_company_member!
            render json: { error: "company membership required" }, status: :forbidden unless current_user&.empire_company_users&.any?
          end
        end
      end
    end
  end
end
