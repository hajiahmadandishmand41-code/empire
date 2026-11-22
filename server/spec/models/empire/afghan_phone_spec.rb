# frozen_string_literal: true

require 'rails_helper'

# The applicant types a phone number; the server decides whether it is Afghan.
# The storefront check is a courtesy for fast feedback, not the control.
RSpec.describe Empire::AfghanPhone do
  describe '.normalize' do
    {
      '+93700123456' => '+93700123456',
      '0093700123456' => '+93700123456',
      '93700123456' => '+93700123456',
      '0700123456' => '+93700123456',
      '+93 700 123 456' => '+93700123456',
      '+93-700-123-456' => '+93700123456',
      '(0700) 123 456' => '+93700123456',
      '۰۷۰۰۱۲۳۴۵۶' => '+93700123456',
      # A Kabul landline: 8-digit national number, area code 20.
      '+9320123456' => '+9320123456',
      '020123456' => '+9320123456'
    }.each do |input, expected|
      it "normalises #{input.inspect}" do
        expect(described_class.normalize(input)).to eq(expected)
      end
    end

    ['+15551234567', '+93', '070012', '70012345', 'not-a-phone', '', nil, '+93000123456'].each do |input|
      it "rejects #{input.inspect}" do
        expect(described_class.normalize(input)).to be_nil
        expect(described_class.valid?(input)).to be(false)
      end
    end
  end
end
