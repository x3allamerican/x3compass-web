(function(){
  var PRODUCT=(window.X3_PRODUCT||document.documentElement.getAttribute("data-x3-product")||"preventability");
  var CYAN="#00B2FD", NAVY="#0b1420";
  var css=`
  #x3cc-btn{position:fixed;right:22px;bottom:22px;width:60px;height:60px;border-radius:50%;background:${CYAN};color:#04121d;border:none;cursor:pointer;box-shadow:0 12px 34px -8px rgba(0,178,253,.6);z-index:99999;display:flex;align-items:center;justify-content:center;transition:transform .15s}
  #x3cc-btn:hover{transform:scale(1.06)}
  #x3cc-btn svg{width:28px;height:28px}
  #x3cc-panel{position:fixed;right:22px;bottom:94px;width:370px;max-width:calc(100vw - 32px);height:520px;max-height:calc(100vh - 130px);background:${NAVY};border:1px solid rgba(0,178,253,.4);border-radius:16px;box-shadow:0 30px 70px -18px rgba(0,0,0,.75);z-index:99999;display:none;flex-direction:column;overflow:hidden;font-family:Inter,system-ui,sans-serif}
  #x3cc-panel.open{display:flex}
  #x3cc-head{background:linear-gradient(135deg,#0b1420,#12283a);padding:14px 16px;border-bottom:1px solid rgba(0,178,253,.25);display:flex;align-items:center;gap:10px}
  #x3cc-head .d{width:34px;height:34px;border-radius:9px;background:${CYAN};color:#04121d;display:flex;align-items:center;justify-content:center;font-weight:900;flex:none}
  #x3cc-head h4{margin:0;color:#fff;font-size:15px;font-weight:800}
  #x3cc-head p{margin:1px 0 0;color:#8fd8e6;font-size:11px;font-weight:600}
  #x3cc-head .x{margin-left:auto;background:none;border:none;color:#9fb3c8;font-size:20px;cursor:pointer}
  #x3cc-msgs{flex:1;overflow-y:auto;padding:16px;display:flex;flex-direction:column;gap:12px}
  .x3cc-m{max-width:85%;padding:10px 13px;border-radius:12px;font-size:13.5px;line-height:1.5}
  .x3cc-m.bot{background:#13212f;color:#dced f5;color:#dcedf5;align-self:flex-start;border:1px solid rgba(255,255,255,.06)}
  .x3cc-m.me{background:${CYAN};color:#04121d;font-weight:600;align-self:flex-end}
  .x3cc-m.bot a{color:${CYAN}}
  #x3cc-in{border-top:1px solid rgba(255,255,255,.08);padding:10px;display:flex;gap:8px}
  #x3cc-in input{flex:1;background:#0a141d;border:1px solid rgba(0,178,253,.3);color:#fff;border-radius:10px;padding:11px 13px;font:inherit;font-size:13.5px;outline:none}
  #x3cc-in input:focus{border-color:${CYAN}}
  #x3cc-in button{background:${CYAN};border:none;color:#04121d;font-weight:800;border-radius:10px;padding:0 15px;cursor:pointer}
  .x3cc-typing{color:#8fd8e6;font-size:12px;padding:2px 4px}`;
  var st=document.createElement("style");st.textContent=css;document.head.appendChild(st);
  var btn=document.createElement("button");btn.id="x3cc-btn";btn.setAttribute("aria-label","Ask the X3 Concierge");
  btn.innerHTML='<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 11.5a8.5 8.5 0 0 1-12.3 7.6L3 21l1.9-5.7A8.5 8.5 0 1 1 21 11.5z"/></svg>';
  var panel=document.createElement("div");panel.id="x3cc-panel";
  panel.innerHTML='<div id="x3cc-head"><div class="d">X3</div><div><h4>X3 Concierge</h4><p>Ask anything · grounded in the standard</p></div><button class="x" aria-label="Close">×</button></div>'+
    '<div id="x3cc-msgs"></div>'+
    '<div id="x3cc-in"><input type="text" placeholder="Ask about this accident…" autocomplete="off"/><button>Send</button></div>';
  document.body.appendChild(btn);document.body.appendChild(panel);
  var msgs=panel.querySelector("#x3cc-msgs"), inp=panel.querySelector("input"), send=panel.querySelector("#x3cc-in button");
  var history=[], greeted=false;
  function esc(s){return String(s).replace(/[<>&]/g,function(c){return{"<":"&lt;",">":"&gt;","&":"&amp;"}[c];});}
  function link(s){return esc(s).replace(/→ (X3 [A-Za-z& ]+) handles that\.?/g,'<br><b style="color:'+CYAN+'">→ $1 handles that.</b>');}
  function add(role,text){var d=document.createElement("div");d.className="x3cc-m "+(role==="me"?"me":"bot");d.innerHTML=role==="me"?esc(text):link(text);msgs.appendChild(d);msgs.scrollTop=msgs.scrollHeight;}
  function toggle(){panel.classList.toggle("open");if(panel.classList.contains("open")){if(!greeted){greeted=true;add("bot","Hi 👋 I'm your X3 Concierge for "+PRODUCT.charAt(0).toUpperCase()+PRODUCT.slice(1)+". Ask me anything — I'll keep it plain and cited to the standard.");}inp.focus();}}
  btn.onclick=toggle; panel.querySelector(".x").onclick=toggle;
  async function ask(){var q=inp.value.trim();if(!q)return;inp.value="";add("me",q);history.push({role:"user",content:q});
    var t=document.createElement("div");t.className="x3cc-typing";t.textContent="X3 is thinking…";msgs.appendChild(t);msgs.scrollTop=msgs.scrollHeight;
    try{var r=await fetch("/api/concierge",{method:"POST",headers:{"content-type":"application/json"},body:JSON.stringify({product:PRODUCT,messages:history})});var d=await r.json();t.remove();var a=d.reply||"Try again in a moment.";add("bot",a);history.push({role:"assistant",content:a});}
    catch(e){t.remove();add("bot","I hit a network snag — try again.");}}
  send.onclick=ask; inp.addEventListener("keydown",function(e){if(e.key==="Enter")ask();});
})();
