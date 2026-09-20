
(function(){
"use strict";
var reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
var hasGsap = typeof gsap !== "undefined";
if(reduced || !hasGsap){ document.body.classList.add("no-anim"); document.querySelectorAll(".anim-in").forEach(function(el){el.style.opacity=1;el.style.transform="none";}); }


function lsGet(k){ try{ return window.localStorage.getItem(k); }catch(e){ return null; } }
function lsSet(k,v){ try{ window.localStorage.setItem(k,v); }catch(e){} }

/* ============ I18N ============ */
var LANG = lsGet("ch-lang") || "zh";
function applyLang(l){
  LANG = l; lsSet("ch-lang", l);
  document.documentElement.lang = l === "zh" ? "zh-CN" : "en";
  document.querySelectorAll("[data-zh]").forEach(function(el){
    var v = el.getAttribute("data-" + l);
    if(v !== null) el.innerHTML = v;
  });
  document.getElementById("lang-toggle").textContent = l === "zh" ? "EN" : "中文";
  if(l === "en"){ document.body.style.fontFamily = '"Inter","PingFang SC",-apple-system,sans-serif'; }
  else { document.body.style.fontFamily = ""; }
  renderCharts();
  renderResults();
  window.dispatchEvent(new Event("languagechange"));
}
document.getElementById("lang-toggle").addEventListener("click",function(){ applyLang(LANG === "zh" ? "en" : "zh"); });


var D = {
  mau:1848000, cogs:3.95, fx:1.98,
  baseCups:158679, baseRevRMB:3216000,
  reach:.35, act:.04, conv:.25, rep:1.5, cann:.20, asp:10.2, d1:.20, d2:.05
};
var PRESETS = {
  low:{reach:.20, act:.02, conv:.15, rep:1.0, cann:.35, asp:9.5, d1:.25, d2:.08},
  mid:{reach:.35, act:.04, conv:.25, rep:1.5, cann:.20, asp:10.2, d1:.20, d2:.05},
  high:{reach:.50, act:.07, conv:.35, rep:2.2, cann:.10, asp:11.0, d1:.15, d2:.03}
};
var SLIDERS = [
  {id:"reach", key:"reach", fmt:function(v){return Math.round(v*100)+"%";}, scale:100},
  {id:"act", key:"act", fmt:function(v){return (v*100).toFixed(1).replace(/\.0$/,"")+"%";}, scale:100},
  {id:"conv", key:"conv", fmt:function(v){return Math.round(v*100)+"%";}, scale:100},
  {id:"rep", key:"rep", fmt:function(v){return v.toFixed(1);}, scale:1},
  {id:"cann", key:"cann", fmt:function(v){return Math.round(v*100)+"%";}, scale:100},
  {id:"asp", key:"asp", fmt:function(v){return v.toFixed(1)+" AED";}, scale:1},
  {id:"d1", key:"d1", fmt:function(v){return Math.round(v*100)+"%";}, scale:100},
  {id:"d2", key:"d2", fmt:function(v){return Math.round(v*100)+"%";}, scale:100}
];
function fmtWan(v){ /* AED -> 万AED string */
  return (v/10000).toFixed(1);
}
function compute(d){
  var reached = d.mau*d.reach;
  var activated = reached*d.act;
  var first = activated*d.conv;
  var totalCups = first*d.rep;
  var repCups = Math.max(0, totalCups - first);
  var netFirst = first*(1-d.cann), netRep = repCups*(1-d.cann);
  var rev = netFirst*d.asp*(1-d.d1) + netRep*d.asp*(1-d.d2);
  var margin = netFirst*(d.asp*(1-d.d1)-d.cogs) + netRep*(d.asp*(1-d.d2)-d.cogs);
  var baseRevAED = d.baseRevRMB/d.fx;
  return {reached:reached, activated:activated, first:first, totalCups:totalCups,
          netCups:netFirst+netRep, rev:rev, revRMB:rev*d.fx,
          margin:margin, marginRMB:margin*d.fx, uplift:rev/baseRevAED};
}
var R = compute(D);

/* number tween */
var shown = {cups:0, rev:0, margin:0, rmb:0, uplift:0, sept:0};
function tweenNum(el, from, to, fmt){
  if(!hasGsap || reduced){ el.innerHTML = fmt(to); return; }
  var o = {v:from};
  gsap.to(o,{v:to,duration:.5,ease:"power2.out",onUpdate:function(){ el.innerHTML = fmt(o.v); },overwrite:true});
}
function renderResults(){
  tweenNum(document.getElementById("r-cups"), shown.cups, R.netCups, function(v){ return Math.round(v).toLocaleString("en-US"); });
  tweenNum(document.getElementById("r-rev"), shown.rev, R.rev, function(v){ return fmtWan(v)+"<small>"+(LANG==="zh"?" 万 AED":"×10⁴ AED")+"</small>"; });
  tweenNum(document.getElementById("r-rev-rmb"), shown.rmb, R.revRMB, function(v){ return "≈ "+fmtWan(v)+" "+(LANG==="zh"?"万元":"×10⁴ RMB"); });
  tweenNum(document.getElementById("r-margin"), shown.margin, R.margin, function(v){ return fmtWan(v)+"<small>"+(LANG==="zh"?" 万 AED":"×10⁴ AED")+"</small>"; });
  tweenNum(document.getElementById("r-uplift"), shown.uplift, R.uplift, function(v){ return "≈ "+(LANG==="zh"?"现有月收入 +":"current monthly revenue +")+(v*100).toFixed(1)+"%"; });
  tweenNum(document.getElementById("r-sept"), shown.sept, R.marginRMB/64322, function(v){ return "≈ "+(LANG==="zh"?"毛利 / 9 月利润目标规模（非净利润）：":"Gross margin / September profit target (not net profit): ")+Math.round(v*100)+"%"; });
  shown = {cups:R.netCups, rev:R.rev, margin:R.margin, rmb:R.revRMB, uplift:R.uplift, sept:R.marginRMB/64322};
  renderCharts();
}
SLIDERS.forEach(function(s){
  var inp = document.getElementById("s-"+s.id), lab = document.getElementById("v-"+s.id);
  inp.addEventListener("input",function(){
    D[s.key] = parseFloat(inp.value)/s.scale;
    lab.textContent = s.fmt(D[s.key]);
    document.querySelectorAll(".presets .btn").forEach(function(b){b.classList.remove("active");});
    R = compute(D); renderResults();
  });
});
document.querySelectorAll(".presets .btn").forEach(function(b){
  b.addEventListener("click",function(){
    var pr = PRESETS[b.getAttribute("data-preset")];
    Object.keys(pr).forEach(function(k){ D[k]=pr[k]; });
    SLIDERS.forEach(function(s){
      document.getElementById("s-"+s.id).value = D[s.key]*s.scale;
      document.getElementById("v-"+s.id).textContent = s.fmt(D[s.key]);
    });
    document.querySelectorAll(".presets .btn").forEach(function(x){x.classList.remove("active");});
    b.classList.add("active");
    R = compute(D); renderResults();
  });
});

/* ============ CHARTS ============ */
var hasEcharts = typeof echarts !== "undefined";
var charts = {};
var COLORS = {red:"#A42336", redDeep:"#7C1A28", gold:"#C6A15B", ink:"#5A5048", soft:"#E8DCC0", grid:"rgba(31,27,24,.08)"};
function T(zh,en){ return LANG==="zh"?zh:en; }

/* cumulative factors: P0 ramp -> P1 scale -> P2 MEA replication */
var CUMF = [0.3,0.7,1.0,1.25,1.45,1.7,2.4,3.0,3.4,3.8,4.1,4.4];

function chartFonts(){ return {fontFamily:"Inter, PingFang SC, sans-serif", color:"#5A5048"}; }

function renderCharts(){
  if(!hasEcharts){ renderFallbacks(); return; }
  var textStyle = chartFonts();
  /* funnel */
  if(!charts.funnel) charts.funnel = echarts.init(document.getElementById("chart-funnel"));
  charts.funnel.setOption({
    animation:false, textStyle:textStyle,
    tooltip:{trigger:"item",formatter:"{b}: {c}"},
    series:[{type:"funnel",left:"8%",right:"8%",top:8,bottom:8,minSize:"18%",gap:4,
      label:{show:true,position:"inside",formatter:function(p){return p.name+"\n"+p.value.toLocaleString("en-US");},fontSize:12,color:"#FFFDF9"},
      itemStyle:{borderWidth:0},
      data:[
        {value:Math.round(R.reached), name:T("触达","Reached"), itemStyle:{color:COLORS.gold}},
        {value:Math.round(R.activated), name:T("激活","Activated"), itemStyle:{color:COLORS.red}},
        {value:Math.round(R.first), name:T("首单","First orders"), itemStyle:{color:COLORS.redDeep}},
        {value:Math.round(R.totalCups), name:T("月杯量(含复购)","Monthly cups"), itemStyle:{color:COLORS.ink}},
        {value:Math.round(R.netCups), name:T("净增杯量","Net new cups"), itemStyle:{color:"#4A7C59"}}
      ]}]
  },true);
  /* cumulative */
  if(!charts.cum) charts.cum = echarts.init(document.getElementById("chart-cum"));
  var monthly = CUMF.map(function(f){ return Math.round(R.rev*f); });
  var cum = [], s=0; monthly.forEach(function(m){ s+=m; cum.push(s); });
  var months = []; for(var i=1;i<=12;i++) months.push(T("M","M")+i);
  charts.cum.setOption({
    animation:false, textStyle:textStyle,
    tooltip:{trigger:"axis"},
    legend:{data:[T("月增量收入 (AED)","Monthly incremental (AED)"),T("累计 (AED)","Cumulative (AED)")],animation:false, textStyle:textStyle,top:0},
    grid:{left:10,right:10,top:34,bottom:6,containLabel:true},
    xAxis:{type:"category",data:months,axisLine:{lineStyle:{color:COLORS.grid}}},
    yAxis:{type:"value",splitLine:{lineStyle:{color:COLORS.grid}},axisLabel:{formatter:function(v){return (v/10000)+(LANG==="zh"?"万":"×10⁴");}}},
    series:[
      {name:T("月增量收入 (AED)","Monthly incremental (AED)"),type:"bar",data:monthly,itemStyle:{color:COLORS.gold,borderRadius:[2,2,0,0]},barMaxWidth:22},
      {name:T("累计 (AED)","Cumulative (AED)"),type:"line",data:cum,smooth:true,lineStyle:{color:COLORS.red,width:2.5},itemStyle:{color:COLORS.red},areaStyle:{color:"rgba(164,35,54,.06)"}}
    ]
  },true);
  /* sensitivity */
  if(!charts.sens) charts.sens = echarts.init(document.getElementById("chart-sens"));
  var xs=[], base=[], lowB=[], highB=[], band=[];
  for(var rch=10; rch<=60; rch+=5){
    var dd = Object.assign({},D,{reach:rch/100});
    var mk = function(actMul){ return compute(Object.assign({},dd,{act:dd.act*actMul})).rev; };
    var lo = mk(0.6), mid = mk(1), hi = mk(1.4);
    xs.push(rch+"%"); base.push(Math.round(mid)); lowB.push(Math.round(lo)); band.push(Math.round(hi-lo));
  }
  charts.sens.setOption({
    animation:false, textStyle:textStyle,
    tooltip:{trigger:"axis"},
    grid:{left:10,right:10,top:30,bottom:6,containLabel:true},
    xAxis:{type:"category",data:xs,name:T("触达率","Reach"),axisLine:{lineStyle:{color:COLORS.grid}}},
    yAxis:{type:"value",splitLine:{lineStyle:{color:COLORS.grid}},axisLabel:{formatter:function(v){return (v/10000)+(LANG==="zh"?"万":"×10⁴");}}},
    series:[
      {name:"low",type:"line",data:lowB,lineStyle:{opacity:0},stack:"band",symbol:"none",silent:true},
      {name:T("区间 (激活率±40%)","Band (activation ±40%)"),type:"line",data:band,lineStyle:{opacity:0},stack:"band",symbol:"none",areaStyle:{color:"rgba(198,161,91,.25)"},silent:true},
      {name:T("月增量收入 (AED)","Monthly incremental (AED)"),type:"line",data:base,smooth:true,lineStyle:{color:COLORS.red,width:2.5},itemStyle:{color:COLORS.red}}
    ]
  },true);
  /* GCC MAU landscape */
  var gccEl = document.getElementById("chart-gcc");
  if(gccEl){
    if(!charts.gcc) charts.gcc = echarts.init(gccEl);
    var gccData = [
      {name:"KSA", v:8000000, note:T("主战场 · 4.3× UAE","Main arena · 4.3× UAE")},
      {name:"JORDAN", v:1900000, note:""},
      {name:"UAE", v:1848000, note:T("本方案试点","This proposal's pilot")},
      {name:"QATAR", v:430000, note:T("库迪门店网络可联动","Cotti store network link")},
      {name:"KUWAIT", v:300000, note:""},
      {name:"BAHRAIN", v:201000, note:""}
    ];
    charts.gcc.setOption({
      animation:false, textStyle:textStyle,
      tooltip:{trigger:"axis",axisPointer:{type:"shadow"},formatter:function(ps){var p=ps[0];var d=gccData[p.dataIndex];return d.name+": "+d.v.toLocaleString("en-US")+(d.note?"<br>"+d.note:"");}},
      grid:{left:10,right:65,top:10,bottom:6,containLabel:true},
      xAxis:{type:"value",splitLine:{lineStyle:{color:COLORS.grid}},axisLabel:{formatter:function(v){return (v/10000)+(LANG==="zh"?"万":"×10⁴");}}},
      yAxis:{type:"category",inverse:true,data:gccData.map(function(d){return d.name;}),axisLine:{lineStyle:{color:COLORS.grid}}},
      series:[{type:"bar",barMaxWidth:26,
        data:gccData.map(function(d){
          var col = d.name==="UAE"?COLORS.red:(d.name==="KSA"?"#D9B36C":COLORS.soft);
          return {value:d.v,itemStyle:{color:col,borderRadius:[0,2,2,0]},
            label:{show:true,position:"right",fontSize:11,color:"#ddd8ce",
              formatter:function(){return (d.v/10000).toLocaleString("en-US")+(LANG==="zh"?"万":"×10⁴");}}};
        })
      }]
    },true);
  }
  Object.keys(charts).forEach(function(k){ charts[k].resize(); });
}

/* fallback tables when echarts unavailable */
function renderFallbacks(){
  document.querySelectorAll(".chart").forEach(function(c){ c.style.display="none"; });
  document.querySelectorAll(".chart-fallback").forEach(function(t){ t.style.display="table"; });
  var f = document.getElementById("fb-funnel");
  f.innerHTML = "<tr><th>"+T("阶段","Stage")+"</th><th>"+T("数量","Value")+"</th></tr>"+
    [["触达 / Reached",R.reached],["激活 / Activated",R.activated],["首单 / First orders",R.first],["月杯量 / Monthly cups",R.totalCups],["净增 / Net new",R.netCups]]
    .map(function(r){ return "<tr><td>"+r[0]+"</td><td class='num'>"+Math.round(r[1]).toLocaleString("en-US")+"</td></tr>"; }).join("");
  var monthly = CUMF.map(function(x){ return Math.round(R.rev*x); });
  var cum=0;
  document.getElementById("fb-cum").innerHTML = "<tr><th>"+T("月份","Month")+"</th><th>"+T("月增量 AED","Monthly AED")+"</th><th>"+T("累计 AED","Cum. AED")+"</th></tr>"+
    monthly.map(function(m,i){ cum+=m; return "<tr><td>M"+(i+1)+"</td><td class='num'>"+m.toLocaleString("en-US")+"</td><td class='num'>"+cum.toLocaleString("en-US")+"</td></tr>"; }).join("");
  var rows="";
  for(var rch=10; rch<=60; rch+=10){
    var dd=Object.assign({},D,{reach:rch/100});
    rows += "<tr><td>"+rch+"%</td><td class='num'>"+Math.round(compute(dd).rev).toLocaleString("en-US")+"</td></tr>";
  }
  document.getElementById("fb-sens").innerHTML = "<tr><th>"+T("触达率","Reach")+"</th><th>"+T("月增量收入 AED","Monthly AED")+"</th></tr>"+rows;
}
window.addEventListener("resize",function(){ Object.keys(charts).forEach(function(k){ charts[k].resize(); }); });


document.getElementById("print-url").textContent = (typeof location!=="undefined"?location.href:"") + " · " + new Date().toISOString().slice(0,10);

/* ============ INIT ============ */
applyLang(LANG);
R = compute(D);
renderResults();
})();
