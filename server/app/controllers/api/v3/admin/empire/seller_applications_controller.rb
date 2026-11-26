# frozen_string_literal: true

module Api
  module V3
    module Admin
      module Empire
        # Review queue for seller applications.
        #
        # Gated on `read_sellers` / `write_sellers` — the same permission that
        # governs admitting a seller natively, because this endpoint *is* the act
        # of admitting one. Approval runs Spree's own
        # `seller_approve_workflow`; it does not knock the seller into `approved`
        # with an `update!`, so requirement checks, events and webhooks all still
        # apply.
        class SellerApplicationsController < BaseController
          scoped_resource :sellers

          def index
            scope = ::Empire::SellerApplication.where(store: current_store).order(created_at: :desc, id: :desc)
            scope = scope.where(status: params[:status]) if params[:status].present?
            render json: { data: scope.map(&:review_summary), meta: { count: scope.size } }
          end

          def show
            application = scoped.find(params[:id])
            render json: application.review_summary
          end

          # PATCH /api/v3/admin/empire/seller_applications/:id/approve
          def approve
            application = scoped.find(params[:id])
            unless application.pending? && application.seller.present?
              return render_error(code: 'application_not_pending', message: I18n.t('empire.application_not_pending'),
                                  status: :unprocessable_content)
            end

            # Truthiness is decided explicitly: `"false"` from a JSON body is a
            # non-empty string, and `present?` would read it as an override.
            override = ActiveModel::Type::Boolean.new.cast(params[:override_requirements]) || false
            result = Spree.seller_approve_workflow.call(seller: application.seller, approver: current_user,
                                                        override_requirements: override)
            unless result.success?
              return render_error(code: 'seller_approval_failed',
                                  message: I18n.t('empire.seller_approval_failed'),
                                  status: :unprocessable_content,
                                  details: approval_details(result))
            end

            application.approve!(reviewer: current_user, seller: result.value.is_a?(Spree::Seller) ? result.value : application.seller)
            render json: application.review_summary
          end

          # PATCH /api/v3/admin/empire/seller_applications/:id/reject
          def reject
            application = scoped.find(params[:id])
            unless application.pending?
              return render_error(code: 'application_not_pending', message: I18n.t('empire.application_not_pending'),
                                  status: :unprocessable_content)
            end

            reason = params[:reason].to_s.strip
            if reason.length < 3
              return render_error(code: 'validation_error', message: I18n.t('empire.rejection_reason_required'),
                                  status: :unprocessable_content)
            end

            # Rejecting the application also closes the seller the applicant was
            # provisioned as, through Spree's own workflow — a seller left
            # `pending` would still show up in the review queue and still hold a
            # storefront shell. The workflow converts the seller's status; it
            # does not delete the user, so the applicant can be contacted about a
            # corrected application.
            if application.seller.present? && Spree.respond_to?(:seller_reject_workflow)
              Spree.seller_reject_workflow.call(seller: application.seller, rejected_by: current_user, reason: reason)
            end
            application.reject!(reviewer: current_user, reason: reason)
            render json: application.review_summary
          end

          private

          def scoped
            ::Empire::SellerApplication.where(store: current_store)
          end

          def approval_details(result)
            error = result.error
            errors = error.respond_to?(:value) ? error.value : error
            errors.respond_to?(:full_messages) ? { base: errors.full_messages } : nil
          end
        end
      end
    end
  end
end
