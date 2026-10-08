# A closed-up em dash (word—word) can otherwise open a line: a browser may
# break on either side of it. A word joiner (U+2060) before the dash keeps it
# on the line with the word it follows, and the line can still break after
# it. The joiner is invisible and takes no space.
#
# Only the text of a rendered HTML page is touched. Tags and their
# attributes, comments, scripts, styles, <pre>, <code>, <textarea> and
# <title> are passed over, as is a dash with a space before it (the spaced
# separator in page titles). A dash just after an inline tag (*quaranta*—)
# is joined to the word inside it; one after a block tag starts its own text
# and is left alone. Feeds and the search index are built from the content,
# not from these pages, so they keep the plain dash.
require "strscan"

module DashJoin
  JOINER = "⁠"
  DASH = /—|&mdash;|&#8212;|&#x2014;/i
  SKIPPED = /<(script|style|pre|code|textarea|title)\b(?:[^>"']|"[^"]*"|'[^']*')*>.*?<\/\1\s*>/mi
  COMMENT = /<!--.*?-->/m
  TAG = /<\/?([a-zA-Z][a-zA-Z0-9-]*)(?:[^>"']|"[^"]*"|'[^']*')*>/
  INLINE = %w[a abbr b bdi cite data dfn em i kbd mark q s samp small span strong sub sup time u var].freeze

  def self.join(html)
    scanner = StringScanner.new(html)
    out = +""
    joinable = false # the text just before ends in a character a dash can hold on to
    until scanner.eos?
      if (skipped = scanner.scan(SKIPPED) || scanner.scan(COMMENT))
        out << skipped
        joinable = false
      elsif (tag = scanner.scan(TAG))
        out << tag
        joinable = false unless INLINE.include?(scanner[1].downcase)
      elsif (text = scanner.scan(/[^<]+/))
        text = text.gsub(/(?<=[^\s⁠])(#{DASH})/o) { JOINER + Regexp.last_match(1) }
        text = JOINER + text if joinable && text.match?(/\A#{DASH}/o)
        out << text
        joinable = text.match?(/[^\s⁠]\z/)
      else
        out << scanner.getch
        joinable = false
      end
    end
    out
  end
end

Jekyll::Hooks.register [:pages, :documents], :post_render do |item|
  item.output = DashJoin.join(item.output) if item.output_ext == ".html" && item.output.match?(DashJoin::DASH)
end
