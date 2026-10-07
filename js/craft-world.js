/* One interaction: keyboard wandering and Enter to visit. The mini map guides
   the duck to a doorway using a collision-safe route computed once per trip. */
(() => {
  const projects=window.CraftProjects;
  const world=document.getElementById('craftWorld');
  const stage=document.getElementById('worldStage');
  const canvas=document.getElementById('worldCanvas');
  const destinations=document.getElementById('worldDestinations');
  const nearby=document.getElementById('worldNearby');
  const visit=document.getElementById('worldVisit');
  const welcome=document.getElementById('worldWelcome');
  const note=document.getElementById('worldNote');
  const dialog=document.getElementById('craftDialog');
  const smallScreen=matchMedia('(max-width: 760px)');
  if(!projects || !window.CraftScene || !window.CraftMap) return;

  // Movement is always enabled; no mode or persisted toggle can disable it.
  const SETTINGS={speed:6.5,fastNavigationSpeed:22,routeGrid:.75,interactionRadius:3.1,
    playerRadius:window.CraftScene.CHARACTER.footprintRadius*window.CraftScene.CHARACTER.scale,
    collisionCell:4,maxStep:.16,maxFrameDelta:.04};
  const directions=new Map([['ArrowUp',[0,-1]],['w',[0,-1]],['ArrowDown',[0,1]],['s',[0,1]],['ArrowLeft',[-1,0]],['a',[-1,0]],['ArrowRight',[1,0]],['d',[1,0]]]);
  const keys=new Set(),links=new Map(),obstacleGrid=new Map();
  let scene,player,frame=0,lastTime=0,nearId=null,visible=true;
  let strideActive=false,restPending=false,route=[],routeSpeed=0,destination=null;
  const miniMap=window.CraftMap.create(document.getElementById('villageMap'),navigateTo);

  function dismissWelcome(){welcome.hidden=true;}
  function cancelTrip(){route=[];routeSpeed=0;destination=null;note.textContent='';}
  function fail(error) {
    stop();world.dataset.ready='false';projects.setView('index');
    if(error)console.error('Craft world unavailable; the project index is still available.',error);
  }
  function stop() {
    keys.clear();cancelTrip();cancelAnimationFrame(frame);frame=0;lastTime=0;
    if(scene&&player&&strideActive){
      scene.moveAvatar(player.x,player.z);strideActive=false;restPending=true;
      if(!world.hidden&&!document.hidden&&!dialog.open){scene.render();restPending=false;}
    }
  }
  function syncLinks() {
    scene.places.forEach(place=>{
      let link=links.get(place.id);
      if(!link){
        link=document.createElement('a');link.className='world-building';link.href=`#craft-${place.id}`;link.dataset.craftOpen=place.id;
        link.setAttribute('aria-label',`Visit ${place.title}${place.status ? ' · '+place.status : ''}`);link.setAttribute('aria-haspopup','dialog');
        const label=document.createElement('span');label.className='building-label';
        const title=document.createElement('span');title.textContent=place.title;
        if(place.status){const status=document.createElement('span');status.className='building-status';status.textContent=place.status;title.append(status);}
        const arrow=document.createElement('span');arrow.className='building-arrow';arrow.textContent='↗';arrow.setAttribute('aria-hidden','true');
        label.append(title,arrow);link.append(label);destinations.append(link);links.set(place.id,link);
      }
      const b=scene.projectBounds(place);
      link.tabIndex=b.right>0&&b.left<stage.clientWidth&&b.bottom>80&&b.top<stage.clientHeight-80?0:-1;
      Object.assign(link.style,{left:`${b.left}px`,top:`${b.top}px`,width:`${Math.max(44,b.right-b.left)}px`,height:`${Math.max(44,b.bottom-b.top)}px`});
    });
  }
  function updateNearby() {
    let next=null,distance=SETTINGS.interactionRadius;
    for(const place of scene.places){
      const d=Math.hypot(player.x-place.door.x,player.z-place.door.z);
      if(d<distance){next=place;distance=d;}
    }
    if((next?.id||null)===nearId)return;nearId=next?.id||null;
    links.forEach((link,id)=>link.classList.toggle('is-near',id===nearId));
    nearby.hidden=!next;
    if(next){visit.dataset.craftOpen=next.id;visit.href=`#craft-${next.id}`;visit.querySelector('span').textContent=next.title+(next.status ? ' · '+next.status : '');}
  }
  // Broad phase is built once per layout. Movement checks only the local bucket.
  function indexObstacles() {
    obstacleGrid.clear();
    for(const obstacle of scene.colliders){
      const r=obstacle.reach+SETTINGS.playerRadius,cell=SETTINGS.collisionCell;
      for(let x=Math.floor((obstacle.x-r)/cell);x<=Math.floor((obstacle.x+r)/cell);x++){
        for(let z=Math.floor((obstacle.z-r)/cell);z<=Math.floor((obstacle.z+r)/cell);z++){
          const key=`${x},${z}`;if(!obstacleGrid.has(key))obstacleGrid.set(key,[]);obstacleGrid.get(key).push(obstacle);
        }
      }
    }
  }
  function overlaps(obstacle,x,z,r=SETTINGS.playerRadius) {
    const dx=x-obstacle.x,dz=z-obstacle.z;
    if(obstacle.kind==='circle')return dx*dx+dz*dz<(obstacle.radius+r)**2;
    const localX=dx*obstacle.cos-dz*obstacle.sin,localZ=dx*obstacle.sin+dz*obstacle.cos;
    const qx=Math.max(Math.abs(localX)-obstacle.halfX,0),qz=Math.max(Math.abs(localZ)-obstacle.halfZ,0);
    return qx*qx+qz*qz<r*r;
  }
  function walkable(x,z) {
    const [minX,maxX,minZ,maxZ]=scene.details.bounds,r=SETTINGS.playerRadius;
    if(x<minX+r||x>maxX-r||z<minZ+r||z>maxZ-r)return false;
    const key=`${Math.floor(x/SETTINGS.collisionCell)},${Math.floor(z/SETTINGS.collisionCell)}`;
    return !(obstacleGrid.get(key)||[]).some(obstacle=>overlaps(obstacle,x,z));
  }
  // Swept substeps prevent tunnelling across thin fences. Sliding keeps walls smooth.
  function resolveMovement(from,dx,dz) {
    const result={...from},count=Math.max(1,Math.ceil(Math.hypot(dx,dz)/SETTINGS.maxStep));
    dx/=count;dz/=count;
    for(let i=0;i<count;i++){
      if(walkable(result.x+dx,result.z+dz)){result.x+=dx;result.z+=dz;}
      else {
        if(walkable(result.x+dx,result.z))result.x+=dx;
        if(walkable(result.x,result.z+dz))result.z+=dz;
      }
    }
    return result;
  }
  function segmentClear(a,b) {
    const steps=Math.max(1,Math.ceil(Math.hypot(b.x-a.x,b.z-a.z)/SETTINGS.maxStep));
    for(let i=1;i<=steps;i++)if(!walkable(a.x+(b.x-a.x)*i/steps,a.z+(b.z-a.z)*i/steps))return false;
    return true;
  }
  // A* uses the same ground obstacles as manual movement. Search is bounded and
  // only runs on a map selection; straight, clear segments are simplified once.
  function planRoute(from,goal) {
    if(!walkable(goal.x,goal.z))return null;
    if(segmentClear(from,goal))return [{...goal}];
    const grid=SETTINGS.routeGrid,heap=[],costs=new Map(),closed=new Set();
    function push(node) {
      heap.push(node);let i=heap.length-1;
      while(i){const parent=(i-1)>>1;if(heap[parent].f<=node.f)break;heap[i]=heap[parent];i=parent;}heap[i]=node;
    }
    function pop() {
      const first=heap[0],last=heap.pop();
      if(heap.length){let i=0;while(i*2+1<heap.length){let child=i*2+1;if(child+1<heap.length&&heap[child+1].f<heap[child].f)child++;if(last.f<=heap[child].f)break;heap[i]=heap[child];i=child;}heap[i]=last;}
      return first;
    }
    function enqueue(i,j,g,parent) {
      const key=`${i},${j}`;
      if(closed.has(key)||(costs.get(key)??Infinity)<=g)return;
      const point={x:i*grid,z:j*grid};
      if(!walkable(point.x,point.z)||!segmentClear(parent?.point||from,point))return;
      costs.set(key,g);push({i,j,key,point,g,f:g+Math.hypot(goal.x-point.x,goal.z-point.z),parent});
    }
    const ix=Math.round(from.x/grid),iz=Math.round(from.z/grid);
    for(let i=ix-1;i<=ix+1;i++)for(let j=iz-1;j<=iz+1;j++)enqueue(i,j,Math.hypot(i*grid-from.x,j*grid-from.z),null);
    let found=null;
    while(heap.length&&closed.size<16000){
      const node=pop();if(closed.has(node.key))continue;closed.add(node.key);
      if(Math.hypot(goal.x-node.point.x,goal.z-node.point.z)<=grid*2&&segmentClear(node.point,goal)){found=node;break;}
      for(let x=-1;x<=1;x++)for(let z=-1;z<=1;z++)if(x||z)enqueue(node.i+x,node.j+z,node.g+Math.hypot(x,z)*grid,node);
    }
    if(!found)return null;
    const points=[goal];for(let n=found;n;n=n.parent)points.push(n.point);points.push(from);points.reverse();
    const smooth=[];let i=0;
    while(i<points.length-1){let next=points.length-1;while(next>i+1&&!segmentClear(points[i],points[next]))next--;smooth.push({...points[next]});i=next;}
    return smooth;
  }
  function navigateTo(id) {
    if(!scene||world.hidden||dialog.open)return;
    const place=scene.places.find(p=>p.id===id);if(!place)return;
    stop();dismissWelcome();
    const path=planRoute(player,place.door);
    if(!path){note.textContent='That path is blocked. Try wandering a little closer.';return;}
    focusWalking();
    if(projects.reducedMotion.matches){
      // Avoid an involuntary camera journey for visitors who request less motion.
      player={...place.door};scene.moveAvatar(player.x,player.z);scene.followAvatar(0,0,0,true);
      syncLinks();updateNearby();miniMap.update(player,nearId);scene.render();return;
    }
    route=path;destination=id;requestDraw();
  }
  function draw(time=0) {
    frame=0;
    if(!visible||world.hidden||document.hidden||dialog.open){stop();return;}
    const dt=lastTime?Math.min((time-lastTime)/1000,SETTINGS.maxFrameDelta):1/60;lastTime=time;
    let dx=0,dz=0;
    if(route.length){
      const target=route[0],distance=Math.hypot(target.x-player.x,target.z-player.z);
      const speed=route.length===1?Math.min(SETTINGS.fastNavigationSpeed,3+distance*6):SETTINGS.fastNavigationSpeed;
      routeSpeed+=(speed-routeSpeed)*(1-Math.exp(-8*dt));
      const step=Math.min(distance,routeSpeed*dt);
      if(distance){dx=(target.x-player.x)/distance*step;dz=(target.z-player.z)/distance*step;}
    }else{
      let sx=0,sz=0;keys.forEach(key=>{sx+=directions.get(key)[0];sz+=directions.get(key)[1];});
      const c=Math.cos(scene.azimuth),s=Math.sin(scene.azimuth),length=Math.hypot(sx,sz)||1;
      dx=(sx*c+sz*s)/length*SETTINGS.speed*dt;dz=(-sx*s+sz*c)/length*SETTINGS.speed*dt;
    }
    const next=resolveMovement(player,dx,dz),moved=Math.hypot(next.x-player.x,next.z-player.z)>.0001;
    player=next;
    if(route.length&&Math.hypot(player.x-route[0].x,player.z-route[0].z)<.015){route.shift();if(!route.length)cancelTrip();}
    else if(route.length&&!moved){cancelTrip();note.textContent='The path is blocked. You can keep wandering from here.';}
    const poseChanged=moved||strideActive;
    if(poseChanged){
      if(moved)dismissWelcome();
      strideActive=moved&&!projects.reducedMotion.matches;
      scene.moveAvatar(player.x,player.z,dx,dz,time,strideActive);
    }
    const cameraChanged=scene.followAvatar(dt,moved?dx:0,moved?dz:0,projects.reducedMotion.matches);
    if(cameraChanged)syncLinks();
    if(poseChanged||cameraChanged)scene.render();
    updateNearby();miniMap.update(player,nearId);
    // Continue only through movement and camera settling, never an idle render loop.
    if(keys.size||route.length||strideActive||cameraChanged)frame=requestAnimationFrame(draw);else lastTime=0;
  }
  function requestDraw(){if(!frame)frame=requestAnimationFrame(draw);}
  function focusWalking(){stage.focus({preventScroll:true});}
  function onKeyDown(event) {
    // Immediate page-level movement, without stealing navigation/form/media keys.
    if(world.hidden||!visible||document.hidden||dialog.open)return;
    if(![document.body,document.documentElement,stage,canvas].includes(event.target)||event.ctrlKey||event.metaKey||event.altKey)return;
    const key=event.key.length===1?event.key.toLowerCase():event.key;
    if(directions.has(key)){event.preventDefault();cancelTrip();focusWalking();keys.add(key);requestDraw();}
    else if(key==='Enter'&&nearId){event.preventDefault();projects.open(nearId,stage);}
    else if(key==='Escape'){event.preventDefault();stop();dismissWelcome();requestDraw();}
  }
  function onKeyUp(event){keys.delete(event.key.length===1?event.key.toLowerCase():event.key);}
  function frameScene(){scene.followAvatar(0,0,0,true);syncLinks();miniMap.update(player,nearId);scene.render();}
  function rebuild(){
    stop();scene.build(smallScreen.matches?'mobile':'desktop');indexObstacles();
    const [x,z]=scene.details.start;player={x,z};nearId=null;nearby.hidden=true;
    links.forEach(link=>link.classList.remove('is-near'));
    scene.moveAvatar(x,z);miniMap.build(scene);frameScene();updateNearby();
  }

  try {
    world.hidden=false;
    scene=window.CraftScene.create(canvas,projects.entries,smallScreen.matches?'mobile':'desktop');
    indexObstacles();const [x,z]=scene.details.start;player={x,z};scene.moveAvatar(x,z);miniMap.build(scene);frameScene();
    world.dataset.ready='true';projects.setView('world');
    document.addEventListener('keydown',onKeyDown);document.addEventListener('keyup',onKeyUp);
    canvas.addEventListener('click',focusWalking);
    document.getElementById('dismissWelcome').addEventListener('click',()=>{dismissWelcome();focusWalking();});
    stage.addEventListener('blur',stop);window.addEventListener('blur',stop);
    document.addEventListener('craft:open',stop);
    dialog.addEventListener('close',()=>{
      if(restPending&&!world.hidden){scene.render();restPending=false;}
      if(!world.hidden)requestDraw();
    });
    document.addEventListener('craft:view',event=>{
      stop();if(event.detail.view==='world'){scene.resize();frameScene();}
    });
    document.addEventListener('visibilitychange',()=>{if(document.hidden)stop();});
    projects.reducedMotion.addEventListener('change',()=>{stop();if(!world.hidden){scene.followAvatar(0,0,0,true);syncLinks();scene.render();}});
    smallScreen.addEventListener('change',rebuild);
    let resizeFrame=0;
    window.addEventListener('resize',()=>{cancelAnimationFrame(resizeFrame);resizeFrame=requestAnimationFrame(()=>{scene.resize();frameScene();});});
    if('IntersectionObserver'in window)new IntersectionObserver(([entry])=>{visible=entry.isIntersecting;if(!visible)stop();}).observe(world);
    canvas.addEventListener('webglcontextlost',event=>{event.preventDefault();fail();});
    window.CraftWorld={scene,settings:SETTINGS,get player(){return {...player};},get destination(){return destination;},walkable,resolveMovement,overlaps,planRoute};
  }catch(error){fail(error);}
})();
