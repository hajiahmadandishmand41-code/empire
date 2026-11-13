# frozen_string_literal: true

class CreateEmpirePayouts < SpreeExtension::Migration[7.0]
  def change
    create_table :empire_payouts do |t|
      t.references :empire_seller, null: false, foreign_key: true
      t.decimal :total_amount, null: false, precision: 12, scale: 2
      t.decimal :commission_deducted, null: false, precision: 12, scale: 2
      t.decimal :net_amount, null: false, precision: 12, scale: 2
      t.string :currency, null: false, default: "AFN"
      t.integer :status, default: 0, null: false # 0=requested, 1=approved, 2=paid, 3=rejected
      t.text :rejection_reason
      t.datetime :requested_at
      t.datetime :approved_at
      t.references :approved_by, foreign_key: { to_table: :spree_users }
      t.datetime :paid_at
      t.string :payment_reference
      t.text :notes
      t.timestamps
    end
    add_index :empire_payouts, :empire_seller_id
    add_index :empire_payouts, :status
    add_index :empire_payouts, :requested_at
  end
end
