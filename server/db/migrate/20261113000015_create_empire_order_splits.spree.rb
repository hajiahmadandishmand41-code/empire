# frozen_string_literal: true

class CreateEmpireOrderSplits < ActiveRecord::Migration[8.1]
  def change
    create_table :empire_order_splits do |t|
      t.references :order, null: false, foreign_key: { to_table: :spree_orders }
      t.references :empire_seller, null: false, foreign_key: true
      t.decimal :subtotal, null: false, precision: 12, scale: 2
      t.decimal :commission_amount, null: false, precision: 12, scale: 2
      t.decimal :seller_payable, null: false, precision: 12, scale: 2
      t.string :currency, null: false, default: "AFN"
      t.integer :status, default: 0, null: false # 0=pending, 1=fulfilled, 2=cancelled
      t.timestamps
    end
    add_index :empire_order_splits, :order_id
    add_index :empire_order_splits, :empire_seller_id
    add_index :empire_order_splits, :status
  end
end
