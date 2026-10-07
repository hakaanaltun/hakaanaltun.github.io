/* The sky as /stars/ draws it, shared with the homepage's Tonight and the
   window in The House: where the stars, the moon, the sun and the planets
   stand for a place and a moment, and the map that shows them. It needs
   Astronomy Engine, js/astronomy.js for the moon's phase, and for the stars
   js/bright-stars.js. It asks nothing of the network and keeps nothing. */
(function(){
  "use strict";
  var NS="http://www.w3.org/2000/svg";
  var PHASES=["new moon","waxing crescent","first quarter","waxing gibbous","full moon","waning gibbous","last quarter","waning crescent"];
  var COMPASS=["north","northeast","east","southeast","south","southwest","west","northwest"];
  var PLANETS=["Venus","Jupiter","Mars","Saturn","Mercury"];
  var CON_NAMES={Bootes:"Boötes"};   /* Astronomy Engine spells it without the diaeresis */
  var CX=300,CY=300,R=260;
  function bearing(a){return ["N","NE","E","SE","S","SW","W","NW"][Math.round(a/45)%8];}
  /* Where to look, in words: "low in the east", "high in the south". */
  function where(alt,az){
    if(alt>=80)return "overhead";
    return (alt<15?"low in the ":alt>=60?"high in the ":"in the ")+COMPASS[Math.round(az/45)%8];
  }
  function svg(tag,attrs,parent,text){
    var el=document.createElementNS(NS,tag);
    Object.keys(attrs).forEach(function(k){el.setAttribute(k,attrs[k]);});
    if(text!==undefined)el.textContent=text;
    parent.appendChild(el);return el;
  }
  /* Looking up: north at the top, east on the left, the zenith in the middle. */
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
  /* The phase in the words and the arithmetic of /moon/, The House and the
     homepage, so every page gives the same moon. */
  function moonPhase(now){
    var A=window.OLAE_ASTRO,lun=A.lunation(now),age=(lun-Math.floor(lun))*A.SYNODIC;
    return {age:age,lit:(1-Math.cos(2*Math.PI*age/A.SYNODIC))/2,name:PHASES[A.moonPhaseIndex(age)]};
  }
  function horizon(E,observer,now,body){
    var eq=E.Equator(body,now,observer,true,true);
    return E.Horizon(now,observer,eq.ra,eq.dec,"normal");
  }
  /* The five planets the eye can find, brightest first, wherever they are. */
  function planets(now,lat,lng){
    var E=window.Astronomy,observer=new E.Observer(lat,lng,0);
    return PLANETS.map(function(body){
      var h=horizon(E,observer,now,body);
      return {body:body,alt:h.altitude,az:h.azimuth,mag:E.Illumination(body,now).mag,glare:E.AngleFromSun(body,now)<15};
    }).sort(function(a,b){return a.mag-b.mag;});
  }
  var STARS=null;
  function stars(){
    /* Each star: [HR, RA hours, Dec degrees, magnitude, designation, name].
       A null magnitude is a variable star kept only for a line through it. */
    if(!STARS)STARS=window.OLAE_STARS.map(function(s){return {hr:s[0],ra:s[1],dec:s[2],mag:s[3],designation:s[4],name:s[5]||""};});
    return STARS;
  }
  function sky(now,lat,lng){
    var E=window.Astronomy,observer=new E.Observer(lat,lng,0),rot=E.Rotation_EQJ_HOR(now,observer);
    var at=Object.create(null),visible=[];
    /* Where every star stands, below the horizon too, for the lines. */
    stars().forEach(function(s){
      var h=E.HorizonFromVector(E.RotateVector(rot,E.VectorFromSphere(new E.Spherical(s.dec,s.ra*15,1),now)),"normal");
      var p=point(h.lat,h.lon),v={s:s,alt:h.lat,az:h.lon,x:p.x,y:p.y};
      at[s.hr]=v;
      if(h.lat>0&&s.mag!==null)visible.push(v);
    });
    visible.sort(function(a,b){return a.s.mag-b.s.mag;});
    var sun=horizon(E,observer,now,"Sun"),moon=horizon(E,observer,now,"Moon");
    return {now:now,at:at,visible:visible,
      sun:{alt:sun.altitude,az:sun.azimuth},
      moon:{alt:moon.altitude,az:moon.azimuth,phase:moonPhase(now)},
      planets:planets(now,lat,lng).filter(function(p){return p.alt>0;})};
  }
  /* The constellations worth finding: each named for its brightest star
     above the horizon, if that star is bright enough to lead the eye. */
  function constellations(s,n){
    var E=window.Astronomy,regions=Object.create(null);
    s.visible.forEach(function(v){
      var con=v.s.con||(v.s.con=E.Constellation(v.s.ra,v.s.dec));
      if(!regions[con.symbol]||v.s.mag<regions[con.symbol].mag)regions[con.symbol]={symbol:con.symbol,name:CON_NAMES[con.name]||con.name,star:v.s.name||v.s.designation,mag:v.s.mag,alt:v.alt,az:v.az};
    });
    return Object.keys(regions).map(function(key){return regions[key];})
      .filter(function(c){return c.mag<=3&&c.alt>=10;}).sort(function(a,b){return b.alt-a.alt;}).slice(0,n);
  }
  function starRadius(mag,k){return Math.max(.55,Math.min(3.7,1.35+.52*(3-mag)))*k;}

  /* o: fs, the label size in map units; k, how much to enlarge the dots;
     starLabels, how many bright stars to name; names, constellations to
     write on the map; title. */
  function draw(map,s,o){
    var fs=o.fs,k=o.k;
    map.replaceChildren();
    svg("title",{},map,o.title);
    svg("circle",{cx:CX,cy:CY,r:R,class:"sky-disc"},map);
    [R,R*2/3,R/3].forEach(function(r){svg("circle",{cx:CX,cy:CY,r:r,class:"grid"},map);});
    svg("line",{x1:CX,y1:CY-R,x2:CX,y2:CY+R,class:"grid"},map);
    svg("line",{x1:CX-R,y1:CY,x2:CX+R,y2:CY,class:"grid"},map);
    var boxes=[];
    [["N",300,25],["E",20,305],["S",300,585],["W",580,305]].forEach(function(c){
      svg("text",{x:c[1],y:c[2],"text-anchor":"middle",class:"cardinal"},map,c[0]);
      boxes.push({x:c[1]-fs*.6,y:c[2]-fs,w:fs*1.2,h:fs*1.2});
    });
    /* The figures: a segment is drawn while both of its stars are up. */
    var d="",lines=window.OLAE_CONSTELLATION_LINES;
    Object.keys(lines).forEach(function(con){
      lines[con].forEach(function(chain){
        for(var i=1;i<chain.length;i++){
          var a=s.at[chain[i-1]],b=s.at[chain[i]];
          if(a.alt>0&&b.alt>0)d+="M"+a.x.toFixed(1)+" "+a.y.toFixed(1)+"L"+b.x.toFixed(1)+" "+b.y.toFixed(1);
        }
      });
    });
    if(d)svg("path",{d:d,class:"constellation"},map);
    for(var i=s.visible.length-1;i>=0;i--){
      var v=s.visible[i],r=starRadius(v.s.mag,k);
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
    if(s.sun.alt>0){
      var sp=point(s.sun.alt,s.sun.az),sr=10*k;
      svg("circle",{cx:sp.x.toFixed(1),cy:sp.y.toFixed(1),r:(sr*2.2).toFixed(1),class:"sun-glow"},map);
      var sd=svg("circle",{cx:sp.x.toFixed(1),cy:sp.y.toFixed(1),r:sr,class:"sun"},map);
      svg("title",{},sd,"The sun · "+Math.round(s.sun.alt)+"° "+bearing(s.sun.az));
      boxes.push({x:sp.x-sr,y:sp.y-sr,w:2*sr,h:2*sr});
      shown.push(function(){label("Sun",sp.x,sp.y,sr,"sun-label",true);});
    }
    if(s.moon.alt>0){
      var mp=point(s.moon.alt,s.moon.az),mr=11*k;
      var mg=moonIcon(map,mp,mr,s.moon.phase.lit,toward(s.moon,s.sun));
      svg("title",{},mg,"The moon · "+s.moon.phase.name+" · "+Math.round(s.moon.alt)+"° "+bearing(s.moon.az));
      boxes.push({x:mp.x-mr,y:mp.y-mr,w:2*mr,h:2*mr});
      shown.push(function(){label("Moon",mp.x,mp.y,mr,"moon-label",true);});
    }
    s.planets.forEach(function(p){
      var pp=point(p.alt,p.az),pr=5*k;
      var dot=svg("circle",{cx:pp.x.toFixed(1),cy:pp.y.toFixed(1),r:pr,class:"planet"},map);
      svg("title",{},dot,p.body+" · "+Math.round(p.alt)+"° "+bearing(p.az));
      boxes.push({x:pp.x-pr,y:pp.y-pr,w:2*pr,h:2*pr});
      shown.push(function(){label(p.body,pp.x,pp.y,pr,"planet-label",true);});
    });
    shown.forEach(function(f){f();});
    var named=0;
    for(var n=0;n<s.visible.length&&named<o.starLabels;n++){
      var vs=s.visible[n];
      if(vs.s.name&&vs.s.mag<=2.5&&label(vs.s.name,vs.x,vs.y,starRadius(vs.s.mag,k),"",false))named++;
    }
    (o.names||[]).forEach(function(c){
      var sx=0,sy=0,sn=0;
      (lines[c.symbol]||[]).forEach(function(chain){chain.forEach(function(hr){var a=s.at[hr];if(a.alt>0){sx+=a.x;sy+=a.y;sn++;}});});
      if(sn)label(c.name,sx/sn,sy/sn,0,"con-label",false);
    });
  }

  window.OLAE_SKYMAP={PHASES:PHASES,bearing:bearing,where:where,moonPhase:moonPhase,planets:planets,sky:sky,constellations:constellations,draw:draw};
})();
