# frozen_string_literal: true

class CreateEmpireCommissions < ActiveRecord::Migration[8.1]
  def change
    create_table :empire_commissions do |t|
      t.references :empire_seller, null: false, foreign_key: true
      t.references :order, null: false, foreign_key: { to_table: :spree_orders }
      t.decimal :order_total, null: false, precision: 12, scale: 2
      t.decimal :commission_rate, null: false, precision: 5, scale: 4
      t.decimal :commission_amount, null: false, precision: 12, scale: 2
      t.decimal :platform_share, null: false, precision: 12, scale: 2
      t.decimal :seller_share, null: false, precision: 12, scale: 2
      t.string :currency, null: false, default: "AFN"
      t.integer :settlement_status, default: 0, null: false # 0=unsettled, 1=settled, 2=paid
      t.references :payout, foreign_key: { to_table: :empire_payouts }
      t.timestamps
    end
    add_index :empire_commissions, :empire_seller_id
    add_index :empire_commissions, :order_id, unique: true
    add_index :empire_commissions, :settlement_status
  end
end
