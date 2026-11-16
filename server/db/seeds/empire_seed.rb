# frozen_string_literal: true

module EmpireSeed
  module_function

  PROVINCES = [
    ['BDS', 'بدخشان', 'Badakhshan', 'فیض‌آباد'], ['BDG', 'بادغیس', 'Badghis', 'قلعه‌نو'],
    ['BGL', 'بغلان', 'Baghlan', 'پل خمری'], ['BLK', 'بلخ', 'Balkh', 'مزارشریف'],
    ['BAM', 'بامیان', 'Bamyan', 'بامیان'], ['DKU', 'دایکندی', 'Daykundi', 'نیلی'],
    ['FRA', 'فراه', 'Farah', 'فراه'], ['FRY', 'فاریاب', 'Faryab', 'میمنه'],
    ['GZN', 'غزنی', 'Ghazni', 'غزنی'], ['GHO', 'غور', 'Ghor', 'فیروزکوه'],
    ['HEL', 'هلمند', 'Helmand', 'لشکرگاه'], ['HER', 'هرات', 'Herat', 'هرات'],
    ['JAW', 'جوزجان', 'Jowzjan', 'شبرغان'], ['KAB', 'کابل', 'Kabul', 'کابل'],
    ['KND', 'کندهار', 'Kandahar', 'کندهار'], ['KPS', 'کاپیسا', 'Kapisa', 'محمودراقی'],
    ['KST', 'خوست', 'Khost', 'خوست'], ['KNR', 'کنر', 'Kunar', 'اسدآباد'],
    ['KDZ', 'کندوز', 'Kunduz', 'کندوز'], ['LAG', 'لغمان', 'Laghman', 'مهترلام'],
    ['LOG', 'لوگر', 'Logar', 'پل علم'], ['NAN', 'ننگرهار', 'Nangarhar', 'جلال‌آباد'],
    ['NIM', 'نیمروز', 'Nimruz', 'زرنج'], ['NUR', 'نورستان', 'Nuristan', 'پرون'],
    ['PIA', 'پکتیا', 'Paktia', 'گردیز'], ['PIK', 'پکتیکا', 'Paktika', 'شرن'],
    ['PNS', 'پنجشیر', 'Panjshir', 'بازارک'], ['PNW', 'پروان', 'Parwan', 'چاریکار'],
    ['SMN', 'سمنگان', 'Samangan', 'ایبک'], ['SPR', 'سرپل', 'Sar-e Pol', 'سرپل'],
    ['TKR', 'تخار', 'Takhar', 'تالقان'], ['URZ', 'ارزگان', 'Uruzgan', 'ترین‌کوت'],
    ['WRD', 'میدان‌وردک', 'Wardak', 'میدان‌شهر'], ['ZBL', 'زابل', 'Zabul', 'قلات']
  ].freeze

  def load!
    store = Spree::Store.default || raise('Spree store seed did not create a default store')
    store.update!(name: 'Empire', default_currency: 'AFN', supported_currencies: 'AFN',
                  default_locale: 'fa', supported_locales: 'en,fa', default_country_code: 'AF')
    seed_geography
    seed_cod(store)
    seed_publishable_key(store)
    seed_demo(store) if ENV['EMPIRE_SEED_DEMO'] == 'true' && !Rails.env.production?
    puts "Empire seeds complete: store=#{store.prefixed_id}, demo=#{ENV['EMPIRE_SEED_DEMO'] == 'true' && !Rails.env.production?}"
  end

  def seed_geography
    PROVINCES.each do |code, name, english, center|
      province = Empire::Province.find_or_initialize_by(code: code)
      province.update!(name: name, name_en: english, name_ps: nil, active: true)
      districts = code == 'KAB' ? [center, 'پغمان', 'چهارآسیاب', 'بگرامی', 'شکردره', 'ده‌سبز'] : [center]
      districts.each_with_index do |district, index|
        record = Empire::District.find_or_initialize_by(province: province, name: district)
        record.update!(name_en: index.zero? ? english : district, name_ps: nil, active: true)
      end
    end
  end

  def seed_cod(store)
    method = store.payment_methods.find_or_initialize_by(type: 'Empire::CashOnDelivery')
    method.update!(name: 'پرداخت هنگام تحویل', description: 'پرداخت نقدی هنگام دریافت سفارش',
                   active: true, storefront_visible: true, capture_method: 'manual')
  end

  def seed_publishable_key(store)
    token = ENV['SPREE_PUBLISHABLE_KEY'].presence
    key = store.api_keys.active.publishable.find_by(token: token) if token
    key ||= store.api_keys.active.publishable.find_by(name: 'Empire storefront', channel_id: nil)
    key ||= store.api_keys.create!(name: 'Empire storefront', key_type: 'publishable', token: token)
    puts "Empire publishable key: #{key.token}" unless Rails.env.test?
  end

  def seed_demo(store)
    admin = Spree.admin_user_class.find_by(email: ENV.fetch('ADMIN_EMAIL', 'admin@empire.test'))
    raise 'Demo seed requires ADMIN_EMAIL and ADMIN_PASSWORD' if admin.nil?

    seller_user = Spree.admin_user_class.find_or_create_by!(email: ENV.fetch('DEMO_SELLER_EMAIL', 'demo.seller@empire.test')) do |user|
      password = ENV.fetch('DEMO_SELLER_PASSWORD', 'DemoSeller123!')
      user.assign_attributes(password: password, password_confirmation: password, first_name: 'فروشنده', last_name: 'نمایشی')
    end
    seller = store.sellers.find_by(name: 'فروشگاه نمایشی Empire')
    if seller.nil?
      result = Spree.seller_create_workflow.call(store: store, attributes: { name: 'فروشگاه نمایشی Empire', contact_email: seller_user.email })
      raise result.value.errors.full_messages.to_sentence unless result.success?
      seller = result.value
      seller.add_user(seller_user)
      Spree.seller_approve_workflow.call(seller: seller, approver: admin, override_requirements: true).tap do |approval|
        raise 'Demo seller approval failed' unless approval.success?
      end
    end

    product = store.products.find_by(slug: 'empire-demo-handmade-basket')
    if product.nil?
      result = Spree.product_create_workflow.call(store: store, record: seller.products.build,
        attributes: { name: 'سبد دست‌باف نمایشی Empire', slug: 'empire-demo-handmade-basket',
                      description: 'کالای نمایشی برای آزمایش خرید واقعی؛ سفارش واقعی ارسال نمی‌شود.',
                      prices: [{ currency: 'AFN', amount: '1200.00' }] })
      raise result.value.errors.full_messages.to_sentence unless result.success?
      product = result.value
      # Seller warehouses do not auto-propagate new variants; create the demo
      # variant's stock row explicitly so the seeded catalog is purchasable.
      location = seller.stock_locations.find_by(default: true) || seller.stock_locations.first
      raise 'Demo seller requires a stock location' unless location
      location.set_up_stock_level(product.default_variant).update!(count_on_hand: 100)
      Spree.product_propose_workflow.call(product: product, submitted_by: seller_user)
      Spree.product_approve_workflow.call(product: product.reload, reviewer: admin).tap do |approval|
        raise 'Demo product approval failed' unless approval.success?
      end
    end

    # Spree 6 storefront visibility is per-channel: a product must have a
    # ProductPublication for the current channel. The core model method takes
    # database IDs (the Admin API decodes prefixed IDs before calling it).
    channel = store.default_channel
    raise 'Empire demo requires a default sales channel' unless channel
    channel.add_products([product.id])

    rate = store.commission_rates.find_by(code: 'marketplace-default')
    rate&.update!(value: '10', enabled: true)
    store.delivery_methods.where(name: 'Standard').find_each do |method|
      method.calculator.preferences = { amount: 150, currency: 'AFN' }
      method.calculator.save!
      # Spree 6 defaults marketplace methods to private; share the operator's
      # standard rate with seller-owned stock so checkout can quote delivery.
      method.update!(available_to_sellers: true, storefront_visible: true)
    end

    buyer = Spree.customer_class.find_or_create_by!(email: ENV.fetch('DEMO_BUYER_EMAIL', 'demo.buyer@empire.test')) do |user|
      password = ENV.fetch('DEMO_BUYER_PASSWORD', 'DemoBuyer123!')
      user.assign_attributes(password: password, password_confirmation: password, first_name: 'خریدار', last_name: 'نمایشی')
    end
    company = store.companies.find_or_create_by!(name: 'شرکت نمایشی Empire') { |record| record.kind = 'company' }
    company.memberships.find_or_create_by!(customer: buyer)
    Empire::Rfq.find_or_create_by!(store: store, customer: buyer, company: company, title: 'درخواست قیمت نمایشی Empire') do |rfq|
      rfq.assign_attributes(variant: product.default_variant, requested_quantity: 10, description: 'درخواست آزمایشی قیمت عمده')
    end
  end
end

EmpireSeed.load!
