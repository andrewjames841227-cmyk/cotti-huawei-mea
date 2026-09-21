(function(root){
const HOURS=[14,14,14.5,15,17,19,21,22.5,24.5,26.5,28.5,30,31.5,33.5,35,37,39,40.5,42.5,44.5];
function staff(q,s){if(s.laborMode==='manual')return {count:null,cost:s.manualLabor};if(q>1000)return {count:null,cost:NaN};const h=HOURS[Math.max(0,Math.min(19,Math.ceil(q/50)-1))];const count=Math.max(2,Math.ceil(h*s.days/208));return {count,cost:s.manager+(count-1)*s.barista+count*s.staffExtra};}
function occupancy(p,s,year=1,annualSales=0){
 const rate=p.rates.length&&p.rate===s.rate?p.rates[Math.min(year,3)-1]:s.rate*Math.pow(1+s.escalation/100,year-1);
 const main=p.area*rate,terr=s.terrace*rate*s.terraceRatio/100,base=main+terr,service=(p.area+s.terrace)*s.service,chilled=(p.area+(s.chilledTerrace?s.terrace:0))*s.chilled;
 const marketing=(s.marketingTerrace?base:main)*s.marketing/100;
 const comparisonBase=s.turnScope==='main'?main:base;
 let rental;if(s.rentMode==='add')rental=base+annualSales*s.turn/100;else rental=Math.max(comparisonBase,annualSales*s.turn/100)+(s.turnScope==='main'?terr:0);
 const total=rental+service+chilled+marketing;
 const depositBase=s.depositTerrace?base+service+chilled:main+p.area*(s.service+s.chilled);
 return {rate,main,terr,base,service,chilled,marketing,rental,total,deposit:depositBase*s.deposit/100,premium:rental-base};
}
function calc(p,s,q=s.cups,year=1){
 if(!Number.isFinite(s.rate)||s.rate<0||!Number.isFinite(s.terrace)||s.terrace<0)return null;
 const price=s.grossPrice/(1+s.vat/100),units=q*s.days,rev=units*price,people=staff(q,s),variable=rev*(s.raw+s.logistics+s.platform+s.payment+s.utilities)/100,occ=occupancy(p,s,year,rev*12),contribution=rev-variable-people.cost-s.other-occ.total/12;
 const fitout=p.area*.092903*s.fitout,preInvest=(fitout+s.equipment)*(1+s.contingency/100)+s.designFee,investment=preInvest+s.preopen;
 const fixed=people.cost+s.other+occupancy(p,s,year,0).total/12;
 const startup=investment*(1+s.vat/100)+occ.deposit+occupancy(p,s,1,0).total/4*(1+s.vat/100)+s.reserve*fixed;
 return {price,units,rev,people,variable,occ,contribution,fitout,investment,startup,fixed,occupancyRate:rev>0?occ.total/12/rev*100:null};
}
function threshold(p,s,target=0){for(let q=1;q<=1000;q++){const r=calc(p,s,q);if(r&&Number.isFinite(r.contribution)&&r.contribution>=target)return q;}return null;}
function trajectory(p,s){let cumul=0,paid=null,annualRevenue=0;const base=calc(p,s);if(!base)return null;const rows=[];for(let m=1;m<=36;m++){const mult=m===1?s.ramp1/100:m===2?s.ramp2/100:m===3?s.ramp3/100:1;const year=Math.ceil(m/12);const r=calc(p,s,s.cups*mult,year);annualRevenue+=r.rev;let contribution=r.contribution+r.occ.premium/12;if(m%12===0){contribution-=occupancy(p,s,year,annualRevenue).premium;annualRevenue=0;}cumul+=contribution;const balance=cumul-base.investment;if(paid===null&&balance>=0)paid=m;rows.push({month:m,contribution,cumulative:balance});}return {rows,paid};}
const api={staff,occupancy,calc,threshold,trajectory};if(typeof module!=='undefined')module.exports=api;root.EM_MODEL=api;
})(typeof window==='undefined'?globalThis:window);
