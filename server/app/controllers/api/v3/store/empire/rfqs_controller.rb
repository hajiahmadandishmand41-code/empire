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
              # The first entry of the history is the request itself, written
              # with it so a buyer opening the page later sees the negotiation
              # from its beginning rather than from the first quote.
              rfq.record_event!(event: 'created', actor: current_user, from: nil, to: rfq.status)
              render json: serialize(rfq), status: :created
            else
              render_validation_error(rfq.errors)
            end
          end

          def accept
            rfq = visible.find(params[:id])
            quote = rfq.quotes.find(params[:quote_id])
            ::Empire::AcceptQuote.call(rfq: rfq, quote: quote, actor: current_user)
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
            value = params["#{name}_id"].presence || params[name].presence
            return if value.blank?

            rfq.public_send("#{name}=", scope.find_by_prefix_id!(value))
          end

          # `unit` was in the table but never permitted, so a buyer asking for
          # "50 cartons" had the unit silently dropped and every seller quoted a
          # bare number. It is part of the request, not a seller-side detail.
          def rfq_params
            params.permit(:title, :description, :requested_quantity, :unit,
                          :budget_min, :budget_max, :expires_at)
          end

          def serialize(rfq, quotes: false)
            data = { id: rfq.id, title: rfq.title, description: rfq.description, status: rfq.status,
                     requested_quantity: rfq.requested_quantity, unit: rfq.unit, currency: rfq.currency,
                     budget_min: ::Empire::Money.format(rfq.budget_min), budget_max: ::Empire::Money.format(rfq.budget_max),
                     company_id: rfq.company&.prefixed_id, variant_id: rfq.variant&.prefixed_id,
                     seller_id: rfq.seller&.prefixed_id, expires_at: rfq.expires_at,
                     closed_at: rfq.closed_at, status_reason: rfq.status_reason,
                     # The buyer needs to know whether they can still expect
                     # offers, and why a request they are looking at is shut.
                     quoteable: rfq.quoteable?, expired: rfq.expired?,
                     created_at: rfq.created_at }
            if quotes
              data[:quotes] = rfq.quotes.order(:created_at).map { |quote|
                { id: quote.id, seller_id: quote.seller.prefixed_id, amount: ::Empire::Money.format(quote.amount),
                  quantity: quote.quantity, unit: quote.unit, valid_until: quote.valid_until,
                  total: ::Empire::Money.format(quote.total_amount),
                  currency: quote.currency, status: quote.status, notes: quote.notes }
              }
              # The buyer is a party to every event (they raised the request, they
              # accepted an offer), so the negotiation history is theirs to read.
              data[:events] = rfq.events.order(:created_at).map do |event|
                { id: event.id, event: event.event, from_status: event.from_status,
                  to_status: event.to_status, note: event.note,
                  quote_id: event.quote_id, created_at: event.created_at }
              end
            end
            data
          end
        end
      end
    end
  end
end
