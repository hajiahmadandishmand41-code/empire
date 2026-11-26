Rails.application.routes.draw do
  # Empire's own API controllers live in the host app (Api::V3::*), not under
  # the Spree engine namespace, so they are drawn here rather than inside
  # Spree::Core::Engine.add_routes (which would resolve Spree::Api::V3::*).
  namespace :api, defaults: { format: 'json' } do
    namespace :v3 do
      namespace :store do
        namespace :empire do
          resources :provinces, only: %i[index show]
          resources :seller_applications, only: %i[create show]
          # Points at its own controller, not a `VariantsController` member
          # action: `resources ... do get :volume_pricing` would look for
          # VariantsController and fail with an uninitialised constant.
          get 'variants/:variant_id/volume_pricing', to: 'volume_pricing#show', as: :variant_volume_pricing
          resources :rfqs, only: %i[index show create] do
            post 'quotes/:quote_id/accept', action: :accept, on: :member
          end
        end
      end
      namespace :seller do
        namespace :empire do
          # `rfqs` first so `/empire/rfqs/:id` is not captured by `quotes`.
          resources :rfqs, only: %i[index show]
          resources :quotes, only: %i[index show create update] do
            patch :withdraw, on: :member
          end
          resources :payout_requests, only: %i[index create]
        end
      end
      namespace :admin do
        namespace :empire do
          resources :rfqs, only: %i[index show] do
            patch :close, on: :member
            patch :cancel, on: :member
            patch :reopen, on: :member
            patch 'quotes/:quote_id/reject', action: :reject_quote, on: :member
          end
          resources :seller_applications, only: %i[index show] do
            patch :approve, on: :member
            patch :reject, on: :member
          end
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
