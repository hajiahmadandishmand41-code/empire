# frozen_string_literal: true

class CreateEmpireDisputes < SpreeExtension::Migration[7.0]
  def change
    create_table :empire_disputes do |t|
      t.references :order, null: false, foreign_key: { to_table: :spree_orders }
      t.references :buyer, null: false, foreign_key: { to_table: :spree_users }
      t.references :empire_seller, null: false, foreign_key: true
      t.string :reason, null: false
      t.text :description
      t.integer :status, default: 0, null: false # 0=open, 1=in_review, 2=resolved, 3=closed
      t.text :resolution
      t.datetime :resolved_at
      t.references :resolved_by, foreign_key: { to_table: :spree_users }
      t.timestamps
    end
    add_index :empire_disputes, :order_id
    add_index :empire_disputes, :buyer_id
    add_index :empire_disputes, :empire_seller_id
    add_index :empire_disputes, :status
  end
end
