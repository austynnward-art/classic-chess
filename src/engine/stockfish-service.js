export class StockfishService {
  constructor(workerUrl) { this.workerUrl=workerUrl; this.worker=null; this.ready=false; this.starting=null; this.generation=0; this.queue=[]; this.active=null; this.jobId=0; }
  async start() {
    if (this.ready && this.worker) return;
    if (this.starting) return this.starting;
    const generation=++this.generation, worker=new Worker(this.workerUrl); this.worker=worker; this.ready=false;
    this.starting=new Promise((resolve,reject)=>{
      worker.onmessage=event=>{
        const line=String(event.data||""); if(worker!==this.worker||generation!==this.generation)return;
        if(line==="uciok"){worker.postMessage("setoption name Threads value 1");worker.postMessage("isready");return;}
        if(line==="readyok"){this.ready=true;this.starting=null;this.runNext();resolve();return;}
        this.handleMessage(worker,generation,line);
      };
      worker.onerror=error=>{if(worker!==this.worker||generation!==this.generation)return;this.starting=null;this.restart();reject(error instanceof Error?error:new Error("Stockfish worker error"));};
      try{worker.postMessage("uci");}catch(error){this.starting=null;this.restart();reject(error);}
    });
    return this.starting;
  }
  handleMessage(worker,generation,line){
    if(worker!==this.worker||generation!==this.generation)return;
    if(line.startsWith("bestmove")){
      const job=this.active;if(!job||job.generation!==generation)return;
      const bestMove=line.split(/\s+/)[1]||"0000";this.active=null;clearTimeout(job.timer);job.resolve(bestMove);this.runNext();
    }
  }
  search(fen,{depth=12,time=1800}={}){
    return new Promise((resolve,reject)=>{
      this.queue.push({id:++this.jobId,fen,depth,time,generation:this.generation,resolve,reject});
      if(!this.worker)this.start().catch(()=>{});else this.runNext();
    });
  }
  runNext(){
    if(!this.ready||this.active||!this.queue.length||!this.worker)return;
    const job=this.queue.shift();job.generation=this.generation;this.active=job;
    try{
      this.worker.postMessage("position fen "+job.fen);this.worker.postMessage("go depth "+job.depth+" movetime "+job.time);
      job.timer=setTimeout(()=>{
        if(this.active!==job)return;
        const oldWorker=this.worker;this.generation++;this.active=null;this.worker=null;this.ready=false;this.starting=null;
        try{oldWorker?.postMessage("stop");}catch{} try{oldWorker?.terminate();}catch{}
        job.reject(new Error("Stockfish search timed out"));
        if(this.queue.length)this.start().catch(()=>{});
      },job.time+1500);
    }catch(error){this.active=null;job.reject(error);this.restart();}
  }
  cancel(){
    this.generation++;const queued=this.queue.splice(0);queued.forEach(job=>job.reject(new Error("Search cancelled")));
    const active=this.active;this.active=null;if(active){clearTimeout(active.timer);active.reject(new Error("Search cancelled"));}
    const oldWorker=this.worker;this.worker=null;this.ready=false;this.starting=null;
    try{oldWorker?.postMessage("stop");}catch{} try{oldWorker?.terminate();}catch{}
  }
  restart(){
    const oldWorker=this.worker;this.worker=null;this.ready=false;this.starting=null;this.generation++;
    try{oldWorker?.terminate();}catch{}
    const queued=this.queue.splice(0);queued.forEach(job=>job.reject(new Error("Engine restarted")));
    const active=this.active;this.active=null;if(active){clearTimeout(active.timer);active.reject(new Error("Engine restarted"));}
  }
  destroy(){
    this.generation++;const queued=this.queue.splice(0);queued.forEach(job=>job.reject(new Error("Engine destroyed")));
    const active=this.active;this.active=null;if(active){clearTimeout(active.timer);active.reject(new Error("Engine destroyed"));}
    const worker=this.worker;this.worker=null;this.ready=false;this.starting=null;try{worker?.terminate();}catch{}
  }
}