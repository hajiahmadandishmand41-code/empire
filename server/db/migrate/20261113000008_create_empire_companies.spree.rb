# frozen_string_literal: true

class CreateEmpireCompanies < ActiveRecord::Migration[8.1]
  def change
    create_table :empire_companies do |t|
      t.string :name, null: false
      t.string :registration_number
      t.string :tax_identification_number
      t.text :description
      t.string :website
      t.string :industry
      t.references :billing_address, foreign_key: { to_table: :spree_addresses }
      t.references :shipping_address, foreign_key: { to_table: :spree_addresses }
      t.boolean :active, default: true, null: false
      t.boolean :wholesale_eligible, default: false, null: false
      t.timestamps
    end
    add_index :empire_companies, :registration_number, unique: true
    add_index :empire_companies, :active
  end
end
