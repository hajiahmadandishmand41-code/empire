# frozen_string_literal: true

module Empire
  # Applies for a seller account in one transaction.
  #
  # Two records have to agree: the application (everything the applicant typed)
  # and the native Spree seller, which is what a reviewer later admits. The
  # previous implementation created the user and the seller and threw the rest of
  # the payload away; this keeps all of it and still refuses to grant anything —
  # the seller is created `pending`, gets no store staff role, and the merchant
  # is signed in to the seller panel only after `Spree.seller_approve_workflow`.
  #
  # Everything is one transaction: a failed seller creation must not leave a
  # user account behind that the applicant cannot re-use, because the address is
  # unique.
  class ApplySeller
    Result = Struct.new(:success?, :application, :errors, keyword_init: true)

    MIN_PASSWORD_LENGTH = 8

    def self.call(store:, attributes:, locale: nil)
      new(store: store, attributes: attributes, locale: locale).call
    end

    def initialize(store:, attributes:, locale: nil)
      @store = store
      @attributes = attributes.to_h.symbolize_keys
      @locale = locale
    end

    def call
      email = @attributes[:email].to_s.strip.downcase
      password = @attributes[:password].to_s
      confirmation = @attributes[:password_confirmation].to_s

      # Re-applying is refused before anything is written, so a merchant who
      # submits twice gets one clear answer rather than a unique-index 500.
      if SellerApplication.live_for(store: @store, email: email).present?
        return failure(:application_already_submitted)
      end

      if password.length < MIN_PASSWORD_LENGTH
        return failure(:application_password_too_short)
      end
      if password != confirmation
        return failure(:application_password_mismatch)
      end

      application = nil
      ActiveRecord::Base.transaction do
        application = SellerApplication.new(application_attributes)
        unless application.save
          return Result.new(success?: false, errors: application.errors)
        end

        user = Spree.admin_user_class.create!(
          email: email, password: password, password_confirmation: confirmation,
          first_name: application.contact_name.presence || application.shop_name,
          last_name: 'Empire'
        )

        seller_result = Spree.seller_create_workflow.call(
          store: @store,
          attributes: {
            name: application.shop_name,
            contact_email: email,
            registration_number: application.registration_number.presence
          }
        )
        unless seller_result.success? && seller_result.value.is_a?(Spree::Seller)
          raise ActiveRecord::Rollback
        end

        seller = seller_result.value
        # `add_user` grants the seller's own super-role — permissions scoped to
        # *this* seller. It grants nothing on the store's back office.
        seller.add_user(user)

        application.update!(user: user, seller: seller, last_submitted_at: Time.current,
                            metadata: (application.metadata || {}).merge('locale' => @locale.to_s.presence || 'fa-AF'))
      end

      return Result.new(success?: false, errors: nil) if application.nil? || application.seller_id.nil?

      Result.new(success?: true, application: application)
    rescue ActiveRecord::RecordInvalid => e
      Result.new(success?: false, errors: e.record&.errors)
    rescue ActiveRecord::RecordNotUnique
      # Lost a race with a simultaneous submission: same rule, same message.
      failure(:application_already_submitted)
    end

    private

    def application_attributes
      @attributes.slice(:shop_name, :contact_name, :email, :phone, :address, :city,
                        :description, :registration_number, :categories)
                 .tap { |attrs| attrs[:store] = @store }
    end

    def failure(key)
      Result.new(success?: false, errors: { base: [I18n.t("empire.#{key}", default: key.to_s.humanize)] })
    end
  end
end
