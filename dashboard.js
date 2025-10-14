// Lightweight fake live data + canvas charts (no deps)
(function(){
  const stepsCanvas = document.getElementById('chart-steps');
  const actCanvas = document.getElementById('chart-activity');
  const stepsCtx = stepsCanvas.getContext('2d');
  const actCtx = actCanvas.getContext('2d');
  const moodCanvas = document.getElementById('chart-mood');
  const moodCtx = moodCanvas.getContext('2d');

  const kSteps = document.getElementById('kpi-steps');
  const kInactive = document.getElementById('kpi-inactive');
  const kHR = document.getElementById('kpi-hr');
  const kAlerts = document.getElementById('kpi-alerts');
  const toggleBtn = document.getElementById('toggle-speed');
  const convList = document.getElementById('conv-list');

  let speed = 1; // 1=normal, 2=fast
  toggleBtn.addEventListener('click', ()=>{
    speed = speed === 1 ? 2 : 1;
    toggleBtn.textContent = `Speed: ${speed===1?'Normal':'Fast'}`;
  });

  // Generate base data
  const steps = Array.from({length: 60}, (_,i)=> 2000 + Math.round(1500*Math.sin(i/8) + 1200*Math.random()));
  const activity = Array.from({length: 24}, (_,h)=> Math.max(0, Math.round(80*Math.sin((h-6)/4)+60+20*Math.random())));
  const moods = Array.from({length: 14}, (_,i)=> Math.max(1, Math.min(5, Math.round(3 + Math.sin(i/3) + (Math.random()-0.5)))));
  const conversations = [
    { time: 'Today 8:12 AM', text: 'Good morning! Remember to stretch your legs for 3 minutes.' },
    { time: 'Yesterday 6:02 PM', text: 'Nice evening walk — 1,240 steps in 20 minutes. Great job!' },
    { time: 'Yesterday 12:30 PM', text: 'Time to drink water. How are you feeling?' },
    { time: '2 days ago 9:10 AM', text: 'Gentle reminder: take your morning medication.' },
    { time: '3 days ago 4:45 PM', text: 'It seems quiet today. Would you like to call a friend?' },
    { time: '4 days ago 7:55 AM', text: 'Short balance exercise: stand near a wall and raise heels.' },
    { time: '6 days ago 8:20 PM', text: 'Goodnight! Your activity was consistent today.' },
  ];
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

  function drawMood(){
    const w = moodCanvas.width, h = moodCanvas.height, pad = 32;
    moodCtx.clearRect(0,0,w,h);
    moodCtx.fillStyle = '#0f1428'; moodCtx.fillRect(0,0,w,h);
    // grid
    moodCtx.strokeStyle = 'rgba(255,255,255,0.08)';
    for(let y=pad; y<h-pad; y+=40){ moodCtx.beginPath(); moodCtx.moveTo(pad,y); moodCtx.lineTo(w-pad,y); moodCtx.stroke(); }
    const maxVal = 5, minVal = 1;
    const fx = (i)=> pad + i*(w-2*pad)/(moods.length-1);
    const fy = (v)=> h-pad - (v-minVal)*(h-2*pad)/(maxVal-minVal);
    moodCtx.beginPath(); moodCtx.lineWidth = 3; moodCtx.strokeStyle = '#f59e0b';
    moods.forEach((v,i)=>{ const x=fx(i), y=fy(v); if(i===0) moodCtx.moveTo(x,y); else moodCtx.lineTo(x,y); });
    moodCtx.stroke();
    moodCtx.fillStyle = '#f59e0b';
    moods.forEach((v,i)=>{ const x=fx(i), y=fy(v); moodCtx.beginPath(); moodCtx.arc(x,y,3,0,Math.PI*2); moodCtx.fill(); });
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
    // Mood slight random walk
    moods.push(Math.max(1, Math.min(5, moods[moods.length-1] + (Math.random()-0.5))));
    if(moods.length>14) moods.shift();
    drawMood();
  }

  // Bootstrap
  drawSteps();
  drawActivity();
  drawMood();
  // Render conversations
  convList.innerHTML = conversations.map(c=>{
    return `<div><div style="font-weight:600">${c.time}</div><div>${c.text}</div></div>`;
  }).join('');
  setInterval(tick, 1500);
})();


