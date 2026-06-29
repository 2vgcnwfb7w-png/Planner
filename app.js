
function show(id){
document.querySelectorAll('.page').forEach(p=>p.classList.remove('active'));
document.getElementById(id).classList.add('active');
}
const tasks=JSON.parse(localStorage.getItem('planlyTasks')||'[]');
function render(){
const ul=document.getElementById('tasksList');
ul.innerHTML='';
tasks.forEach((t,i)=>{
const li=document.createElement('li');
li.innerHTML=t+' <button onclick="delTask('+i+')">✕</button>';
ul.appendChild(li);
});
localStorage.setItem('planlyTasks',JSON.stringify(tasks));
}
function addTask(){
const i=document.getElementById('taskInput');
if(!i.value.trim())return;
tasks.push(i.value);
i.value='';
render();
}
function delTask(i){tasks.splice(i,1);render();}
render();
