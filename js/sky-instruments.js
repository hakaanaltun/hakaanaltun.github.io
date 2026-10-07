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
  var PHASES = ["new moon","waxing crescent","first quarter","waxing gibbous","full moon","waning gibbous","last quarter","waning crescent"];
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
  function moonPhase(now){
    var lun=A.lunation(now),age=(lun-Math.floor(lun))*A.SYNODIC;
    return {age:age,lit:(1-Math.cos(2*Math.PI*age/A.SYNODIC))/2,name:PHASES[A.moonPhaseIndex(age)]};
  }
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

  /* ---- The Stars ------------------------------------------------------ */
  var E=window.Astronomy;
  /* Each star: [HR, RA hours, Dec degrees, magnitude, designation, name].
     A null magnitude is a variable star kept only for a line through it. */
  var STARS=starsPage?window.OLAE_STARS.map(function(s){return {hr:s[0],ra:s[1],dec:s[2],mag:s[3],designation:s[4],name:s[5]||""};}):[];
  var BY_HR=Object.create(null);STARS.forEach(function(s){BY_HR[s.hr]=s;});
  var CON_NAMES={Bootes:"Boötes"};   /* Astronomy Engine spells it without the diaeresis */
  var CX=300,CY=300,R=260;
  function point(alt,az){var r=(90-alt)/90*R,t=az*Math.PI/180;return {x:CX-r*Math.sin(t),y:CY-r*Math.cos(t)};}
  /* Which way the sun lies from the moon on the map: a degree along the
     great circle between them, so the map's stretching cannot bend it. */
  function unit(alt,az){var a=alt*Math.PI/180,z=az*Math.PI/180;return [Math.cos(a)*Math.cos(z),Math.cos(a)*Math.sin(z),Math.sin(a)];}
  function toward(from,to){
    var f=unit(from.alt,from.az),t=unit(to.alt,to.az),d=f[0]*t[0]+f[1]*t[1]+f[2]*t[2];
    var g=[t[0]-d*f[0],t[1]-d*f[1],t[2]-d*f[2]],n=Math.hypot(g[0],g[1],g[2])||1,s=Math.sin(Math.PI/180),c=Math.cos(Math.PI/180);
    var p=[f[0]*c+g[0]/n*s,f[1]*c+g[1]/n*s,f[2]*c+g[2]/n*s];
    var a=point(from.alt,from.az),b=point(Math.asin(Math.max(-1,Math.min(1,p[2])))*180/Math.PI,Math.atan2(p[1],p[0])*180/Math.PI);
    return Math.atan2(b.y-a.y,b.x-a.x)*180/Math.PI;
  }
  /* The moon as /moon/ draws it, lit on the right, then turned to face the sun. */
  function moonIcon(parent,at,r,lit,angle){
    var g=svg("g",{transform:"translate("+at.x.toFixed(1)+" "+at.y.toFixed(1)+") rotate("+angle.toFixed(1)+")"},parent);
    svg("circle",{r:r,class:"moon-dark"},g);
    var rx=(r*Math.abs(1-2*lit)).toFixed(2);
    svg("path",{d:"M0 "+(-r)+"A"+r+" "+r+" 0 0 1 0 "+r+"A"+rx+" "+r+" 0 0 "+(lit>0.5?1:0)+" 0 "+(-r)+"Z",class:"moon-lit"},g);
    return g;
  }
  function inHours(ms){
    var m=Math.max(1,Math.round(ms/60000)),h=Math.floor(m/60);
    return "in "+(h?h+" h":"")+(h&&m%60?" ":"")+(m%60?m%60+" min":"");
  }

  function drawStars(now,target){
    var phone=window.innerWidth<=650,k=phone?1.35:1,fs=phone?24:15;
    var observer=new E.Observer(C.lat,C.lng,0),rot=E.Rotation_EQJ_HOR(now,observer);
    var map=$("sky-map");map.replaceChildren();
    svg("title",{},map,"Stars and planets over "+C.name+" at "+timeFmt.format(now));
    svg("circle",{cx:CX,cy:CY,r:R,class:"sky-disc"},map);
    [R,R*2/3,R/3].forEach(function(r){svg("circle",{cx:CX,cy:CY,r:r,class:"grid"},map);});
    svg("line",{x1:CX,y1:CY-R,x2:CX,y2:CY+R,class:"grid"},map);
    svg("line",{x1:CX-R,y1:CY,x2:CX+R,y2:CY,class:"grid"},map);
    var boxes=[];
    [["N",300,25],["E",20,305],["S",300,585],["W",580,305]].forEach(function(c){
      svg("text",{x:c[1],y:c[2],"text-anchor":"middle",class:"cardinal"},map,c[0]);
      boxes.push({x:c[1]-fs*.6,y:c[2]-fs,w:fs*1.2,h:fs*1.2});
    });
    /* Where every star stands, below the horizon too, for the lines. */
    var at=Object.create(null),visible=[];
    STARS.forEach(function(s){
      var h=E.HorizonFromVector(E.RotateVector(rot,E.VectorFromSphere(new E.Spherical(s.dec,s.ra*15,1),now)),"normal");
      var p=point(h.lat,h.lon),v={s:s,alt:h.lat,az:h.lon,x:p.x,y:p.y};
      at[s.hr]=v;
      if(h.lat>0&&s.mag!==null)visible.push(v);
    });
    /* The figures: a segment is drawn while both of its stars are up. */
    var d="";
    Object.keys(window.OLAE_CONSTELLATION_LINES).forEach(function(con){
      window.OLAE_CONSTELLATION_LINES[con].forEach(function(chain){
        for(var i=1;i<chain.length;i++){
          var a=at[chain[i-1]],b=at[chain[i]];
          if(a.alt>0&&b.alt>0)d+="M"+a.x.toFixed(1)+" "+a.y.toFixed(1)+"L"+b.x.toFixed(1)+" "+b.y.toFixed(1);
        }
      });
    });
    if(d)svg("path",{d:d,class:"constellation"},map);
    visible.sort(function(a,b){return a.s.mag-b.s.mag;});
    for(var i=visible.length-1;i>=0;i--){
      var v=visible[i],r=Math.max(.55,Math.min(3.7,1.35+.52*(3-v.s.mag)))*k;
      var dot=svg("circle",{cx:v.x.toFixed(1),cy:v.y.toFixed(1),r:r.toFixed(2),class:v.s.mag>3.5?"star faint":"star"},map);
      if(v.s.name||v.s.mag<=3)svg("title",{},dot,(v.s.name?v.s.name+" ("+v.s.designation+")":v.s.designation)+" · "+Math.round(v.alt)+"° "+bearing(v.az));
      if(v.s.mag<=2.5)boxes.push({x:v.x-r-1,y:v.y-r-1,w:2*r+2,h:2*r+2});
    }
    /* Labels: tried on each side in turn, never over another label or a
       bright dot. The moon, the sun and the planets always get theirs. */
    function label(text,x,y,r,cls,must){
      /* The width is a guess, so each label is anchored on the side nearest
         its dot: a wider word grows away from the dot, not over it. */
      var w=text.length*fs*.52+2,h=fs*1.05,g=3;
      /* r 0 is a name for a region rather than a dot: centred on it first. */
      var spots=r?[[x+r+g,y-h/2,"start"],[x-r-g-w,y-h/2,"end"],[x-w/2,y-r-g-h,"middle"],[x-w/2,y+r+g,"middle"],[x+r,y-r-h,"start"],[x-r-w,y-r-h,"end"],[x+r,y+r,"start"],[x-r-w,y+r,"end"]]
        :[[x-w/2,y-h/2,"middle"],[x-w/2,y-h*1.6,"middle"],[x-w/2,y+h*.6,"middle"]];
      function fits(b){return b.x>=2&&b.x+b.w<=598&&b.y>=2&&b.y+b.h<=598&&!boxes.some(function(o){return b.x<o.x+o.w&&b.x+b.w>o.x&&b.y<o.y+o.h&&b.y+b.h>o.y;});}
      var box=null;
      for(var j=0;j<spots.length&&!box;j++){var b={x:spots[j][0],y:spots[j][1],w:w,h:h,anchor:spots[j][2]};if(fits(b))box=b;}
      if(!box&&must)box={x:Math.max(2,Math.min(598-w,spots[0][0])),y:Math.max(2,Math.min(598-h,spots[0][1])),w:w,h:h,anchor:"start"};
      if(!box)return false;
      boxes.push(box);
      var tx=box.anchor==="start"?box.x:box.anchor==="end"?box.x+w:box.x+w/2;
      svg("text",{x:tx.toFixed(1),y:(box.y+h*.78).toFixed(1),"text-anchor":box.anchor,class:cls},map,text);
      return true;
    }
    var shown=[];
    var sunEq=E.Equator("Sun",now,observer,true,true),sunH=E.Horizon(now,observer,sunEq.ra,sunEq.dec,"normal");
    var sun={alt:sunH.altitude,az:sunH.azimuth};
    if(sun.alt>0){
      var sp=point(sun.alt,sun.az),sr=10*k;
      svg("circle",{cx:sp.x.toFixed(1),cy:sp.y.toFixed(1),r:(sr*2.2).toFixed(1),class:"sun-glow"},map);
      var sd=svg("circle",{cx:sp.x.toFixed(1),cy:sp.y.toFixed(1),r:sr,class:"sun"},map);
      svg("title",{},sd,"The sun · "+Math.round(sun.alt)+"° "+bearing(sun.az));
      boxes.push({x:sp.x-sr,y:sp.y-sr,w:2*sr,h:2*sr});
      shown.push(function(){label("Sun",sp.x,sp.y,sr,"sun-label",true);});
    }
    var list=$("planets");list.replaceChildren();var count=0;
    var moonEq=E.Equator("Moon",now,observer,true,true),moonH=E.Horizon(now,observer,moonEq.ra,moonEq.dec,"normal");
    if(moonH.altitude>0){
      var phase=moonPhase(now),mp=point(moonH.altitude,moonH.azimuth),mr=11*k;
      var mg=moonIcon(map,mp,mr,phase.lit,toward({alt:moonH.altitude,az:moonH.azimuth},sun));
      svg("title",{},mg,"The moon · "+phase.name+" · "+Math.round(moonH.altitude)+"° "+bearing(moonH.azimuth));
      boxes.push({x:mp.x-mr,y:mp.y-mr,w:2*mr,h:2*mr});
      shown.push(function(){label("Moon",mp.x,mp.y,mr,"moon-label",true);});
      row(list,"The Moon",phase.name.charAt(0).toUpperCase()+phase.name.slice(1)+", "+Math.round(phase.lit*100)+"% lit",Math.round(moonH.altitude)+"° "+bearing(moonH.azimuth));
    }
    ["Venus","Jupiter","Mars","Saturn","Mercury"].map(function(body){
      var eq=E.Equator(body,now,observer,true,true),h=E.Horizon(now,observer,eq.ra,eq.dec,"normal");
      return {body:body,alt:h.altitude,az:h.azimuth,mag:E.Illumination(body,now).mag};
    }).filter(function(p){return p.alt>0;}).sort(function(a,b){return a.mag-b.mag;}).forEach(function(p){
      count++;
      var pp=point(p.alt,p.az),pr=5*k;
      var dot=svg("circle",{cx:pp.x.toFixed(1),cy:pp.y.toFixed(1),r:pr,class:"planet"},map);
      svg("title",{},dot,p.body+" · "+Math.round(p.alt)+"° "+bearing(p.az));
      boxes.push({x:pp.x-pr,y:pp.y-pr,w:2*pr,h:2*pr});
      shown.push(function(){label(p.body,pp.x,pp.y,pr,"planet-label",true);});
      row(list,p.body,E.AngleFromSun(p.body,now)<15?"Close to the sun’s glare":"",Math.round(p.alt)+"° "+bearing(p.az));
    });
    if(!list.children.length)empty(list,"Neither the moon nor any of the five bright planets is above the horizon at this time.");
    shown.forEach(function(f){f();});
    var named=0;
    for(var n=0;n<visible.length&&named<8;n++){
      var vs=visible[n];
      if(vs.s.name&&vs.s.mag<=2.5&&label(vs.s.name,vs.x,vs.y,Math.max(.55,Math.min(3.7,1.35+.52*(3-vs.s.mag)))*k,"",false))named++;
    }
    /* The constellations worth finding: each named for its brightest star
       above the horizon, if that star is bright enough to lead the eye. */
    var regions=Object.create(null);
    visible.forEach(function(v){
      var con=v.s.con||(v.s.con=E.Constellation(v.s.ra,v.s.dec));
      if(!regions[con.symbol]||v.s.mag<regions[con.symbol].mag)regions[con.symbol]={symbol:con.symbol,name:CON_NAMES[con.name]||con.name,star:v.s.name||v.s.designation,mag:v.s.mag,alt:v.alt,az:v.az};
    });
    var chosen=Object.keys(regions).map(function(key){return regions[key];})
      .filter(function(c){return c.mag<=3&&c.alt>=10;}).sort(function(a,b){return b.alt-a.alt;}).slice(0,6);
    var cons=$("constellations");cons.replaceChildren();
    chosen.forEach(function(c){
      row(cons,c.name,c.star,Math.round(c.alt)+"° "+bearing(c.az));
      var sx=0,sy=0,sn=0;
      (window.OLAE_CONSTELLATION_LINES[c.symbol]||[]).forEach(function(chain){chain.forEach(function(hr){var a=at[hr];if(a.alt>0){sx+=a.x;sy+=a.y;sn++;}});});
      if(sn)label(c.name,sx/sn,sy/sn,0,"con-label",false);
    });
    if(!chosen.length)empty(cons,"No bright constellation stands high enough to find at this time.");
    var climbing=A.sunAltitude(new Date(now.getTime()+600000),C.lat,C.lng)>A.sunAltitude(now,C.lat,C.lng);
    $("sky-notice").textContent=sun.alt>=0?"Daylight. The stars are still there, hidden by the bright sky."
      :sun.alt>-12?(climbing?"Twilight. The sky is brightening, and the faint stars go first.":"Twilight. The brightest stars and planets appear first as the sky darkens.")
      :"Night. Clouds, moonlight and city lights still affect what you can see.";
    var ahead=target?Math.max(0,Math.round((target-Date.now())/600000)*10):0;
    $("hour").value=ahead;
    $("hour").setAttribute("aria-valuetext",timeFmt.format(now)+(target?", "+inHours(target-Date.now()):", now"));
    $("chosen-time").textContent=timeFmt.format(now);
    $("live").setAttribute("aria-pressed",String(!target));
    map.setAttribute("aria-label",visible.length+" stars"+(moonH.altitude>0?", the moon":"")+" and "+count+" planets above the horizon over "+C.name+" at "+timeFmt.format(now));
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
})();
