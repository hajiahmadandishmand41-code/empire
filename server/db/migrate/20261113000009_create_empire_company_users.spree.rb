# frozen_string_literal: true

class CreateEmpireCompanyUsers < SpreeExtension::Migration[7.0]
  def change
    create_table :empire_company_users do |t|
      t.references :user, null: false, foreign_key: { to_table: :spree_users }
      t.references :empire_company, null: false, foreign_key: true
      t.integer :role, default: 0, null: false # 0=buyer, 1=company_admin, 2=order_approver
      t.boolean :can_place_orders, default: true, null: false
      t.boolean :can_approve_orders, default: false, null: false
      t.timestamps
    end
    add_index :empire_company_users, [:user_id, :empire_company_id], unique: true
    add_index :empire_company_users, :empire_company_id
    add_index :empire_company_users, :role
  end
end
