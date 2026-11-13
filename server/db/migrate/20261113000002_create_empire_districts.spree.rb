# frozen_string_literal: true

class CreateEmpireDistricts < ActiveRecord::Migration[8.1]
  def change
    create_table :empire_districts do |t|
      t.references :province, null: false, foreign_key: { to_table: :empire_provinces }
      t.string :name, null: false, comment: "نام ولسوالی (دری)"
      t.string :name_ps, null: false, comment: "نام ولسوالی (پشتو)"
      t.string :name_en, null: false, comment: "District name (English)"
      t.boolean :active, default: true, null: false
      t.timestamps
    end
    add_index :empire_districts, [:province_id, :name]
    add_index :empire_districts, :active
  end
end
