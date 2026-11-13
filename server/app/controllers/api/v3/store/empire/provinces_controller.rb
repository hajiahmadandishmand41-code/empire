# frozen_string_literal: true

module Api
  module V3
    module Store
      module Empire
        # Afghanistan provinces and districts — public reference data.
        class ProvincesController < BaseController
          skip_before_action :authenticate_user!, only: %i[index show]

          def index
            provinces = Empire::Province.active.includes(:districts)
            render json: provinces.map { |p|
              {
                id: p.id,
                code: p.code,
                name: p.localized_name,
                name_dari: p.name,
                name_pashto: p.name_ps,
                name_english: p.name_en,
                districts: p.districts.active.map { |d|
                  {
                    id: d.id,
                    name: d.localized_name,
                    name_dari: d.name,
                    name_pashto: d.name_ps,
                    name_english: d.name_en,
                  }
                },
              }
            }
          end

          def show
            province = Empire::Province.active.find(params[:id])
            render json: {
              id: province.id,
              code: province.code,
              name: province.localized_name,
              districts: province.districts.active.map { |d|
                { id: d.id, name: d.localized_name }
              },
            }
          end
        end
      end
    end
  end
end
