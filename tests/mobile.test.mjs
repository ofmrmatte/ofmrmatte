import test from 'node:test';
import assert from 'node:assert/strict';
import {mobilePlaybackViewport,enterMobilePlayback,unlockMobilePlayback} from '../src/mobile.mjs';
const layout=()=>{const classes=new Set();return {classList:{add:x=>classes.add(x),remove:x=>classes.delete(x),contains:x=>classes.has(x)}};};
test('mobile requests fullscreen during the click and locks landscape after entry',async()=>{
 const target=layout(),events=[];target.requestFullscreen=()=>{events.push('fullscreen');return Promise.resolve();};
 const orientation={lock:async mode=>events.push(mode),unlock:()=>events.push('unlock')};
 const pending=enterMobilePlayback(target,{doc:{},orientation});assert.deepEqual(events,['fullscreen']);await pending;assert.deepEqual(events,['fullscreen','landscape']);
 assert.equal(target.classList.contains('mobile-landscape'),true);unlockMobilePlayback(target,orientation);assert.equal(target.classList.contains('mobile-landscape'),false);assert.equal(events.at(-1),'unlock');
 assert.equal(mobilePlaybackViewport({matchMedia:query=>({matches:query.includes('pointer:coarse')})}),true);
});
test('a browser without fullscreen or orientation lock retains the custom landscape player',async()=>{
 const target=layout();await enterMobilePlayback(target,{doc:{},orientation:{lock:async()=>{throw new Error('not supported');}}});
 assert.equal(target.classList.contains('is-full-window'),true);assert.equal(target.classList.contains('mobile-landscape'),true);
});
test('closing while fullscreen is pending prevents a later landscape lock',async()=>{
 const target=layout();let enter,locks=0,exits=0;target.requestFullscreen=()=>new Promise(resolve=>{enter=resolve;});const doc={fullscreenElement:target,exitFullscreen:async()=>{exits++;}};
 // Simulate a pending entry rather than an already active fullscreen element.
 doc.fullscreenElement=null;const pending=enterMobilePlayback(target,{doc,orientation:{lock:async()=>{locks++;}}});unlockMobilePlayback(target,{});doc.fullscreenElement=target;enter();await pending;
 assert.equal(locks,0);assert.equal(exits,1);
});
