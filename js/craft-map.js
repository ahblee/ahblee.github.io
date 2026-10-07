/* A small SVG village navigator. Project names come from the HTML; positions and
   finishes come from the same PLACES / BUILDING_PALETTE used by the 3D scene. */
(() => {
  const SETTINGS = {
    desktop:{width:216,height:172,padding:24},
    mobile:{width:176,height:184,padding:23},
  };
  // Mix scene materials with its plaster, rather than using an unrelated map
  // palette. These small amounts soften contrast while preserving project colours.
  const THEME={groundMix:.40,pathMix:.16,roofMix:.14,detailMix:.24};
  function mix(a,b,amount) {
    const rgb=hex=>[1,3,5].map(i=>parseInt(hex.slice(i,i+2),16));
    const from=rgb(a),to=rgb(b);
    return '#'+from.map((c,i)=>Math.round(c+(to[i]-c)*amount).toString(16).padStart(2,'0')).join('');
  }
  function applyTheme(root) {
    const p=window.CraftScene.PALETTE,tone=(colour,amount=THEME.detailMix)=>mix(colour,p.plaster,amount);
    const tokens={ground:tone(p.grass,THEME.groundMix),path:tone(p.soil,THEME.pathMix),
      border:tone(p.grass,.58),highlight:tone(p.grass,.64),wall:p.plaster,
      side:tone(p.woodLight,.30),wood:tone(p.woodDark),paper:tone(p.cream,.24),
      window:tone(p.window),tea:tone(p.tea),shadow:p.leafDark};
    Object.entries(tokens).forEach(([name,value])=>root.style.setProperty(`--map-${name}`,value));
  }
  function samplePath(points,count=64) {
    if(points.length<2)return points;
    const curve=new window.THREE.CatmullRomCurve3(points.map(([x,z])=>new window.THREE.Vector3(x,0,z)));
    return curve.getPoints(count).map(p=>[p.x,p.z]);
  }
  // Original miniature silhouettes: changing one icon does not affect its model.
  const ICONS = {
    photo:'<path d="M5 15 19 9 35 16 21 23Z" fill="var(--roof)"/><rect x="15" y="10" width="11" height="6" rx="1" fill="var(--map-wood)"/><circle cx="21" cy="13" r="2" fill="var(--map-window)"/><path d="M8 23h9v7H8Z" fill="var(--roof)"/>',
    theatre:'<path d="M5 20v-5Q12 3 23 10l12 6v6L21 29Z" fill="var(--roof)"/><path d="M9 25v-6q6-7 11 0v11" fill="var(--map-wall)"/><path d="M11 29v-9q4-5 7 0v10" fill="var(--map-joinery)"/>',
    church:'<path d="m5 20 14-11 21 9-14 8Z" fill="var(--roof)"/><path d="M9 29V12l7-3 5 4v18Z" fill="var(--map-wall)"/><path d="m7 14 8-7 8 7Z" fill="var(--roof)"/><path d="M15 2v7m-3-4h6" stroke="var(--map-wood)" stroke-width="2"/><path d="M12 29v-6q3-4 6 0v7" fill="var(--map-wood)"/>',
    bookstore:'<path d="m4 19 13-12 20 10-15 9Z" fill="var(--roof)"/><path d="M7 26h12v7H7Z" fill="var(--map-wood)"/><path d="M9 27v4m3-4v5m3-4v4m3-4v4" stroke="var(--map-paper)" stroke-width="2"/>',
    tea:'<path d="m4 16 15-7 18 9-15 9Z" fill="var(--roof)"/><path d="m5 21 16 6v4L5 25Z" fill="var(--map-paper)"/><path d="m9 22v4m6-2v4" stroke="var(--roof)" stroke-width="3"/><path d="m17 6 9 2-2 10-6-1Z" fill="var(--map-tea)"/><path d="m23 2-2 8" stroke="var(--map-wood)" stroke-width="2"/><circle cx="20" cy="13" r="1" fill="var(--map-wood)"/><circle cx="23" cy="14" r="1" fill="var(--map-wood)"/>',
  };
  const NS='http://www.w3.org/2000/svg';
  // Only the duck's face and its little seasonal hat, never a full-body marker.
  function duckIcon() {
    const original=window.CraftScene.CHARACTER,p=window.CraftScene.PALETTE,c={...original};
    for(const key of ['feathers','cheek','cap','capBand','leafPin','bill'])c[key]=mix(original[key],p.plaster,.12);
    const outline=mix(p.woodDark,p.plaster,.42);
    const hat=c.accessory==='acorn-beret'
      ? `<path d="m14 5-1-3" stroke="${c.capBand}" stroke-width="2.3" stroke-linecap="round"/><path d="M3 10C2 6 9 3 16 3c8 0 14 3 13 6-1 4-22 7-26 1Z" fill="${c.cap}"/><path d="M22 7q7-3 4 2-1 3-5 3Z" fill="${c.leafPin}"/>`
      : `<path d="M12 8q-2-6 1-6 2 0 3 5 1-4 3-3 2 1 0 5" fill="${c.feathers}"/>`;
    return `<svg viewBox="0 0 32 32" aria-hidden="true"><path d="M4 17C4 10 8 6 16 6s12 4 12 11c0 8-5 12-12 12S4 25 4 17Z" fill="${c.feathers}" stroke="${outline}" stroke-width="1"/>${hat}<ellipse cx="8.5" cy="20" rx="2" ry="1.2" fill="${c.cheek}"/><ellipse cx="23.5" cy="20" rx="2" ry="1.2" fill="${c.cheek}"/><circle cx="11" cy="16.5" r="1.5" fill="${c.eyes}"/><circle cx="21" cy="16.5" r="1.5" fill="${c.eyes}"/><ellipse cx="16" cy="21" rx="4.2" ry="2.15" fill="${c.bill}"/></svg>`;
  }
  function create(root,onNavigate) {
    const landscape=root.querySelector('.map-landscape'),destinations=root.querySelector('.map-destinations');
    const player=root.querySelector('.map-player');
    player.innerHTML=duckIcon();
    let projectPoint,config,lastPosition=null,buttons=new Map();
    function svg(tag,attributes) {
      const node=document.createElementNS(NS,tag);
      Object.entries(attributes).forEach(([key,value])=>node.setAttribute(key,value));return node;
    }
    function build(scene) {
      config=SETTINGS[scene.mode];applyTheme(root);
      const angle=window.CraftScene.CAMERA[scene.mode].azimuth*Math.PI/180,c=Math.cos(angle),s=Math.sin(angle);
      const rotate=(x,z)=>({x:x*c-z*s,y:x*s+z*c});
      const corners=scene.places.map(p=>rotate(p.x,p.z));
      const minX=Math.min(...corners.map(p=>p.x))-4,maxX=Math.max(...corners.map(p=>p.x))+4;
      const minY=Math.min(...corners.map(p=>p.y))-4,maxY=Math.max(...corners.map(p=>p.y))+4;
      lastPosition=null;
      projectPoint=(x,z)=>{
        const p=rotate(x,z),pad=config.padding;
        return {x:pad+(p.x-minX)/(maxX-minX)*(config.width-pad*2),y:pad+(p.y-minY)/(maxY-minY)*(config.height-pad*2)};
      };
      root.style.setProperty('--map-width',`${config.width}px`);root.style.setProperty('--map-height',`${config.height}px`);
      landscape.setAttribute('viewBox',`0 0 ${config.width} ${config.height}`);landscape.replaceChildren();
      function path(points,width) {
        if(!points.length)return;
        const d=points.map(([x,z],i)=>{const p=projectPoint(x,z);return `${i?'L':'M'}${p.x.toFixed(2)} ${p.y.toFixed(2)}`;}).join(' ');
        landscape.append(svg('path',{d,fill:'none',stroke:'var(--map-path)','stroke-width':width,'stroke-linecap':'round','stroke-linejoin':'round'}));
      }
      const road=samplePath(scene.details.path,150),fork=samplePath(scene.details.fork,100),roadPoints=[...road,...fork];
      path(road,5.5);path(fork,5);
      scene.places.forEach(place=>{
        const closest=roadPoints.reduce((a,b)=>Math.hypot(a[0]-place.door.x,a[1]-place.door.z)<Math.hypot(b[0]-place.door.x,b[1]-place.door.z)?a:b);
        const doorway=[place.door.x,place.door.z];
        path(samplePath([[place.x,place.z],doorway,[(doorway[0]+closest[0])/2,doorway[1]+.6],closest],28),2.8);
      });
      // Keep buttons during responsive rebuilds so an existing keyboard focus survives.
      scene.places.forEach(place=>{
        let button=buttons.get(place.id);
        if(!button) {
          button=document.createElement('button');button.type='button';button.className='map-place';button.dataset.mapProject=place.id;
          button.setAttribute('aria-label',`Travel to ${place.title}${place.status ? ' · '+place.status : ''}`);button.setAttribute('aria-controls','worldStage');
          button.classList.toggle('is-under-construction',Boolean(place.status));
          button.innerHTML=`<svg viewBox="0 0 40 40" aria-hidden="true"><ellipse cx="21" cy="33" rx="15" ry="4" fill="var(--map-shadow)" opacity=".13"/><path d="M6 18 21 25v11L6 29Z" fill="var(--map-wall)"/><path d="m21 25 14-7v11l-14 7Z" fill="var(--map-side)"/>${ICONS[place.model] || ICONS.photo}</svg>`;
          const label=document.createElement('span');label.className='map-label';label.textContent=place.title+(place.status ? ' · '+place.status : '');button.append(label);
          button.addEventListener('click',()=>onNavigate(place.id));destinations.append(button);buttons.set(place.id,button);
        }
        const p=projectPoint(place.x,place.z);
        button.style.left=`${p.x/config.width*100}%`;button.style.top=`${p.y/config.height*100}%`;
        const paint=window.CraftScene.BUILDING_PALETTE[place.model],paper=window.CraftScene.PALETTE.plaster;
        button.style.setProperty('--roof',mix(paint.roof,paper,THEME.roofMix));
        button.style.setProperty('--map-wall',paint.wall);
        button.style.setProperty('--map-side',mix(paint.trim,paint.wall,.3));
        button.style.setProperty('--map-joinery',mix(paint.joinery,paper,THEME.detailMix));
        button.classList.toggle('label-right',p.x>config.width*.6);
        button.classList.toggle('label-left',p.x<config.width*.4);
      });
    }
    function update(position,nearId) {
      if(!projectPoint)return;
      if(lastPosition&&lastPosition.x===position.x&&lastPosition.z===position.z&&lastPosition.nearId===nearId)return;
      lastPosition={...position,nearId};
      const p=projectPoint(position.x,position.z);
      const x=Math.max(12,Math.min(config.width-12,p.x)),y=Math.max(14,Math.min(config.height-14,p.y));
      const outside=x!==p.x||y!==p.y;
      player.style.left=`${x/config.width*100}%`;player.style.top=`${y/config.height*100}%`;
      player.classList.toggle('is-outside',outside);
      player.setAttribute('aria-label',outside?'Your position, beyond the map edge':'Your position in the village');
      buttons.forEach((button,id)=>button.classList.toggle('is-near',id===nearId));
    }
    return {build,update};
  }
  window.CraftMap={create,SETTINGS,THEME,ICONS,duckIcon};
})();
