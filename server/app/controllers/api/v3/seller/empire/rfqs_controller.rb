# frozen_string_literal: true

module Api
  module V3
    module Seller
      module Empire
        # The seller's RFQ desk.
        #
        # Reading is scoped by `Empire::Rfq.visible_to_seller` — the seller's own
        # store, requests addressed to them or to the whole marketplace, and only
        # while still open. A request addressed to a competitor answers 404, not
        # 403, so the endpoint cannot be used to enumerate other sellers' work.
        # A seller's own offers are the only ones serialized: what a competitor
        # quoted is never part of this payload.
        class RfqsController < Spree::Api::V3::Seller::BaseController
          scoped_resource :quotes

          def index
            rfqs = visible.includes(:customer, :company, :variant, quotes: :seller)
                          .order(created_at: :desc, id: :desc)
            render json: { data: rfqs.map { |rfq| serialize(rfq) }, meta: { count: rfqs.size } }
          end

          def show
            rfq = visible.includes(:customer, :company, :variant).find(params[:id])
            render json: serialize(rfq, detail: true)
          end

          private

          # Visible *and* still quotable: a request whose deadline passed while it
          # sat unanswered is not something a seller can act on, so it is not
          # listed and `/rfqs/:id` answers 404 rather than showing a dead form.
          # Submitting to it is also refused — see QuotesController#create.
          def visible
            ::Empire::Rfq.visible_to_seller(current_seller).quoteable
          end

          def serialize(rfq, detail: false)
            mine = rfq.quotes.find { |quote| quote.seller_id == current_seller.id }
            data = {
              id: rfq.id,
              title: rfq.title,
              description: rfq.description,
              status: rfq.status,
              quoteable: rfq.quoteable?,
              requested_quantity: rfq.requested_quantity,
              unit: rfq.unit,
              currency: rfq.currency,
              budget_min: ::Empire::Money.format(rfq.budget_min),
              budget_max: ::Empire::Money.format(rfq.budget_max),
              expires_at: rfq.expires_at,
              closed_at: rfq.closed_at,
              status_reason: rfq.status_reason,
              created_at: rfq.created_at,
              # Buyer identity is limited to what a seller needs to recognise the
              # enquiry: a name and the company, never an e-mail address or the
              # buyer's order history.
              buyer_name: buyer_name(rfq),
              company_name: rfq.company&.name,
              product_name: rfq.variant&.product&.name,
              product_sku: rfq.variant&.sku,
              my_quote: mine && quote_json(mine)
            }
            if detail
              # Only this seller's own offer history is exposed. A competitor's
              # offer id, amount or notes must never appear in this response.
              data[:my_quotes] = rfq.quotes.select { |quote| quote.seller_id == current_seller.id }
                                          .sort_by(&:created_at).map { |quote| quote_json(quote) }
              data[:quote_count] = rfq.quotes.size
            end
            data
          end

          def quote_json(quote)
            { id: quote.id, amount: ::Empire::Money.format(quote.amount), quantity: quote.quantity, unit: quote.unit,
              currency: quote.currency, status: quote.status, notes: quote.notes,
              valid_until: quote.valid_until, total: ::Empire::Money.format(quote.total_amount),
              editable: quote.seller_id == current_seller.id && quote.editable?,
              created_at: quote.created_at, responded_at: quote.responded_at }
          end

          def buyer_name(rfq)
            name = [rfq.customer&.first_name, rfq.customer&.last_name].compact_blank.join(' ')
            name.presence || I18n.t('empire.rfq_buyer_anonymous')
          end
        end
      end
    end
  end
end
