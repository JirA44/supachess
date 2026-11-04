(function(root){
  "use strict";
  var STORAGE_KEY="supachess-sounds-enabled-v1";
  var context=null;
  var patterns={move:[520],capture:[420,620],check:[740,590],correct:[660,880],incorrect:[250,190],complete:[523,659,784]};
  function isEnabled(){try{return root.localStorage.getItem(STORAGE_KEY)==="true";}catch(_error){return false;}}
  function setEnabled(value){try{root.localStorage.setItem(STORAGE_KEY,value?"true":"false");}catch(_error){}return isEnabled();}
  function play(kind){
    if(!isEnabled())return false;
    var AudioContextCtor=root.AudioContext||root.webkitAudioContext;
    if(typeof AudioContextCtor!=="function")return false;
    try{
      if(!context)context=new AudioContextCtor();
      if(context.state==="suspended")context.resume().catch(function(){});
      var notes=patterns[kind];if(!notes)return false;
      var start=context.currentTime;
      notes.forEach(function(frequency,index){
        var oscillator=context.createOscillator(),gain=context.createGain(),when=start+index*0.11;
        oscillator.type="triangle";
        oscillator.frequency.setValueAtTime(frequency,when);
        gain.gain.setValueAtTime(0.0001,when);
        gain.gain.exponentialRampToValueAtTime(0.055,when+0.012);
        gain.gain.exponentialRampToValueAtTime(0.0001,when+0.095);
        oscillator.connect(gain);gain.connect(context.destination);oscillator.start(when);oscillator.stop(when+0.1);
      });
      return true;
    }catch(_error){return false;}
  }
  root.SupaChessAudio={isEnabled:isEnabled,setEnabled:setEnabled,play:play};
})(typeof window!=="undefined"?window:globalThis);
