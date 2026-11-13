# frozen_string_literal: true

module Api
  module V3
    module Store
      module Empire
        class BankTransfersController < BaseController
          def create
            bt = current_user.bank_transfers.build(bank_transfer_params)
            if bt.save
              render json: { id: bt.id, status: bt.status }, status: :created
            else
              render json: { errors: bt.errors.full_messages }, status: :unprocessable_entity
            end
          end

          private

          def bank_transfer_params
            params.permit(:order_id, :bank_name, :account_number, :account_holder, :branch, :amount, :currency, :reference_number)
          end
        end
      end
    end
  end
end
