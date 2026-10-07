/* Project content has one home: the native disclosures in craft.html.
   Opening a project temporarily moves its article into a native modal, then
   returns it on close. No duplicated copy, hidden-only content, or video clones. */
(() => {
  const dialog = document.getElementById('craftDialog');
  const host = document.getElementById('craftDialogContent');
  const panel = dialog.querySelector('.dialog-panel');
  const index = document.getElementById('craftIndex');
  const world = document.getElementById('craftWorld');
  const controls = document.querySelector('.craft-controls');
  const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)');
  const entries = Array.from(document.querySelectorAll('[data-project-id]'), (entry) => ({
    id: entry.dataset.projectId,
    title: entry.querySelector('.project-name').textContent,
    kind: entry.querySelector('.project-kind').textContent,
    status: entry.dataset.projectStatus || '',
    entry,
    article: entry.querySelector('[data-craft-project]'),
  }));
  let active = null;
  let returnFocus = null;
  const mediaControllers = [];

  // Original cover videos load when a project opens, never on village arrival.
  // Per-cover data-autoplay="false" / data-loop="false" can override these defaults.
  const MEDIA = {autoplay:true, loop:true};
  function createMedia(root) {
    const video=root.querySelector('video');
    const stage=root.querySelector('.craft-media-stage');
    const poster=root.querySelector('.craft-media-poster');
    const fallback=root.querySelector('.craft-media-fallback');
    // The still remains a no-JS/loading/error fallback, never a separate preview step.
    video.poster=poster.getAttribute('src');poster.hidden=true;video.hidden=false;
    video.controls=false;
    const status=document.createElement('p');status.className='craft-media-status';status.setAttribute('role','status');
    root.append(status);fallback.hidden=true;
    let revision=0,pending=false,failed=false,activeMedia=false;
    function sync() {
      stage.setAttribute('aria-busy',String(pending));
    }
    function pause() {revision++;pending=false;video.pause();sync();}
    function fail() {
      pause();failed=true;fallback.hidden=false;
      status.textContent='This video couldn’t load. You can open the original video below.';
    }
    async function play() {
      if(!activeMedia||document.hidden||pending)return;
      pauseVideos(video);
      const attempt=++revision;pending=true;failed=false;status.textContent='';fallback.hidden=true;
      // Keep the existing source and currentTime. Native looping waits for the
      // entire file; returning to a tab must not restart or truncate the clip.
      sync();
      try {
        await video.play();
        if(attempt!==revision)return;
        pending=false;
        if(document.hidden||!activeMedia){pause();return;}
        sync();
      } catch(error) {
        if(attempt!==revision)return;
        pending=false;
        if(error.name==='NotAllowedError'){
          fallback.hidden=false;status.textContent='You can open the full video below.';sync();
        }else if(error.name==='AbortError'){sync();}
        else fail();
      }
    }
    function resume() {
      if(!activeMedia)return;
      const autoplay=root.dataset.autoplay?root.dataset.autoplay==='true':MEDIA.autoplay;
      if(!autoplay||reducedMotion.matches){pause();fallback.hidden=false;return;}
      if(!document.hidden&&!failed&&!video.ended&&video.paused)play();
    }
    function activate() {
      if(activeMedia){resume();return;}
      activeMedia=true;failed=false;video.muted=true;
      video.loop=root.dataset.loop?root.dataset.loop==='true':MEDIA.loop;
      video.preload='auto';video.src=video.dataset.craftSrc;video.load();
      status.textContent='';fallback.hidden=true;sync();
      resume();
    }
    function reset() {
      activeMedia=false;pause();failed=false;
      // Release the decoder and unfinished network work when the card closes.
      const loaded=video.hasAttribute('src');video.removeAttribute('src');if(loaded)video.load();
      video.preload='none';video.muted=true;status.textContent='';fallback.hidden=true;sync();
    }
    video.addEventListener('error',()=>{if(activeMedia&&video.hasAttribute('src'))fail();});
    sync();
    return {video,activate,pause,resume,reset};
  }
  entries.forEach(({ article }) => article.querySelectorAll('[data-craft-media]').forEach((root) => mediaControllers.push(createMedia(root))));
  entries.forEach(({entry,article})=>entry.addEventListener('toggle',()=>{
    if(entry.open&&typeof dialog.showModal!=='function'){
      mediaControllers.forEach(controller=>{if(article.contains(controller.video)&&!controller.video.hasAttribute('src'))controller.activate();});
    }else if(!entry.open){
      mediaControllers.forEach(controller=>{if(article.contains(controller.video))controller.reset();});
    }
  }));
  if (typeof dialog.showModal === 'function') {
    entries.forEach(({ entry }) => entry.querySelector('summary').setAttribute('aria-haspopup', 'dialog'));
  }

  function setView(view) {
    const showWorld = view === 'world' && world.dataset.ready === 'true';
    world.hidden = !showWorld;
    index.hidden = showWorld;
    document.body.classList.toggle('is-world-view', showWorld);
    controls.hidden = !showWorld;
    document.dispatchEvent(new CustomEvent('craft:view', { detail: { view: showWorld ? 'world' : 'index' } }));
  }

  function pauseVideos(except = null) {
    mediaControllers.forEach((controller) => { if (controller.video !== except) controller.pause(); });
  }

  function restoreArticle() {
    pauseVideos();
    if (active) {
      mediaControllers.forEach((controller) => { if (active.article.contains(controller.video)) controller.reset(); });
      active.article.classList.remove('is-active');
      active.entry.append(active.article);
    }
    active = null;
    document.body.classList.remove('dialog-open');
  }

  function openProject(id, trigger = document.activeElement) {
    const project = entries.find((entry) => entry.id === id);
    if (!project) return;
    if(active===project&&dialog.open)return;
    // Older browsers keep the same readable disclosure instead of a broken modal.
    if (typeof dialog.showModal !== 'function') {
      setView('index');
      project.entry.open = true;
      mediaControllers.forEach(controller=>{if(project.article.contains(controller.video))controller.activate();});
      project.entry.scrollIntoView({ behavior: 'instant', block: 'start' });
      return;
    }
    if (active) restoreArticle();
    returnFocus = trigger;
    active = project;
    host.append(project.article);
    project.article.classList.add('is-active');
    dialog.setAttribute('aria-labelledby', project.article.querySelector('h2').id);
    try {
      if (!dialog.open) dialog.showModal();
    } catch {
      restoreArticle();
      setView('index');
      project.entry.open = true;
      return;
    }
    document.body.classList.add('dialog-open');
    panel.scrollTop = 0;
    dialog.querySelector('.dialog-close').focus({ preventScroll: true });
    mediaControllers.forEach(controller=>{if(project.article.contains(controller.video))controller.activate();});
    document.dispatchEvent(new CustomEvent('craft:open', { detail: { id } }));
  }

  document.addEventListener('click', (event) => {
    if (event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
    const link = event.target.closest('[data-craft-open]');
    const summary = event.target.closest('.project-entry > summary');
    const id = link?.dataset.craftOpen || summary?.parentElement.dataset.projectId;
    if (!id) return;
    if (summary && typeof dialog.showModal !== 'function') return;
    event.preventDefault();
    openProject(id, link || summary);
  });

  dialog.addEventListener('click', (event) => {
    if (event.target === dialog) dialog.close();
  });
  dialog.addEventListener('close', () => {
    // A queued close event can arrive after another project has already reopened.
    if (dialog.open) return;
    restoreArticle();
    const target = returnFocus?.isConnected && returnFocus.getClientRects().length ? returnFocus : !controls.hidden ? document.getElementById('worldStage') : null;
    target?.focus({ preventScroll: true });
  });
  document.addEventListener('visibilitychange', () => {
    if(document.hidden)pauseVideos();
    else mediaControllers.forEach(controller=>controller.resume());
  });
  reducedMotion.addEventListener('change',()=>mediaControllers.forEach(controller=>controller.resume()));

  window.CraftProjects = { entries, open: openProject, setView, reducedMotion, mediaSettings:MEDIA };
  function openHash() {
    const project = entries.find(({ entry }) => `#${entry.id}` === location.hash);
    if (project) openProject(project.id, project.entry.querySelector('summary'));
  }
  window.addEventListener('hashchange', openHash);
  // Defer until the optional world has had a chance to initialise.
  setTimeout(openHash, 0);
})();
