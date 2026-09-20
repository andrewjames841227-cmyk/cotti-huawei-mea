(()=>{'use strict';
const $=s=>document.querySelector(s), $$=s=>[...document.querySelectorAll(s)];
const video=$('#bg-video'),audio=$('#bgm-audio'),sound=$('#bgm-toggle'),vb=$('#video-toggle'),status=$('#media-status');
const en=()=>document.documentElement.lang==='en';let videoWanted=!matchMedia('(prefers-reduced-motion: reduce)').matches;
function videoLabel(){vb.textContent=video.paused?'▷':'Ⅱ';vb.setAttribute('aria-label',en()?(video.paused?'Play background video':'Pause background video'):(video.paused?'播放背景视频':'暂停背景视频'));}
function soundLabel(){const on=!audio.paused; sound.classList.toggle('is-playing',on);sound.setAttribute('aria-pressed',String(on));sound.setAttribute('aria-label',en()?(on?'Pause Lounge music':'Play Lounge music'):(on?'暂停 Lounge 音乐':'播放 Lounge 音乐'));$('#sound-label').textContent=en()?(on?'LOUNGE · ON':'LOUNGE · OFF'):(on?'LOUNGE · 已开启':'开启 LOUNGE');}
video.muted=true;video.defaultMuted=true;
const playVideo=()=>video.play().then(()=>{status.textContent='';videoLabel()}).catch(()=>{videoLabel();status.textContent=en()?'Tap ▷ to play':'点 ▷ 播放影像'});
if(videoWanted)playVideo();else{video.pause();video.removeAttribute('autoplay')}
vb.addEventListener('click',()=>{videoWanted=video.paused;if(videoWanted)playVideo();else video.pause()});
video.addEventListener('playing',videoLabel);video.addEventListener('pause',videoLabel);video.addEventListener('error',()=>{status.textContent=en()?'Video unavailable · retry':'视频未载入 · 点击重试';videoLabel()});
audio.volume=.28;
sound.addEventListener('click',async()=>{if(audio.paused){try{await audio.play();status.textContent=''}catch{status.textContent=en()?'Audio unavailable · retry':'音乐未载入 · 点击重试'}}else audio.pause();soundLabel()});
audio.addEventListener('playing',soundLabel);audio.addEventListener('pause',soundLabel);
document.addEventListener('visibilitychange',()=>{if(document.hidden)video.pause();else if(videoWanted)playVideo()});
window.addEventListener('languagechange',()=>{soundLabel();videoLabel()});soundLabel();videoLabel();
const menu=$('#chapter-menu'),menuBtn=$('.menu-toggle');menuBtn.addEventListener('click',()=>{menu.hidden=!menu.hidden;menuBtn.setAttribute('aria-expanded',String(!menu.hidden))});
$$('#chapter-menu a').forEach(a=>a.addEventListener('click',()=>{menu.hidden=true;menuBtn.setAttribute('aria-expanded','false')}));document.addEventListener('keydown',e=>{if(e.key==='Escape'){menu.hidden=true;menuBtn.setAttribute('aria-expanded','false')}});
function tabs(selector,attr,panel){const buttons=$$(selector);function select(b){buttons.forEach(x=>{x.setAttribute('aria-selected',String(x===b));x.tabIndex=x===b?0:-1;$(panel+x.dataset[attr]).hidden=x!==b});window.dispatchEvent(new Event('resize'))}buttons.forEach((b,i)=>{b.addEventListener('click',()=>select(b));b.addEventListener('keydown',e=>{let n;if(e.key==='ArrowRight')n=(i+1)%buttons.length;if(e.key==='ArrowLeft')n=(i+buttons.length-1)%buttons.length;if(e.key==='Home')n=0;if(e.key==='End')n=buttons.length-1;if(n!==undefined){e.preventDefault();select(buttons[n]);buttons[n].focus()}})})}
tabs('.phase-nav button','stage','#stage-');tabs('.chart-tabs button','chart','#chart-panel-');
const sections=$$('section[id]');function scroll(){document.body.classList.toggle('scrolled',scrollY>40);$('#scroll-progress').style.width=(100*scrollY/Math.max(1,document.documentElement.scrollHeight-innerHeight))+'%';let current='hero';sections.forEach(s=>{if(s.getBoundingClientRect().top<200)current=s.id});$$('.n-links a').forEach(a=>a.classList.toggle('active',a.hash==='#'+current))}addEventListener('scroll',scroll,{passive:true});scroll();
let openBefore=[];addEventListener('beforeprint',()=>{openBefore=$$('details').map(d=>d.open);$$('details').forEach(d=>d.open=true)});addEventListener('afterprint',()=>$$('details').forEach((d,i)=>d.open=openBefore[i]));
})();
