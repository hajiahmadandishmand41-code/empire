# frozen_string_literal: true

class CreateEmpirePayoutRequests < ActiveRecord::Migration[8.1]
  def change
    create_table :empire_payout_requests do |t|
      t.references :seller, null: false, foreign_key: { to_table: :spree_sellers }
      t.references :payout, foreign_key: { to_table: :spree_seller_payouts }
      t.references :reviewed_by, foreign_key: { to_table: :spree_admin_users }
      t.string :currency, null: false
      t.text :note
      t.integer :status, null: false, default: 0
      t.text :rejection_reason
      t.datetime :reviewed_at
      t.timestamps
    end
    add_index :empire_payout_requests, [:seller_id, :currency], unique: true,
              where: 'status = 0', name: 'index_empire_one_open_payout_request'
  end
end
