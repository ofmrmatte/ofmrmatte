import test from 'node:test';
import assert from 'node:assert/strict';
import {mobilePlaybackViewport,enterNativePlayback} from '../src/mobile.mjs';
const video=()=>({controls:false,playsInline:true,removeAttribute(){}});
test('iPhone uses the native video fullscreen API instead of the page container',async()=>{
 const v=video(),events=[];v.webkitEnterFullscreen=()=>events.push('system-video');v.requestFullscreen=()=>{throw Error('Must prefer iPhone native API');};
 assert.equal(await enterNativePlayback(v,{doc:{},orientation:{}}),true);assert.deepEqual(events,['system-video']);assert.equal(v.controls,true);assert.equal(v.playsInline,false);
 assert.equal(mobilePlaybackViewport({matchMedia:q=>({matches:q.includes('pointer:coarse')})}),true);
});
test('Android requests fullscreen on the video element and retains native controls',async()=>{
 const v=video(),events=[];v.requestFullscreen=async()=>events.push('video');assert.equal(await enterNativePlayback(v,{doc:{},orientation:{lock:async mode=>events.push(mode)}}),true);assert.deepEqual(events,['video','landscape']);assert.equal(v.controls,true);
});
test('when native fullscreen is denied, no simulated browser fullscreen or CSS rotation is used',async()=>{
 const v=video();v.requestFullscreen=async()=>{throw Error('Gesture required');};assert.equal(await enterNativePlayback(v,{doc:{},orientation:{}}),false);assert.equal(v.controls,true);assert.equal(v.playsInline,false);
});
