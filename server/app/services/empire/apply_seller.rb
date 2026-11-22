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

    # Raised inside the transaction when Spree's own seller workflow refuses.
    # A real exception, not `ActiveRecord::Rollback`, because the rollback must
    # propagate past the block for the caller to report anything at all.
    SellerCreationFailed = Class.new(StandardError)

    # Raised when the address already belongs to an account the supplied password
    # does not open.
    CredentialsRejected = Class.new(StandardError)

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
      # A `return` written inside this block would return from `call` and *commit*
      # everything the block had already written — a half-registered applicant
      # with no seller. Failures therefore leave by raising: the transaction rolls
      # back, and the `rescue` clauses below turn them into a Result.
      ActiveRecord::Base.transaction do
        application = SellerApplication.new(application_attributes)
        application.save!

        # A merchant whose first application was rejected applies again with the
        # same address, so the account is reused instead of colliding with the
        # unique index. The password they supply must open it: without that
        # check anyone could attach their own seller to a stranger's account.
        user = Spree.admin_user_class.find_by(email: email)
        if user
          raise CredentialsRejected unless user.valid_password?(password)
        else
          user = Spree.admin_user_class.create!(
            email: email, password: password, password_confirmation: confirmation,
            first_name: application.contact_name.presence || application.shop_name,
            last_name: 'Empire'
          )
        end

        seller_result = Spree.seller_create_workflow.call(
          store: @store,
          attributes: {
            name: application.shop_name,
            contact_email: email,
            registration_number: application.registration_number.presence
          }
        )
        unless seller_result.success? && seller_result.value.is_a?(Spree::Seller)
          raise SellerCreationFailed, seller_result.errors.inspect
        end

        seller = seller_result.value
        # `add_user` grants the seller's own super-role — permissions scoped to
        # *this* seller. It grants nothing on the store's back office.
        seller.add_user(user)

        application.update!(user: user, seller: seller, last_submitted_at: Time.current,
                            metadata: (application.metadata || {}).merge('locale' => @locale.to_s.presence || 'fa-AF'))
      end

      # A rolled-back transaction leaves these associations unset on an object
      # whose row never committed; report it instead of returning a phantom.
      if application.nil? || application.seller_id.nil?
        return failure(:seller_approval_failed)
      end

      Result.new(success?: true, application: application)
    rescue ActiveRecord::RecordInvalid => e
      # Field-level problems (a malformed email, an under-length password on the
      # user record) belong to the caller and are returned as validation errors.
      Result.new(success?: false, errors: e.record&.errors)
    rescue SellerCreationFailed, ActiveRecord::RecordNotSaved, ActiveRecord::Rollback
      # Nothing was written: the transaction rolled back.
      failure(:seller_approval_failed)
    rescue CredentialsRejected
      failure(:application_credentials_rejected)
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
