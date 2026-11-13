# frozen_string_literal: true

module Empire
  class AcceptQuote
    def self.call(rfq:, quote:)
      ActiveRecord::Base.transaction do
        rfq.lock!
        quote.lock!
        unless quote.rfq_id == rfq.id && quote.pending? && %w[open quoted].include?(rfq.status) && !rfq.expired?
          quote.errors.add(:base, I18n.t('empire.quote_unavailable'))
          raise ActiveRecord::RecordInvalid.new(quote)
        end

        quote.update!(status: :accepted, responded_at: Time.current)
        rfq.quotes.where.not(id: quote.id).where(status: :pending).find_each do |other|
          other.update!(status: :rejected, responded_at: Time.current)
        end
        rfq.update!(status: :accepted)
        quote
      end
    end
  end
end
