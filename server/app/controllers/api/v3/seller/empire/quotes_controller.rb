# frozen_string_literal: true

module Api
  module V3
    module Seller
      module Empire
        class QuotesController < Spree::Api::V3::Seller::BaseController
          scoped_resource :quotes

          def index
            render json: { data: ::Empire::Quote.where(seller: current_seller).order(created_at: :desc).map { |quote| serialize(quote) } }
          end

          def create
            quote = nil
            ActiveRecord::Base.transaction do
              # Lock the parent before validating the quote. Several sellers may
              # quote the same open RFQ, but acceptance closes it atomically.
              rfq = ::Empire::Rfq.where(store: current_store).where(status: %i[open quoted])
                                 .where(seller_id: [nil, current_seller.id]).lock.find(params[:rfq_id])
              if rfq.expired?
                return render_error(code: 'quote_unavailable', message: I18n.t('empire.quote_unavailable'), status: :unprocessable_content)
              end

              quote = ::Empire::Quote.create!(rfq: rfq, seller: current_seller,
                                              amount: params[:amount], notes: params[:notes])
              rfq.update!(status: :quoted) if rfq.open?
            end
            render json: serialize(quote), status: :created
          rescue ActiveRecord::RecordInvalid => e
            render_validation_error(e.record.errors)
          rescue ActiveRecord::RecordNotUnique
            render_error(code: 'quote_unavailable', message: I18n.t('empire.quote_unavailable'), status: :unprocessable_content)
          end

          private

          def serialize(quote)
            { id: quote.id, rfq_id: quote.rfq_id, seller_id: quote.seller.prefixed_id,
              amount: quote.amount.to_s, currency: quote.currency, status: quote.status, notes: quote.notes }
          end
        end
      end
    end
  end
end
