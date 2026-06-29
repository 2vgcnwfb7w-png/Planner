const $ = id => document.getElementById(id);
const today = new Date().toISOString().slice(0,10);

const defaults = {
  tasks:[
    {id:"t1",title:"Englisch LK lernen",category:"Schule",priority:"Hoch",date:today,done:false},
    {id:"t2",title:"Planly v5 testen",category:"Projekte",priority:"Dringend",date:"",done:false}
  ],
  subjects:[
    {id:"s1",name:"Englisch",goal:14},
    {id:"s2",name:"Mathe",goal:10},
    {id:"s3",name:"Geschichte",goal:13}
  ],
  exams:[
    {id:"e1",subject:"Englisch",title:"Q1 Einstieg",date:today,priority:"Hoch",status:"Am Lernen"}
  ],
  grades:[
    {id:"g1",subject:"Englisch",points:8,type:"Startwert",note:"Zeugnis",date:today}
  ]
};

let data = JSON.parse(localStorage.getItem("planlyDataV5") || "null") || JSON.parse(localStorage.getItem("planlyDataV4") || "null") || defaults;

function save(){localStorage.setItem("planlyDataV5",JSON.stringify(data))}
function uid(){return crypto.randomUUID ? crypto.randomUUID() : Date.now().toString(36)}
function fmt(d){return new Date(d).toLocaleDateString("de-DE")}
function daysUntil(d){return Math.ceil((new Date(d)-new Date(today))/(1000*60*60*24))}
function avg(arr){return arr.length ? arr.reduce((a,b)=>a+Number(b),0)/arr.length : 0}
function subAvg(name){return avg(data.grades.filter(g=>g.subject===name).map(g=>g.points))}
function totalAvg(){return avg(data.subjects.map(s=>subAvg(s.name)).filter(Boolean))}

document.querySelectorAll(".nav").forEach(btn=>{
  btn.onclick=()=>{
    document.querySelectorAll(".nav").forEach(b=>b.classList.remove("active"));
    document.querySelectorAll(".page").forEach(p=>p.classList.remove("active"));
    btn.classList.add("active");
    $(btn.dataset.page).classList.add("active");
    render();
  }
});

$("taskForm").onsubmit=e=>{
  e.preventDefault();
  const title=$("taskTitle").value.trim();
  if(!title)return;
  data.tasks.unshift({id:uid(),title,category:$("taskCategory").value,priority:$("taskPriority").value,date:$("taskDate").value,done:false});
  $("taskTitle").value="";$("taskDate").value="";
  save();render();
};
$("taskSearch").oninput=render;
$("taskFilter").onchange=render;

$("subjectForm").onsubmit=e=>{
  e.preventDefault();
  const name=$("subjectName").value.trim();
  if(!name)return;
  data.subjects.unshift({id:uid(),name,goal:Number($("subjectGoal").value||12)});
  $("subjectName").value="";
  save();render();
};

$("examForm").onsubmit=e=>{
  e.preventDefault();
  if(!$("examTitle").value.trim() || !$("examDate").value)return;
  data.exams.unshift({id:uid(),subject:$("examSubject").value,title:$("examTitle").value.trim(),date:$("examDate").value,priority:$("examPriority").value,status:$("examStatus").value});
  $("examTitle").value="";$("examDate").value="";
  save();render();
};

$("gradeForm").onsubmit=e=>{
  e.preventDefault();
  data.grades.unshift({id:uid(),subject:$("gradeSubject").value,points:Number($("gradePoints").value),type:$("gradeType").value,note:$("gradeNote").value.trim(),date:today});
  $("gradePoints").value=10;$("gradeNote").value="";
  save();render();
};

$("resetData").onclick=()=>{
  if(confirm("Alle lokalen Daten löschen?")){
    localStorage.removeItem("planlyDataV3");
    localStorage.removeItem("planlyDataV4");
    localStorage.removeItem("planlyDataV5");
    data=JSON.parse(JSON.stringify(defaults));
    save();render();
  }
};

function renderClock(){
  const now=new Date();
  $("clock").textContent=now.toLocaleTimeString("de-DE",{hour:"2-digit",minute:"2-digit"});
}
setInterval(renderClock,1000); renderClock();

function renderDashboard(){
  const label=new Date().toLocaleDateString("de-DE",{weekday:"long",day:"2-digit",month:"long"});
  $("todayLabel").textContent=label;$("sideDate").textContent=label;
  const open=data.tasks.filter(t=>!t.done).length;
  const done=data.tasks.filter(t=>t.done).length;
  const progress=data.tasks.length?Math.round(done/data.tasks.length*100):0;
  const todayTasks=data.tasks.filter(t=>t.date===today);
  const exams=data.exams.filter(e=>e.date>=today).sort((a,b)=>a.date.localeCompare(b.date));
  const ta=totalAvg();

  $("progressText").textContent=progress+"%";
  $("statOpen").textContent=open;
  $("statToday").textContent=todayTasks.length;
  $("statExams").textContent=exams.length;
  $("statAverage").textContent=ta?ta.toFixed(1):"-";
  $("todayCount").textContent=todayTasks.length;
  $("dashExamCount").textContent=exams.length;

  $("todayTasksList").innerHTML=todayTasks.length?todayTasks.map(taskItem).join(""):`<div class="empty">Heute ist noch nichts eingetragen.</div>`;
  $("dashExamList").innerHTML=exams.slice(0,4).map(examItem).join("")||`<div class="empty">Keine Klausuren eingetragen.</div>`;
  renderCalendar("miniCalendar", false);
  renderCalendar("fullCalendar", true);
}

function renderTasks(){
  const search=$("taskSearch").value.toLowerCase();
  const filter=$("taskFilter").value;
  const list=data.tasks.filter(t=>(t.title.toLowerCase().includes(search))&&(filter==="Alle"||t.category===filter||t.priority===filter));
  $("taskList").innerHTML=list.map(taskItemFull).join("")||`<div class="empty">Keine Aufgabe gefunden.</div>`;
}

function renderSchool(){
  $("subjectCount").textContent=data.subjects.length;
  $("subjectList").innerHTML=data.subjects.map(s=>`
    <div class="item"><div class="badge">${s.name[0]}</div><div class="itemBody"><h3>${s.name}</h3><p>Ziel ${s.goal} Punkte · Ø ${subAvg(s.name).toFixed(1)}</p></div><button class="delete" onclick="deleteSubject('${s.id}')">Löschen</button></div>
  `).join("");
  const opts=data.subjects.map(s=>`<option>${s.name}</option>`).join("");
  $("examSubject").innerHTML=opts;$("gradeSubject").innerHTML=opts;
  $("examCountFull").textContent=data.exams.length;
  $("examList").innerHTML=data.exams.map(examItemFull).join("")||`<div class="empty">Noch keine Klausuren.</div>`;
}

function renderGrades(){
  const ta=totalAvg();
  $("totalAverageBig").textContent=ta?ta.toFixed(2):"-";
  $("gradesCount").textContent=data.grades.length;
  $("subjectsCountGrades").textContent=data.subjects.length;
  $("gradeHistoryCount").textContent=data.grades.length;
  $("subjectGradeGrid").innerHTML=data.subjects.map(s=>{
    const a=subAvg(s.name);
    return `<div class="gradeCard"><h3>${s.name}</h3><strong>${a?a.toFixed(2):"-"}</strong><p>Ziel: ${s.goal} Punkte</p></div>`
  }).join("");
  $("gradeList").innerHTML=data.grades.map(g=>`
    <div class="item"><div class="badge">${g.points}</div><div class="itemBody"><h3>${g.subject}</h3><p>${g.type} · ${fmt(g.date)}${g.note?" · "+g.note:""}</p></div><button class="delete" onclick="deleteGrade('${g.id}')">Löschen</button></div>
  `).join("")||`<div class="empty">Noch keine Noten.</div>`;
}

function renderCalendar(id, large){
  const el=$(id);
  const now=new Date();
  const y=now.getFullYear(), m=now.getMonth();
  const first=new Date(y,m,1);
  const days=new Date(y,m+1,0).getDate();
  const start=(first.getDay()+6)%7;
  const names=["Mo","Di","Mi","Do","Fr","Sa","So"];
  $("calendarMonthLabel").textContent=now.toLocaleDateString("de-DE",{month:"long"});
  if($("fullCalendarTitle")) $("fullCalendarTitle").textContent=now.toLocaleDateString("de-DE",{month:"long",year:"numeric"});
  let html=names.map(n=>`<div class="dayName">${n}</div>`).join("");
  for(let i=0;i<start;i++) html+=`<div class="dayCell"></div>`;
  for(let d=1;d<=days;d++){
    const date=`${y}-${String(m+1).padStart(2,"0")}-${String(d).padStart(2,"0")}`;
    const has=data.tasks.some(t=>t.date===date)||data.exams.some(e=>e.date===date);
    html+=`<div class="dayCell ${date===today?"today":""} ${has?"hasItem":""}">${d}</div>`;
  }
  el.innerHTML=html;
}

function taskItem(t){return `<div class="item ${t.done?"done":""}"><button class="check" onclick="toggleTask('${t.id}')">${t.done?"✓":""}</button><div class="itemBody"><h3>${t.title}</h3><p>${t.category} · ${t.priority}</p></div></div>`}
function taskItemFull(t){return `<div class="item ${t.done?"done":""}"><button class="check" onclick="toggleTask('${t.id}')">${t.done?"✓":""}</button><div class="itemBody"><h3>${t.title}</h3><p>${t.category} · ${t.priority}${t.date?" · "+fmt(t.date):""}</p></div><button class="delete" onclick="deleteTask('${t.id}')">Löschen</button></div>`}
function examItem(e){return `<div class="item"><div class="badge">${Math.max(daysUntil(e.date),0)}d</div><div class="itemBody"><h3>${e.subject}: ${e.title}</h3><p>${fmt(e.date)} · ${e.status}</p></div></div>`}
function examItemFull(e){return `<div class="item"><div class="badge">${Math.max(daysUntil(e.date),0)}d</div><div class="itemBody"><h3>${e.subject}: ${e.title}</h3><p>${fmt(e.date)} · ${e.priority} · ${e.status}</p></div><button class="delete" onclick="deleteExam('${e.id}')">Löschen</button></div>`}

window.toggleTask=id=>{data.tasks=data.tasks.map(t=>t.id===id?{...t,done:!t.done}:t);save();render()}
window.deleteTask=id=>{data.tasks=data.tasks.filter(t=>t.id!==id);save();render()}
window.deleteSubject=id=>{data.subjects=data.subjects.filter(s=>s.id!==id);save();render()}
window.deleteExam=id=>{data.exams=data.exams.filter(e=>e.id!==id);save();render()}
window.deleteGrade=id=>{data.grades=data.grades.filter(g=>g.id!==id);save();render()}

function render(){renderDashboard();renderTasks();renderSchool();renderGrades()}
render();
