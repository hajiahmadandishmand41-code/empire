require 'factory_bot'
require 'rspec/rails'

# Spree's testing support may already have loaded the host app factories via
# factory_bot_rails; loading them twice raises DuplicateDefinitionError.
FactoryBot.find_definitions unless FactoryBot.factories.registered?(:empire_rfq)

RSpec.configure do |config|
  config.include FactoryBot::Syntax::Methods
end

# enable factories decorators
Dir[Rails.root.join('spec/factories/spree/**/*.rb')].sort.each do |factory|
  require factory if factory =~ /decorator/
end
