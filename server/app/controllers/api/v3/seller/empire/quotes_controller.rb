# frozen_string_literal: true

module Api
  module V3
    module Seller
      module Empire
        # A seller's own quotes.
        #
        # Create is the previous behaviour, hardened: the RFQ is locked before it
        # is validated so two sellers quoting at once cannot both pass, the
        # amount is parsed as a canonical decimal (Spree's `money_param`, which
        # refuses `"1.2345"` and localized strings rather than rounding them),
        # and the volume/validity a seller may offer are bounded by the request.
        #
        # show/update/withdraw are the missing half: a seller could submit an
        # offer and then had no way to see it, correct a price, or take it back
        # before the buyer decided.
        class QuotesController < Spree::Api::V3::Seller::BaseController
          scoped_resource :quotes

          def index
            scope = ::Empire::Quote.where(seller: current_seller)
                                   .includes(rfq: %i[customer company variant])
                                   .order(created_at: :desc, id: :desc)
            render json: { data: scope.map { |quote| serialize(quote) } }
          end

          def show
            render json: serialize(mine.find(params[:id]))
          end

          def create
            quote = nil
            ActiveRecord::Base.transaction do
              # Lock the parent before validating so two simultaneous offers from
              # the same seller cannot both pass the uniqueness validation.
              rfq = ::Empire::Rfq.visible_to_seller(current_seller).lock.find(params[:rfq_id])
              unless rfq.quoteable?
                return render_error(code: 'quote_unavailable', message: I18n.t('empire.quote_unavailable'),
                                    status: :unprocessable_content)
              end

              attributes = quote_attributes
              attributes[:amount] = money_param(:amount, rfq.currency)
              quote = ::Empire::Quote.create!(attributes.merge(rfq: rfq, seller: current_seller))
              rfq.update!(status: :quoted) if rfq.open?
              rfq.record_event!(event: 'quoted', actor: current_user, quote: quote,
                                note: quote.notes, to: rfq.status)
            end
            render json: serialize(quote), status: :created
          rescue ActiveRecord::RecordInvalid => e
            render_validation_error(e.record.errors)
          rescue ActiveRecord::RecordNotUnique
            render_error(code: 'quote_unavailable', message: I18n.t('empire.quote_already_submitted'),
                         status: :unprocessable_content)
          end

          def update
            quote = mine.find(params[:id])
            unless quote.editable?
              return render_error(code: 'quote_unavailable', message: I18n.t('empire.quote_unavailable'),
                                  status: :unprocessable_content)
            end

            attributes = quote_attributes
            attributes[:amount] = money_param(:amount, quote.currency) if params.key?(:amount)
            quote.update!(attributes)
            quote.rfq.record_event!(event: 'quote_updated', actor: current_user, quote: quote,
                                    note: attributes[:notes])
            render json: serialize(quote)
          rescue ActiveRecord::RecordInvalid => e
            render_validation_error(e.record.errors)
          end

          def withdraw
            quote = mine.find(params[:id])
            unless quote.editable?
              return render_error(code: 'quote_unavailable', message: I18n.t('empire.quote_unavailable'),
                                  status: :unprocessable_content)
            end

            quote.withdraw!(actor: current_user)
            render json: serialize(quote.reload)
          rescue ActiveRecord::RecordInvalid => e
            render_validation_error(e.record.errors)
          end

          private

          def mine
            ::Empire::Quote.where(seller: current_seller).includes(rfq: %i[customer company variant])
          end

          # Note what is absent: `currency`. A seller prices in the request's own
          # currency, so accepting a currency from the payload would let an offer
          # claim AFN while being compared with a USD request.
          def quote_attributes
            params.permit(:notes, :quantity, :unit, :valid_until).to_h.symbolize_keys.tap do |attrs|
              attrs.delete(:unit) if attrs[:unit].blank?
            end
          end

          def serialize(quote)
            { id: quote.id, rfq_id: quote.rfq_id, seller_id: quote.seller_id,
              amount: ::Empire::Money.format(quote.amount), quantity: quote.quantity, unit: quote.unit,
              currency: quote.currency, status: quote.status, notes: quote.notes,
              valid_until: quote.valid_until, total: ::Empire::Money.format(quote.total_amount),
              editable: quote.editable?,
              rfq: { id: quote.rfq_id, title: quote.rfq&.title, status: quote.rfq&.status,
                     expires_at: quote.rfq&.expires_at, requested_quantity: quote.rfq&.requested_quantity },
              created_at: quote.created_at, responded_at: quote.responded_at }
          end
        end
      end
    end
  end
end
