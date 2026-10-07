/* The Sun and The Stars share the observer, clock and direction labels.
   No requests: both instruments keep their calculations on the device. */
(function(){
  "use strict";
  var A = window.OLAE_ASTRO, O = window.OLAE_OBSERVER, C = O.city;
  var starsPage = document.body.getAttribute("data-sky-tool") === "stars";
  var $ = function(id){ return document.getElementById(id); };
  var NS = "http://www.w3.org/2000/svg";
  var timeFmt = new Intl.DateTimeFormat("en-GB",{timeZone:C.tz,hour:"2-digit",minute:"2-digit"});
  var dateFmt = new Intl.DateTimeFormat("en-US",{timeZone:C.tz,month:"long",day:"numeric",year:"numeric"});
  function bearing(a){ return ["N","NE","E","SE","S","SW","W","NW"][Math.round(a/45)%8]; }
  /* A true minus sign rather than a hyphen in front of a negative number. */
  function signed(v,digits){ var s=Math.abs(v).toFixed(digits); return (v<0&&Number(s)!==0?"−":"")+s; }
  function svg(tag,attrs,parent,text){
    var el=document.createElementNS(NS,tag);
    Object.keys(attrs).forEach(function(k){el.setAttribute(k,attrs[k]);});
    if(text !== undefined) el.textContent=text;
    parent.appendChild(el); return el;
  }
  function localMinute(date){
    var p=new Date(date.getTime()+A.tzOffsetMs(C.tz,date));
    return p.getUTCHours()*60+p.getUTCMinutes();
  }
  /* Interpret wall-clock minutes in the selected city's zone. Re-read the
     offset at the target instant to include DST and fractional offsets. */
  function atMinute(date,minute){
    var day=A.dayOfYearLocal(date,C.tz);
    var wall=Date.UTC(day.y,day.mo,day.d,0,minute);
    var target=new Date(wall-A.tzOffsetMs(C.tz,date));
    return new Date(wall-A.tzOffsetMs(C.tz,target));
  }
  function row(parent,name,detail,value){
    var el=document.createElement("div");el.className="object-row";
    var left=document.createElement("span");left.textContent=name;
    if(detail){var small=document.createElement("small");small.textContent=detail;left.appendChild(small);}
    var right=document.createElement("span");right.className="bearing";right.textContent=value;
    el.append(left,right);parent.appendChild(el);
  }
  function empty(parent,text){var p=document.createElement("p");p.className="empty";p.textContent=text;parent.appendChild(p);}
  $("city").value=O.key;
  $("city").addEventListener("change",function(){
    var url=new URL(location.href);
    if(this.value)url.searchParams.set("city",this.value);else url.searchParams.delete("city");
    location.assign(url.href);
  });
  var latTxt=Math.abs(C.lat).toFixed(1)+"°"+(C.lat>=0?"N":"S"),lngTxt=Math.abs(C.lng).toFixed(1)+"°"+(C.lng>=0?"E":"W");
  $("place").textContent=O.nominal
    ? C.name+" · a nominal point at "+latTxt+" "+lngTxt+" · choose a city for local positions"
    : C.name+" · "+latTxt+" "+lngTxt;

  function drawSun(now,pos){
    $("height").replaceChildren(document.createTextNode(signed(pos.altitude,1)));
    var deg=document.createElement("span");deg.textContent="°";$("height").appendChild(deg);
    var rising=A.sunAltitude(new Date(now.getTime()+60000),C.lat,C.lng)>pos.altitude;
    $("sun-status").textContent=(pos.altitude>=0?"Above the horizon":"Below the horizon")+" · "+(rising?"climbing":"descending");
    $("direction").textContent=Math.abs(pos.altitude)>89.5 ? (pos.altitude>0?"Overhead":"Below you") : Math.round(pos.azimuth)%360+"° "+bearing(pos.azimuth);
    var day=A.dayOfYearLocal(now,C.tz);
    var rise=A.sunEvent(day,true,90.833,C.lat,C.lng,C.tz);
    var set=A.sunEvent(day,false,90.833,C.lat,C.lng,C.tz);
    $("sunrise").textContent=rise?timeFmt.format(rise):"No sunrise today";
    $("sunset").textContent=set?timeFmt.format(set):"No sunset today";
    if(rise&&set){var mins=Math.round((set-rise)/60000);$("daylight").textContent=Math.floor(mins/60)+"h "+mins%60+"m";}
    else{$("daylight").textContent=A.sunAltitude(atMinute(now,720),C.lat,C.lng)>0?"24 hours":"0 hours";}
    var chart=$("sun-chart");chart.replaceChildren();
    svg("title",{},chart,"The sun’s height in "+C.name+" throughout "+dateFmt.format(now));
    var x=function(m){return 52+m/1440*742;},y=function(h){return 125-h/90*96;};
    [-90,0,90].forEach(function(h){svg("line",{x1:52,x2:794,y1:y(h),y2:y(h),class:"axis"},chart);svg("text",{x:42,y:y(h)+5,"text-anchor":"end"},chart,signed(h,0)+"°");});
    [0,360,720,1080,1440].forEach(function(m){svg("text",{x:x(m),y:253,"text-anchor":m===0?"start":m===1440?"end":"middle"},chart,String(Math.floor(m/60)).padStart(2,"0")+":00");});
    /* The day in ten-minute steps, split where the sun crosses the horizon:
       each part is one path, so the part below keeps an even dash. */
    var runs=[],run=null,prev=null;
    for(var m=0;m<=1440;m+=10){
      var p=[m,A.sunAltitude(atMinute(now,m),C.lat,C.lng)],below=p[1]<0;
      if(run&&run.below!==below){
        var cross=[prev[0]+10*prev[1]/(prev[1]-p[1]),0];
        run.points.push(cross);runs.push(run);run={below:below,points:[cross]};
      }
      if(!run)run={below:below,points:[]};
      run.points.push(p);prev=p;
    }
    runs.push(run);
    runs.forEach(function(r){
      svg("path",{d:"M"+r.points.map(function(q){return x(q[0]).toFixed(1)+","+y(q[1]).toFixed(1);}).join(" L"),class:"sun-path"+(r.below?" below":"")},chart);
    });
    svg("circle",{cx:x(localMinute(now)),cy:y(pos.altitude),r:window.innerWidth<=650?12:6,class:"sun-marker"},chart);
    chart.setAttribute("aria-label","Sun height "+signed(pos.altitude,1)+" degrees now; today's path in "+C.name);
  }

  /* ---- The Stars: the map itself is js/sky-map.js ------------------- */
  function inHours(ms){
    var m=Math.max(1,Math.round(ms/60000)),h=Math.floor(m/60);
    return "in "+(h?h+" h":"")+(h&&m%60?" ":"")+(m%60?m%60+" min":"");
  }

  function drawStars(now,target){
    var M=window.OLAE_SKYMAP,phone=window.innerWidth<=650;
    var s=M.sky(now,C.lat,C.lng),chosen=M.constellations(s,6);
    M.draw($("sky-map"),s,{fs:phone?24:15,k:phone?1.35:1,starLabels:8,names:chosen,title:"Stars and planets over "+C.name+" at "+timeFmt.format(now)});
    var list=$("planets");list.replaceChildren();
    if(s.moon.alt>0)row(list,"The Moon",s.moon.phase.name.charAt(0).toUpperCase()+s.moon.phase.name.slice(1)+", "+Math.round(s.moon.phase.lit*100)+"% lit",Math.round(s.moon.alt)+"° "+M.bearing(s.moon.az));
    s.planets.forEach(function(p){row(list,p.body,p.glare?"Close to the sun’s glare":"",Math.round(p.alt)+"° "+M.bearing(p.az));});
    if(!list.children.length)empty(list,"Neither the moon nor any of the five bright planets is above the horizon at this time.");
    var cons=$("constellations");cons.replaceChildren();
    chosen.forEach(function(c){row(cons,c.name,c.star,Math.round(c.alt)+"° "+M.bearing(c.az));});
    if(!chosen.length)empty(cons,"No bright constellation stands high enough to find at this time.");
    var climbing=A.sunAltitude(new Date(now.getTime()+600000),C.lat,C.lng)>A.sunAltitude(now,C.lat,C.lng);
    $("sky-notice").textContent=s.sun.alt>=0?"Daylight. The stars are still there, hidden by the bright sky."
      :s.sun.alt>-12?(climbing?"Twilight. The sky is brightening, and the faint stars go first.":"Twilight. The brightest stars and planets appear first as the sky darkens.")
      :"Night. Clouds, moonlight and city lights still affect what you can see.";
    var ahead=target?Math.max(0,Math.round((target-Date.now())/600000)*10):0;
    $("hour").value=ahead;
    $("hour").setAttribute("aria-valuetext",timeFmt.format(now)+(target?", "+inHours(target-Date.now()):", now"));
    $("chosen-time").textContent=timeFmt.format(now);
    $("live").setAttribute("aria-pressed",String(!target));
    $("sky-map").setAttribute("aria-label",s.visible.length+" stars"+(s.moon.alt>0?", the moon":"")+" and "+s.planets.length+" planets above the horizon over "+C.name+" at "+timeFmt.format(now));
  }

  /* A chosen moment stays put while the clock runs on; once the clock
     reaches it, the page is live again. */
  var target=null;
  function render(){
    if(target&&target<=Date.now())target=null;
    var now=target?new Date(target):new Date();
    $("moment").textContent=dateFmt.format(now)+" · "+timeFmt.format(now)+" · "+(target?inHours(target-Date.now()):"now");
    if(starsPage)drawStars(now,target);else drawSun(now,A.sunPosition(now,C.lat,C.lng));
  }
  if(starsPage){
    $("hour").addEventListener("input",function(){
      var ahead=Number(this.value);
      target=ahead?Math.round((Date.now()+ahead*60000)/300000)*300000:null;
      render();
    });
    $("live").addEventListener("click",function(){target=null;render();});
  }
  render();setInterval(function(){if(!document.hidden)render();},30000);
  document.addEventListener("visibilitychange",function(){if(!document.hidden)render();});

  /* Fullscreen, as on /moon/: the notes step aside and the chrome waits
     for the pointer. Where the browser refuses, the page goes immersive
     on its own and Escape brings it back. */
  var docEl=document.documentElement,fakeFs=false,chromeTimer;
  function nativeFs(){return document.fullscreenElement||document.webkitFullscreenElement||null;}
  function pokeChrome(){
    document.body.classList.add("show-chrome");
    clearTimeout(chromeTimer);
    chromeTimer=setTimeout(function(){document.body.classList.remove("show-chrome");},2800);
  }
  function syncImmersive(){
    var on=!!nativeFs()||fakeFs;
    document.body.classList.toggle("immersive",on);
    if(on)pokeChrome();
  }
  $("fsBtn").addEventListener("click",function(){
    if(nativeFs()){var exit=document.exitFullscreen||document.webkitExitFullscreen;if(exit)try{exit.call(document);}catch(e){}return;}
    if(fakeFs){fakeFs=false;syncImmersive();return;}
    var enter=docEl.requestFullscreen||docEl.webkitRequestFullscreen,ok=false;
    if(enter)try{var r=enter.call(docEl);ok=true;if(r&&r.catch)r.catch(function(){fakeFs=true;syncImmersive();});}catch(e){}
    if(!ok){fakeFs=true;syncImmersive();}
  });
  document.addEventListener("fullscreenchange",syncImmersive);
  document.addEventListener("webkitfullscreenchange",syncImmersive);
  document.addEventListener("keydown",function(e){if(e.key==="Escape"&&fakeFs){fakeFs=false;syncImmersive();}});
  ["mousemove","touchstart","keydown"].forEach(function(ev){
    document.addEventListener(ev,function(){if(document.body.classList.contains("immersive"))pokeChrome();});
  });
})();
