# frozen_string_literal: true

module Api
  module V3
    module Store
      module Empire
        # Public seller application.
        #
        # Accepts the complete application the storefront collects and stores
        # every field it accepts — the previous version read six keys and
        # silently dropped name, phone, address, city, description and
        # categories. Nothing here approves the merchant: the application is
        # `pending` and only the admin review endpoints may decide.
        class SellerApplicationsController < BaseController
          skip_before_action :require_authentication!, only: %i[create show]
          allow_guest_storefront_access!

          rate_limit to: 5, within: 1.hour, store: Rails.cache, only: :create,
                     name: 'empire-seller-application',
                     with: -> { render_rate_limited(limit: 5) }

          # POST /api/v3/store/empire/seller_applications
          def create
            result = ::Empire::ApplySeller.call(store: current_store, attributes: application_params,
                                                locale: current_locale)
            return render_application_errors(result.errors) unless result.success?

            render json: serialize(result.application), status: :created
          end

          # GET /api/v3/store/empire/seller_applications/:id
          #
          # The applicant's own status. Proof of ownership is the e-mail address
          # the application was made with, sent as `email` — the applicant has no
          # customer account yet at this point, so there is no session to check
          # against. Nothing beyond the status and the reviewer's public note is
          # returned, and a mismatch answers 404 exactly like an unknown id so
          # the endpoint cannot be used to discover addresses.
          def show
            application = ::Empire::SellerApplication.where(store: current_store).find(params[:id])
            unless application.email == params[:email].to_s.strip.downcase
              raise ActiveRecord::RecordNotFound
            end

            render json: { id: application.id, status: application.status,
                           shop_name: application.shop_name,
                           submitted_at: application.last_submitted_at || application.created_at,
                           reviewed_at: application.reviewed_at,
                           rejection_reason: application.status == 'rejected' ? application.rejection_reason : nil }
          end

          private

          def application_params
            params.permit(:shop_name, :name, :contact_name, :email, :password, :password_confirmation,
                          :phone, :address, :city, :description, :registration_number,
                          categories: []).tap do |permitted|
              # The form offers an owner/representative name; the API names the
              # column `contact_name`. Accept both spellings instead of forcing
              # the browser to know the database's vocabulary.
              permitted[:contact_name] = (permitted[:contact_name].presence || permitted[:name].presence)
            end
          end

          def render_application_errors(errors)
            if errors.is_a?(Hash)
              render_error(code: 'validation_error', message: errors.values.flatten.to_sentence,
                           status: :unprocessable_content)
            elsif errors.respond_to?(:full_messages) && errors.any?
              render_validation_error(errors)
            else
              render_error(code: 'validation_error', message: I18n.t('empire.application_invalid'),
                           status: :unprocessable_content)
            end
          end

          def serialize(application)
            { id: application.id, status: application.status, shop_name: application.shop_name,
              seller_id: application.seller&.prefixed_id, seller_panel: '/sellers',
              submitted_at: application.last_submitted_at || application.created_at,
              categories: application.categories }
          end
        end
      end
    end
  end
end
