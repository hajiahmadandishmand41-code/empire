# This file should ensure the existence of records required to run the application
# in every environment (production, development, test). The code here should be
# idempotent so that it can be executed at any point.
#
# The data can then be loaded with the bin/rails db:seed command
# (or created alongside the database with db:setup).

Spree::Core::Engine.load_seed if defined?(Spree::Core)

# ---------------------------------------------------------------------------
# Empire seed data — marked with the "Demo" label so it is never confused
# with production data.
# ---------------------------------------------------------------------------
require_dependency "empire_seed" if File.exist?(Rails.root.join("db", "seeds", "empire_seed.rb"))

if Rails.env.development? || Rails.env.test?
  load Rails.root.join("db", "seeds", "empire_seed.rb")
end
