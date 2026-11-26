# frozen_string_literal: true

# Stores the complete seller application the storefront collects.
#
# Spree's seller record (spree_sellers) is the right home for the *approved*
# merchant — name, legal name, registration number, contact e-mail — but it has
# no place for an applicant who has not been admitted yet, nor for the contact
# details (phone, city, address, description, requested categories) a reviewer
# needs to decide. Writing them into columns that Spree does not own would fork
# the seller model; dropping them on the floor is what the previous controller
# did. This table is the application itself, and it links to the native seller
# only once the application is accepted.
class CreateEmpireSellerApplications < ActiveRecord::Migration[8.1]
  def change
    create_table :empire_seller_applications do |t|
      t.references :store, null: false, foreign_key: { to_table: :spree_stores }
      # Role-account the application creates: the merchant signs in with it and
      # the panel decides what they may do from their seller role, never from
      # this record. Nullified (not deleted) if the account is removed.
      t.references :user, foreign_key: { to_table: :spree_admin_users }, index: { unique: true }
      # Set when an operator admits the application.
      t.references :seller, foreign_key: { to_table: :spree_sellers }, index: { unique: true }
      t.references :reviewed_by, foreign_key: { to_table: :spree_admin_users }

      t.string :email, null: false, comment: 'Applicant sign-in address (stored lower-cased)'
      t.string :shop_name, null: false
      t.string :contact_name, comment: 'Owner / representative name (دری)'
      t.string :phone, comment: 'Normalised E.164 Afghan number, e.g. +93700123456'
      t.string :address
      t.string :city
      t.text :description
      t.string :registration_number
      t.jsonb :categories, default: [], null: false, comment: 'Category names requested by the applicant'
      t.jsonb :metadata, default: {}, null: false, comment: 'Locale and review history'

      t.integer :status, null: false, default: 0, comment: '0 pending, 1 approved, 2 rejected'
      t.datetime :reviewed_at
      t.text :rejection_reason
      t.datetime :last_submitted_at
      t.timestamps
    end

    # One live application per address per store; a rejected applicant may try
    # again, and an approved one already has a seller account.
    add_index :empire_seller_applications, %i[store_id email], unique: true,
              where: 'status IN (0, 1)', name: 'index_empire_seller_applications_live_email'
    add_index :empire_seller_applications, %i[store_id status]
  end
end
