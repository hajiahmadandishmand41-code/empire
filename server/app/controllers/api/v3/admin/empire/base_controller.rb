# frozen_string_literal: true

module Api
  module V3
    module Admin
      module Empire
        # Native admin authentication + scoped authorization. A customer or
        # seller JWT cannot authenticate here; a secret key needs the explicit
        # extension scope. Row queries are always bound to current_store.
        class BaseController < Spree::Api::V3::Admin::BaseController
        end
      end
    end
  end
end
