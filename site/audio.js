(function(){"use strict";const d=new URLSearchParams(location.search),w=window.AudioContext||window.webkitAudioContext;if(d.has("mute")||!w)return;class y{constructor(){this.chunks=[],this.at=0,this.frames=0,this.started=!1,this.underrun=0}push(s){this.chunks.push(s),this.frames+=s.length>>1,this.started=!0}read(s,r,u){const i=s.length;let a=0;for(;a<i&&this.chunks.length;){const n=this.chunks[0],R=(n.length>>1)-this.at,p=Math.min(R,i-a);for(let h=0;h<p;h++)s[a+h]=n[(this.at+h)*2],r[a+h]=n[(this.at+h)*2+1];u&&u.push(n.slice(this.at*2,(this.at+p)*2)),this.at+=p,a+=p,this.at*2>=n.length&&(this.chunks.shift(),this.at=0)}return this.frames-=a,a<i&&(s.fill(0,a),r.fill(0,a),this.started&&(this.underrun+=i-a)),a}}const l=d.has("audio-tap");let o;const k={latencyHint:"interactive"};d.has("audio-rate")&&(k.sampleRate=Number(d.get("audio-rate")));try{o=new w(k)}catch{return}const t=window.raizenAudio={rate:o.sampleRate,pushed:0,played:0,underrun:0,mode:"none",buffered(){return Math.max(0,t.pushed-t.played)},push(e){t.pushed+=e.length>>1,l&&c.pushed.push(e.slice()),g(e)},resume(){return o.resume()},suspend(){return o.suspend()},state(){return o.state}},c={pushed:[],played:[]};let f=[];function g(e){t.node?t.node.port.postMessage(e,[e.buffer]):t.queue?t.queue.push(e):f.push(e)}const M="const Queue = "+y.toString()+`;

    registerProcessor("raizen-out", class extends AudioWorkletProcessor {
        constructor(options) {
            super();
            this.queue = new Queue();
            this.played = 0; this.quanta = 0; this.tap = options.processorOptions.tap ? [] : null;
            this.port.onmessage = (event) => {
                if (event.data === "flush") { this.report(true); return; }
                this.queue.push(event.data);
            };
        }
        report(flush) {
            const message = { played: this.played, underrun: this.queue.underrun };
            if (this.tap && this.tap.length) { message.tap = this.tap.splice(0); }
            if (flush) message.flushed = true;
            this.port.postMessage(message);
        }
        process(inputs, outputs) {
            const out = outputs[0];
            this.played += this.queue.read(out[0], out[1] || out[0], this.tap);
            if (++this.quanta % 2 === 0) this.report(false);
            return true;
        }
    });`;function x(e){if(t.played=e.played,t.underrun=e.underrun,e.tap)for(const s of e.tap)c.played.push(s);e.flushed&&t.onFlushed&&t.onFlushed()}async function A(){if(o.audioWorklet&&window.AudioWorkletNode)try{const r=URL.createObjectURL(new Blob([M],{type:"text/javascript"}));await o.audioWorklet.addModule(r),URL.revokeObjectURL(r);const u=new AudioWorkletNode(o,"raizen-out",{numberOfInputs:0,outputChannelCount:[2],processorOptions:{tap:l}});u.port.onmessage=i=>x(i.data),u.connect(o.destination),t.node=u,t.mode="worklet";for(const i of f.splice(0))g(i);return}catch(r){console.warn("audio: AudioWorklet unavailable ("+r+"), ScriptProcessor fallback")}const e=t.queue=new y,s=o.createScriptProcessor(2048,0,2);s.onaudioprocess=r=>{const u=r.outputBuffer;t.played+=e.read(u.getChannelData(0),u.getChannelData(1),l?c.played:null),t.underrun=e.underrun},s.connect(o.destination),t.script=s,t.mode="script";for(const r of f.splice(0))g(r)}function b(){if(o.state==="running")return m();o.resume().then(()=>{o.state==="running"&&m()},()=>{})}const v=["pointerdown","mousedown","touchend","keydown","click"];function m(){for(const e of v)window.removeEventListener(e,b,!0)}for(const e of v)window.addEventListener(e,b,!0);o.resume().then(()=>{o.state==="running"&&m()},()=>{});function q(e){let s=0;for(const i of e)s+=i.length;const r=new Float32Array(s);let u=0;for(const i of e)r.set(i,u),u+=i.length;return r}t.tapReport=async function(){if(!l)return null;t.node&&await new Promise(n=>{t.onFlushed=n,t.node.port.postMessage("flush"),setTimeout(n,2e3)});const e=q(c.pushed),s=q(c.played);let r=0,u=-1;const i=Math.min(e.length,s.length);for(let n=0;n<i;n++)e[n]!==s[n]&&(r++,u<0&&(u=n));let a=0;for(let n=0;n<s.length;n++)a=Math.max(a,Math.abs(s[n]));return{mode:t.mode,state:o.state,rate:t.rate,pushedFrames:e.length>>1,playedFrames:s.length>>1,underrunFrames:t.underrun,differingSamples:r,firstDifference:u,peak:a,played:s,pushed:e}},A().catch(e=>console.warn("audio: "+e))})();
