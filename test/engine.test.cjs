const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const vm=require('node:vm');
const test=require('node:test');

test('restarts Stockfish after a missing bestmove and analyzes the next request',async()=>{
  class FakeWorker{
    static instances=[];
    constructor(workerPath){
      this.workerPath=workerPath;
      this.id=FakeWorker.instances.length+1;
      this.terminated=false;
      FakeWorker.instances.push(this);
    }
    emit(line){
      queueMicrotask(()=>{if(!this.terminated&&this.onmessage)this.onmessage({data:line});});
    }
    postMessage(command){
      if(command==='uci'){
        this.emit('id name Fake Stockfish');
        this.emit('uciok');
      }else if(command==='isready'){
        this.emit('readyok');
      }else if(command.startsWith('go ')&&this.id>1){
        this.emit('info depth 2 multipv 1 score cp 23 pv e2e4');
        this.emit('bestmove e2e4');
      }
    }
    terminate(){this.terminated=true;}
  }
  const context={Worker:FakeWorker,setTimeout,clearTimeout,console};
  vm.runInNewContext(fs.readFileSync(path.join(__dirname,'..','js','engine.js'),'utf8')+'\nglobalThis.StockfishEngine=StockfishEngine;',context);
  const engine=new context.StockfishEngine('fake-worker.js');
  await engine.ready;
  await assert.rejects(
    engine.analyze({fen:'startpos',movetime:1,timeoutMs:20}),
    error=>error.code==='ENGINE_TIMEOUT'&&error.retryable===true
  );
  assert.equal(FakeWorker.instances.length,1);
  assert.equal(FakeWorker.instances[0].terminated,true);
  const result=await engine.analyze({fen:'startpos',movetime:1,timeoutMs:100});
  assert.equal(FakeWorker.instances.length,2);
  assert.equal(result.bestmove,'e2e4');
  assert.equal(result.lines[0].scoreCp,23);
  engine.worker.terminate();
});
