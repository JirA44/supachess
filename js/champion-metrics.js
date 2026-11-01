(function(root){
  "use strict";
  var STORAGE_KEY="supachess-champion-metrics-v1";
  var players={
    carlsen:{name:"Magnus Carlsen",aliases:["Magnus Carlsen","Carlsen, Magnus"]},
    fischer:{name:"Robert James Fischer",aliases:["Robert James Fischer","Fischer, Robert James","Bobby Fischer"]},
    kasparov:{name:"Garry Kasparov",aliases:["Garry Kasparov","Kasparov, Garry"]},
    tal:{name:"Mikhail Tal",aliases:["Mikhail Tal","Tal, Mikhail"]},
    capablanca:{name:"José Raúl Capablanca",aliases:["José Raúl Capablanca","Jose Raul Capablanca","Capablanca, Jose Raul"]},
    anand:{name:"Viswanathan Anand",aliases:["Viswanathan Anand","Anand, Viswanathan"]},
    karpov:{name:"Anatoly Karpov",aliases:["Anatoly Karpov","Karpov, Anatoly"]},
    lasker:{name:"Emanuel Lasker",aliases:["Emanuel Lasker","Lasker, Emanuel"]}
  };
  var currentEngine=null,cancelRequested=false,profilePerformanceResults=null;
  function normalizeName(value){return String(value||"").normalize("NFD").replace(/[\u0300-\u036f]/g,"").toLowerCase().replace(/[^a-z0-9]/g,"");}
  function escapeHtml(value){return String(value==null?"":value).replace(/[&<>"']/g,function(ch){return {"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[ch];});}
  function splitPgnGames(source){
    var text=String(source||"").replace(/\r\n?/g,"\n").trim();
    if(!text)return [];
    var chunks=text.split(/(?=^\[Event\s)/m).map(function(chunk){return chunk.trim();}).filter(Boolean);
    return chunks.length?chunks:[text];
  }
  function parsePgnGames(source,ChessCtor){
    var parsed=[],skipped=0;
    splitPgnGames(source).forEach(function(chunk,index){
      try{
        var board=new ChessCtor();
        var load=board.load_pgn||board.loadPgn;
        if(typeof load!=="function"||!load.call(board,chunk,{sloppy:true})){skipped++;return;}
        var headers=typeof board.header==="function"?board.header():{};
        var moves=board.history({verbose:true});
        if(!moves.length){skipped++;return;}
        parsed.push({headers:headers,moves:moves,index:index+1});
      }catch(_error){skipped++;}
    });
    return {games:parsed,skipped:skipped,total:splitPgnGames(source).length};
  }
  function matchesPlayer(name,player){
    var normalized=normalizeName(name);
    if(!normalized)return false;
    return player.aliases.some(function(alias){
      var candidate=normalizeName(alias);
      return normalized===candidate||normalized.indexOf(candidate)>=0||candidate.indexOf(normalized)>=0;
    });
  }
  function cpScore(line){
    return line&&line.mate===null&&line.scoreCp!==null&&line.scoreCp!==undefined&&Number.isFinite(Number(line.scoreCp))?Number(line.scoreCp):null;
  }
  function winningPercent(cp){return 100/(1+Math.exp(-0.00368208*cp));}
  function moveLoss(beforeCp,afterOpponentCp){return Math.max(0,beforeCp+afterOpponentCp);}
  function moveAccuracy(beforeCp,afterMoverCp){
    var winBefore=winningPercent(beforeCp);
    var winAfter=winningPercent(afterMoverCp);
    var winLoss=Math.max(0,winBefore-winAfter);
    return Math.max(0,Math.min(100,103.1668*Math.exp(-0.04354*winLoss)-3.1669));
  }
  function readResults(){
    try{var data=JSON.parse(localStorage.getItem(STORAGE_KEY)||"{}");return data&&typeof data==="object"&&!Array.isArray(data)?data:{};}catch(_error){return {};}
  }
  function saveResults(results){try{localStorage.setItem(STORAGE_KEY,JSON.stringify(results));return true;}catch(_error){return false;}}
  function renderResults(){
    var body=document.getElementById("champion-results-body");
    if(!body)return;
    var data=readResults();
    var rows=Object.keys(data).map(function(key){return data[key];}).filter(Boolean).sort(function(a,b){return a.name.localeCompare(b.name,"fr");});
    if(!rows.length){body.innerHTML='<tr><td colspan="8">Aucune analyse enregistrée sur cet appareil.</td></tr>';renderRanking();return;}
    body.innerHTML=rows.map(function(row){
      var date=row.completedAt?new Date(row.completedAt).toLocaleString("fr-FR"):"—";
      return "<tr><th scope=\"row\">"+escapeHtml(row.name)+"</th><td>"+row.gamesAnalyzed+" / "+row.candidateGames+"</td><td>"+row.ratedMoves+"</td><td>"+row.accuracy.toFixed(1).replace(".",",")+" %</td><td>"+row.acpl.toFixed(1).replace(".",",")+" cp</td><td>"+row.averageDepth.toFixed(1)+"</td><td>"+escapeHtml(row.engine)+" · "+row.movetime+" ms</td><td>"+escapeHtml(date)+"</td></tr>";
    }).join("");
    renderRanking();
  }
  function renderRanking(){
    var body=document.getElementById("champion-ranking-body");
    var protocolSelect=document.getElementById("champion-ranking-protocol");
    var metricSelect=document.getElementById("champion-ranking-metric");
    var status=document.getElementById("champion-ranking-status");
    var caption=document.getElementById("champion-ranking-caption");
    if(!body||!protocolSelect||!metricSelect||!status)return;
    var all=Object.keys(readResults()).map(function(key){return readResults()[key];}).filter(function(row){
      return row&&row.name&&Number.isFinite(Number(row.accuracy))&&Number.isFinite(Number(row.acpl));
    });
    var groups={};
    all.forEach(function(row){
      var key=String(row.engine||"Stockfish")+"|"+String(row.movetime||0);
      if(!groups[key])groups[key]={key:key,label:String(row.engine||"Stockfish")+" · "+String(row.movetime||0)+" ms",count:0};
      groups[key].count++;
    });
    var previous=protocolSelect.value;
    var orderedGroups=Object.keys(groups).map(function(key){return groups[key];}).sort(function(a,b){return b.count-a.count||a.label.localeCompare(b.label,"fr");});
    protocolSelect.innerHTML=orderedGroups.map(function(group){return '<option value="'+escapeHtml(group.key)+'">'+escapeHtml(group.label)+' · '+group.count+' joueur(s)</option>';}).join("");
    if(groups[previous])protocolSelect.value=previous;
    else if(orderedGroups.length)protocolSelect.value=orderedGroups[0].key;
    if(!orderedGroups.length){
      body.innerHTML='<tr><td colspan="6">Aucune analyse compatible enregistrée.</td></tr>';
      status.textContent="Analyse au moins deux joueurs avec les mêmes réglages pour établir un classement.";
      if(caption)caption.textContent="Classement local des analyses disponibles";
      return;
    }
    var selected=protocolSelect.value;
    var rows=all.filter(function(row){return String(row.engine||"Stockfish")+"|"+String(row.movetime||0)===selected;});
    var metric=metricSelect.value;
    var labels={accuracy:"Précision moyenne",acpl:"ACPL",gamesAnalyzed:"Parties analysées",ratedMoves:"Demi-coups évalués",averageDepth:"Profondeur moyenne"};
    var values={accuracy:function(row){return Number(row.accuracy);},acpl:function(row){return Number(row.acpl);},gamesAnalyzed:function(row){return Number(row.gamesAnalyzed)||0;},ratedMoves:function(row){return Number(row.ratedMoves)||0;},averageDepth:function(row){return Number(row.averageDepth)||0;}};
    rows.sort(function(a,b){var diff=values[metric](a)-values[metric](b);return metric==="acpl"?diff: -diff;});
    body.innerHTML=rows.map(function(row,index){
      var score=metric==="accuracy"?Number(row.accuracy).toFixed(1).replace(".",",")+" %":
        metric==="acpl"?Number(row.acpl).toFixed(1).replace(".",",")+" cp":
        metric==="averageDepth"?Number(row.averageDepth).toFixed(1)+" ply":String(values[metric](row));
      return "<tr><td>"+(index+1)+"</td><th scope=\"row\">"+escapeHtml(row.name)+"</th><td>"+score+"</td><td>"+(Number(row.gamesAnalyzed)||0)+" / "+(Number(row.candidateGames)||0)+"</td><td>"+(Number(row.ratedMoves)||0)+"</td><td>"+(Number(row.averageDepth)||0).toFixed(1)+" ply</td></tr>";
    }).join("");
    var protocol=groups[selected]?groups[selected].label:"";
    if(caption)caption.textContent=labels[metric]+" · "+protocol;
    status.textContent=rows.length+" joueur(s) classé(s) pour "+labels[metric].toLocaleLowerCase("fr")+
      " · "+protocol+". Le rang utilise l’échantillon affiché; parties, cadence et positions peuvent différer.";
  }
  function readSelectedName(){
    var key=document.getElementById("champion-player").value;
    if(key==="custom")return document.getElementById("custom-player-name").value.trim();
    return players[key].name;
  }
  function updateCustomPlayer(){
    var custom=document.getElementById("champion-player").value==="custom";
    document.getElementById("custom-player-wrap").hidden=!custom;
  }
  function moveGame(board,move){
    return board.move({from:move.from,to:move.to,promotion:move.promotion||"q"});
  }
  async function analyzeGame(player,game,movetime,progress){
    var headers=game.headers;
    var white=String(headers.White||""),black=String(headers.Black||"");
    var color=matchesPlayer(white,player)? "w":matchesPlayer(black,player)?"b":null;
    if(!color)return null;
    var initial=headers.FEN?new Chess(headers.FEN):new Chess();
    var measured=0,lossSum=0,accuracySum=0,depthSum=0;
    for(var i=0;i<game.moves.length;i++){
      var move=game.moves[i],beforeFen=initial.fen();
      if(move.color===color){
        if(cancelRequested)throw new Error("ANALYSIS_CANCELLED");
        var before=await currentEngine.analyze({fen:beforeFen,multipv:1,movetime:movetime,elo:0});
        if(cancelRequested)throw new Error("ANALYSIS_CANCELLED");
        var beforeLine=before.lines&&before.lines[0];
        var beforeCp=cpScore(beforeLine);
        var played=moveGame(initial,move);
        if(!played)throw new Error("Un coup PGN n’a pas pu être rejoué.");
        var after=await currentEngine.analyze({fen:initial.fen(),multipv:1,movetime:movetime,elo:0});
        var afterLine=after.lines&&after.lines[0];
        var afterCp=cpScore(afterLine);
        if(beforeCp!==null&&afterCp!==null){
          var loss=moveLoss(beforeCp,afterCp);
          lossSum+=loss;
          accuracySum+=moveAccuracy(beforeCp,-afterCp);
          depthSum+=(Number(beforeLine.depth)||0)+(Number(afterLine.depth)||0);
          measured++;
        }
        progress();
      }else{
        if(!moveGame(initial,move))throw new Error("Un coup PGN n’a pas pu être rejoué.");
      }
    }
    if(!measured)return null;
    return {moves:measured,loss:lossSum,accuracy:accuracySum,depth:depthSum/(2*measured)};
  }
  async function runAnalysis(){
    var status=document.getElementById("champion-analysis-status");
    var progressBar=document.getElementById("champion-progress");
    var analyzeButton=document.getElementById("champion-analyze");
    var cancelButton=document.getElementById("champion-cancel");
    var raw=document.getElementById("champion-pgn").value;
    var file=document.getElementById("champion-pgn-file").files[0];
    if(file){try{raw=await file.text();}catch(_error){status.textContent="Impossible de lire ce fichier PGN.";status.dataset.state="error";return;}}
    var playerName=readSelectedName();
    if(!playerName){status.textContent="Saisis le nom du joueur tel qu’il apparaît dans les en-têtes PGN.";status.dataset.state="error";return;}
    var key=document.getElementById("champion-player").value;
    var player=key==="custom"?{name:playerName,aliases:[playerName]}:players[key];
    var parsed=parsePgnGames(raw,typeof Chess==="undefined"?null:Chess);
    var candidates=parsed.games.filter(function(game){
      return matchesPlayer(String(game.headers.White||""),player)||matchesPlayer(String(game.headers.Black||""),player);
    });
    if(!candidates.length){status.textContent="Aucune partie PGN valide trouvée avec "+playerName+" dans l’en-tête White/Black. Vérifie le joueur choisi et le PGN.";status.dataset.state="error";return;}
    var limit=Number(document.getElementById("champion-game-limit").value)||10;
    var selected=candidates.slice(0,limit);
    var movetime=Number(document.getElementById("champion-movetime").value)||300;
    var totalMoves=selected.reduce(function(total,game){return total+game.moves.filter(function(move){return (matchesPlayer(String(game.headers.White||""),player)&&move.color==="w")||(matchesPlayer(String(game.headers.Black||""),player)&&move.color==="b");}).length;},0);
    if(typeof StockfishEngine==="undefined"){status.textContent="Le moteur local n’est pas disponible dans cette page.";status.dataset.state="error";return;}
    cancelRequested=false;
    analyzeButton.disabled=true;cancelButton.disabled=false;
    progressBar.hidden=false;progressBar.max=Math.max(1,totalMoves);progressBar.value=0;
    status.dataset.state="";status.textContent="Préparation de Stockfish…";
    try{
      if(!currentEngine)currentEngine=new StockfishEngine("vendor/stockfish-19-lite-single.js");
      await currentEngine.ready;
      var totalGames=0,totalRated=0,lossSum=0,accuracySum=0,depthSum=0;
      for(var i=0;i<selected.length;i++){
        if(cancelRequested)throw new Error("ANALYSIS_CANCELLED");
        var result=await analyzeGame(player,selected[i],movetime,function(){
          progressBar.value=Math.min(totalMoves,progressBar.value+1);
          status.textContent="Analyse Stockfish · partie "+(i+1)+"/"+selected.length+" · "+progressBar.value+"/"+totalMoves+" demi-coups comptés.";
        });
        if(result){totalGames++;totalRated+=result.moves;lossSum+=result.loss;accuracySum+=result.accuracy;depthSum+=result.depth*result.moves;}
      }
      if(cancelRequested)throw new Error("ANALYSIS_CANCELLED");
      if(!totalRated)throw new Error("Aucune évaluation comparable obtenue. Les positions de mat et les évaluations manquantes sont exclues.");
      var record={name:playerName,gamesAnalyzed:totalGames,candidateGames:candidates.length,ratedMoves:totalRated,
        accuracy:accuracySum/totalRated,acpl:lossSum/totalRated,engine:currentEngine.engineName||"Stockfish",movetime:movetime,
        averageDepth:depthSum/totalRated,sourceFile:file?file.name:"PGN collé",completedAt:new Date().toISOString()};
      var results=readResults();results[key]=record;
      if(!saveResults(results))throw new Error("Le stockage local du navigateur est indisponible; exporte ou capture le résultat avant de quitter.");
      var protocolSelect=document.getElementById("champion-ranking-protocol");
      if(protocolSelect)protocolSelect.value=String(record.engine||"Stockfish")+"|"+String(record.movetime||0);
      renderResults();
      status.dataset.state="success";
      status.textContent="Terminé : "+totalGames+" partie(s), "+totalRated+" demi-coups comparables · "+record.accuracy.toFixed(1)+" % de précision moyenne · "+record.acpl.toFixed(1)+" cp d’ACPL · profondeur moyenne observée "+record.averageDepth.toFixed(1)+".";
    }catch(error){
      if(String(error&&error.message)==="ANALYSIS_CANCELLED"){status.textContent="Analyse arrêtée. Aucun résultat partiel n’a été enregistré.";status.dataset.state="";}
      else{status.textContent="Analyse interrompue : "+(error&&error.message||String(error));status.dataset.state="error";}
    }finally{
      analyzeButton.disabled=false;cancelButton.disabled=true;progressBar.hidden=true;
    }
  }
  function cancelAnalysis(){cancelRequested=true;if(currentEngine)currentEngine.stop();}
  function init(){
    if(!root.document)return;
    var analyze=document.getElementById("champion-analyze");
    if(!analyze)return;
    profilePerformanceResults=readResults();
    renderResults();
    document.getElementById("champion-player").addEventListener("change",updateCustomPlayer);
    document.getElementById("champion-pgn-file").addEventListener("change",function(){
      var file=this.files&&this.files[0];if(file)document.getElementById("champion-analysis-status").textContent="Fichier sélectionné : "+file.name+". Le contenu sera analysé localement.";
    });
    analyze.addEventListener("click",runAnalysis);
    document.getElementById("champion-cancel").addEventListener("click",cancelAnalysis);
    document.getElementById("champion-ranking-metric").addEventListener("change",renderRanking);
    document.getElementById("champion-ranking-protocol").addEventListener("change",renderRanking);
    document.getElementById("champion-clear").addEventListener("click",function(){
      try{localStorage.removeItem(STORAGE_KEY);renderResults();document.getElementById("champion-analysis-status").textContent="Les résultats locaux ont été effacés.";}catch(_error){}
    });
  }
  var api={splitPgnGames:splitPgnGames,parsePgnGames:parsePgnGames,moveAccuracy:moveAccuracy,moveLoss:moveLoss,winningPercent:winningPercent,matchesPlayer:matchesPlayer};
  root.SupaChampionMetrics=api;
  if(root.document){if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",init);else init();}
})(typeof window!=="undefined"?window:this);
