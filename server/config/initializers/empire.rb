# frozen_string_literal: true

# Empire configuration — custom extensions built on top of Spree core.
# Spree core remains a versioned gem; Empire features live here and in
# extensions/, models, migrations and locale files.

Rails.application.config.to_prepare do
  # Load Empire decorators/extensions
  Dir[Rails.root.join("app", "models", "spree", "*_decorator.rb")].each do |file|
    require_dependency file
  end
end

# Default market / currency / locale for Afghanistan (primary market)
Empire.config = ActiveSupport::OrderedOptions.new
Empire.config.default_market_code = "AF"
Empire.config.default_currency = "AFN"
Empire.config.default_locale = "fa-AF"
Empire.config.default_timezone = "Asia/Kabul"
Empire.config.country_name = "Afghanistan"

# Marketplace settings
Empire.config.marketplace_enabled = true
Empire.config.default_commission_rate = BigDecimal("0.10") # 10%

# B2B settings
Empire.config.b2b_enabled = true
Empire.config.require_company_approval = true

# Payment settings (disabled until real gateway configured)
Empire.config.cash_on_delivery_enabled = true
Empire.config.bank_transfer_enabled = true
Empire.config.stripe_enabled = false # require legal review + live gateway test

# Shipping settings
Empire.config.shipping_enabled = true
