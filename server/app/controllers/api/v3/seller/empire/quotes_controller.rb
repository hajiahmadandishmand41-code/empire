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
            rfq = ::Empire::Rfq.where(store: current_store).where(status: :open)
                               .where(seller_id: [nil, current_seller.id]).find(params[:rfq_id])
            quote = ::Empire::Quote.new(rfq: rfq, seller: current_seller,
                                        amount: params[:amount], notes: params[:notes])
            ActiveRecord::Base.transaction do
              quote.save!
              rfq.lock!
              raise ActiveRecord::RecordInvalid.new(quote), I18n.t('empire.quote_unavailable') unless rfq.open? && !rfq.expired?
              rfq.update!(status: :quoted)
            end
            render json: serialize(quote), status: :created
          rescue ActiveRecord::RecordInvalid => e
            render_validation_error(e.record.errors)
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
