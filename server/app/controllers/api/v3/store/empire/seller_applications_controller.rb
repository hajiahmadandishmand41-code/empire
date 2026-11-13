# frozen_string_literal: true

module Api
  module V3
    module Store
      module Empire
        class SellerApplicationsController < BaseController
          skip_before_action :require_authentication!, only: :create
          allow_guest_storefront_access!
          rate_limit to: 5, within: 1.hour, store: Rails.cache, only: :create,
                     name: 'empire-seller-application', with: -> { render_rate_limited(limit: 5) }

          # POST /api/v3/store/empire/seller_applications
          # Creates a pending native Spree seller and a seller-only team
          # membership. No store staff role, approval, or payout is granted.
          def create
            attributes = params.permit(:email, :password, :password_confirmation, :shop_name, :registration_number)
            if attributes[:password].to_s.length < 8 || attributes[:shop_name].to_s.strip.blank?
              return render_error(code: 'validation_error', message: I18n.t('empire.application_invalid'), status: :unprocessable_content)
            end

            user = nil
            seller = nil
            ActiveRecord::Base.transaction do
              user = Spree.admin_user_class.create!(email: attributes[:email].to_s.strip.downcase,
                                                   password: attributes[:password],
                                                   password_confirmation: attributes[:password_confirmation],
                                                   first_name: attributes[:shop_name].to_s.strip, last_name: 'Empire')
              result = Spree.seller_create_workflow.call(store: current_store,
                                                        attributes: { name: attributes[:shop_name].to_s.strip,
                                                                      contact_email: user.email,
                                                                      registration_number: attributes[:registration_number].to_s.presence })
              raise ActiveRecord::Rollback unless result.success?

              seller = result.value
              seller.add_user(user)
            end
            return render_error(code: 'validation_error', message: I18n.t('empire.application_invalid'), status: :unprocessable_content) if seller.nil?

            render json: { id: seller.prefixed_id, status: seller.status, seller_panel: '/sellers' }, status: :created
          rescue ActiveRecord::RecordInvalid
            render_error(code: 'validation_error', message: I18n.t('empire.application_invalid'), status: :unprocessable_content)
          end
        end
      end
    end
  end
end
