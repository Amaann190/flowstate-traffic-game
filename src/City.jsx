import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';

const points = { A: new THREE.Vector3(-12, .3, 0), B: new THREE.Vector3(0, .3, -8), C: new THREE.Vector3(0, .3, 8), D: new THREE.Vector3(12, .3, 0) };
const routes = { Upper: ['A','B','D'], Lower: ['A','C','D'], Hybrid: ['A','B','C','D'] };
const routeColors = { Upper: 0xa99aff, Lower: 0x55e6c3, Hybrid: 0xffbd60 };

export default function City({ result, playerRoute, raceId, playing, speed, cameraAction, onArrive }) {
  const mount = useRef(null), api = useRef(null), latest = useRef({ result, playerRoute, playing, speed, onArrive });
  latest.current = { result, playerRoute, playing, speed, onArrive };
  const [error,setError] = useState('');
  useEffect(() => {
    const host = mount.current;
    let renderer;
    try { renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false, powerPreference: 'high-performance' }); }
    catch { setError('This browser could not start 3D graphics. Enable hardware acceleration, then reload. You can still play every challenge using the controls.'); return; }
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.75));
    renderer.shadowMap.enabled = true; renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.setClearColor(0x142e36); renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping; renderer.toneMappingExposure = 1.3;
    host.appendChild(renderer.domElement);
    renderer.domElement.setAttribute('aria-label','Interactive 3D traffic city. Drag to orbit and scroll to zoom. Route selection and camera controls are available as buttons.');
    const scene = new THREE.Scene(); scene.fog = new THREE.Fog(0x142e36, 60, 110);
    const camera = new THREE.PerspectiveCamera(38,1,.1,150);
    const controls = new OrbitControls(camera, renderer.domElement); controls.enableDamping = true; controls.enablePan = false; controls.minDistance = 25; controls.maxDistance = 67; controls.minPolarAngle = .2; controls.maxPolarAngle = Math.PI / 2.6; controls.target.set(0,0,0);
    function resetCamera() { camera.position.set(22,29,34); controls.target.set(0,0,0); controls.update(); }
    resetCamera();
    scene.add(new THREE.HemisphereLight(0xffe9cc,0x527f86,2.2));
    const sun = new THREE.DirectionalLight(0xffdab0,3.1); sun.position.set(-15,25,10); sun.castShadow = true; sun.shadow.mapSize.set(2048,2048); Object.assign(sun.shadow.camera,{left:-28,right:28,top:24,bottom:-24,near:1,far:65}); sun.shadow.normalBias=.045; scene.add(sun);
    const mats = new Map();
    function material(color) { if(!mats.has(color))mats.set(color,new THREE.MeshStandardMaterial({color,roughness:.8})); return mats.get(color); }
    const boxGeometry = new THREE.BoxGeometry(1,1,1);
    function box(w,h,d,x,y,z,color,parent=scene) { const m = new THREE.Mesh(boxGeometry,material(color)); m.scale.set(w,h,d);m.position.set(x,y,z);m.castShadow=true;m.receiveShadow=true;parent.add(m);return m; }
    function cylinder(radius,height,x,y,z,color,segments=12,parent=scene) { const m=new THREE.Mesh(new THREE.CylinderGeometry(radius,radius,height,segments),material(color));m.position.set(x,y,z);m.castShadow=true;m.receiveShadow=true;parent.add(m);return m; }
    box(43,1.4,33,0,-1,0,0x294847);box(42,.5,32,0,-.1,0,0x93ad89);
    box(46,.25,5,0,-.35,-19,0x397d88);box(50,.2,4,0,-.55,20,0x316b76);
    for(let i=0;i<28;i++)box(1.1,.02,.055,-23+(i*3.7)%46,-.2,-20+(i%4)*.65,0x6ba0a1);
    // Side streets frame the playable diamond, rather than hiding its topology.
    for(const z of [-12,12]){box(40,.05,1.6,0,.2,z,0x55616a);for(let x=-19;x<20;x+=2)box(.8,.02,.05,x,.24,z,0xc5c7b4);}
    for(const x of [-17,17])box(1.4,.05,26,x,.2,0,0x55616a);
    const roadGroup = new THREE.Group();scene.add(roadGroup);
    function road(from,to,shortcut=false) { const a=points[from], b=points[to],length=a.distanceTo(b);const g=new THREE.Group();roadGroup.add(g);g.position.copy(a).add(b).multiplyScalar(.5);g.position.y=.27;g.rotation.y=Math.atan2(b.x-a.x,b.z-a.z);box(1.7,.16,length,0,0,0,0xc2c1ae,g);box(1.4,.08,length,0,.1,0,shortcut?0x756952:0x475561,g);for(let z=-length/2+.5;z<length/2;z+=1.1)box(.055,.015,.48,0,.15,z,shortcut?0xffcc78:0xddd9b9,g);return g; }
    road('A','B');road('B','D');road('A','C');road('C','D');const shortcut=road('B','C',true);shortcut.visible=false;
    const barrier = new THREE.Group();scene.add(barrier);
    for(const z of [-5,5]){box(1.3,.17,.17,0,.75,z,0xffbe68,barrier);box(.1,.6,.1,-.5,.45,z,0x394950,barrier);box(.1,.6,.1,.5,.45,z,0x394950,barrier);}
    function label(text,x,y,z,color='#fff3d0',scale=3.2) { const c=document.createElement('canvas');c.width=text.length===1?128:512;c.height=128;const ctx=c.getContext('2d');ctx.fillStyle='#173137';ctx.beginPath();ctx.roundRect(6,8,c.width-12,112,28);ctx.fill();ctx.strokeStyle=color;ctx.lineWidth=3;ctx.stroke();ctx.fillStyle=color;ctx.font=text.length===1?'bold 76px sans-serif':'bold 54px sans-serif';ctx.textAlign='center';ctx.textBaseline='middle';ctx.fillText(text,c.width/2,66);const texture=new THREE.CanvasTexture(c);const m=new THREE.SpriteMaterial({map:texture,depthTest:false});const sprite=new THREE.Sprite(m);sprite.position.set(x,y,z);sprite.scale.set(scale,scale*128/c.width,1);scene.add(sprite);return sprite; }
    Object.entries(points).forEach(([key,p])=>{cylinder(1.03,.14,p.x,.37,p.z,0xc5c7b2);cylinder(.75,.16,p.x,.48,p.z,0x3b665e);label(key==='A'?'A · START':key==='D'?'D · FINISH':key,p.x,2.4,p.z,key==='A'||key==='D'?'#f9dc8d':'#e1f7dd',key==='A'||key==='D'?3.7:1.2);});
    const edgeLabel=label('BRAESS EDGE',1.9,1.3,0,'#ffca76',3.2);edgeLabel.visible=false;
    function building(x,z,w,d,h,color) {box(w+.3,.2,d+.3,x,.24,z,0xc5c0aa);box(w,h,d,x,h/2+.3,z,color);box(w+.15,.15,d+.15,x,h+.34,z,0xe3d9bc);box(w*.35,.4,d*.35,x,h+.6,z,0x7b9490);for(let floor=1;floor<h-.4;floor+=.85){for(let col=-w/2+.4;col<w/2;col+=.7){box(.3,.42,.035,x+col,floor+.3,z+d/2+.02,0x50737d);box(.3,.42,.035,x+col,floor+.3,z-d/2-.02,0x50737d);}for(let col=-d/2+.4;col<d/2;col+=.8)box(.035,.42,.32,x+w/2+.02,floor+.3,z+col,0x547480);}}
    const palette=[0xe7bb8c,0x88b0a8,0xd99270,0xc5d0ba,0xd1af90];
    const lots=[[-12,-9,2.7,2.6,3],[-8,-10,2.8,2.2,5],[-4,-13.8,2.4,2,3.5],[1,-14,3,2.1,6],[6,-13.9,2.5,2.2,4],[10,-9,2.6,2.8,4.8],[14,-6,2.2,2.5,3],[-13,8.5,2.5,2.5,3.2],[-9,10,2.8,2,4.5],[-5,14,2.4,2.2,2.8],[1,14,2.7,2,3.8],[7,13.8,2.8,2.2,2.7],[12,9,2.8,2.4,4],[-20,-8,1.8,3,4],[-20,1,1.8,2.5,3],[20,-6,1.7,3,4],[20,4,1.7,2.5,3],[-5,0,2,2.4,2],[5,0,2,2.4,2.6]];
    lots.forEach((a,i)=>building(...a,palette[i%palette.length]));
    function tree(x,z,s=1) {cylinder(.1*s,.8*s,x,.7*s,z,0x846b4b,6);const crown=new THREE.Mesh(new THREE.IcosahedronGeometry(.72*s,0),material(0x477b5a));crown.position.set(x,1.5*s,z);crown.scale.y=1.25;crown.castShadow=true;scene.add(crown);}
    [[-14,-4],[-15,3],[-11,-5],[-8,-5],[-10,5],[-6,6],[6,-6],[10,-5],[14,4],[9,6],[4,11],[-4,-11],[-14,14],[14,-14],[-20,7],[20,10],[-2,3],[2,-3],[-8,1],[8,-1]].forEach(([x,z],i)=>tree(x,z,.8+(i%3)*.15));
    cylinder(1.5,.14,5,.33,5,0xc1cbb3);cylinder(1.1,.12,5,.44,5,0x65aab0);cylinder(.25,.65,5,.65,5,0xe1dbc2);
    for(const [x,z] of [[-10,-3],[7,-5],[-7,5],[10,3],[-1,-10],[1,10]]){cylinder(.045,2,x,1.2,z,0x394c50,6);box(.5,.15,.25,x,2.2,z,0xffe0a0);}
    const traffic=new THREE.Group();scene.add(traffic);let cars=[];
    function car(color,group=traffic) { const g=new THREE.Group();group.add(g);box(.39,.23,.76,0,.19,0,color,g);box(.32,.18,.38,0,.39,-.03,0xd5e9e6,g);box(.33,.1,.02,0,.39,.17,0x385364,g);for(const x of [-.21,.21])for(const z of [-.23,.23])box(.08,.17,.16,x,.12,z,0x233137,g);for(const x of [-.13,.13])box(.08,.055,.025,x,.22,.39,0xfff5c3,g);return g; }
    const player=car(0xffd05e,scene);player.scale.setScalar(1.65);player.position.copy(points.A);player.position.y=.5;const you=label('YOU',-12,2.8,0,'#ffde7d',1.8);
    const ring=new THREE.Mesh(new THREE.TorusGeometry(.7,.035,6,40),new THREE.MeshBasicMaterial({color:0xffd26e}));ring.rotation.x=Math.PI/2;scene.add(ring);
    function positionCar(mesh,name,progress) {const keys=routes[name]||routes.Upper;const segments=keys.slice(1).map((key,i)=>[points[keys[i]],points[key]]);const lengths=segments.map(([a,b])=>a.distanceTo(b));let d=progress*lengths.reduce((a,b)=>a+b,0);let index=0;while(index<lengths.length-1&&d>lengths[index])d-=lengths[index++];const [a,b]=segments[index];mesh.position.lerpVectors(a,b,Math.min(d/lengths[index],1));mesh.position.y=.48;mesh.rotation.y=Math.atan2(b.x-a.x,b.z-a.z);const offset=name==='Lower'?-.28:.28;mesh.position.x+=Math.cos(mesh.rotation.y)*offset;mesh.position.z-=Math.sin(mesh.rotation.y)*offset; }
    function updateTraffic(result) {traffic.clear();cars=[];shortcut.visible=result.braess;edgeLabel.visible=result.braess;barrier.visible=!result.braess;Object.entries(result.flows).forEach(([name,flow])=>{for(let i=0;i<Math.round(flow);i++){const mesh=car(routeColors[name]);cars.push({mesh,name,phase:i/Math.max(1,Math.round(flow)),duration:Math.max(5,result.times[name]/5)});}});}
    let race=0,progress=0,racing=false,elapsed=0,last=performance.now(),frame;
    api.current={updateTraffic, race(id){if(id!==race){race=id;progress=0;racing=id>0;}},camera(action){if(action==='reset')resetCamera();else if(action==='top'){camera.position.set(0,44,.1);controls.update();}else if(action==='left'||action==='right'){const offset=camera.position.clone().sub(controls.target);offset.applyAxisAngle(new THREE.Vector3(0,1,0),action==='left'?-.35:.35);camera.position.copy(controls.target).add(offset);controls.update();}else {const factor=action==='in'?.85:1.15;const offset=camera.position.clone().sub(controls.target);offset.setLength(THREE.MathUtils.clamp(offset.length()*factor,25,67));camera.position.copy(controls.target).add(offset);controls.update();}}};
    updateTraffic(latest.current.result);
    const resize=()=>{const w=host.clientWidth,h=host.clientHeight;renderer.setSize(w,h);camera.aspect=w/h;camera.fov=w/h<1?64:38;camera.updateProjectionMatrix();};const observer=new ResizeObserver(resize);observer.observe(host);resize();
    function animate(now){frame=requestAnimationFrame(animate);const dt=Math.min((now-last)/1000,.05);last=now;const current=latest.current;if(current.playing){elapsed+=dt*current.speed;if(racing){progress=Math.min(1,progress+dt*current.speed/6);if(progress>=1){racing=false;current.onArrive?.();}}}cars.forEach(c=>positionCar(c.mesh,c.name,(c.phase+elapsed/c.duration)%1));positionCar(player,current.playerRoute,progress);you.position.copy(player.position).add(new THREE.Vector3(0,3.3,0));ring.position.copy(player.position);ring.position.y=.44;controls.update();renderer.render(scene,camera);}
    frame=requestAnimationFrame(animate);
    const lost=e=>{e.preventDefault();setError('3D graphics were interrupted. Reload to restore the city. Your challenge controls remain available.');};renderer.domElement.addEventListener('webglcontextlost',lost);
    return()=>{cancelAnimationFrame(frame);observer.disconnect();controls.dispose();api.current=null;const geometries=new Set(),materials=new Set();scene.traverse(o=>{if(o.geometry)geometries.add(o.geometry);if(o.material)materials.add(o.material);});geometries.add(boxGeometry);mats.forEach(m=>materials.add(m));geometries.forEach(g=>g.dispose());materials.forEach(m=>{m.map?.dispose();m.dispose();});renderer.dispose();renderer.domElement.removeEventListener('webglcontextlost',lost);renderer.domElement.remove();};
  },[]);
  useEffect(()=>{api.current?.updateTraffic(result);},[result]);
  useEffect(()=>{api.current?.race(raceId);},[raceId]);
  useEffect(()=>{if(cameraAction)api.current?.camera(cameraAction.action);},[cameraAction]);
  return <div ref={mount} className="city-canvas">{error&&<div className="graphics-error" role="alert"><strong>3D graphics unavailable</strong><p>{error}</p><button onClick={()=>window.location.reload()}>Reload city</button></div>}</div>;
}
