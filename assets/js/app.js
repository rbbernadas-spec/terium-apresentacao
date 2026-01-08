
const state = {
  sections: [],
  index: 0,
  flashcards: [],
  mindmap: null,
};

function qs(sel, root=document){ return root.querySelector(sel); }
function qsa(sel, root=document){ return Array.from(root.querySelectorAll(sel)); }

async function loadJSON(path){
  const res = await fetch(path);
  if(!res.ok) throw new Error(`Falha ao carregar ${path}`);
  return await res.json();
}

function clamp(n, a, b){ return Math.max(a, Math.min(b, n)); }

function gotoIndex(i){
  const slides = qsa(".slide");
  const next = clamp(i, 0, slides.length-1);
  slides[state.index]?.classList.remove("active");
  slides[next]?.classList.add("active");
  state.index = next;
  updateFooter();
}

function next(){ gotoIndex(state.index+1); }
function prev(){ gotoIndex(state.index-1); }

function updateFooter(){
  const total = state.sections.length;
  const cur = state.index + 1;
  qs("#counter").textContent = `${cur}/${total}`;
  const s = state.sections[state.index];
  qs("#sectionTitle").textContent = s?.title || "";
}

function wireKeys(){
  window.addEventListener("keydown", (e)=>{
    if(["ArrowRight","PageDown"," "].includes(e.key)){
      e.preventDefault(); next();
    }
    if(["ArrowLeft","PageUp"].includes(e.key)){
      e.preventDefault(); prev();
    }
    if(e.key === "Home") gotoIndex(0);
    if(e.key === "End") gotoIndex(state.sections.length-1);
  });
}

function buildSlide(section){
  const slide = document.createElement("section");
  slide.className = "slide";
  if(section.bg){
    slide.classList.add("has-bg");
    slide.style.backgroundImage = `url(assets/img/${section.bg})`;
  }

  const container = document.createElement("div");
  container.className = "container";

  const kicker = document.createElement("div");
  kicker.className = "kicker";
  kicker.innerHTML = `<span class="dot"></span><span>TERIUM</span>`;
  container.appendChild(kicker);

  const h1 = document.createElement("h1");
  h1.textContent = section.title || "";
  container.appendChild(h1);

  if(section.subtitle){
    const h2 = document.createElement("h2");
    h2.textContent = section.subtitle;
    container.appendChild(h2);
  }

  if(section.type === "mindmap"){
    const hint = document.createElement("div");
    hint.className = "hint";
    hint.textContent = "Dica: clique no + para expandir/ocultar ramos.";
    container.appendChild(hint);

    const wrap = document.createElement("div");
    wrap.className = "tree";
    wrap.id = "mindmapMount";
    container.appendChild(wrap);
  } else if(section.type === "flashcards"){
    const hint = document.createElement("div");
    hint.className = "hint";
    hint.textContent = "Clique em um cartão para virar. Use isso para Q&A com o público.";
    container.appendChild(hint);

    const grid = document.createElement("div");
    grid.className = "cards";
    grid.id = "flashcardsMount";
    container.appendChild(grid);
  } else if(Array.isArray(section.bullets) && section.bullets.length){
    const ul = document.createElement("ul");
    for(const b of section.bullets){
      const li = document.createElement("li");
      li.textContent = b;
      ul.appendChild(li);
    }
    container.appendChild(ul);
  }

  if(section.cta){
    const btn = document.createElement("button");
    btn.className = "primary";
    btn.textContent = section.cta.label || "Ação";
    btn.addEventListener("click", ()=>handleAction(section.cta.action));
    container.appendChild(btn);
  }

  slide.appendChild(container);

  // click anywhere (except buttons/interactive) to advance
  slide.addEventListener("click", (e)=>{
    const tag = (e.target?.tagName || "").toLowerCase();
    if(tag === "button" || e.target?.closest(".toggle") || e.target?.closest(".card3d")) return;
    next();
  });

  return slide;
}

function handleAction(action){
  if(!action) return;
  if(action.startsWith("goto:")){
    const id = action.split(":")[1];
    const idx = state.sections.findIndex(s => s.id === id);
    if(idx >= 0) gotoIndex(idx);
  }
}

function renderFlashcards(){
  const mount = qs("#flashcardsMount");
  if(!mount) return;
  mount.innerHTML = "";
  const cards = state.flashcards.slice(0, 24); // cap for layout (can increase)
  for(const c of cards){
    const wrap = document.createElement("div");
    wrap.className = "card3d";
    wrap.tabIndex = 0;

    const inner = document.createElement("div");
    inner.className = "inner";

    const front = document.createElement("div");
    front.className = "face front";
    front.innerHTML = `<div class="label">Pergunta</div><div class="text">${escapeHTML(c.front || "")}</div><div class="small">Clique para virar</div>`;

    const back = document.createElement("div");
    back.className = "face back";
    back.innerHTML = `<div class="label">Resposta</div><div class="text">${escapeHTML(c.back || "")}</div><div class="small">Clique para voltar</div>`;

    inner.appendChild(front);
    inner.appendChild(back);
    wrap.appendChild(inner);

    const toggle = ()=>wrap.classList.toggle("flipped");
    wrap.addEventListener("click", toggle);
    wrap.addEventListener("keydown", (e)=>{
      if(e.key === "Enter" || e.key === " "){
        e.preventDefault(); toggle();
      }
    });

    mount.appendChild(wrap);
  }
}

function escapeHTML(s){
  return String(s)
    .replaceAll("&","&amp;")
    .replaceAll("<","&lt;")
    .replaceAll(">","&gt;")
    .replaceAll('"',"&quot;")
    .replaceAll("'","&#039;");
}

function renderMindmap(){
  const mount = qs("#mindmapMount");
  if(!mount) return;
  mount.innerHTML = "";
  if(!state.mindmap) return;

  const rootUl = document.createElement("ul");
  const rootLi = buildTreeNode(state.mindmap, true);
  rootUl.appendChild(rootLi);
  mount.appendChild(rootUl);
}

function buildTreeNode(node, isRoot=false){
  const li = document.createElement("li");
  li.classList.add("expanded");

  const hasChildren = Array.isArray(node.children) && node.children.length > 0;

  const pill = document.createElement("div");
  pill.className = "node" + (isRoot ? " root" : "");
  const toggle = document.createElement("div");
  toggle.className = "toggle";
  toggle.innerHTML = `<span>${hasChildren ? "−" : "•"}</span>`;
  toggle.setAttribute("role","button");
  toggle.setAttribute("aria-label", hasChildren ? "Expandir/ocultar" : "Item");
  if(!hasChildren){
    toggle.style.opacity = .6;
    toggle.style.cursor = "default";
  }

  const title = document.createElement("div");
  title.className = "node-title";
  title.textContent = node.title || "";

  pill.appendChild(toggle);
  pill.appendChild(title);

  li.appendChild(pill);

  if(hasChildren){
    const ul = document.createElement("ul");
    for(const c of node.children){
      ul.appendChild(buildTreeNode(c, false));
    }
    li.appendChild(ul);

    const setCollapsed = (collapsed)=>{
      li.classList.toggle("collapsed", collapsed);
      toggle.querySelector("span").textContent = collapsed ? "+" : "−";
    };

    toggle.addEventListener("click", (e)=>{
      e.stopPropagation();
      const collapsed = li.classList.toggle("collapsed");
      toggle.querySelector("span").textContent = collapsed ? "+" : "−";
    });

    // Start with level-1 expanded, deeper collapsed for clarity
    if(!isRoot){
      // heuristic: collapse grandchildren depth>=2
      // If this node is a top-level branch, keep expanded; otherwise collapse
      const depth = getDepth(li);
      if(depth >= 3) setCollapsed(true);
    }
  }

  return li;
}

function getDepth(li){
  let d = 0, cur = li;
  while(cur){
    if(cur.tagName && cur.tagName.toLowerCase() === "li") d++;
    cur = cur.parentElement;
    if(cur && cur.classList && cur.classList.contains("tree")) break;
  }
  return d;
}

async function init(){
  const sectionsData = await loadJSON("data/sections.json");
  const flashcardsData = await loadJSON("data/flashcards.json");
  const mindmapData = await loadJSON("data/mindmap.json");

  state.sections = sectionsData.sections || [];
  state.flashcards = (flashcardsData.cards || []).filter(c => (c.front||c.back));
  state.mindmap = mindmapData;

  const app = qs("#app");
  for(const s of state.sections){
    app.appendChild(buildSlide(s));
  }
  // activate first
  qsa(".slide")[0]?.classList.add("active");
  updateFooter();
  wireKeys();

  // render dynamic sections after mounting
  renderMindmap();
  renderFlashcards();
}

init().catch(err=>{
  console.error(err);
  qs("#app").innerHTML = `
    <div style="padding:24px; color:#fff; font-family:system-ui">
      <h2>Erro ao carregar a apresentação</h2>
      <p>${err.message}</p>
      <p>Se você abriu o arquivo diretamente (file://), alguns navegadores bloqueiam fetch(). Rode via GitHub Pages ou um servidor local.</p>
    </div>`;
});
