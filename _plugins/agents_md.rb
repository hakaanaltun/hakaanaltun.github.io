# AGENTS.md as text, for /colophon/. Read here rather than through
# include_relative, which would run the file through Liquid and take a tag
# quoted in it for a real one. Its own heading gives way to the page's.
Jekyll::Hooks.register :site, :post_read do |site|
  text = File.read(File.join(site.source, "AGENTS.md"), encoding: "utf-8")
  site.config["agents_md"] = text.sub(/\A# [^\n]*\n+/, "")
end
