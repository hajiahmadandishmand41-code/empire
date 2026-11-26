# frozen_string_literal: true

module Empire
  # A buyer's request for quotation.
  #
  # Spree owns the order and the price list; an RFQ is the negotiation that
  # precedes both, which is why it lives here rather than as a cart in a special
  # state. The lifecycle is a small state machine (`open → quoted → accepted`,
  # with `closed` for an operator's decision and an expiry date for a request
  # nobody needs any more), and every transition writes an `Empire::RfqEvent` so
  # the buyer, the seller and staff can all see who changed what and why.
  class Rfq < ApplicationRecord
    self.table_name = 'empire_rfqs'

    UNITS = %w[piece kg gram litre carton box dozen metre pack set].freeze

    belongs_to :store, class_name: 'Spree::Store'
    belongs_to :customer, class_name: 'Spree::Customer'
    belongs_to :company, class_name: 'Spree::Company', optional: true
    belongs_to :variant, class_name: 'Spree::Variant', optional: true
    belongs_to :seller, class_name: 'Spree::Seller', optional: true
    has_many :quotes, class_name: 'Empire::Quote', dependent: :destroy, inverse_of: :rfq
    has_many :events, class_name: 'Empire::RfqEvent', dependent: :destroy, inverse_of: :rfq

    enum :status, { open: 0, quoted: 1, accepted: 2, closed: 3 }, default: :open

    before_validation { self.currency ||= store&.default_currency }
    before_validation :normalize_unit

    validates :title, presence: true, length: { maximum: 200 }
    validates :description, length: { maximum: 5000 }, allow_blank: true
    validates :requested_quantity, numericality: { only_integer: true, greater_than: 0 }
    validates :currency, presence: true
    validates :unit, inclusion: { in: UNITS }, allow_blank: true
    validates :budget_min, :budget_max, numericality: { greater_than_or_equal_to: 0 }, allow_nil: true
    validates :status_reason, length: { maximum: 1000 }, allow_blank: true
    validate :budget_range
    validate :company_membership
    validate :store_references

    # Requests a seller may see: either addressed to them, or open to the whole
    # marketplace. A request addressed to another seller is never visible, and a
    # request from another store is never visible at all — that narrowing lives
    # in a scope rather than in a controller so no endpoint can forget it.
    scope :visible_to_seller, lambda { |seller|
      where(store_id: seller.store_id)
        .where(seller_id: [nil, seller.id])
        .where(status: %i[open quoted])
    }

    # Open requests whose deadline has passed are still `open` in the database
    # until something touches them. This scope is the honest reading of that:
    # quoteable means open, unexpired, and not addressed to somebody else.
    scope :quoteable, lambda {
      where(status: %i[open quoted]).where('expires_at IS NULL OR expires_at > ?', Time.current)
    }

    def expired?
      expires_at.present? && Time.current >= expires_at
    end

    def quoteable?
      (open? || quoted?) && !expired?
    end

    def readable_by?(customer)
      self.customer == customer || (company.present? && customer.standing_for?(company))
    end

    def requested_quantity_effective
      requested_quantity
    end

    # Records a transition. Kept on the model rather than in each controller so
    # the history cannot be skipped by a code path that forgot to write it.
    def record_event!(event:, actor: nil, note: nil, quote: nil, from: nil, to: nil)
      events.create!(event: event, actor: actor, note: note, quote: quote,
                     from_status: from || status, to_status: to || status)
    end

    def close!(reason: nil, actor: nil)
      transition_to!(status: :closed, event: 'closed', actor: actor, note: reason)
    end

    def cancel!(reason: nil, actor: nil)
      transition_to!(status: :closed, event: 'cancelled', actor: actor, note: reason)
    end

    def reopen!(actor: nil)
      raise ActiveRecord::RecordInvalid, self unless closed? && quotes.none?(&:accepted?)

      transition_to!(status: :open, event: 'reopened', actor: actor, reset_closed_at: true)
    end

    private

    def transition_to!(status:, event:, actor: nil, note: nil, reset_closed_at: false)
      from = self.status
      transaction do
        update!(status: status, status_reason: note.to_s.strip.presence,
                closed_at: reset_closed_at ? nil : Time.current)
        record_event!(event: event, actor: actor, note: note, from: from, to: status)
      end
      self
    end

    def normalize_unit
      self.unit = unit.to_s.strip.downcase.presence
    end

    def budget_range
      return if budget_min.nil? || budget_max.nil? || budget_max >= budget_min

      errors.add(:budget_max, :greater_than_or_equal_to, count: budget_min)
    end

    def company_membership
      return if company.nil? || customer&.standing_for?(company)

      errors.add(:company, :invalid)
    end

    def store_references
      errors.add(:company, :invalid) if company.present? && company.store_id != store_id
      errors.add(:variant, :invalid) if variant.present? && variant.product.store_id != store_id
      errors.add(:seller, :invalid) if seller.present? && (seller.store_id != store_id || !seller.approved?)
    end
  end
end
