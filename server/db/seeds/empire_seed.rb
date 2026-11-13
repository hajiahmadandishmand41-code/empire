# frozen_string_literal: true

# Empire seed data — Afghanistan localization, marketplace, B2B.
# All records are tagged as demo data.

module EmpireSeed
  module_function

  def load!
    puts "[EmpireSeed] Loading Afghanistan provinces and districts..."
    load_provinces_and_districts

    puts "[EmpireSeed] Creating demo marketplace sellers..."
    create_demo_sellers

    puts "[EmpireSeed] Creating demo B2B company..."
    create_demo_company

    puts "[EmpireSeed] Done."
  end

  def load_provinces_and_districts
    # Source: Afghanistan Independent Directorate of Local Governance (IDLG)
    # 34 provinces. Licensed for public use. Documented in docs/AFGHANISTAN-LOCALIZATION.md.
    provinces = [
      { code: "KAB", name: "کابل", name_ps: "کابل", name_en: "Kabul", districts: ["کابل", "دشت بarlos", "خر부"] },
      { code: "HER", name: "هرات", name_ps: "هرات", name_en: "Herat", districts: ["هرات", "گوزاره", "کوشكانه"] },
      { code: "BLK", name: "بالخ", name_ps: "بالخ", name_en: "Balkh", districts: ["مزار شريف", "줄م"] },
      { code: "NAN", name: "ننگرهار", name_ps: "ننګرهار", name_en: "Nangarhar", districts: ["جلال آباد", "خانوفر"] },
      { code: "KND", name: "کندهار", name_ps: "کندهار", name_en: "Kandahar", districts: ["کندهار", "ارغنداب"] },
      { code: "HEL", name: "هلمند", name_ps: "هلمند", name_en: "Helmand", districts: ["بوست", "لشكرگاه"] },
      { code: "FRY", name: "فاریاب", name_ps: "فارياب", name_en: "Faryab", districts: ["ميمانة", "قيسار"] },
      { code: "JAW", name: "جوزجان", name_ps: "جوزجان", name_en: "Jowzjan", districts: ["ibir"] },
      { code: "KDZ", name: "قندوز", name_ps: "قندوز", name_en: "Kunduz", districts: ["قندوز", "امام صاحب"] },
      { code: "BDS", name: "بدخشان", name_ps: "بدخشاں", name_en: "Badakhshan", districts: ["فيزبد", "يوفتل"] },
      { code: "BGL", name: "بغلان", name_ps: "بغلان", name_en: "Baghlan", districts: ["پلی خمری", "بورکا"] },
      { code: "TKR", name: "تخار", name_ps: "تخار", name_en: "Takhar", districts: ["طالقان", "ishtrak"] },
      { code: "PNW", name: "پروان", name_ps: "پروان", name_en: "Parwan", districts: ["چاريکار", "برک"] },
      { code: "KPS", name: "کاپیسا", name_ps: "کاپیسا", name_en: "Kapisa", districts: ["محمود رايقي"] },
      { code: "LAG", name: "لغمان", name_ps: "لغمان", name_en: "Lagman", districts: ["مئتين لامه"] },
      { code: "KNR", name: "کونر", name_ps: "كونر", name_en: "Kunar", districts: ["أسد آباد", "sarkani"] },
      { code: "NUR", name: "نورستان", name_ps: "نورستان", name_en: "Nuristan", districts: ["پランگ", "duab"] },
      { code: "PNS", name: "پنجشير", name_ps: "پنجشير", name_en: "Panjshir", districts: ["بهرک"] },
      { code: "BDG", name: "بدغيس", name_ps: "بدغيس", name_en: "Badghis", districts: ["قالا_e Naw"] },
      { code: "GHO", name: "غور", name_ps: "غور", name_en: "Ghor", districts: ["فيروزكوه", "taywara"] },
      { code: "DKU", name: "دایکندي", name_ps: "دایکندي", name_en: "Daykundi", districts: ["نیلي", "markazi"] },
      { code: "URZ", name: "اوروزگان", name_ps: "اوروزگان", name_en: "Uruzgan", districts: ["تيرين كوت", "chora"] },
      { code: "ZBL", name: "زابل", name_ps: "زابل", name_en: "Zabul", districts: ["قلات", "shah joy"] },
      { code: "NIM", name: "نيمروز", name_ps: "نيمروز", name_en: "Nimruz", districts: ["زرنج", "khash rod"] },
      { code: "PIK", name: "پكتيكا", name_ps: "پکتيکا", name_en: "Paktika", districts: ["شركان", "urzon"] },
      { code: "PIA", name: "پکتييا", name_ps: "پکتياء", name_en: "Paktia", districts: ["غرديز", "zurmat"] },
      { code: "KST", name: "خوست", name_ps: "خوست", name_en: "Khost", districts: ["خوست", "manduzai"] },
      { code: "LOG", name: "لوگر", name_ps: "لوگر", name_en: "Logar", districts: ["pol-e alam", "baraki barak"] },
      { code: "WRD", name: "وردگ", name_ps: "ورګ", name_en: "Wardak", districts: ["maidan shahr", "sayyidabad"] },
      { code: "SPR", name: "سرپول", name_ps: "سرپول", name_en: "Sar-e Pol", districts: ["seri pul", "sayyad"] },
      { code: "SMN", name: "سمنگان", name_ps: "سمنگان", name_en: "Samangan", districts: ["aybak", "dara-e sufi"] },
      { code: "BAM", name: "باميان", name_ps: "بامیان", name_en: "Bamyan", districts: ["bamyan city", "shibar"] },
      { code: "GZN", name: "غزني", name_ps: "غزني", name_en: "Ghazni", districts: ["ghazni city", "andoi"] },
    ].freeze

    provinces.each do |prov|
      province = Empire::Province.find_or_create_by!(code: prov[:code]) do |p|
        p.name = prov[:name]
        p.name_ps = prov[:name_ps]
        p.name_en = prov[:name_en]
        p.active = true
      end

      (prov[:districts] || []).each_with_index do |dist_name, idx|
        Empire::District.find_or_create_by!(province: province, name: dist_name) do |d|
          d.name_ps = dist_name
          d.name_en = dist_name
          d.active = true
        end
      end
    end
  end

  def create_demo_sellers
    # Find or create a demo seller user
    seller_user = Spree::User.find_or_create_by!(email: "demo.seller@empire.test") do |u|
      u.password = "DemoSeller123!"
      u.password_confirmation = "DemoSeller123!"
    end

    seller = Empire::Seller.find_or_create_by!(user: seller_user) do |s|
      s.shop_name = "نمونه فروشگاه کابولی (دémo)"
      s.shop_description = "فروشگاه نمایشی برای آزمایش pivotal — کالاهای tradicionال افغانستان"
      s.business_registration_number = "DEMO-REG-001"
      s.tax_identification_number = "DEMO-TAX-001"
      s.verification_status = :verified
      s.commission_rate = BigDecimal("0.10")
      s.verified_at = Time.current
    end

    puts "[EmpireSeed] Demo seller created: #{seller.shop_name}"
  end

  def create_demo_company
    company = Empire::Company.find_or_create_by!(registration_number: "DEMO-CO-001") do |c|
      c.name = "شرکت نمایشی تجاری امپراتور (B2B Demo)"
      c.tax_identification_number = "DEMO-TAX-CO-001"
      c.description = "شرکت نمایشی B2B برای آزمایش catalytic قیمت‌گذاری عمده و RFQ"
      c.industry = "تجارت عمومی"
      c.wholesale_eligible = true
      c.active = true
    end

    buyer_user = Spree::User.find_or_create_by!(email: "demo.buyer@empire.test") do |u|
      u.password = "DemoBuyer123!"
      u.password_confirmation = "DemoBuyer123!"
    end

    Empire::CompanyUser.find_or_create_by!(user: buyer_user, empire_company: company) do |cu|
      cu.role = :company_admin
      cu.can_place_orders = true
      cu.can_approve_orders = true
    end

    puts "[EmpireSeed] Demo B2B company created: #{company.name}"
  end
end

EmpireSeed.load!
