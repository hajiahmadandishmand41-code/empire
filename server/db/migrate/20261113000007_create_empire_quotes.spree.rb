# frozen_string_literal: true

class CreateEmpireQuotes < SpreeExtension::Migration[7.0]
  def change
    create_table :empire_quotes do |t|
      t.references :empire_rfq, null: false, foreign_key: true
      t.references :empire_seller, null: false, foreign_key: true
      t.decimal :amount, null: false, precision: 12, scale: 2
      t.string :currency, null: false, default: "AFN"
      t.text :notes
      t.integer :status, default: 0, null: false # 0=pending, 1=accepted, 2=rejected, 3=withdrawn
      t.datetime :responded_at
      t.timestamps
    end
    add_index :empire_quotes, :empire_rfq_id
    add_index :empire_quotes, :empire_seller_id
    add_index :empire_quotes, :status
  end
end
