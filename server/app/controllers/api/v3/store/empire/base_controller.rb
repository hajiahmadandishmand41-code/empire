# frozen_string_literal: true

module Api
  module V3
    module Store
      module Empire
        # Base controller for Empire storefront API endpoints.
        # Uses Spree's built-in authentication helpers (session / API key).
        class BaseController < ApplicationController
          include Spree::Core::ControllerHelpers::Auth
          include Spree::Core::ControllerHelpers::Store

          before_action :authenticate_spree_user!

          private

          def current_store
            @current_store ||= Spree::Store.current
          end

          def require_seller!
            render json: { error: "seller account required" }, status: :forbidden unless spree_current_user&.seller?
          end

          def require_company_member!
            render json: { error: "company membership required" }, status: :forbidden unless spree_current_user&.empire_company_users&.any?
          end
        end
      end
    end
  end
end
