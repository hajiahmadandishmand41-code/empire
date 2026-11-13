# frozen_string_literal: true

class AddMoqToSpreeVariants < ActiveRecord::Migration[8.1]
  def change
    add_column :spree_variants, :moq, :integer, default: 1, null: false
    add_column :spree_variants, :wholesale_price, :decimal, precision: 12, scale: 2
    add_index :spree_variants, :moq
  end
end
