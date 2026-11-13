# frozen_string_literal: true

module Api
  module V3
    module Store
      module Empire
        # Inherits the installed Spree 6.0.4 store authentication: a
        # publishable key selects the store, and a store-audience JWT selects
        # the customer. There is no session/cookie or legacy Spree::User path.
        class BaseController < Spree::Api::V3::Store::BaseController
          before_action :require_authentication!

          private

          def render_record(record, status: :ok)
            render json: record, status: status
          end
        end
      end
    end
  end
end
