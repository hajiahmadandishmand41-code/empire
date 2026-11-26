# frozen_string_literal: true

module Empire
  # One recorded state change on an RFQ. Append-only: nothing in the application
  # updates or destroys these rows, so the history an operator reads is the
  # history that happened.
  class RfqEvent < ApplicationRecord
    self.table_name = 'empire_rfq_events'

    events = %w[created quoted quote_updated quote_withdrawn accepted closed cancelled reopened]

    belongs_to :rfq, class_name: 'Empire::Rfq', inverse_of: :events
    belongs_to :quote, class_name: 'Empire::Quote', optional: true
    belongs_to :actor, polymorphic: true, optional: true

    validates :event, presence: true, inclusion: { in: events }

    scope :recent_first, -> { order(created_at: :desc) }

    def actor_label
      case actor
      when nil then nil
      when Spree.customer_class then 'customer'
      when Spree.admin_user_class then 'staff'
      else actor.class.name
      end
    end

    # Never exposes an id the caller is not already entitled to see: a staff
    # actor appears as staff, a buyer as the buyer's own account.
    def as_api_json
      { id: id, event: event, from_status: from_status, to_status: to_status,
        note: note, quote_id: quote_id, actor: actor_label, created_at: created_at }
    end
  end
end
