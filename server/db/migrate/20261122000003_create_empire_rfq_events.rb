# frozen_string_literal: true

# Audit trail for RFQ administration.
#
# `updated_at` answers "when", never "who" or "why". A marketplace that closes a
# buyer's request, or rejects a seller's offer, has to be able to answer all
# three — to the buyer, to the seller, and to its own staff. Each row records a
# single state change with the actor that caused it; rows are never updated or
# deleted by the application.
class CreateEmpireRfqEvents < ActiveRecord::Migration[8.1]
  def change
    create_table :empire_rfq_events do |t|
      t.references :rfq, null: false, foreign_key: { to_table: :empire_rfqs }
      t.references :quote, foreign_key: { to_table: :empire_quotes }
      t.references :actor, polymorphic: true, comment: 'Customer, AdminUser (staff or seller) that caused the change'
      t.string :event, null: false, comment: 'created, quoted, quote_updated, quote_withdrawn, accepted, closed, cancelled, reopened'
      t.string :from_status
      t.string :to_status
      t.text :note, comment: 'Operator-supplied reason; never contains secrets'
      t.timestamps
    end

    add_index :empire_rfq_events, %i[rfq_id created_at]
    add_index :empire_rfq_events, %i[rfq_id event]
  end
end
