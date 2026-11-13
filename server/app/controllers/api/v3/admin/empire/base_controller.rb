# frozen_string_literal: true

module Api
  module V3
    module Admin
      module Empire
        # Base controller for Empire admin API endpoints. Requires admin role.
        class BaseController < ApplicationController
          before_action :authenticate_user!
          before_action :require_admin!

          private

          def require_admin!
            render json: { error: "admin access required" }, status: :forbidden unless current_user&.has_spree_role?("admin")
          end
        end
      end
    end
  end
end
