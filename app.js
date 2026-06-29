const $ = (id) => document.getElementById(id);

const today = new Date().toISOString().slice(0,10);

const defaultData = {
  tasks:[
    {id:"t1",title:"Englisch LK lernen",category:"Schule",priority:"Hoch",date:today,done:false},
    {id:"t2",title:"Planly auf GitHub testen",category:"Projekte",priority:"Dringend",date:"",done:false}
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

let data = JSON.parse(localStorage.getItem("planlyDataV4") || "null") || JSON.parse(localStorage.getItem("planlyDataV3") || "null") || defaultData;

function save(){ localStorage.setItem("planlyDataV4", JSON.stringify(data)); }
function uid(){ return crypto.randomUUID ? crypto.randomUUID() : Date.now().toString(36); }
function fmtDate(date){ return new Date(date).toLocaleDateString("de-DE"); }
function daysUntil(date){
  const a = new Date(new Date().toISOString().slice(0,10));
  const b = new Date(date);
  return Math.ceil((b-a)/(1000*60*60*24));
}
function avg(nums){
  if(!nums.length) return 0;
  return nums.reduce((a,b)=>a+Number(b),0)/nums.length;
}
function subjectAvg(name){
  return avg(data.grades.filter(g=>g.subject===name).map(g=>g.points));
}
function totalAvg(){
  return avg(data.subjects.map(s=>subjectAvg(s.name)).filter(n=>n>0));
}

document.querySelectorAll(".nav").forEach(btn=>{
  btn.addEventListener("click",()=>{
    document.querySelectorAll(".nav").forEach(b=>b.classList.remove("active"));
    btn.classList.add("active");
    document.querySelectorAll(".page").forEach(p=>p.classList.remove("active"));
    $(btn.dataset.page).classList.add("active");
    render();
  });
});

$("taskForm").addEventListener("submit", e=>{
  e.preventDefault();
  const title = $("taskTitle").value.trim();
  if(!title) return;
  data.tasks.unshift({
    id:uid(),
    title,
    category:$("taskCategory").value,
    priority:$("taskPriority").value,
    date:$("taskDate").value,
    done:false
  });
  $("taskTitle").value="";
  $("taskDate").value="";
  save(); render();
});

$("taskSearch").addEventListener("input", render);
$("taskFilter").addEventListener("change", render);

$("subjectForm").addEventListener("submit", e=>{
  e.preventDefault();
  const name = $("subjectName").value.trim();
  if(!name) return;
  data.subjects.unshift({id:uid(),name,goal:Number($("subjectGoal").value || 12)});
  $("subjectName").value="";
  save(); render();
});

$("examForm").addEventListener("submit", e=>{
  e.preventDefault();
  if(!$("examTitle").value.trim() || !$("examDate").value) return;
  data.exams.unshift({
    id:uid(),
    subject:$("examSubject").value,
    title:$("examTitle").value.trim(),
    date:$("examDate").value,
    priority:$("examPriority").value,
    status:$("examStatus").value
  });
  $("examTitle").value="";
  $("examDate").value="";
  save(); render();
});

$("gradeForm").addEventListener("submit", e=>{
  e.preventDefault();
  data.grades.unshift({
    id:uid(),
    subject:$("gradeSubject").value,
    points:Number($("gradePoints").value),
    type:$("gradeType").value,
    note:$("gradeNote").value.trim(),
    date:today
  });
  $("gradePoints").value=10;
  $("gradeNote").value="";
  save(); render();
});

$("resetData").addEventListener("click",()=>{
  if(confirm("Wirklich alle Daten löschen?")){
    localStorage.removeItem("planlyDataV3");
    localStorage.removeItem("planlyDataV4");
    data = JSON.parse(JSON.stringify(defaultData));
    save(); render();
  }
});

function renderDashboard(){
  const label = new Date().toLocaleDateString("de-DE",{weekday:"long",day:"2-digit",month:"long"});
  $("todayLabel").textContent = label;
  $("sidebarToday").textContent = label;
  const open = data.tasks.filter(t=>!t.done).length;
  const done = data.tasks.filter(t=>t.done).length;
  const progress = data.tasks.length ? Math.round(done/data.tasks.length*100) : 0;
  const todayTasks = data.tasks.filter(t=>t.date===today);
  const futureExams = data.exams.filter(e=>e.date>=today).sort((a,b)=>a.date.localeCompare(b.date));
  const total = totalAvg();

  $("progressValue").textContent = progress + "%";
  $("openTasks").textContent = open;
  $("todayTasks").textContent = todayTasks.length;
  $("examCount").textContent = futureExams.length;
  $("gradeAverage").textContent = total ? total.toFixed(1) : "-";
  $("todayMiniCount").textContent = todayTasks.length;
  $("examMiniCount").textContent = futureExams.length;

  $("todayList").innerHTML = todayTasks.length ? todayTasks.map(t=>`
    <div class="item ${t.done?'done':''}">
      <button class="check" onclick="toggleTask('${t.id}')">${t.done?'✓':''}</button>
      <div class="itemBody"><h3>${t.title}</h3><p>${t.category} · ${t.priority}</p></div>
    </div>`).join("") : `<div class="empty">Heute ist noch nichts eingetragen.</div>`;

  $("examListMini").innerHTML = futureExams.slice(0,4).map(e=>`
    <div class="item">
      <div class="badge">${Math.max(daysUntil(e.date),0)}d</div>
      <div class="itemBody"><h3>${e.subject}: ${e.title}</h3><p>${fmtDate(e.date)} · ${e.status}</p></div>
    </div>`).join("") || `<div class="empty">Keine Klausuren eingetragen.</div>`;
}

function renderTasks(){
  const search = $("taskSearch").value.toLowerCase();
  const filter = $("taskFilter").value;
  const tasks = data.tasks.filter(t=>{
    const s = t.title.toLowerCase().includes(search);
    const f = filter==="Alle" || t.category===filter || t.priority===filter;
    return s && f;
  });
  $("taskList").innerHTML = tasks.map(t=>`
    <div class="item ${t.done?'done':''}">
      <button class="check" onclick="toggleTask('${t.id}')">${t.done?'✓':''}</button>
      <div class="itemBody"><h3>${t.title}</h3><p>${t.category} · ${t.priority}${t.date?' · '+fmtDate(t.date):''}</p></div>
      <button class="delete" onclick="deleteTask('${t.id}')">Löschen</button>
    </div>`).join("") || `<div class="empty">Keine Aufgabe gefunden.</div>`;
}

function renderSubjects(){
  $("subjectCount").textContent = data.subjects.length;
  $("subjectList").innerHTML = data.subjects.map(s=>`
    <div class="item">
      <div class="badge">${s.name.slice(0,1)}</div>
      <div class="itemBody"><h3>${s.name}</h3><p>Ziel: ${s.goal} Punkte · Ø ${subjectAvg(s.name).toFixed(1)}</p></div>
      <button class="delete" onclick="deleteSubject('${s.id}')">Löschen</button>
    </div>`).join("");

  const subjectOptions = data.subjects.map(s=>`<option>${s.name}</option>`).join("");
  $("examSubject").innerHTML = subjectOptions;
  $("gradeSubject").innerHTML = subjectOptions;

  $("examCountFull").textContent = data.exams.length;
  $("examList").innerHTML = data.exams.map(e=>`
    <div class="item">
      <div class="badge">${Math.max(daysUntil(e.date),0)}d</div>
      <div class="itemBody"><h3>${e.subject}: ${e.title}</h3><p>${fmtDate(e.date)} · ${e.priority} · ${e.status}</p></div>
      <button class="delete" onclick="deleteExam('${e.id}')">Löschen</button>
    </div>`).join("") || `<div class="empty">Noch keine Klausuren.</div>`;
}

function renderGrades(){
  const total = totalAvg();
  $("totalAverageBig").textContent = total ? total.toFixed(2) : "-";
  $("gradesCount").textContent = data.grades.length;
  $("subjectsCountGrades").textContent = data.subjects.length;

  $("subjectGradeGrid").innerHTML = data.subjects.map(s=>{
    const a = subjectAvg(s.name);
    const needed = a >= s.goal ? "Ziel erreicht" : "Ziel: " + s.goal + " Punkte";
    return `<div class="gradeCard"><h3>${s.name}</h3><strong>${a?a.toFixed(2):"-"}</strong><p>${needed}</p></div>`;
  }).join("");

  $("gradeList").innerHTML = data.grades.map(g=>`
    <div class="item">
      <div class="badge">${g.points}</div>
      <div class="itemBody"><h3>${g.subject}</h3><p>${g.type} · ${fmtDate(g.date)}${g.note?' · '+g.note:''}</p></div>
      <button class="delete" onclick="deleteGrade('${g.id}')">Löschen</button>
    </div>`).join("") || `<div class="empty">Noch keine Noten.</div>`;
}

window.toggleTask = function(id){
  data.tasks = data.tasks.map(t=>t.id===id ? {...t,done:!t.done} : t);
  save(); render();
}
window.deleteTask = function(id){ data.tasks = data.tasks.filter(t=>t.id!==id); save(); render(); }
window.deleteSubject = function(id){ data.subjects = data.subjects.filter(s=>s.id!==id); save(); render(); }
window.deleteExam = function(id){ data.exams = data.exams.filter(e=>e.id!==id); save(); render(); }
window.deleteGrade = function(id){ data.grades = data.grades.filter(g=>g.id!==id); save(); render(); }

function render(){
  renderDashboard();
  renderTasks();
  renderSubjects();
  renderGrades();
}

render();
