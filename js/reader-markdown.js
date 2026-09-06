/* Markdown for The Reader. Marked 18.0.11 supplies tokens only; document
   content never enters an HTML parser. Keep the renderer's element and
   attribute choices here, independent of raw HTML or token attributes. */
(function(root){
  "use strict";
  function render(source, doc, lexer){
    var section = doc.createElement("section");
    section.id = "s0";
    var toc = [], anchors = new Map(), pending = [], used = new Set();
    var budget = 100000, decoder = doc.createElement("textarea");
    function entities(text){
      return String(text || "").replace(/&(?:#[xX][\da-fA-F]+|#\d+|[a-zA-Z][a-zA-Z\d]*);/g, function(entity){
        /* Only a single entity reaches this inert textarea, never markup. */
        decoder.innerHTML = entity;
        return decoder.value;
      });
    }
    function text(parent, value){ parent.appendChild(doc.createTextNode(value || "")); }
    function element(parent, tag){
      if(--budget < 0) throw Error("Markdown has too many elements");
      var el = doc.createElement(tag); parent.appendChild(el); return el;
    }
    function walk(tokens, parent, depth){
      if(depth > 64) throw Error("Markdown is nested too deeply");
      (tokens || []).forEach(function(t){
        if(--budget < 0) throw Error("Markdown has too many tokens");
        var el, href, slug, base, n;
        switch(t.type){
          case "space": break;
          case "heading":
            el = element(parent, "h" + Math.max(1, Math.min(6, t.depth)));
            walk(t.tokens, el, depth + 1);
            base = el.textContent.normalize("NFC").toLowerCase().replace(/[^\p{L}\p{N}_\-\s]/gu, "").trim().replace(/\s+/g, "-") || "section";
            slug = base; n = 0;
            while(used.has(slug)) slug = base + "-" + (++n);
            used.add(slug); el.id = "md-" + slug; anchors.set(slug, el.id);
            toc.push({label:el.textContent, sec:0, frag:el.id, lvl:t.depth > 1 ? 2 : 1});
            break;
          case "paragraph": case "blockquote": case "em": case "strong": case "del":
            el = element(parent, t.type === "paragraph" ? "p" : t.type);
            walk(t.tokens, el, depth + 1); break;
          case "list":
            el = element(parent, t.ordered ? "ol" : "ul");
            if(t.ordered && Number.isSafeInteger(t.start)) el.setAttribute("start", String(t.start));
            t.items.forEach(function(item){ walk(item.tokens, element(el, "li"), depth + 1); });
            break;
          case "checkbox":
            el = element(parent, "span");
            el.setAttribute("role", "img"); el.setAttribute("aria-label", t.checked ? "Completed" : "Not completed");
            text(el, t.checked ? "☑ " : "☐ "); break;
          case "hr": case "br": element(parent, t.type); break;
          case "code": case "codespan":
            el = t.type === "code" ? element(parent, "pre") : parent;
            text(element(el, "code"), t.text); break;
          case "link":
            el = element(parent, "a"); walk(t.tokens, el, depth + 1);
            href = entities(t.href).trim();
            if(href.charAt(0) === "#"){
              try{ pending.push({el:el, slug:decodeURIComponent(href.slice(1))}); }catch(e){}
            } else if(!/[\u0000-\u0020\u007f]/.test(href) && /^(https?:\/\/|mailto:)/i.test(href)){
              try{
                var url = new URL(href);
                if(["https:", "http:", "mailto:"].indexOf(url.protocol) !== -1){
                  el.setAttribute("href", url.href); el.setAttribute("target", "_blank");
                  el.setAttribute("rel", "noopener noreferrer");
                }
              }catch(e){}
            }
            break;
          case "image":
            /* A local Markdown file cannot grant access to sibling images.
               Alt text also avoids fetching remote tracking images. */
            text(element(parent, "em"), entities(t.text) || "[Image]"); break;
          case "table":
            el = element(parent, "table");
            var head = element(element(el, "thead"), "tr");
            t.header.forEach(function(cell){ walk(cell.tokens, element(head, "th"), depth + 1); });
            var body = element(el, "tbody");
            t.rows.forEach(function(row){
              var tr = element(body, "tr");
              row.forEach(function(cell){ walk(cell.tokens, element(tr, "td"), depth + 1); });
            });
            break;
          case "text":
            if(t.tokens) walk(t.tokens, parent, depth + 1);
            else text(parent, entities(t.text));
            break;
          case "html":
            /* Raw HTML is displayed as text, never executed. */
            text(parent, t.text || t.raw); break;
          case "escape": text(parent, t.text); break;
          default: text(parent, t.raw || t.text);
        }
      });
    }
    walk(lexer(source.replace(/^\uFEFF/, ""), {gfm:true, breaks:false}), section, 0);
    pending.forEach(function(link){
      var id = anchors.get(link.slug);
      if(!id) return;
      link.el.setAttribute("href", "#" + id);
      link.el.setAttribute("data-sec", "0"); link.el.setAttribute("data-frag", id);
    });
    return {section:section, toc:toc};
  }
  root.OLAE_MARKDOWN = {render:render};
})(typeof window === "undefined" ? module.exports : window);
