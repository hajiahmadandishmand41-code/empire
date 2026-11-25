# frozen_string_literal: true

module Empire
  class AcceptQuote
    def self.call(rfq:, quote:, actor: nil)
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
        from = rfq.status
        rfq.update!(status: :accepted)
        # The award is the event the buyer and every losing seller look for, so
        # it is written with the decision rather than left to a caller to
        # remember — the previous version recorded nothing here at all.
        rfq.record_event!(event: 'accepted', actor: actor, quote: quote, from: from, to: rfq.status)
        quote
      end
    end
  end
end
