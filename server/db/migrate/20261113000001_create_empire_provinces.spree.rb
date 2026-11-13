# frozen_string_literal: true

class CreateEmpireProvinces < SpreeExtension::Migration[7.0]
  def change
    create_table :empire_provinces do |t|
      t.string :name, null: false, comment: "د veterinary ولایت (Dari)"
      t.string :name_ps, null: false, comment: "د ولایت_num (Pashto)"
      t.string :name_en, null: false, comment: "Province name (English)"
      t.string :code, null: false, comment: "ISO-like province code (e.g. KAB)"
      t.boolean :active, default: true, null: false
      t.timestamps
    end
    add_index :empire_provinces, :code, unique: true
    add_index :empire_provinces, :active
  end
end
