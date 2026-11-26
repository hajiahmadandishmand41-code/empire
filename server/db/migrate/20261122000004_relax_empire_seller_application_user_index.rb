# frozen_string_literal: true

# One merchant account may hold more than one application.
#
# The first version indexed `user_id` uniquely, which read as "an account owns at
# most one application". That is wrong the moment a rejected applicant applies
# again: they sign in with the same account, so the second row collided on the
# index and the whole submission rolled back with a database error the API could
# only report as a generic failure. Re-applying is an explicit product rule (the
# partial unique index on (store_id, email) already allows it for a rejected
# application), so the account link must allow it too.
#
# The index is kept, without `unique`, because every review screen looks an
# application up by its account.
class RelaxEmpireSellerApplicationUserIndex < ActiveRecord::Migration[8.1]
  def up
    remove_index :empire_seller_applications, :user_id,
                 name: 'index_empire_seller_applications_on_user_id'
    add_index :empire_seller_applications, :user_id,
              name: 'index_empire_seller_applications_on_user_id'
  end

  def down
    # Re-tightening would fail on any store that already holds a re-application,
    # and deleting those rows is not this migration's business. Refuse instead,
    # so an operator sees why rather than watching a rollback.
    duplicates = select_value(<<~SQL.squish)
      SELECT COUNT(*) FROM (
        SELECT user_id FROM empire_seller_applications
        WHERE user_id IS NOT NULL GROUP BY user_id HAVING COUNT(*) > 1
      ) repeated
    SQL
    if duplicates.to_i.positive?
      raise ActiveRecord::IrreversibleMigration,
            'A merchant has more than one application; deduplicate before making user_id unique again.'
    end

    remove_index :empire_seller_applications, :user_id,
                 name: 'index_empire_seller_applications_on_user_id'
    add_index :empire_seller_applications, :user_id, unique: true,
              name: 'index_empire_seller_applications_on_user_id'
  end
end
