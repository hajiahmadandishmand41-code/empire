# frozen_string_literal: true

class CreateEmpireVolumePricing < SpreeExtension::Migration[7.0]
  def change
    create_table :empire_volume_pricing do |t|
      t.references :variant, null: false, foreign_key: { to_table: :spree_variants }
      t.references :empire_company, foreign_key: { to_table: :empire_companies }
      t.integer :min_quantity, null: false
      t.integer :max_quantity
      t.decimal :price, null: false, precision: 12, scale: 2
      t.string :currency, null: false, default: "AFN"
      t.datetime :starts_at
      t.datetime :expires_at
      t.boolean :active, default: true, null: false
      t.timestamps
    end
    add_index :empire_volume_pricing, [:variant_id, :empire_company_id]
    add_index :empire_volume_pricing, :active
  end
end
