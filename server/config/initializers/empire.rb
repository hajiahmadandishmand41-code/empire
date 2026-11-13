# frozen_string_literal: true

# Spree 6.0.4 owns sellers, order splitting, commission lines, payout ledgers,
# companies, catalogs, quantity rules and volume prices. Empire adds only the
# pieces absent from that release: COD, geography, RFQs and payout review requests.
Spree.permissions.register_scope(:rfqs, group: :customers, resources: -> { [Empire::Rfq] })
Spree.permissions.register_scope(:quotes, group: :customers, audiences: %i[store seller],
                                 resources: -> { [Empire::Quote] })
Spree.permissions.register_scope(:payout_requests, group: :sellers,
                                 resources: -> { [Empire::PayoutRequest] })

Rails.application.config.to_prepare do
  Spree.payment_methods << Empire::CashOnDelivery unless Spree.payment_methods.include?(Empire::CashOnDelivery)
end

Rails.application.config.i18n.default_locale = :'fa-AF'
Rails.application.config.i18n.available_locales = %i[en fa-AF]
Rails.application.config.i18n.fallbacks = { 'fa-AF': [:en], en: [:en] }
Rails.application.config.time_zone = 'Asia/Kabul'
