import { allLessons } from "../content/courses.js";

const icons = {home:"⌂",board:"♟",courses:"▦",trainer:"🎯",analysis:"⌁",progress:"◒"};

export class AppShell {
  constructor(app, root = document.body) {
    this.app = app;
    this.root = root;
    this.root.addEventListener("rebel:navigate", e => this.renderPage(e.detail));
  }

  mount() {
    this.root.innerHTML = `
      <div class="rebel-shell">
        <aside class="rebel-sidebar" aria-label="Rebel Chess navigation">
          <div class="rebel-brand"><strong>REBEL</strong><span>CLASSIC CHESS</span></div>
          <nav class="rebel-nav">
            ${Object.entries(icons).map(([id,icon]) => `<button data-page="${id}" class="rebel-nav-item"><span>${icon}</span><b>${id[0].toUpperCase()+id.slice(1)}</b></button>`).join("")}
          </nav>
          <div class="rebel-sidebar-card"><b>Keep improving</b><span>${allLessons().length} lessons ready</span></div>
        </aside>
        <main class="rebel-main">
          <header class="rebel-header"><div><span class="eyebrow">REBEL CHESS</span><h1 id="pageTitle">Home</h1></div><div class="rebel-status" id="engineStatus">Starting engine…</div></header>
          <section id="rebel-page" class="rebel-page"></section>
        </main>
      </div>`;
    this.root.querySelectorAll("[data-page]").forEach(btn => btn.addEventListener("click", () => this.app.router.go(btn.dataset.page)));
    this.app.router.go("home");
  }

  renderPage(id) {
    const title = id[0].toUpperCase()+id.slice(1);
    const titleEl = this.root.querySelector("#pageTitle");
    if (titleEl) titleEl.textContent = title;
    const page = this.root.querySelector("#rebel-page");
    if (!page) return;
    if (id === "home") page.innerHTML = `
      <div class="hero-card"><span class="eyebrow">WELCOME BACK</span><h2>Learn chess. Play chess. Become dangerous.</h2><p>Courses, drills, games and engine-powered review in one Rebel workflow.</p><button data-page="courses" class="primary">Explore Courses</button></div>
      <div class="metric-grid"><div><b>${allLessons().length}</b><span>Lessons</span></div><div><b>∞</b><span>Drills</span></div><div><b>SF</b><span>Analysis</span></div></div>`;
    else if (id === "courses") page.innerHTML = `
      <div class="section-heading"><div><span class="eyebrow">LEARN</span><h2>Courses</h2></div><span>${Object.keys(this.app.courses).length} courses</span></div>
      <div class="course-grid">${Object.values(this.app.courses).map(c => `<article class="course-card"><span class="course-tag">${c.category}</span><h3>${c.title}</h3><p>${c.chapters.length} chapters · ${c.chapters.reduce((n,x)=>n+x.lessons.length,0)} lessons</p><button data-course="${c.id}" class="secondary">Open course</button></article>`).join("")}</div>`;
    else if (id === "progress") {
      const p=this.app.storage.progress();
      page.innerHTML=`<div class="hero-card"><span class="eyebrow">YOUR PROGRESS</span><h2>Build a stronger game.</h2><div class="metric-grid"><div><b>${p.xp}</b><span>XP</span></div><div><b>${p.lessons}</b><span>Lessons</span></div><div><b>${p.games}</b><span>Games</span></div><div><b>${p.analysis}</b><span>Analyses</span></div></div></div>`;
    } else {
      page.innerHTML=`<div class="empty-state"><span class="eyebrow">${title.toUpperCase()}</span><h2>${title} workspace</h2><p>The v2 shell is connected. This feature is now ready to be migrated from the legacy runtime without sharing state with other workspaces.</p></div>`;
    }
  }
}
