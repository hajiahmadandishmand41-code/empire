Rails.application.routes.draw do
  # Routes for your own Spree API v3 resources. `bin/rails g spree:api_resource`
  # adds a line here for each resource it generates; you can also add your own.
  Spree::Core::Engine.add_routes do
    namespace :api, defaults: { format: 'json' } do
      namespace :v3 do
        namespace :store do
          # Empire extensions — Afghanistan geography, marketplace, B2B, payments
          namespace :empire do
            resources :provinces, only: %i[index show]
            resources :sellers, only: [] do
              member do
                get :me
                patch :update_profile
              end
            end
            resources :rfqs, only: %i[index create]
            resources :payouts, only: %i[index create]
            resources :bank_transfers, only: %i[create]
          end
        end
        namespace :admin do
          namespace :empire do
            resources :sellers, only: %i[index] do
              member do
                patch :verify
                patch :reject
                patch :suspend
              end
            end
            resources :payouts, only: %i[index] do
              member do
                patch :approve
                patch :reject
              end
            end
            resources :rfqs, only: %i[index]
            resources :disputes, only: %i[index]
          end
        end
      end
    end
  end

  # The app's front door is the dashboard. Spree resolves where it lives:
  # SPREE_DASHBOARD_URL when set, else the /dashboard this app serves, else
  # the Vite dev server in development. 302, not 301, so browsers don't cache
  # it past a change of SPREE_DASHBOARD_URL.
  root to: redirect(status: 302) { Spree::Stores::DashboardUrl.call.presence || '/dashboard' }

  # This line mounts Spree's routes at the root of your application.
  # This means, any requests to URLs such as /products, will go to
  # Spree::ProductsController.
  # If you would like to change where this engine is mounted, simply change the
  # :at option to something different.
  #
  # We ask that you don't use the :as option here, as Spree relies on it being
  # the default of "spree".
  mount Spree::Core::Engine, at: '/'

  # Job dashboard (Mission Control) — inspect, retry, and discard Solid Queue
  # jobs at http://localhost:3000/jobs. Guarded by its own HTTP Basic auth
  # (see config/application.rb), independent of app sessions.
  mount MissionControl::Jobs::Engine, at: "/jobs"

  # Reveal health status on /up that returns 200 if the app boots with no exceptions, otherwise 500.
  # Can be used by load balancers and uptime monitors to verify that the app is live.
  get "up" => "rails/health#show", as: :rails_health_check
end
