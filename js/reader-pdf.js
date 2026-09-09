/* PDF.js is fetched, checksum-verified and self-hosted by the Pages build.
   Documents stay in memory. Only the visible page is rendered. */
(function(){
  "use strict";
  var libPromise;
  var ROOT = "/js/vendor/pdfjs/";
  function library(){
    if(!libPromise) libPromise = import(ROOT + "build/pdf.mjs").then(function(lib){
      lib.GlobalWorkerOptions.workerSrc = ROOT + "build/pdf.worker.mjs";
      return lib;
    }).catch(function(){
      libPromise = null;
      throw Error("The PDF reader could not load. Reconnect and open the file again.");
    });
    return libPromise;
  }
  async function prepare(file, alive, onTask){
    var lib = await library();
    if(!alive()) return null;
    var bytes = await file.arrayBuffer();
    if(!alive()) return null;
    var task = lib.getDocument({
      data: new Uint8Array(bytes), isEvalSupported: false, enableXfa: false,
      cMapUrl: ROOT + "web/cmaps/", cMapPacked: true,
      standardFontDataUrl: ROOT + "web/standard_fonts/",
      wasmUrl: ROOT + "web/wasm/", maxImageSize: 32 * 1024 * 1024,
      canvasMaxAreaInBytes: 32 * 1024 * 1024
    });
    onTask(task);
    try{
      var doc = await task.promise;
      if(!alive()){ await task.destroy(); return null; }
      return {lib:lib, doc:doc, task:task};
    }catch(error){
      await task.destroy().catch(function(){});
      if(error.name === "PasswordException") throw Error("This PDF needs a password. Open an unlocked copy here.");
      throw Error("That PDF could not be read. It may be damaged or unsupported.");
    }
  }
  function mount(prepared, host, initialPage, onPage){
    var lib = prepared.lib, doc = prepared.doc;
    var pageNumber = Math.max(1, Math.min(doc.numPages, Math.round(initialPage) || 1));
    var zoom = "fit", generation = 0, dead = false, renderTask, textTask, resizeTimer;
    var lastPage = null;
    var wrap = document.createElement("div");
    wrap.className = "pdf-reader";
    wrap.innerHTML = '<div class="pdf-toolbar" role="group" aria-label="PDF pages and zoom">' +
      '<button type="button" class="shelf-pill" data-pdf="prev" aria-label="Previous page">←</button>' +
      '<label class="pdf-page-label">Page <input data-pdf="page" type="number" min="1" inputmode="numeric" aria-label="Page number"></label>' +
      '<span data-pdf="total"></span>' +
      '<button type="button" class="shelf-pill" data-pdf="next" aria-label="Next page">→</button>' +
      '<select data-pdf="zoom" aria-label="PDF zoom"><option value="fit">Fit width</option><option value="1">100%</option><option value="1.5">150%</option><option value="2">200%</option><option value="3">300%</option></select>' +
      '</div><p class="pdf-status" role="status" aria-live="polite"></p>' +
      '<div class="pdf-scroll" tabindex="0" role="region" aria-label="PDF page; scroll sideways when zoomed"><div class="pdf-page"></div></div>';
    host.appendChild(wrap);
    var prev = wrap.querySelector('[data-pdf="prev"]'), next = wrap.querySelector('[data-pdf="next"]');
    var pageInput = wrap.querySelector('[data-pdf="page"]'), zoomInput = wrap.querySelector('[data-pdf="zoom"]');
    var status = wrap.querySelector(".pdf-status"), scroller = wrap.querySelector(".pdf-scroll");
    var surface = wrap.querySelector(".pdf-page");
    pageInput.max = String(doc.numPages);
    wrap.querySelector('[data-pdf="total"]').textContent = "of " + doc.numPages;
    function cancel(){
      if(renderTask){ renderTask.cancel(); renderTask = null; }
      if(textTask){ textTask.cancel(); textTask = null; }
    }
    async function draw(){
      var run = ++generation;
      cancel();
      pageInput.value = pageNumber;
      prev.disabled = pageNumber <= 1; next.disabled = pageNumber >= doc.numPages;
      status.textContent = "Loading page " + pageNumber + "…";
      surface.setAttribute("aria-busy", "true");
      surface.replaceChildren();
      try{
        var page = await doc.getPage(pageNumber);
        if(dead || run !== generation) return;
        if(lastPage && lastPage !== page) lastPage.cleanup();
        lastPage = page;
        var base = page.getViewport({scale:1});
        var scale = zoom === "fit" ? Math.max(1, scroller.clientWidth) / base.width : Number(zoom);
        var viewport = page.getViewport({scale:scale});
        // Bound both total pixels and either dimension for mobile canvases.
        var density = Math.min(window.devicePixelRatio || 1, 2,
          Math.sqrt(8 * 1024 * 1024 / (viewport.width * viewport.height)),
          8192 / viewport.width, 8192 / viewport.height);
        var canvas = document.createElement("canvas");
        canvas.setAttribute("aria-hidden", "true");
        canvas.width = Math.max(1, Math.floor(viewport.width * density));
        canvas.height = Math.max(1, Math.floor(viewport.height * density));
        canvas.style.width = viewport.width + "px"; canvas.style.height = viewport.height + "px";
        surface.style.width = viewport.width + "px"; surface.style.height = viewport.height + "px";
        surface.style.setProperty("--total-scale-factor", scale * (page.userUnit || 1));
        surface.style.setProperty("--scale-factor", scale);
        surface.setAttribute("role", "group");
        surface.setAttribute("aria-label", "Page " + pageNumber + " of " + doc.numPages);
        surface.appendChild(canvas);
        var rendering = page.render({canvasContext:canvas.getContext("2d"), viewport:viewport,
          transform:[density,0,0,density,0,0], background:"rgb(255,255,255)"});
        renderTask = rendering;
        await rendering.promise;
        if(dead || run !== generation) return;
        renderTask = null;
        var text = document.createElement("div"); text.className = "textLayer";
        surface.appendChild(text);
        var layer = new lib.TextLayer({textContentSource:page.streamTextContent(), container:text, viewport:viewport});
        textTask = layer;
        try{ await layer.render(); }catch(e){ if(run === generation) text.remove(); }
        if(dead || run !== generation) return;
        textTask = null;
        surface.setAttribute("aria-busy", "false");
        status.textContent = "Page " + pageNumber + " of " + doc.numPages;
      }catch(error){
        if(dead || run !== generation) return;
        surface.setAttribute("aria-busy", "false");
        status.textContent = "This page could not be displayed. Try another page or reopen the PDF.";
      }
    }
    function go(value){
      if(!Number.isFinite(value)){ pageInput.value = pageNumber; return; }
      pageNumber = Math.max(1, Math.min(doc.numPages, Math.round(value)));
      scroller.scrollLeft = 0;
      draw(); onPage();
      wrap.scrollIntoView({block:"start", behavior:"instant"});
    }
    prev.addEventListener("click", function(){ go(pageNumber - 1); });
    next.addEventListener("click", function(){ go(pageNumber + 1); });
    pageInput.addEventListener("change", function(){ go(pageInput.valueAsNumber); });
    pageInput.addEventListener("keydown", function(e){ if(e.key === "Enter"){ e.preventDefault(); go(pageInput.valueAsNumber); } });
    zoomInput.addEventListener("change", function(){ zoom = zoomInput.value; draw(); });
    scroller.addEventListener("keydown", function(e){
      if(e.target !== scroller || e.altKey || e.ctrlKey || e.metaKey) return;
      if(e.key === "PageDown" || e.key === "PageUp"){
        e.preventDefault(); go(pageNumber + (e.key === "PageDown" ? 1 : -1));
      }
    });
    var width = 0;
    var observer = new ResizeObserver(function(){
      if(!scroller.clientWidth || width === scroller.clientWidth) return;
      width = scroller.clientWidth;
      clearTimeout(resizeTimer);
      resizeTimer = setTimeout(function(){ if(!dead && zoom === "fit") draw(); }, 120);
    });
    observer.observe(scroller);
    draw();
    return {
      page:function(){ return pageNumber; },
      progress:function(){ return doc.numPages === 1 ? 1 : (pageNumber - 1) / (doc.numPages - 1); },
      destroy:function(){
        dead = true; generation++; cancel(); observer.disconnect(); clearTimeout(resizeTimer);
        wrap.remove(); prepared.task.destroy().catch(function(){});
      }
    };
  }
  window.OLAE_PDF = {prepare:prepare, mount:mount};
})();
