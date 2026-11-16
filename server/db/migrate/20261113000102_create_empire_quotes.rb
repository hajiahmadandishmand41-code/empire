# frozen_string_literal: true

class CreateEmpireQuotes < ActiveRecord::Migration[8.1]
  def change
    create_table :empire_quotes do |t|
      t.references :rfq, null: false, foreign_key: { to_table: :empire_rfqs }
      t.references :seller, null: false, foreign_key: { to_table: :spree_sellers }
      t.decimal :amount, null: false, precision: 12, scale: 2
      t.string :currency, null: false, default: 'AFN'
      t.text :notes
      t.integer :status, null: false, default: 0
      t.datetime :responded_at
      t.timestamps
    end
    add_index :empire_quotes, [:rfq_id, :seller_id], unique: true
  end
end
