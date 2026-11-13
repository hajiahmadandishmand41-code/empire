# frozen_string_literal: true

class CreateEmpireSellers < SpreeExtension::Migration[7.0]
  def change
    create_table :empire_sellers do |t|
      t.references :user, null: false, foreign_key: { to_table: :spree_users }
      t.string :shop_name, null: false
      t.text :shop_description
      t.string :business_registration_number
      t.string :tax_identification_number
      # Verification documents (stored via ActiveStorage)
      t.string :registration_document_file
      t.string :tax_document_file
      t.string :id_document_file
      # Verification state
      t.integer :verification_status, default: 0, null: false # 0=pending, 1=verified, 2=rejected, 3=suspended
      t.text :rejection_reason
      t.datetime :verified_at
      t.references :verified_by, foreign_key: { to_table: :spree_users }
      # Commission configuration
      t.decimal :commission_rate, default: 0.10, null: false, precision: 5, scale: 4
      # Payout settings
      t.boolean :payout_enabled, default: true, null: false
      t.timestamps
    end
    add_index :empire_sellers, :user_id, unique: true
    add_index :empire_sellers, :shop_name, unique: true
    add_index :empire_sellers, :verification_status
  end
end
