# frozen_string_literal: true

class CreateEmpireRfqs < SpreeExtension::Migration[7.0]
  def change
    create_table :empire_rfqs do |t|
      t.references :user, null: false, foreign_key: { to_table: :spree_users }
      t.references :company, foreign_key: { to_table: :empire_companies }
      t.string :title, null: false
      t.text :description
      t.decimal :budget_min, precision: 12, scale: 2
      t.decimal :budget_max, precision: 12, scale: 2
      t.string :currency, null: false, default: "AFN"
      t.integer :status, default: 0, null: false # 0=open, 1=quoted, 2=accepted, 3=rejected, 4=closed
      t.datetime :expires_at
      t.timestamps
    end
    add_index :empire_rfqs, :user_id
    add_index :empire_rfqs, :company_id
    add_index :empire_rfqs, :status
  end
end
