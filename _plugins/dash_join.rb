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
#
# Scripts that write text (trivia notes, The House, search results, the
# instruments' messages) join their own dashes as they show them. On every
# page a short script at the end of <body> takes the joiner back out of
# anything a reader copies, so a phrase pasted into a search or a message
# is the plain text; text fields and editable areas copy as they are.
require "strscan"

module DashJoin
  JOINER = "\u2060"
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
        text = text.gsub(/(?<=[^\s\u2060])(#{DASH})/o) { JOINER + Regexp.last_match(1) }
        text = JOINER + text if joinable && text.match?(/\A#{DASH}/o)
        out << text
        joinable = text.match?(/[^\s\u2060]\z/)
      else
        out << scanner.getch
        joinable = false
      end
    end
    out
  end

  COPY_SCRIPT = <<~JS.gsub(/\n\s*/, "").freeze
    <script data-dash-copy>document.addEventListener("copy",function(e){
    var a=document.activeElement;if(a&&(/^(INPUT|TEXTAREA)$/.test(a.tagName)||a.isContentEditable))return;
    var s=window.getSelection(),t=String(s);if(t.indexOf("\\u2060")<0||!e.clipboardData)return;
    var d=document.createElement("div");for(var i=0;i<s.rangeCount;i++)d.appendChild(s.getRangeAt(i).cloneContents());
    e.clipboardData.setData("text/plain",t.replace(/\\u2060/g,""));
    e.clipboardData.setData("text/html",d.innerHTML.replace(/\\u2060/g,""));
    e.preventDefault();});</script>
  JS

  def self.clean_copies(html)
    return html if html.include?("data-dash-copy")
    at = html.rindex(%r{</body\s*>}i)
    at ? html.dup.insert(at, COPY_SCRIPT) : html
  end
end

Jekyll::Hooks.register [:pages, :documents], :post_render do |item|
  next unless item.output_ext == ".html"
  item.output = DashJoin.join(item.output) if item.output.match?(DashJoin::DASH)
  item.output = DashJoin.clean_copies(item.output)
end
