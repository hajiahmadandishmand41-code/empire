# frozen_string_literal: true

module Api
  module V3
    module Store
      module Empire
        class RfqsController < BaseController
          def index
            render json: { data: visible.map { |rfq| serialize(rfq) } }
          end

          def show
            rfq = visible.find(params[:id])
            render json: serialize(rfq, quotes: true)
          end

          def create
            rfq = ::Empire::Rfq.new(rfq_params.merge(store: current_store, customer: current_user))
            assign_reference(rfq, :company, current_store.companies)
            assign_reference(rfq, :seller, current_store.sellers)
            assign_reference(rfq, :variant, Spree::Variant.joins(:product).where(spree_products: { store_id: current_store.id }))
            if rfq.save
              render json: serialize(rfq), status: :created
            else
              render_validation_error(rfq.errors)
            end
          end

          def accept
            rfq = visible.find(params[:id])
            quote = rfq.quotes.find(params[:quote_id])
            ::Empire::AcceptQuote.call(rfq: rfq, quote: quote)
            render json: serialize(rfq.reload, quotes: true)
          rescue ActiveRecord::RecordInvalid => e
            render_error(code: 'quote_unavailable', message: e.message, status: :unprocessable_content)
          end

          private

          def visible
            standing = current_user.company_standing(store: current_store).select(:id)
            ::Empire::Rfq.where(store: current_store).where(customer: current_user)
                         .or(::Empire::Rfq.where(store: current_store).where(company_id: standing)).order(created_at: :desc)
          end

          def assign_reference(rfq, name, scope)
            return if params[name].blank?

            rfq.public_send("#{name}=", scope.find_by_prefix_id!(params[name]))
          end

          def rfq_params
            params.permit(:title, :description, :requested_quantity, :budget_min, :budget_max, :expires_at)
          end

          def serialize(rfq, quotes: false)
            data = { id: rfq.id, title: rfq.title, description: rfq.description, status: rfq.status,
                     requested_quantity: rfq.requested_quantity, currency: rfq.currency,
                     budget_min: rfq.budget_min&.to_s, budget_max: rfq.budget_max&.to_s,
                     company_id: rfq.company&.prefixed_id, variant_id: rfq.variant&.prefixed_id,
                     seller_id: rfq.seller&.prefixed_id, expires_at: rfq.expires_at, created_at: rfq.created_at }
            data[:quotes] = rfq.quotes.order(:created_at).map { |quote|
              { id: quote.id, seller_id: quote.seller.prefixed_id, amount: quote.amount.to_s,
                currency: quote.currency, status: quote.status, notes: quote.notes }
            } if quotes
            data
          end
        end
      end
    end
  end
end
