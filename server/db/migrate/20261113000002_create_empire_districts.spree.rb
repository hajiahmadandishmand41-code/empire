# frozen_string_literal: true

class CreateEmpireDistricts < SpreeExtension::Migration[7.0]
  def change
    create_table :empire_districts do |t|
      t.references :province, null: false, foreign_key: { to_table: :empire_provinces }
      t.string :name, null: false, comment: "د veterinary ولسوالی (Dari)"
      t.string :name_ps, null: false, comment: "د ولسوالی_num (Pashto)"
      t.string :name_en, null: false, comment: "District name (English)"
      t.boolean :active, default: true, null: false
      t.timestamps
    end
    add_index :empire_districts, [:province_id, :name]
    add_index :empire_districts, :active
  end
end
