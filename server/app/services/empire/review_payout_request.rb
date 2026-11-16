# frozen_string_literal: true

module Empire
  class ReviewPayoutRequest
    Result = Struct.new(:success?, :request, :error, keyword_init: true)

    def self.call(request:, reviewer:, approve:, reason: nil)
      raise ArgumentError, 'a staff reviewer is required' unless reviewer.is_a?(Spree.admin_user_class)

      ActiveRecord::Base.transaction do
        request.lock!
        return Result.new(success?: false, request: request, error: I18n.t('empire.request_already_reviewed')) unless request.requested?

        if approve
          result = Spree.seller_payout_sweep_workflow.call(seller: request.seller, currency: request.currency)
          unless result.success? && result.value.is_a?(Spree::SellerPayout)
            return Result.new(success?: false, request: request, error: I18n.t('empire.no_payable_balance'))
          end

          request.update!(status: :approved, payout: result.value, reviewed_by: reviewer, reviewed_at: Time.current)
        else
          request.update!(status: :rejected, rejection_reason: reason.to_s.strip.presence,
                          reviewed_by: reviewer, reviewed_at: Time.current)
        end
        Result.new(success?: true, request: request)
      end
    end
  end
end
