# _plugins/moon.rb — the moon over a piece, computed once at build time.
#
# A fragment is set on a night, and the night had a moon. That moon is a fact
# about a fixed date, so it is worked out here and baked into the page as a
# drawn path: nothing to compute in the browser, nothing to load, and it is
# still there for a reader with JavaScript off.
#
# The arithmetic is the same as js/astronomy.js — same epoch, same mean
# lunation, same eight phase edges — and the terminator is drawn the way
# moon/index.html draws it, so the shape here and the shape on /moon/ come out
# of one description of the sky rather than two that have to be kept in step.
#
# NOTE ON THE BUILD: this is the repo's only Ruby plugin, and plugins run only
# because .github/workflows/pages.yml builds with a real Ruby and its own
# `bundle exec jekyll build`. GitHub's stock Pages builder ignores _plugins/
# silently — if the workflow is ever replaced with that, the moons disappear
# without an error. Anything added here inherits that condition.
#
# Usage from a template:
#   {% assign moon = page.moon | moon_phase: page.date %}
#   moon.path          the sunlit part of the disc, an SVG path for a 200×200
#                      viewBox with the disc at r=80 — "" at new moon
#   moon.name          "Waning Crescent", and the rest
#   moon.illumination  0–100, the lit share of the disc, rounded
#   moon.date          the night it answers for, as a Time
#
# The filter takes the front matter's `moon:` value and the post's own date:
#   moon: true          the night the piece was published
#   moon: 2026-05-23    a night the author names, for a piece set on one
# Anything else — false, absent — returns nil and the include draws nothing.

module Jekyll
  module MoonFilter
    SYNODIC   = 29.530588853                        # mean lunation, days
    NEW_EPOCH = Time.utc(2000, 1, 6, 18, 14).to_f   # a known new moon
    # Age in days at which each phase gives way to the next; past the last
    # edge the cycle wraps back to new.
    EDGES = [1.84566, 5.53699, 9.22831, 12.91963, 16.61096, 20.30228, 23.99361, 27.68493].freeze
    NAMES = ['New Moon', 'Waxing Crescent', 'First Quarter', 'Waxing Gibbous',
             'Full Moon', 'Waning Gibbous', 'Last Quarter', 'Waning Crescent'].freeze

    def moon_phase(setting, fallback = nil)
      night = resolve(setting, fallback)
      return nil unless night

      lunation = (night.to_f - NEW_EPOCH) / 86_400.0 / SYNODIC
      age = (lunation - lunation.floor) * SYNODIC
      p = age / SYNODIC

      {
        'path' => lit_path(p),
        'name' => NAMES[EDGES.index { |edge| age < edge } || 0],
        'illumination' => (((1 - Math.cos(2 * Math::PI * p)) / 2) * 100).round,
        'date' => night
      }
    end

    private

    # `moon: true` means the piece's own date; a date means that night. A piece
    # set on a night that is not the night it was published is the ordinary
    # case for fiction, so the explicit form is the one that carries meaning.
    def resolve(setting, fallback)
      case setting
      when true then to_time(fallback)
      when Time, Date, DateTime then to_time(setting)
      when String then setting.strip.empty? ? nil : (to_time(setting) rescue nil)
      end
    end

    def to_time(value)
      case value
      when Time then value
      when DateTime then value.to_time
      when Date then Time.utc(value.year, value.month, value.day)
      when String then Time.parse(value)
      end
    end

    # The sunlit part of the disc: one limb arc, then the terminator, which is
    # half an ellipse whose width is how far round the cycle the moon has come.
    # At new there is nothing lit; at full the whole disc is. Between, the
    # ellipse narrows to a line at the quarters and the sweep flags decide
    # which side is lit and whether the shape bulges or is bitten into.
    def lit_path(p)
      r = 80
      top = '100,20'
      bottom = '100,180'
      c = Math.cos(2 * Math::PI * p)
      rx = format('%.2f', c.abs * r)

      return '' if p < 0.0034 || p > 0.9966
      if (p - 0.5).abs < 0.0034
        return "M #{top} A #{r},#{r} 0 1 1 #{bottom} A #{r},#{r} 0 1 1 #{top}"
      end

      waxing = p < 0.5
      limb_sweep = waxing ? 1 : 0
      term_sweep = waxing ? (c > 0 ? 0 : 1) : (c > 0 ? 1 : 0)
      "M #{top} A #{r},#{r} 0 0 #{limb_sweep} #{bottom} A #{rx},#{r} 0 0 #{term_sweep} #{top}"
    end
  end
end

Liquid::Template.register_filter(Jekyll::MoonFilter)
