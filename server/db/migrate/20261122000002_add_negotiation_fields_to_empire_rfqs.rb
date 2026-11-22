# frozen_string_literal: true

# RFQs already carried title, description, quantity, currency, budget range and
# a deadline. A seller quoting on one also needs the unit the quantity is
# counted in (carton, kg, piece) and the buyer needs an explicit record of why
# a request stopped being open. A quote needs its own quantity and validity so
# a seller can quote a different volume than the request asked for without
# rewriting the buyer's request.
#
# Additive only: every column is nullable or defaulted, so existing rows keep
# their meaning and the migration is safe on a populated database.
class AddNegotiationFieldsToEmpireRfqs < ActiveRecord::Migration[8.1]
  def change
    add_column :empire_rfqs, :unit, :string, limit: 32, comment: 'Unit the quantity is counted in (carton, kg, piece …)'
    add_column :empire_rfqs, :closed_at, :datetime
    add_column :empire_rfqs, :status_reason, :text, comment: 'Why the request was closed or cancelled'

    add_column :empire_quotes, :quantity, :integer, comment: 'Volume this quote covers; nil means the requested quantity'
    add_column :empire_quotes, :unit, :string, limit: 32
    add_column :empire_quotes, :valid_until, :datetime, comment: 'After this instant the offer is no longer binding'

    add_index :empire_rfqs, %i[store_id status expires_at], name: 'index_empire_rfqs_on_store_status_expires'
  end
end
