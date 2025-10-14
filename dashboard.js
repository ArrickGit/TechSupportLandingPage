// Lightweight fake live data + canvas charts (no deps)
(function(){
  const stepsCanvas = document.getElementById('chart-steps');
  const actCanvas = document.getElementById('chart-activity');
  const stepsCtx = stepsCanvas.getContext('2d');
  const actCtx = actCanvas.getContext('2d');

  const kSteps = document.getElementById('kpi-steps');
  const kInactive = document.getElementById('kpi-inactive');
  const kHR = document.getElementById('kpi-hr');
  const kAlerts = document.getElementById('kpi-alerts');
  const toggleBtn = document.getElementById('toggle-speed');

  let speed = 1; // 1=normal, 2=fast
  toggleBtn.addEventListener('click', ()=>{
    speed = speed === 1 ? 2 : 1;
    toggleBtn.textContent = `Speed: ${speed===1?'Normal':'Fast'}`;
  });

  // Generate base data
  const steps = Array.from({length: 60}, (_,i)=> 2000 + Math.round(1500*Math.sin(i/8) + 1200*Math.random()));
  const activity = Array.from({length: 24}, (_,h)=> Math.max(0, Math.round(80*Math.sin((h-6)/4)+60+20*Math.random())));
  let currentSteps = steps[steps.length-1];
  let inactivityMin = 0;
  let avgHR = 72;
  let alertsToday = 0;

  function drawSteps(){
    const w = stepsCanvas.width, h = stepsCanvas.height, pad = 32;
    stepsCtx.clearRect(0,0,w,h);
    stepsCtx.fillStyle = '#0f1428'; stepsCtx.fillRect(0,0,w,h);
    // grid
    stepsCtx.strokeStyle = 'rgba(255,255,255,0.08)';
    for(let y=pad; y<h-pad; y+=40){ stepsCtx.beginPath(); stepsCtx.moveTo(pad,y); stepsCtx.lineTo(w-pad,y); stepsCtx.stroke(); }
    // scale
    const maxVal = Math.max(8000, ...steps);
    const minVal = 0;
    const fx = (i)=> pad + i*(w-2*pad)/(steps.length-1);
    const fy = (v)=> h-pad - (v-minVal)*(h-2*pad)/(maxVal-minVal);
    // line
    stepsCtx.beginPath(); stepsCtx.lineWidth = 3; stepsCtx.strokeStyle = '#22d3ee';
    steps.forEach((v,i)=>{ const x=fx(i), y=fy(v); if(i===0) stepsCtx.moveTo(x,y); else stepsCtx.lineTo(x,y); });
    stepsCtx.stroke();
    // points
    stepsCtx.fillStyle = '#22d3ee';
    steps.forEach((v,i)=>{ const x=fx(i), y=fy(v); stepsCtx.beginPath(); stepsCtx.arc(x,y,3,0,Math.PI*2); stepsCtx.fill(); });
    // alert zone
    stepsCtx.fillStyle = 'rgba(239,68,68,0.12)';
    stepsCtx.fillRect(pad, fy(1000), w-2*pad, fy(0)-fy(1000));
    stepsCtx.fillStyle = '#ef4444'; stepsCtx.font='12px Inter'; stepsCtx.fillText('Low activity alert zone', pad+6, fy(1000)-6);
  }

  function drawActivity(){
    const w = actCanvas.width, h = actCanvas.height, pad = 32;
    actCtx.clearRect(0,0,w,h);
    actCtx.fillStyle = '#0f1428'; actCtx.fillRect(0,0,w,h);
    // grid
    actCtx.strokeStyle = 'rgba(255,255,255,0.08)';
    for(let y=pad; y<h-pad; y+=40){ actCtx.beginPath(); actCtx.moveTo(pad,y); actCtx.lineTo(w-pad,y); actCtx.stroke(); }
    const barW = (w-2*pad)/activity.length - 6;
    const maxVal = 100;
    const fx = (i)=> pad + i*((w-2*pad)/activity.length) + 3;
    const fh = (v)=> (v/maxVal)*(h-2*pad);
    // bars
    for(let i=0;i<activity.length;i++){
      const v = activity[i];
      const x = fx(i), bh = fh(v), y = h-pad-bh;
      const grad = actCtx.createLinearGradient(0,y,0,y+bh);
      grad.addColorStop(0,'rgba(139,92,246,0.8)');
      grad.addColorStop(1,'rgba(139,92,246,0.2)');
      actCtx.fillStyle = grad;
      actCtx.fillRect(x,y,barW,bh);
    }
  }

  function tick(){
    // Update fake data
    const delta = Math.round((Math.random()*120) * speed);
    const moved = Math.random() > 0.2; // 80% chance of movement each tick
    if(moved){
      currentSteps += delta;
      inactivityMin = 0;
    } else {
      inactivityMin += 1*speed;
    }
    avgHR += (Math.random()-0.5)*2; // small drift
    if(inactivityMin > 60 && Math.random() < 0.02*speed){ alertsToday++; }

    steps.push(currentSteps);
    if(steps.length > 60) steps.shift();

    // Slightly wiggle hourly activity
    const hour = Math.floor(Date.now()/3600000)%24;
    activity[hour] = Math.max(0, Math.min(100, activity[hour] + Math.round((Math.random()-0.5)*10)));

    // Update KPIs
    kSteps.textContent = currentSteps.toLocaleString();
    kInactive.textContent = `${Math.floor(inactivityMin)} min`;
    kHR.textContent = `${Math.round(avgHR)} bpm`;
    kAlerts.textContent = alertsToday;

    // Draw
    drawSteps();
    drawActivity();
  }

  // Bootstrap
  drawSteps();
  drawActivity();
  setInterval(tick, 1500);
})();


