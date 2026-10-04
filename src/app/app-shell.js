import { allLessons } from "../content/courses.js";
import { drills } from "../content/drills.js";
import { BoardView } from "../ui/board-view.js";
import { DrillSession } from "../training/drill-session.js";
import { ReviewSession } from "../training/review-session.js";
import { GameState, START_FEN } from "../chess/game-state.js";

const courseMeta = [
  { id:"foundations", label:"Beginner", stage:"Opening · Middlegame · Endgame" },
  { id:"opening", label:"Opening", stage:"Opening" },
  { id:"engine", label:"Skills", stage:"Analysis" }
];

export class AppShell {
  constructor(app, root=document.body) {
    this.app=app; this.root=root; this.board=null; this.session=null;
    this.root.addEventListener("rebel:navigate", e=>this.renderPage(e.detail));
  }

  mount() {
    this.root.innerHTML=`<div class="rebel-shell">
      <aside class="rebel-sidebar" aria-label="Rebel Chess navigation">
        <div class="rebel-brand"><strong>REBEL</strong><span>CLASSIC CHESS</span></div>
        <nav class="rebel-nav">
          ${["home","courses","trainer","board","analysis","progress"].map(id=>`<button data-page="${id}" class="rebel-nav-item"><span>•</span><b>${id[0].toUpperCase()+id.slice(1)}</b></button>`).join("")}
        </nav>
        <div class="rebel-sidebar-card"><b>Learn at your pace</b><span>${allLessons().length} lessons · ${drills.length} drills</span></div>
      </aside>
      <main class="rebel-main">
        <header class="rebel-header"><div><span class="eyebrow">REBEL CHESS</span><h1 id="pageTitle">Home</h1></div><div class="rebel-status">Stockfish ready</div></header>
        <section id="rebel-page" class="rebel-page"></section>
      </main>
    </div>`;
    this.root.querySelectorAll("[data-page]").forEach(b=>b.onclick=()=>this.app.router.go(b.dataset.page));
    this.app.router.go("home");
  }

  renderPage(id) {
    const page=this.root.querySelector("#rebel-page");
    this.root.querySelector("#pageTitle").textContent=id[0].toUpperCase()+id.slice(1);
    this.session=null; this.board=null;
    if(id==="home") return this.home(page);
    if(id==="courses") return this.courses(page);
    if(id==="trainer") return this.trainer(page);
    if(id==="board") return this.workspace(page,"Play");
    if(id==="analysis") return this.analysis(page);
    return this.progress(page);
  }

  home(page) {
    const p=this.app.storage.progress();
    page.innerHTML=`<div class="home-grid">
      <section class="hero-card"><span class="eyebrow">YOUR CHESS JOURNEY</span><h2>Learn, drill, and improve one position at a time.</h2><p>Rebel uses a course-first learning flow with chapters, studies, quizzes, drills and an analysis board.</p><div class="home-actions"><button class="primary" data-page="courses">Browse courses</button><button class="secondary" data-page="trainer">Train now</button></div></section>
      <aside class="progress-card"><span class="eyebrow">YOUR PROGRESS</span><strong>${p.xp} XP</strong><span>${p.lessons} lessons · ${p.tactics} drills · ${p.analysis} reviews</span><div class="progress-track"><i style="width:${Math.min(100,p.lessons*10)}%"></i></div></aside>
    </div>
    <div class="section-heading"><div><span class="eyebrow">CONTINUE LEARNING</span><h2>Courses</h2></div><button class="secondary" data-page="courses">See all</button></div>
    <div class="course-grid">${Object.values(this.app.courses).map((c,i)=>this.courseCard(c,i===0)).join("")}</div>
    <div class="feature-grid">
      <button class="feature-card" data-page="trainer"><b>Drill Shuffle</b><span>Jump into a random training position.</span></button>
      <button class="feature-card" data-page="analysis"><b>Analysis Board</b><span>Play a line, then compare it with Stockfish.</span></button>
      <button class="feature-card" data-page="board"><b>Play</b><span>Use the full board workspace for your own games.</span></button>
    </div>`;
    page.querySelectorAll("[data-page]").forEach(b=>b.onclick=()=>this.app.router.go(b.dataset.page));
  }

  courseCard(c, featured=false) {
    const meta=courseMeta.find(x=>x.id===c.id)||{};
    const lessons=c.chapters.reduce((n,x)=>n+x.lessons.length,0);
    return `<article class="course-card ${featured?"featured":""}"><span class="course-tag">${meta.label||c.category}</span><h3>${c.title}</h3><p>${meta.stage||"Chess skills"} · ${c.chapters.length} chapters · ${lessons} lessons</p><div class="course-footer"><span>Free sample</span><button class="secondary" data-course="${c.id}">Learn more</button></div></article>`;
  }

  courses(page) {
    page.innerHTML=`<div class="course-hero"><div><span class="eyebrow">ALL COURSES</span><h2>Build your chess knowledge.</h2><p>Filter by level and stage, then work through chapters in order.</p></div><div class="filter-row"><button class="filter active">All</button><button class="filter">Beginner</button><button class="filter">Intermediate</button><button class="filter">Opening</button><button class="filter">Middlegame</button><button class="filter">Endgame</button></div></div><div class="course-grid">${Object.values(this.app.courses).map(c=>this.courseCard(c)).join("")}</div><div id="course-detail"></div>`;
    page.querySelectorAll("[data-course]").forEach(b=>b.onclick=()=>this.openCourse(page,b.dataset.course));
  }

  openCourse(page,id) {
    const course=this.app.courses[id];
    const lessons=course.chapters.flatMap((chapter,chapterIndex)=>chapter.lessons.map(lesson=>({...lesson,chapterTitle:chapter.title,chapterIndex})));
    page.querySelector("#course-detail").innerHTML=`<section class="course-detail"><div class="course-detail-head"><div><span class="eyebrow">${course.category.toUpperCase()}</span><h2>${course.title}</h2><p>${course.chapters.length} chapters · ${lessons.length} lessons · drills · quizzes · analysis board</p></div><button class="primary" data-start>Start course</button></div><div class="chapter-list">${course.chapters.map((ch,ci)=>`<article class="chapter"><div class="chapter-head"><span>CHAPTER ${ci+1}</span><b>${ch.title}</b></div><div class="lesson-list">${ch.lessons.map(l=>`<button class="lesson-row" data-lesson="${l.id}"><span>○</span><span>${l.title}</span><small>Study</small></button>`).join("")}</div></article>`).join("")}</div><div id="lesson-workspace"></div></section>`;
    page.querySelector("[data-start]").onclick=()=>this.openLesson(page,lessons[0],lessons,0);
    page.querySelectorAll("[data-lesson]").forEach(b=>b.onclick=()=>{const i=lessons.findIndex(x=>x.id===b.dataset.lesson);this.openLesson(page,lessons[i],lessons,i);});
  }

  openLesson(page,lesson,lessons,index) {
    const mount=page.querySelector("#lesson-workspace");
    const state=new GameState(lesson.fen);
    mount.innerHTML=`<div class="lesson-view"><div class="lesson-copy"><span class="eyebrow">CHAPTER ${lesson.chapterIndex+1}</span><h3>${lesson.title}</h3><p>${lesson.description}</p><div class="lesson-step"><b>${index+1}</b><span>Make a move on the board. Then continue when you're ready.</span></div><div id="lesson-status">Your position is ready.</div><button class="primary" data-next>${index<lessons.length-1?"Next lesson":"Complete course"}</button></div><div id="lesson-board"></div></div>`;
    this.board=new BoardView({state});
    this.board.onMove=()=>mount.querySelector("#lesson-status").textContent="Move recorded. Review the position, then continue.";
    this.board.mount(mount.querySelector("#lesson-board"));
    mount.querySelector("[data-next]").onclick=()=>{
      const progress=this.app.storage.progress();
      this.app.storage.updateProgress({lessons:Math.max(progress.lessons,index+1),xp:progress.xp+5});
      if(index<lessons.length-1)this.openLesson(page,lessons[index+1],lessons,index+1);
      else mount.querySelector("#lesson-status").textContent="Course complete. Great work.";
    };
  }

  trainer(page) {
    page.innerHTML=`<div class="course-hero"><div><span class="eyebrow">TRAINING</span><h2>Drill Shuffle</h2><p>Pick a skill or jump into a random position. Correct moves earn XP.</p></div><button class="primary" data-random>Shuffle drill</button></div><div class="course-grid">${drills.map(d=>`<article class="course-card"><span class="course-tag">${d.category}</span><h3>${d.title}</h3><p>${d.description}</p><button class="secondary" data-drill="${d.id}">Start drill</button></article>`).join("")}</div><div id="trainer-workspace"></div>`;
    page.querySelector("[data-random]").onclick=()=>this.startDrill(page,drills[Math.floor(Math.random()*drills.length)].id);
    page.querySelectorAll("[data-drill]").forEach(b=>b.onclick=()=>this.startDrill(page,b.dataset.drill));
  }

  async startDrill(page,id) {
    const drill=drills.find(d=>d.id===id), mount=page.querySelector("#trainer-workspace");
    mount.innerHTML=`<div class="lesson-view"><div class="lesson-copy"><span class="eyebrow">DRILL</span><h3>${drill.title}</h3><p>${drill.description}</p><div id="trainer-status">Finding the best move…</div><button class="secondary" data-shuffle>Another drill</button></div><div id="trainer-board"></div></div>`;
    this.session=new DrillSession(drill,this.app.engine);
    this.board=new BoardView({state:this.session.state});
    this.board.onMove=move=>{
      const played=move.from+move.to+(move.promotion||"");
      if(!this.session.target){mount.querySelector("#trainer-status").textContent="Still analyzing…";return;}
      if(played===this.session.target){
        this.session.status="Correct — best move.";
        const p=this.app.storage.progress();
        this.app.storage.updateProgress({tactics:p.tactics+1,xp:p.xp+10});
      } else {
        this.session.status="Try again — that wasn't the target.";
        this.session.state.reset(drill.fen); this.board.render();
      }
      mount.querySelector("#trainer-status").textContent=this.session.status;
    };
    this.board.mount(mount.querySelector("#trainer-board"));
    mount.querySelector("[data-shuffle]").onclick=()=>this.startDrill(page,drills[Math.floor(Math.random()*drills.length)].id);
    try { await this.session.prepare(); mount.querySelector("#trainer-status").textContent=this.session.status; }
    catch { mount.querySelector("#trainer-status").textContent="Engine unavailable. Try again."; }
  }

  workspace(page,label) {
    const state=new GameState();
    page.innerHTML=`<div class="section-heading"><div><span class="eyebrow">PLAY</span><h2>${label}</h2></div><button class="secondary" data-page="analysis">Analyze position</button></div><div class="rebel-workspace"><div id="rebel-board-mount"></div><aside class="rebel-panel"><h3>Game</h3><p>Play a position, then send it to the analysis board.</p><div id="workspaceMoves">No moves yet.</div></aside></div>`;
    this.board=new BoardView({state});
    this.board.onMove=()=>page.querySelector("#workspaceMoves").textContent=state.history().join(" ")||"No moves yet.";
    this.board.mount(page.querySelector("#rebel-board-mount"));
    page.querySelector("[data-page]").onclick=()=>this.app.router.go("analysis");
  }

  async analysis(page) {
    const state=new GameState();
    page.innerHTML=`<div class="section-heading"><div><span class="eyebrow">ANALYSIS BOARD</span><h2>Review your moves</h2></div><button class="secondary" data-new>New analysis</button></div><div class="rebel-workspace"><div id="analysis-board"></div><aside class="rebel-panel"><h3>Game Review</h3><p id="analysis-status">Make moves, then analyze the position.</p><button class="primary" data-review>Analyze with Stockfish</button><div id="analysis-report"></div></aside></div>`;
    this.board=new BoardView({state});
    this.board.mount(page.querySelector("#analysis-board"));
    page.querySelector("[data-new]").onclick=()=>{state.reset();this.board.render();page.querySelector("#analysis-report").innerHTML="";};
    page.querySelector("[data-review]").onclick=async()=>{
      const moves=state.history();
      if(!moves.length){page.querySelector("#analysis-status").textContent="Make at least one move first.";return;}
      page.querySelector("#analysis-status").textContent="Analyzing…";
      const session=new ReviewSession(START_FEN,moves,this.app.engine);
      try {
        const results=await session.run();
        page.querySelector("#analysis-report").innerHTML=results.map(r=>`<div class="analysis-row"><b>${r.ply}. ${r.move}</b><span>${r.classification}</span><small>best ${r.best}</small></div>`).join("");
        page.querySelector("#analysis-status").textContent="Review complete.";
        const p=this.app.storage.progress();this.app.storage.updateProgress({analysis:p.analysis+1,xp:p.xp+5});
      } catch { page.querySelector("#analysis-status").textContent="Analysis cancelled or unavailable."; }
    };
  }

  progress(page) {
    const p=this.app.storage.progress();
    page.innerHTML=`<div class="hero-card"><span class="eyebrow">PROGRESS TRACKER</span><h2>Keep improving.</h2><div class="metric-grid"><div><b>${p.xp}</b><span>XP</span></div><div><b>${p.lessons}</b><span>Lessons</span></div><div><b>${p.tactics}</b><span>Drills</span></div><div><b>${p.analysis}</b><span>Reviews</span></div></div><div class="achievement-row"><div><b>First Steps</b><span>Complete a lesson</span></div><div><b>Sharp Eye</b><span>Complete a drill</span></div><div><b>Analyst</b><span>Review a game</span></div></div></div>`;
  }
}
