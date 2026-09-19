# Plain text for the search index. No layout chrome, styles or scripts.
require "cgi"

module SearchTextFilter
  def search_text(input)
    text = input.to_s.gsub(/<(script|style)\b[^>]*>.*?<\/\1\s*>/mi, " ")
    text = text.gsub(/<!--.*?-->/m, " ").gsub(/\{%.*?%\}|\{\{.*?\}\}/m, " ")
    text = text.gsub(/<[^>]*>/m, " ")
    CGI.unescapeHTML(text).gsub(/[[:space:]]+/, " ").strip
  end
end

Liquid::Template.register_filter(SearchTextFilter)
