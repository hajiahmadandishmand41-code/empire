# frozen_string_literal: true

class CreateEmpireRfqs < ActiveRecord::Migration[8.1]
  def change
    create_table :empire_rfqs do |t|
      t.references :store, null: false, foreign_key: { to_table: :spree_stores }
      t.references :customer, null: false, foreign_key: { to_table: :spree_customers }
      t.references :company, foreign_key: { to_table: :spree_companies }
      t.references :variant, foreign_key: { to_table: :spree_variants }
      t.references :seller, foreign_key: { to_table: :spree_sellers }
      t.string :title, null: false
      t.text :description
      t.integer :requested_quantity, null: false, default: 1
      t.decimal :budget_min, precision: 12, scale: 2
      t.decimal :budget_max, precision: 12, scale: 2
      t.string :currency, null: false, default: 'AFN'
      t.integer :status, null: false, default: 0
      t.datetime :expires_at
      t.timestamps
    end
    add_index :empire_rfqs, [:store_id, :status]
  end
end
