# frozen_string_literal: true

# Fail closed at runtime, not only in a deployment checklist. Asset builds use
# Rails' SECRET_KEY_BASE_DUMMY and never receive real database/encryption keys.
Rails.application.config.after_initialize do
  next if ENV['SECRET_KEY_BASE_DUMMY'].present?
  next unless Rails.env.production?

  missing = %w[SECRET_KEY_BASE DATABASE_URL ACTIVE_RECORD_ENCRYPTION_PRIMARY_KEY
               ACTIVE_RECORD_ENCRYPTION_DETERMINISTIC_KEY ACTIVE_RECORD_ENCRYPTION_KEY_DERIVATION_SALT]
            .select { |name| ENV[name].to_s.length < 32 }
  raise "Empire production configuration missing/short: #{missing.join(', ')}" if missing.any?
end
