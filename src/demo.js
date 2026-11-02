import { iso, P2, ws } from './utils'

export function demoData(kind,T){
 const pro=kind==='pro',td=iso(T),y=T.getFullYear(),mo=T.getMonth();let sd=pro?11:5;
 const rnd=()=>(sd=(sd*1664525+1013904223)%4294967296)/4294967296,add=(d,n)=>{const x=new Date(d);x.setDate(x.getDate()+n);return x},at=(n,h)=>iso(add(T,n))+'T'+h,
 A=pro?['Work','Learning','Health','Personal','Side project','Review']:['Classes','Study','Health','Personal','Projects','Review'],C=['#3b82f6','#10b981','#f59e0b','#a78bfa','#fb923c','#94a3b8'],
 ar=A.map((n,i)=>({id:'a'+(i+1),n,c:C[i]})),
 tpl=pro?[{s:'09:00',e:'12:00',a:'a1',t:'Deep work: top priority'},{s:'13:00',e:'15:00',a:'a1',t:'Meetings and email'},{s:'15:30',e:'17:00',a:'a1',t:'Project tasks and reviews'},{s:'18:00',e:'19:00',a:'a3',t:'Gym or run'},{s:'20:00',e:'21:00',a:'a2',t:'Online course or reading'},{s:'21:00',e:'21:30',a:'a6',t:'Review the day, plan tomorrow'}]
 :[{s:'08:00',e:'10:00',a:'a1',t:'Lectures'},{s:'10:30',e:'12:30',a:'a2',t:'Focused study block'},{s:'14:00',e:'15:30',a:'a5',t:'Assignment or project work'},{s:'17:00',e:'18:00',a:'a3',t:'Workout or walk'},{s:'19:30',e:'21:00',a:'a2',t:'Revision and practice problems'},{s:'21:00',e:'21:30',a:'a6',t:'Review the day, plan tomorrow'}],
 now=T.getHours()*60+T.getMinutes(),mm=s=>+s.slice(0,2)*60+ +s.slice(3),wf={},fac=d=>{const k=ws(d);if(wf[k]===undefined)wf[k]=0.6+0.4*rnd();return wf[k]},tk=[];
 for(let k=-3;k<=0;k++)for(let d=1,nd=new Date(y,mo+k+1,0).getDate();d<=nd;d++){const dt=new Date(y,mo+k,d),ds=iso(dt),dow=dt.getDay(),bl=dow===0?[]:dow===6?tpl.filter(b=>b.a==='a3'||b.a==='a6'):tpl;
  bl.forEach((b,j)=>{const x=ds<td?rnd()<fac(ds)*0.95:ds===td?(mm(b.e)<now&&rnd()<0.9):false;tk.push({id:'dm'+ds.replace(/-/g,'')+j,d:ds,s:b.s,e:b.e,a:b.a,t:b.t,x})})}
 (pro?[[-3,'11:00','11:30','a1','Send weekly status report'],[-1,'14:00','14:45','a1','Code review for a teammate'],[0,'16:00','17:00','a1','Prepare sprint demo slides'],[1,'12:00','13:00','a4','Dentist appointment'],[3,'19:00','20:00','a5','Update portfolio and CV'],[4,'10:00','10:30','a4','Book travel for the conference']]
  :[[-4,'16:00','17:00','a5','Group project meeting'],[-1,'11:00','11:30','a4','Library: return books'],[0,'13:00','14:00','a2','Submit lab report'],[2,'15:00','16:00','a2','Quiz revision with past papers'],[4,'10:00','10:30','a1','Email professor about thesis topic'],[5,'12:00','13:00','a5','Print poster for presentation']])
  .forEach(([o,s,e,a,t],i)=>tk.push({id:'do'+i,d:iso(add(T,o)),s,e,a,t,x:o<0}));
 const first=iso(new Date(y,mo,1)),df=[['d1','06:30','07:00','a4','Wake up, water, no phone for 30 min'],['d2','12:30','13:00','a3','Lunch away from the screen'],['d3','22:00','22:30','a4','Phone away, read 20 pages, sleep']].map(([id,s,e,a,t])=>({id,s,e,a,t,f:first,u:y+'-12-31',w:[0,1,2,3,4,5,6]})),dx={},pd={};
 for(let i=1;i<=90;i++){const ds=iso(add(T,-i));if(ds>=first)df.forEach(f=>{if(rnd()<0.78)dx[f.id+'|'+ds]=true});let b=0;for(let k=0;k<5;k++)if(rnd()<0.85)b|=1<<k;pd[ds]=b}
 const gl=[],nd0=new Date(y,mo+1,0).getDate(),pm=T.getDate()/nd0,pw=(T.getDay()+1)/7,pq=((mo%3)*30.4+T.getDate())/91.5,ph=((mo%6)*30.4+T.getDate())/183,py=(mo*30.4+T.getDate())/365,
 G=(l,p,a,t,tg,u,fr)=>gl.push({id:'dg'+gl.length,l,p,t,a,tg,u,cu:Math.min(tg,Math.round(tg*fr*(0.8+0.35*rnd())))}),
 M=y+'-'+P2(mo+1),W=ws(td),Q=y+'-Q'+(Math.floor(mo/3)+1),H=y+'-H'+(mo<6?1:2),Y=''+y;
 if(pro){G('M',M,'a1','Ship the main feature',1,'',pm);G('M',M,'a1','Close tickets',20,'tickets',pm);G('M',M,'a2','Online course lessons',12,'lessons',pm);G('M',M,'a3','Gym sessions',12,'sessions',pm);G('M',M,'a4','Read books',2,'books',pm);
  G('W',W,'a1','Deep-work hours',20,'hours',pw);G('W',W,'a3','Gym sessions',3,'sessions',pw);G('W',W,'a1','Networking coffee or 1:1',1,'',pw);G('W',W,'a6','Weekly review and plan',1,'',pw>0.8?1:0);
  G('Q',Q,'a1','Deliver 3 key results',3,'results',pq);G('Q',Q,'a2','Certification prep',1,'',pq);G('Q',Q,'a3','Gym sessions',36,'sessions',pq);G('Q',Q,'a4','Read books',6,'books',pq);
  G('H',H,'a2','Complete 2 certifications',2,'',ph);G('H',H,'a1','Present at a team or industry event',1,'',ph);G('H',H,'a4','Read books',12,'books',ph);
  G('Y',Y,'a5','Portfolio of 3 case studies',3,'case studies',py);G('Y',Y,'a5','Launch a side project',1,'',py);G('Y',Y,'a3','Workout sessions',150,'sessions',py);G('Y',Y,'a4','Read books',24,'books',py)}
 else{G('M',M,'a2','Finish lecture chapters',12,'chapters',pm);G('M',M,'a5','Submit assignments',3,'assignments',pm);G('M',M,'a3','Workout sessions',12,'sessions',pm);G('M',M,'a4','Read books',2,'books',pm);G('M',M,'a5','Project milestone: working prototype',1,'',pm);
  G('W',W,'a2','Study hours',15,'hours',pw);G('W',W,'a3','Workouts',3,'sessions',pw);G('W',W,'a2','Revise chapters',4,'chapters',pw);G('W',W,'a6','Weekly review and plan',1,'',pw>0.8?1:0);
  G('Q',Q,'a5','Complete 2 portfolio projects',2,'projects',pq);G('Q',Q,'a4','Read books',6,'books',pq);G('Q',Q,'a3','Workout sessions',36,'sessions',pq);G('Q',Q,'a2','Finish all semester courses',5,'courses',pq);
  G('H',H,'a5','Apply for internships',5,'applications',ph);G('H',H,'a2','Finish an online certification',1,'',ph);G('H',H,'a4','Read books',12,'books',ph);
  G('Y',Y,'a2','Earn 2 certifications',2,'',py);G('Y',Y,'a3','Workout sessions',150,'sessions',py);G('Y',Y,'a4','Read books',24,'books',py);G('Y',Y,'a5','Ship a personal project',1,'',py)}
 const fri=((5-T.getDay()+7)%7)||7,ev=(pro?[['Certification exam',12,'10:00','o','x'],['Quarterly planning',4,'10:00','o','e'],['Report due to manager',2,'17:00','o','a'],['Client proposal deadline',8,'12:00','o','a'],['Sprint demo',fri,'16:00','w','e'],['Timesheet submission',7,'09:00','m','e'],['Team offsite',15,'09:00','o','e'],['Work anniversary lunch',40,'12:30','y','e']]
  :[['Midterm exam: Data Structures',6,'10:00','o','x'],['Calculus quiz',2,'09:00','o','x'],['Lab report due',3,'17:00','o','a'],['Project proposal due',9,'23:00','o','a'],['Study group',1,'18:00','w','e'],['Club meeting',5,'17:30','m','e'],['Family birthday dinner',20,'19:00','y','e']])
  .map(([n,o,h,r,k],i)=>({id:'de'+i,n,t:at(o,h),r,k}));
 return{ar,tpl,tk,gl,ev,df,dx,im:pro?{do2:1,do5:1}:{do2:1,do4:1},pr:{reg:'Dhaka',asr:'hanafi',d:pd}}}
