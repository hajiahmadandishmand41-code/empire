# frozen_string_literal: true

# Spree 6.0.4 owns sellers, order splitting, commission lines, payout ledgers,
# companies, catalogs, quantity rules and volume prices. Empire adds only the
# pieces absent from that release: COD, geography, RFQs and payout review requests.
Spree.permissions.register_scope(:rfqs, group: :customers, resources: -> { [Empire::Rfq] })
Spree.permissions.register_scope(:quotes, group: :customers, audiences: %i[store seller],
                                 resources: -> { [Empire::Quote] })
Spree.permissions.register_scope(:payout_requests, group: :sellers, audiences: %i[store seller],
                                 resources: -> { [Empire::PayoutRequest] })

# Core populates the payment-method registry and autoloads its models in
# after_initialize; touch neither during the initializer pass itself.
Rails.application.config.after_initialize do
  Spree.payment_methods << Empire::CashOnDelivery unless Spree.payment_methods.include?(Empire::CashOnDelivery)

  # Afghanistan has limited postal-code coverage. Spree explicitly leaves this
  # list mutable for host-country customization; keep postal codes optional for
  # AF rather than inventing a code or weakening validation for every country.
  Spree::Address::NO_ZIPCODE_ISO_CODES << 'AF' unless Spree::Address::NO_ZIPCODE_ISO_CODES.include?('AF')
end

# Spree 6.0.4's canonical content locale for Dari/Persian is `fa`
# (Spree::Locales::ALL). Empire's storefront UI locale is `fa-AF`; keep both
# I18n locales available so store content and Empire messages resolve safely.
Rails.application.config.i18n.default_locale = :'fa-AF'
Rails.application.config.i18n.available_locales = %i[en fa fa-AF]
Rails.application.config.i18n.fallbacks = { 'fa-AF': %i[fa en], fa: %i[fa-AF en], en: [:en] }
Rails.application.config.time_zone = 'Asia/Kabul'
