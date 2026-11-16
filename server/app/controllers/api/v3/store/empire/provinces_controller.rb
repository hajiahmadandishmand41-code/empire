# frozen_string_literal: true

module Api
  module V3
    module Store
      module Empire
        class ProvincesController < BaseController
          skip_before_action :require_authentication!, only: %i[index show]
          allow_guest_storefront_access!

          def index
            render json: { data: ::Empire::Province.active.order(:code).includes(:districts).map { |province| serialize(province) },
                           translations: { 'ps-AF' => 'draft' } }
          end

          def show
            province = ::Empire::Province.active.find(params[:id])
            render json: serialize(province)
          end

          private

          def serialize(province)
            { id: province.id, code: province.code, name: province.localized_name,
              name_dari: province.name, name_english: province.name_en,
              translation_status: { 'ps-AF' => 'draft' },
              districts: province.districts.active.order(:name).map { |district|
                { id: district.id, name: district.localized_name, name_dari: district.name, name_english: district.name_en }
              } }
          end
        end
      end
    end
  end
end
