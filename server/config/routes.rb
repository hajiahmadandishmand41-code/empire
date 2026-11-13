Rails.application.routes.draw do
  # Empire's own API controllers live in the host app (Api::V3::*), not under
  # the Spree engine namespace, so they are drawn here rather than inside
  # Spree::Core::Engine.add_routes (which would resolve Spree::Api::V3::*).
  namespace :api, defaults: { format: 'json' } do
    namespace :v3 do
      namespace :store do
        namespace :empire do
          resources :provinces, only: %i[index show]
          resources :seller_applications, only: :create
          resources :rfqs, only: %i[index show create] do
            post 'quotes/:quote_id/accept', action: :accept, on: :member
          end
        end
      end
      namespace :seller do
        namespace :empire do
          resources :quotes, only: %i[index create]
          resources :payout_requests, only: %i[index create]
        end
      end
      namespace :admin do
        namespace :empire do
          resources :rfqs, only: :index
          resources :payout_requests, only: :index do
            patch :approve, on: :member
            patch :reject, on: :member
          end
        end
      end
    end
  end

  root to: redirect(status: 302) { Spree::Config.dashboard_url.presence || '/dashboard' }
  mount Spree::Core::Engine, at: '/'
  if Rails.env.local? || (ENV['MISSION_CONTROL_USER'].present? && ENV['MISSION_CONTROL_PASSWORD'].present?)
    mount MissionControl::Jobs::Engine, at: '/jobs'
  end
  get 'up' => 'rails/health#show', as: :rails_health_check
end
