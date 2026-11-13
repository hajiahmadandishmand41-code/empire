# frozen_string_literal: true

# Reference/configuration seeds are idempotent. Demo identities and products
# are opt-in and cannot be created in a production Rails environment.
Spree::Core::Engine.load_seed
load Rails.root.join('db/seeds/empire_seed.rb')
