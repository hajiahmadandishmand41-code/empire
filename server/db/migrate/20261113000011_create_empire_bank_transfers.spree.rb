# frozen_string_literal: true

class CreateEmpireBankTransfers < SpreeExtension::Migration[7.0]
  def change
    create_table :empire_bank_transfers do |t|
      t.references :order, null: false, foreign_key: { to_table: :spree_orders }
      t.references :user, null: false, foreign_key: { to_table: :spree_users }
      t.string :bank_name, null: false
      t.string :account_number, null: false
      t.string :account_holder, null: false
      t.string :branch, null: false
      t.decimal :amount, null: false, precision: 12, scale: 2
      t.string :currency, null: false, default: "AFN"
      t.string :reference_number, null: false
      # Receipt uploaded via ActiveStorage
      t.string :receipt_file
      t.integer :status, default: 0, null: false # 0=pending, 1=verified, 2=rejected
      t.text :rejection_reason
      t.datetime :verified_at
      t.references :verified_by, foreign_key: { to_table: :spree_users }
      t.timestamps
    end
    add_index :empire_bank_transfers, :order_id, unique: true
    add_index :empire_bank_transfers, :user_id
    add_index :empire_bank_transfers, :status
    add_index :empire_bank_transfers, :reference_number, unique: true
  end
end
