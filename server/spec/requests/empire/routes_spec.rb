# frozen_string_literal: true

require 'rails_helper'

# Every Empire endpoint the API contract promises must actually be drawn, and
# must resolve to a controller action that exists.
#
# This exists because a route written as `resources :variants do
# get :volume_pricing, on: :member end` looks correct, passes the static audit
# (which compares paths, not Rails internals), and only fails when a real request
# reaches it — the mistake that broke the end-to-end journey. Recognition plus
# constantising the controller catches it in a unit test instead, and needs no
# database or authentication.
RSpec.describe 'Empire route table' do
  contract = JSON.parse(Rails.root.join('../docs/api/api-contract.json').read)

  # A concrete path for a Rails route template. Prefix ids look like
  # `variant_abc123` and plain ids like `7`; the segment only has to be
  # supplied, not meaningful, because recognition matches the pattern.
  def concrete(path)
    path.gsub(':variant_id', 'variant_1').gsub(/:([a-z_]+)/) { |match| match == ':variant_id' ? match : '7' }
  end

  contract.fetch('empire').each do |verb, path|
    it "draws #{verb.upcase} #{path} to a real action" do
      url = concrete(path)

      recognized = begin
        Rails.application.routes.recognize_path(url, method: verb.upcase.to_sym)
      rescue ActionController::RoutingError => e
        raise "no route drawn for #{verb.upcase} #{path} (#{url}): #{e.message}"
      end

      controller = "#{recognized[:controller]}_controller".camelize.safe_constantize
      expect(controller).to be_present,
                            "#{verb.upcase} #{path} resolves to #{recognized[:controller]}_controller, which does not exist"
      expect(controller.action_methods).to include(recognized[:action].to_s),
                                           "#{controller} has no ##{recognized[:action]} for #{verb.upcase} #{path}"
    end
  end
end
