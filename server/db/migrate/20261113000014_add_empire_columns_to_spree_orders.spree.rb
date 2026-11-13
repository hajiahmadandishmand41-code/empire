# frozen_string_literal: true

class AddEmpireColumnsToSpreeOrders < ActiveRecord::Migration[8.1]
  def change
    add_column :spree_orders, :po_number, :string
    add_column :spree_orders, :empire_company_id, :integer
    add_column :spree_orders, :is_wholesale, :boolean, default: false, null: false
    add_column :spree_orders, :marketplace_split, :boolean, default: false, null: false
    add_index :spree_orders, :po_number
    add_index :spree_orders, :empire_company_id
    add_index :spree_orders, :is_wholesale
  end
end
