# frozen_string_literal: true

module Empire
  # Afghan phone numbers, validated on the server.
  #
  # The storefront validates the same numbers for fast feedback, but a browser
  # check is a courtesy, not a control: this module is what decides. It accepts
  # the shapes a person actually types — `+93700123456`, `0093700123456`,
  # `93700123456`, `0700123456`, and the same with spaces, dashes or Dari-Indic
  # digits — and normalises them to one canonical E.164 string.
  module AfghanPhone
    # Afghanistan's numbering plan: mobile national numbers are 9 digits
    # starting with 7 (70, 72, 73, 74, 76, 77, 78, 79); landline national
    # numbers are 8 digits beginning with an area code 2, 3, 4, 6 or 8.
    NATIONAL = /\A(?:7\d{8}|[23468]\d{7})\z/

    # Persian/Arabic-Indic digits to ASCII, so a number typed on a Dari keyboard
    # validates the same way.
    DIGIT_MAP = { '۰' => '0', '۱' => '1', '۲' => '2', '۳' => '3', '۴' => '4',
                  '۵' => '5', '۶' => '6', '۷' => '7', '۸' => '8', '۹' => '9',
                  '٠' => '0', '١' => '1', '٢' => '2', '٣' => '3', '٤' => '4',
                  '٥' => '5', '٦' => '6', '٧' => '7', '٨' => '8', '٩' => '9' }.freeze

    module_function

    # @return [String, nil] canonical +93… form, or nil when the input is not an
    #   Afghan number at all.
    def normalize(value)
      digits = value.to_s.gsub(/[۰-۹٠-٩]/, DIGIT_MAP).gsub(/[^\d]/, '')
      return nil if digits.blank?

      national =
        if digits.start_with?('0093') then digits.delete_prefix('0093')
        elsif digits.start_with?('93') then digits.delete_prefix('93')
        elsif digits.start_with?('0') then digits.delete_prefix('0')
        else digits
        end

      national.match?(NATIONAL) ? "+93#{national}" : nil
    end

    def valid?(value)
      normalize(value).present?
    end
  end
end
