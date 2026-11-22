# frozen_string_literal: true

module Empire
  # A seller's offer against an RFQ.
  #
  # One live offer per seller per request (enforced by a unique index, not only
  # by a validation) — the seller edits their own offer rather than stacking
  # several, which is also what keeps the buyer's comparison honest. An offer is
  # binding while `pending` and inside its own `valid_until`; withdrawing it,
  # accepting a competitor or the request closing ends it.
  class Quote < ApplicationRecord
    self.table_name = 'empire_quotes'

    belongs_to :rfq, class_name: 'Empire::Rfq', inverse_of: :quotes
    belongs_to :seller, class_name: 'Spree::Seller'

    enum :status, { pending: 0, accepted: 1, rejected: 2, withdrawn: 3 }, default: :pending

    before_validation { self.currency ||= rfq&.currency }
    before_validation :inherit_quantity

    validates :amount, presence: true, numericality: { greater_than: 0 }
    validates :quantity, numericality: { only_integer: true, greater_than: 0 }, allow_nil: true
    validates :notes, length: { maximum: 2000 }, allow_blank: true
    validates :seller_id, uniqueness: { scope: :rfq_id }
    validate :seller_may_quote, on: :create
    validate :seller_still_owns_offer, on: :update
    validate :offer_deadline_sane

    def expired?
      valid_until.present? && Time.current >= valid_until
    end

    # A seller may change or withdraw an offer only while nobody has accepted
    # it and the request is still open. Changing an accepted price would rewrite
    # a concluded negotiation.
    def editable?
      pending? && rfq.quoteable? && !expired?
    end

    def withdraw!(actor: nil)
      raise ActiveRecord::RecordInvalid, self unless editable?

      transaction do
        update!(status: :withdrawn, responded_at: Time.current)
        rfq.record_event!(event: 'quote_withdrawn', actor: actor, quote: self)
      end
      self
    end

    # Total the offer represents, for side-by-side comparison. Always the real
    # arithmetic of amount × quantity, never a display-only guess.
    def total_amount
      return nil if amount.nil?

      amount * (quantity || rfq&.requested_quantity || 1).to_i
    end

    private

    def inherit_quantity
      self.quantity ||= rfq&.requested_quantity
      self.unit ||= rfq&.unit
    end

    def offer_deadline_sane
      return if valid_until.nil?
      return if rfq.nil? || rfq.expires_at.nil? || valid_until <= rfq.expires_at
      # An offer that outlives the request it answers would still be binding
      # after the buyer stopped asking; that is a mistake, not a negotiation.
      errors.add(:valid_until, :less_than_or_equal_to, count: rfq.expires_at)
    end

    # Changing an offer's amount, volume or validity is a re-quote, and is only
    # allowed while the offer is still live for a request that is still open.
    # Status changes made by the domain methods (withdraw/accept/reject) are
    # exempt: those legitimately move a pending offer to a final state.
    def seller_still_owns_offer
      fields = %w[amount quantity unit valid_until notes currency]
      return if (changed & fields).empty?
      return if editable?

      errors.add(:base, I18n.t('empire.quote_unavailable'))
    end

    def seller_may_quote
      return if rfq.nil? || seller.nil?
      return if seller.approved? && seller.store_id == rfq.store_id &&
                (rfq.seller_id.nil? || rfq.seller_id == seller.id) && rfq.quoteable?

      errors.add(:base, I18n.t('empire.quote_unavailable'))
    end
  end
end
