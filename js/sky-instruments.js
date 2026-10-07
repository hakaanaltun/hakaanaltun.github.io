/* The Sun and The Stars share the observer, clock and direction labels.
   No requests: both instruments keep their calculations on the device. */
(function(){
  "use strict";
  var A = window.OLAE_ASTRO, O = window.OLAE_OBSERVER, C = O.city;
  var starsPage = document.body.getAttribute("data-sky-tool") === "stars";
  var $ = function(id){ return document.getElementById(id); };
  var NS = "http://www.w3.org/2000/svg", live = true, chosenMinute = 0;
  var timeFmt = new Intl.DateTimeFormat("en-GB",{timeZone:C.tz,hour:"2-digit",minute:"2-digit"});
  var dateFmt = new Intl.DateTimeFormat("en-US",{timeZone:C.tz,month:"long",day:"numeric",year:"numeric"});
  function bearing(a){ return ["N","NE","E","SE","S","SW","W","NW"][Math.round(a/45)%8]; }
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
  $("place").textContent=C.name+(O.nominal ? " · nominal equatorial sky; choose a city for local positions" : " · city-center sky");

  function drawSun(now,pos){
    $("height").replaceChildren(document.createTextNode(pos.altitude.toFixed(1)));
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
    [-90,0,90].forEach(function(h){svg("line",{x1:52,x2:794,y1:y(h),y2:y(h),class:"axis"},chart);svg("text",{x:42,y:y(h)+5,"text-anchor":"end"},chart,h+"°");});
    [0,360,720,1080,1440].forEach(function(m){svg("text",{x:x(m),y:253,"text-anchor":m===0?"start":m===1440?"end":"middle"},chart,String(Math.floor(m/60)).padStart(2,"0")+":00");});
    /* Individual segments keep the horizon crossing continuous while giving
       the below-horizon section a different stroke. */
    for(var m=0;m<1440;m+=10){
      var a=A.sunAltitude(atMinute(now,m),C.lat,C.lng),b=A.sunAltitude(atMinute(now,m+10),C.lat,C.lng);
      if((a>=0)!==(b>=0)){
        var mid=m+10*a/(a-b);
        svg("path",{d:"M"+x(m)+","+y(a)+" L"+x(mid)+","+y(0),class:"sun-path"+(a<0?" below":"")},chart);
        svg("path",{d:"M"+x(mid)+","+y(0)+" L"+x(m+10)+","+y(b),class:"sun-path"+(b<0?" below":"")},chart);
      }else svg("path",{d:"M"+x(m)+","+y(a)+" L"+x(m+10)+","+y(b),class:"sun-path"+(a<0?" below":"")},chart);
    }
    svg("circle",{cx:x(localMinute(now)),cy:y(pos.altitude),r:6,class:"sun-marker"},chart);
    chart.setAttribute("aria-label","Sun height "+pos.altitude.toFixed(1)+" degrees now; today's path in "+C.name);
  }

  function drawStars(now){
    var E=window.Astronomy,observer=new E.Observer(C.lat,C.lng,0);
    var map=$("sky-map");map.replaceChildren();
    svg("title",{},map,"Bright stars and planets over "+C.name+" at "+timeFmt.format(now));
    [260,173.33,86.67].forEach(function(r){svg("circle",{cx:300,cy:300,r:r,class:"grid"},map);});
    svg("line",{x1:300,y1:40,x2:300,y2:560,class:"grid"},map);
    svg("line",{x1:40,y1:300,x2:560,y2:300,class:"grid"},map);
    [["N",300,25],["E",20,305],["S",300,585],["W",580,305]].forEach(function(c){svg("text",{x:c[1],y:c[2],"text-anchor":"middle",class:"cardinal"},map,c[0]);});
    function point(alt,az){var r=(90-alt)/90*260,t=az*Math.PI/180;return {x:300-r*Math.sin(t),y:300-r*Math.cos(t)};}
    var rot=E.Rotation_EQJ_HOR(now,observer),visible=[];
    window.OLAE_BRIGHT_STARS.forEach(function(s){
      var vec=E.VectorFromSphere(new E.Spherical(s.dec,s.ra*15,1),now);
      var h=E.HorizonFromVector(E.RotateVector(rot,vec),"normal");
      if(h.lat<=0)return;
      var p=point(h.lat,h.lon),name=s.name||s.designation;
      var dot=svg("circle",{cx:p.x,cy:p.y,r:Math.max(1.3,3.6-s.mag*.7),class:"star"},map);
      svg("title",{},dot,name+" · "+Math.round(h.lat)+"° "+bearing(h.lon));
      visible.push({star:s,name:name,alt:h.lat,az:h.lon,x:p.x,y:p.y});
    });
    var labels=[];
    function label(item,planet){
      var text=item.name,width=text.length*(window.innerWidth<=650?11.7:7.3)+8,x=item.x+8,y=item.y-7;
      if(x+width>560)x=item.x-width-8;
      y=Math.max(55,Math.min(548,y));
      var box={x:x,y:y-15,w:width,h:21};
      if(labels.some(function(b){return box.x<b.x+b.w&&box.x+box.w>b.x&&box.y<b.y+b.h&&box.y+box.h>b.y;}))return;
      labels.push(box);svg("text",{x:x,y:y,class:planet?"planet-label":""},map,text);
    }
    var planetList=$("planets");planetList.replaceChildren();var count=0;
    ["Mercury","Venus","Mars","Jupiter","Saturn"].forEach(function(body){
      var eq=E.Equator(body,now,observer,true,true),h=E.Horizon(now,observer,eq.ra,eq.dec,"normal");
      if(h.altitude<=0)return;count++;
      var p=point(h.altitude,h.azimuth),dot=svg("circle",{cx:p.x,cy:p.y,r:5,class:"planet"},map);
      var glare=E.AngleFromSun(body,now)<15;
      svg("title",{},dot,body+" · "+Math.round(h.altitude)+"° "+bearing(h.azimuth));
      label({name:body,x:p.x,y:p.y},true);
      row(planetList,body,glare?"Close to the sun’s glare":"",Math.round(h.altitude)+"° "+bearing(h.azimuth));
    });
    if(!count)empty(planetList,"None of the five bright planets is above the horizon at this time.");
    visible.sort(function(a,b){return a.star.mag-b.star.mag;});
    visible.filter(function(v){return v.star.name;}).slice(0,8).forEach(function(v){label(v,false);});
    var regions=Object.create(null);
    visible.forEach(function(v){
      var con=E.Constellation(v.star.ra,v.star.dec);
      if(!regions[con.symbol]||v.alt>regions[con.symbol].alt)regions[con.symbol]={name:con.name,star:v.name,alt:v.alt,az:v.az};
    });
    var constellations=$("constellations");constellations.replaceChildren();
    Object.keys(regions).map(function(k){return regions[k];}).sort(function(a,b){return b.alt-a.alt;}).slice(0,6).forEach(function(c){row(constellations,c.name,c.star,Math.round(c.alt)+"° "+bearing(c.az));});
    if(!visible.length)empty(constellations,"No stars from this bright-star selection are above the horizon.");
    var sun=A.sunAltitude(now,C.lat,C.lng);
    $("sky-notice").textContent=sun>=0?"Daylight. The map shows positions; most stars will be hidden by the bright sky.":sun>-12?"Twilight. The brightest stars appear first as the sky darkens.":"The sun is below the twilight sky. Clouds and local lights still affect the view.";
    $("hour").value=live?localMinute(now):chosenMinute;
    $("chosen-time").textContent=timeFmt.format(now);
    $("live").setAttribute("aria-pressed",String(live));
    map.setAttribute("aria-label",visible.length+" bright stars and "+count+" planets above the horizon over "+C.name+" at "+timeFmt.format(now));
  }
  function render(){
    var current=new Date(),now=starsPage&&!live?atMinute(current,chosenMinute):current;
    $("moment").textContent=dateFmt.format(now)+" · "+timeFmt.format(now)+(live?" · now":" · selected time");
    if(starsPage)drawStars(now);else drawSun(now,A.sunPosition(now,C.lat,C.lng));
  }
  if(starsPage){
    $("hour").addEventListener("input",function(){live=false;chosenMinute=Number(this.value);render();});
    $("live").addEventListener("click",function(){live=true;render();});
  }
  render();setInterval(function(){if(!document.hidden)render();},30000);
  document.addEventListener("visibilitychange",function(){if(!document.hidden)render();});
})();
