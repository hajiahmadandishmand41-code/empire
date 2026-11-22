# frozen_string_literal: true

require 'rails_helper'

# The storefront collects a full application and the API must persist all of it.
# These specs assert against the database, not the response body, because the
# defect they guard against was fields being dropped *silently*: the request
# returned 201 while name, phone, address, city, description and categories were
# never written anywhere.
RSpec.describe 'Empire seller applications API', type: :request do
  let(:payload) do
    {
      shop_name: '  فروشگاه کابل   بازار  ',
      name: 'احمد کریمی',
      email: 'Applicant@Example.COM',
      password: 'SecurePass123!',
      password_confirmation: 'SecurePass123!',
      registration_number: 'REG-42',
      phone: '0700 123 456',
      address: 'سرک ۱۵، ناحیه ۴',
      city: 'کابل',
      description: 'فروشنده عمده پارچه',
      categories: %w[پارچه پوشاک]
    }
  end

  def apply(overrides = {})
    post '/api/v3/store/empire/seller_applications',
         params: payload.merge(overrides).to_json,
         headers: { 'X-Spree-Api-Key' => publishable_key.token, 'Content-Type' => 'application/json' }
  end

  it 'stores every accepted field, normalised, and creates a pending seller' do
    expect { apply }.to change(Empire::SellerApplication, :count).by(1)
    expect_status!(201)

    application = Empire::SellerApplication.last
    expect(application.store).to eq(empire_store)
    expect(application.shop_name).to eq('فروشگاه کابل بازار')
    expect(application.contact_name).to eq('احمد کریمی')
    expect(application.email).to eq('applicant@example.com')
    expect(application.phone).to eq('+93700123456')
    expect(application.address).to eq('سرک ۱۵، ناحیه ۴')
    expect(application.city).to eq('کابل')
    expect(application.description).to eq('فروشنده عمده پارچه')
    expect(application.registration_number).to eq('REG-42')
    expect(application.categories).to eq(%w[پارچه پوشاک])

    # The native Spree seller is what a reviewer admits later; it must exist and
    # must not be approved by the applicant's own request.
    expect(application.seller).to be_present
    expect(application.seller).not_to be_approved
    expect(application.seller.store).to eq(empire_store)
    expect(application.seller.users).to include(application.user)

    # Nothing sensitive is echoed back.
    body = body_json
    expect(body.keys).to match_array(%w[id status shop_name seller_id seller_panel submitted_at categories])
    expect(response.body).not_to include('SecurePass123!')
  end

  it 'rejects an invalid Afghan phone number instead of storing it' do
    expect { apply(phone: '+15551234567') }.not_to change(Empire::SellerApplication, :count)
    expect_status!(422)
    expect(body_json.dig('error', 'details', 'phone')).to be_present
  end

  it 'rejects a mismatched password and a short password' do
    expect { apply(password_confirmation: 'different') }.not_to change(Empire::SellerApplication, :count)
    expect_status!(422)

    expect { apply(password: 'short', password_confirmation: 'short') }.not_to change(Empire::SellerApplication, :count)
    expect_status!(422)
    # The message names the rule, not the value.
    expect(body_json.dig('error', 'message')).to be_present
  end

  it 'refuses a second live application for the same address' do
    apply
    expect_status!(201)
    expect { apply(email: 'applicant@example.com') }.not_to change(Empire::SellerApplication, :count)
    expect_status!(422)
    expect(body_json.dig('error', 'message')).to eq(I18n.t('empire.application_already_submitted'))
  end

  it 'lets a rejected applicant apply again, reusing their account' do
    apply
    first = Empire::SellerApplication.last
    first.reject!(reviewer: nil, reason: 'incomplete')

    # A new shop name, because Spree's seller slug is unique within the store and
    # a re-applying merchant may well want a different name — but re-using the
    # old one is a legitimate case too, so both are covered below.
    expect { apply(email: 'applicant@example.com', shop_name: 'Second attempt') }
      .to change(Empire::SellerApplication, :count).by(1)
    # Print the refusal instead of leaving a zero-change assertion unexplained.
    warn "REAPPLY1 #{response.status} #{response.body}" unless response.status == 201
    expect_status!(201)

    second = Empire::SellerApplication.last
    expect(second.email).to eq('applicant@example.com')
    expect(second.shop_name).to eq('Second attempt')
    expect(second.user_id).to eq(first.user_id)
    expect(second.seller_id).not_to eq(first.seller_id)
  end

  it 'reuses the shop name when a rejected merchant re-applies under it' do
    apply
    Empire::SellerApplication.last.reject!(reviewer: nil, reason: 'missing documents')
    # Same name as before: it must still succeed. Spree's slug is unique per
    # store, so the application has to ask for a free one rather than fail.
    expect { apply(email: 'applicant@example.com') }
      .to change(Empire::SellerApplication, :count).by(1)
    warn "REAPPLY2 #{response.status} #{response.body}" unless response.status == 201
    expect_status!(201)
    expect(Empire::SellerApplication.last.shop_name).to eq('فروشگاه کابل بازار')
  end

  it 'refuses to attach a seller to an address the password does not open' do
    apply
    Empire::SellerApplication.last.reject!(reviewer: nil, reason: 'incomplete')

    expect do
      apply(email: 'applicant@example.com', password: 'SomeoneElses123!',
            password_confirmation: 'SomeoneElses123!')
    end.not_to change(Empire::SellerApplication, :count)
    expect_status!(422)
  end

  it 'exposes the applicant status only to the matching email' do
    apply
    id = body_json.fetch('id')
    get "/api/v3/store/empire/seller_applications/#{id}",
        params: { email: 'applicant@example.com' }, headers: { 'X-Spree-Api-Key' => publishable_key.token }
    expect_status!(200)
    expect(body_json['status']).to eq('pending')

    get "/api/v3/store/empire/seller_applications/#{id}",
        params: { email: 'someone.else@example.com' }, headers: { 'X-Spree-Api-Key' => publishable_key.token }
    expect_status!(404)
  end

  it 'does not create a customer account or a staff role for the applicant' do
    expect { apply }.not_to change(Spree.customer_class, :count)
    application = Empire::SellerApplication.last
    # The merchant's role belongs to their own seller, never to the store's back
    # office: a store role would let an applicant into the operator's dashboard.
    expect(Spree::RoleUser.joins(:role).where(user: application.user,
                                              spree_roles: { resource: empire_store }).exists?).to be(false)
    expect(application.user.sellers).to include(application.seller)
  end

  it 'requires the publishable key' do
    post '/api/v3/store/empire/seller_applications', params: payload.to_json,
         headers: { 'Content-Type' => 'application/json' }
    expect(response.status).to be_between(400, 403)
    expect(Empire::SellerApplication.count).to eq(0)
  end
end
