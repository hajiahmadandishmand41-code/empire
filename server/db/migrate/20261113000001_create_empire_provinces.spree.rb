# frozen_string_literal: true

class CreateEmpireProvinces < ActiveRecord::Migration[8.1]
  def change
    create_table :empire_provinces do |t|
      t.string :name, null: false, comment: "نام ولایت (دری)"
      t.string :name_ps, comment: "Pashto draft: NULL until reviewed"
      t.string :name_en, null: false, comment: "Province name (English)"
      t.string :code, null: false, comment: "ISO-like province code (e.g. KAB)"
      t.boolean :active, default: true, null: false
      t.timestamps
    end
    add_index :empire_provinces, :code, unique: true
    add_index :empire_provinces, :active
  end
end
