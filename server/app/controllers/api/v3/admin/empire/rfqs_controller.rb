# frozen_string_literal: true

module Api
  module V3
    module Admin
      module Empire
        # Staff RFQ desk.
        #
        # `scoped_resource :rfqs` is registered in
        # `config/initializers/empire.rb` for the store audience, so every action
        # here is gated on `read_rfqs` / `write_rfqs` for both a staff JWT (role
        # permissions) and a secret API key (scopes). Row access is always bound
        # to `current_store`.
        #
        # Staff may read the whole negotiation — every seller's offer and the
        # full history — and may close or cancel a request or reject an offer.
        # They may not edit a seller's amount or a buyer's request: that would
        # rewrite a commercial offer under a seller's name, and there is no
        # endpoint here that can do it.
        class RfqsController < BaseController
          scoped_resource :rfqs

          def index
            scope = requests.includes(:customer, :company, :variant).order(created_at: :desc)
            scope = scope.where(status: params[:status]) if params[:status].present?
            render json: { data: scope.map { |rfq| serialize(rfq) }, meta: { count: scope.size } }
          end

          def show
            rfq = requests.includes({ quotes: :seller }, { events: :actor }, :customer, :company, :variant)
                          .find(params[:id])
            render json: serialize(rfq, detail: true)
          end

          # PATCH /api/v3/admin/empire/rfqs/:id/close
          def close
            transition { |rfq| rfq.close!(reason: params[:reason], actor: current_user) }
          end

          # PATCH /api/v3/admin/empire/rfqs/:id/cancel
          def cancel
            transition { |rfq| rfq.cancel!(reason: params[:reason], actor: current_user) }
          end

          # PATCH /api/v3/admin/empire/rfqs/:id/reopen
          def reopen
            transition { |rfq| rfq.reopen!(actor: current_user) }
          end

          # PATCH /api/v3/admin/empire/rfqs/:id/quotes/:quote_id/reject
          #
          # Rejecting is the operator declining an *offer*, not editing it. The
          # seller sees the offer's status and can quote again only while the
          # request stays open.
          def reject_quote
            rfq = requests.find(params[:id])
            quote = rfq.quotes.find(params[:quote_id])
            unless quote.pending?
              return render_error(code: 'quote_unavailable', message: I18n.t('empire.quote_unavailable'),
                                  status: :unprocessable_content)
            end

            quote.update!(status: :rejected, responded_at: Time.current)
            rfq.record_event!(event: 'closed', actor: current_user, quote: quote, to: rfq.status,
                              note: params[:reason].to_s.strip.presence)
            render json: serialize(rfq.reload, detail: true)
          end

          private

          def requests
            ::Empire::Rfq.where(store: current_store)
          end

          def transition
            rfq = requests.find(params[:id])
            yield(rfq)
            render json: serialize(rfq.reload, detail: true)
          rescue ActiveRecord::RecordInvalid => e
            render_validation_error(e.record.errors)
          end

          def serialize(rfq, detail: false)
            data = { id: rfq.id, title: rfq.title, description: rfq.description, status: rfq.status,
                     quoteable: rfq.quoteable?, requested_quantity: rfq.requested_quantity,
                     unit: rfq.unit, currency: rfq.currency,
                     budget_min: ::Empire::Money.format(rfq.budget_min), budget_max: ::Empire::Money.format(rfq.budget_max),
                     customer_id: rfq.customer&.prefixed_id, customer_name: customer_name(rfq),
                     company_id: rfq.company&.prefixed_id, company_name: rfq.company&.name,
                     variant_id: rfq.variant&.prefixed_id, product_name: rfq.variant&.product&.name,
                     seller_id: rfq.seller&.prefixed_id, seller_name: rfq.seller&.name,
                     expires_at: rfq.expires_at, closed_at: rfq.closed_at,
                     status_reason: rfq.status_reason, quote_count: rfq.quotes.size,
                     created_at: rfq.created_at }
            return data unless detail

            data[:quotes] = rfq.quotes.sort_by(&:created_at).map { |quote| quote_json(quote) }
            data[:events] = rfq.events.sort_by(&:created_at).map(&:as_api_json)
            data
          end

          def quote_json(quote)
            { id: quote.id, seller_id: quote.seller&.prefixed_id, seller_name: quote.seller&.name,
              amount: ::Empire::Money.format(quote.amount), quantity: quote.quantity, unit: quote.unit,
              currency: quote.currency, status: quote.status, notes: quote.notes,
              valid_until: quote.valid_until, total: ::Empire::Money.format(quote.total_amount),
              created_at: quote.created_at, responded_at: quote.responded_at }
          end

          def customer_name(rfq)
            name = [rfq.customer&.first_name, rfq.customer&.last_name].compact_blank.join(' ')
            # Staff need to recognise the buyer; the address is available on the
            # customer record itself and is not duplicated into every RFQ list.
            name.presence || rfq.customer&.prefixed_id
          end
        end
      end
    end
  end
end
