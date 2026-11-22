# frozen_string_literal: true

module Empire
  # A merchant's application to sell on the marketplace.
  #
  # This is the *application*, not the seller. Spree owns `Spree::Seller` and the
  # operator admits a seller through `Spree.seller_create_workflow`; nothing here
  # may approve, suspend or price a seller. What this record keeps is everything
  # the applicant told us — including the fields Spree's seller has no column
  # for (phone, city, street address, description, requested categories) — so a
  # reviewer can decide on real information instead of a shop name, and so the
  # applicant can be told what happened to their submission.
  #
  # Status and seller are only ever advanced by the admin review endpoints.
  class SellerApplication < ApplicationRecord
    self.table_name = 'empire_seller_applications'

    # Matches the E.164 numbers `Empire::AfghanPhone` accepts: +93 followed by
    # a 9-digit national number starting with 7 (mobile) or 2/3/4/6/8 (landline).
    AFGHAN_PHONE = /\A\+93[2-9]\d{8}\z/
    MAX_CATEGORIES = 12
    MAX_CATEGORY_LENGTH = 80

    belongs_to :store, class_name: 'Spree::Store'
    belongs_to :user, class_name: 'Spree::AdminUser', optional: true
    belongs_to :seller, class_name: 'Spree::Seller', optional: true
    belongs_to :reviewed_by, class_name: 'Spree::AdminUser', optional: true

    enum :status, { pending: 0, approved: 1, rejected: 2 }, default: :pending

    before_validation :normalize_fields

    validates :shop_name, presence: true, length: { maximum: 120 }
    validates :email, presence: true, format: { with: URI::MailTo::EMAIL_REGEXP }
    validates :contact_name, length: { maximum: 120 }, allow_blank: true
    validates :phone, format: { with: AFGHAN_PHONE, message: :invalid_phone }, allow_blank: true
    validates :city, length: { maximum: 80 }, allow_blank: true
    validates :address, length: { maximum: 255 }, allow_blank: true
    validates :description, length: { maximum: 2000 }, allow_blank: true
    validates :registration_number, length: { maximum: 60 }, allow_blank: true
    validates :rejection_reason, length: { maximum: 1000 }, allow_blank: true
    validate :single_live_application, on: :create

    scope :awaiting_review, -> { pending.order(created_at: :asc) }
    scope :live, -> { where(status: %i[pending approved]) }

    # The one application per address that has not been closed out. A rejected
    # applicant may apply again; a pending or approved one may not, which is
    # what stops a single merchant filling the review queue.
    def self.live_for(store:, email:)
      live.where(store: store, email: email.to_s.strip.downcase).first
    end

    def approve!(reviewer:, seller:)
      update!(status: :approved, seller: seller, reviewed_by: reviewer,
              reviewed_at: Time.current, rejection_reason: nil)
    end

    def reject!(reviewer:, reason:)
      update!(status: :rejected, reviewed_by: reviewer, reviewed_at: Time.current,
              rejection_reason: reason.to_s.strip.presence)
    end

    # Only the reviewer-facing view names the applicant; API responses must not
    # leak credentials, and this record never stores them in the first place.
    def review_summary
      { id: id, shop_name: shop_name, contact_name: contact_name, email: email, phone: phone,
        city: city, address: address, description: description,
        registration_number: registration_number, categories: categories,
        status: status, seller_id: seller&.prefixed_id, created_at: created_at,
        reviewed_at: reviewed_at, rejection_reason: rejection_reason }
    end

    private

    def normalize_fields
      self.email = email.to_s.strip.downcase.presence
      self.shop_name = shop_name.to_s.squish.presence
      self.contact_name = contact_name.to_s.squish.presence
      self.city = city.to_s.squish.presence
      self.address = address.to_s.squish.presence
      self.registration_number = registration_number.to_s.strip.presence
      # `phone` keeps the raw value when it is not an Afghan number, so the
      # format validation below can reject it. Writing the normalised `nil`
      # would turn a typed-but-wrong number into "no number given".
      normalized_phone = Empire::AfghanPhone.normalize(phone)
      self.phone = normalized_phone || phone.to_s.strip.presence
      # Bounded here rather than with a length validation: a category is free
      # text matching the store's taxonomy, and an over-long one is trimmed to
      # what the reviewer can read instead of rejecting an otherwise valid
      # application. The count limit is what stops the field being abused.
      self.categories = Array(categories).map { |value| value.to_s.squish.first(MAX_CATEGORY_LENGTH) }
                                       .reject(&:blank?).uniq.first(MAX_CATEGORIES)
    end

    def single_live_application
      return if email.blank? || store.nil?
      return unless self.class.live.where(store_id: store_id, email: email).where.not(id: id).exists?

      errors.add(:base, I18n.t('empire.application_already_submitted'))
    end
  end
end
