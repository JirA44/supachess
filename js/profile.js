(function(){
'use strict';
var db=null, auth=null;
var GAME_TYPES = {
  puzzle: {label:'Puzzle', icon:'🧩', defaultRating:1200},
  classic3s: {label:'Classique 3 s/coup', icon:'⚡', defaultRating:1200},
  classic5s: {label:'Classique 5 s/coup', icon:'⏱️', defaultRating:1200}
};
function init(a,d){ auth=a; db=d; }
function ensureUserProfile(user){
  if(!db||!user||!user.uid) return Promise.resolve();
  var ref=db.collection('users').doc(user.uid);
  return ref.get().then(function(doc){
    if(doc.exists) return;
    var data={
      uid:user.uid,
      email:user.email||'',
      displayName:user.displayName|| (user.email? user.email.split('@')[0] : profileText('profile_guest','Joueur')),
      photoURL:user.photoURL||'',
      createdAt: firebase.firestore.FieldValue.serverTimestamp(),
      stats:{
        puzzle:{rating:1200, wins:0, losses:0, draws:0, played:0},
        classic3s:{rating:1200, wins:0, losses:0, draws:0, played:0},
        classic5s:{rating:1200, wins:0, losses:0, draws:0, played:0}
      },
      totalGames:0
    };
    return ref.set(data);
  }).catch(function(){});
}
function updateStats(uid, gameType, result, delta){
  if(!db||!uid||!GAME_TYPES[gameType]) return;
  var ref=db.collection('users').doc(uid);
  var map={win:'wins', loss:'losses', draw:'draws'};
  var field='stats.'+gameType;
  var upd={};
  upd[field+'.played']=firebase.firestore.FieldValue.increment(1);
  upd['totalGames']=firebase.firestore.FieldValue.increment(1);
  if(map[result]) upd[field+'.'+map[result]]=firebase.firestore.FieldValue.increment(1);
  if(delta) upd[field+'.rating']=firebase.firestore.FieldValue.increment(delta);
  ref.set(upd,{merge:true});
}
function searchUsers(query, limit){
  limit=limit||8;
  if(!db||!query) return Promise.resolve([]);
  query=query.trim().toLowerCase();
  // Firestore can't do case-insensitive contains, so we fetch and filter client-side for small set
  return db.collection('users').limit(50).get().then(function(snap){
    var out=[];
    snap.forEach(function(doc){
      var d=doc.data();
      var name=(d.displayName||'').toLowerCase();
      var email=(d.email||'').toLowerCase();
      if(name.indexOf(query)!==-1 || email.indexOf(query)!==-1){
        out.push({uid:doc.id, displayName:d.displayName, email:d.email, photoURL:d.photoURL, stats:d.stats});
      }
    });
    return out.slice(0,limit);
  });
}
function getTopRanking(gameType, limit){
  limit=limit||10;
  if(!db||!GAME_TYPES[gameType]) return Promise.resolve([]);
  return db.collection('users').orderBy('stats.'+gameType+'.rating','desc').limit(limit).get().then(function(snap){
    var out=[];
    snap.forEach(function(doc){
      var d=doc.data();
      out.push({uid:doc.id, displayName:d.displayName, rating:(d.stats&&d.stats[gameType]&&d.stats[gameType].rating)||1200, stats:d.stats});
    });
    return out;
  }).catch(function(){ return []; });
}
function getProfile(uid){
  if(!db||!uid) return Promise.resolve(null);
  return db.collection('users').doc(uid).get().then(function(doc){
    if(!doc.exists) return null;
    var data=doc.data();
    if(!data.uid) data.uid=uid;
    return data;
  });
}
// UI helpers
function escapeProfileText(value){
  return String(value==null?'':value).replace(/[&<>\"']/g,function(ch){return {'&':'&amp;','<':'&lt;','>':'&gt;','\"':'&quot;',"'":'&#39;'}[ch];});
}
function summarizeAccuracyGames(games, now){
  var currentTime=Number.isFinite(Number(now))?Number(now):Date.now();
  var day=24*60*60*1000;
  var records=(Array.isArray(games)?games:[]).map(function(game){
    if(!game||!['1-0','0-1','1/2-1/2'].includes(String(game.result||'')))return null;
    var color=game.userColor;
    if(color!=='w'&&color!=='b'){
      var pgn=String(game.pgn||'');
      var colorHeader=pgn.match(/^\[SupaChessUserColor\s+"([wb])"\]/m);
      if(colorHeader)color=colorHeader[1];
      else if(/^\[White\s+"Joueur"\]/mi.test(pgn))color='w';
      else if(/^\[Black\s+"Joueur"\]/mi.test(pgn))color='b';
    }
    if(color!=='w'&&color!=='b')return null;
    var raw=game[color==='w'?'accuracyW':'accuracyB'];
    if(raw===null||raw===undefined||raw==='')return null;
    var accuracy=Number(raw);
    if(!Number.isFinite(accuracy))return null;
    if(accuracy>=0&&accuracy<=1)accuracy*=100;
    accuracy=Math.max(0,Math.min(100,accuracy));
    var timestamp=game.date?new Date(game.date).getTime():NaN;
    var moves=Math.max(1,Number(game.stats&&game.stats.moves)||1);
    return {accuracy:accuracy,timestamp:Number.isFinite(timestamp)?timestamp:null,moves:moves};
  }).filter(function(record){return !!record;});
  function average(items){
    var total=0,weight=0;
    items.forEach(function(record){total+=record.accuracy*record.moves;weight+=record.moves;});
    return {average:weight?total/weight:null,games:items.length,moves:weight};
  }
  function inWindow(start,end){
    return records.filter(function(record){return record.timestamp!==null&&record.timestamp>start&&record.timestamp<=end;});
  }
  var weekCurrent=average(inWindow(currentTime-7*day,currentTime));
  var weekPrevious=average(inWindow(currentTime-14*day,currentTime-7*day));
  var monthCurrent=average(inWindow(currentTime-30*day,currentTime));
  var monthPrevious=average(inWindow(currentTime-60*day,currentTime-30*day));
  return {
    all:average(records),
    week:{current:weekCurrent,previous:weekPrevious,delta:weekCurrent.average!==null&&weekPrevious.average!==null?weekCurrent.average-weekPrevious.average:null},
    month:{current:monthCurrent,previous:monthPrevious,delta:monthCurrent.average!==null&&monthPrevious.average!==null?monthCurrent.average-monthPrevious.average:null}
  };
}
function readLocalLearningProgress(data){
  function read(key,fallback){try{return JSON.parse(localStorage.getItem(key)||'');}catch(_e){return fallback;}}
  function completedCount(record,key){
    var value=record&&record[key];
    if(Array.isArray(value))return value.length;
    if(value&&typeof value==='object')return Object.keys(value).filter(function(id){return !!value[id];}).length;
    return Math.max(0,Number(record&&record[key+'Count'])||0);
  }
  var lessons=read('supachess-book-lessons-v1',{});
  var games=read('supachess_reviewed_pgns',[]);
  var playedGames=read('supachess_games',[]);
  var localProgress=read('chessnova_progress',{});
  var cloudProgress=data&&data.progress&&typeof data.progress==='object'?data.progress:{};
  if(!lessons||typeof lessons!=='object'||Array.isArray(lessons))lessons={};
  if(!Array.isArray(games))games=[];
  if(!Array.isArray(playedGames))playedGames=[];
  var records=Object.keys(lessons).map(function(id){return {id:id,progress:lessons[id]};}).filter(function(item){return item.progress&&typeof item.progress==='object';});
  var completed=records.filter(function(item){return item.progress.completed;});
  var attempted=records.filter(function(item){return Number(item.progress.attempts)>0||item.progress.completed;});
  var moveExercises=games.reduce(function(sum,game){return sum+(Array.isArray(game.correctionExercises)?game.correctionExercises.length:0);},0);
  var latest=games.find(function(game){return Array.isArray(game.correctionExercises)&&game.correctionExercises.length;})||games[0]||null;
  var categoryCounts={};
  games.forEach(function(game){(Array.isArray(game.correctionExercises)?game.correctionExercises:[]).forEach(function(exercise){
    var type=exercise.classification||'unrated';categoryCounts[type]=(categoryCounts[type]||0)+1;
  });});
  var xp=Math.max(0,Number(localProgress.xp)||0,Number(cloudProgress.xp)||0,Number(data&&data.xp)||0);
  var progressApi=window.ChessNovaProgress;
  var level=progressApi&&typeof progressApi.getLevelForXP==='function'?progressApi.getLevelForXP(xp):Math.max(1,Number(cloudProgress.level)||Number(localProgress.level)||1);
  var streak=Math.max(Number(localProgress.currentStreak)||0,Number(cloudProgress.currentStreak)||0);
  var practiceSessions=Math.max(Number(localProgress.practice&&localProgress.practice.sessions)||0,Number(cloudProgress.practice&&cloudProgress.practice.sessions)||0);
  var puzzleElo=Math.max(0,Number(localStorage.getItem('puzzle_elo'))||Number(cloudProgress.puzzleElo)||0);
  var accuracyGames=games.map(function(game){
    var value=Number(game&&game.accuracy);
    if(!Number.isFinite(value))return null;
    if(value>=0&&value<=1)value*=100;
    return Math.max(0,Math.min(100,value));
  }).filter(function(value){return value!==null;}).slice(-12);
  var openings=read('chessnova_training_openings',{});
  var endgames=read('chessnova_training_endgames',{});
  var tactics=read('chessnova_training_tactics',{});
  return {
    completed:completed,attempted:attempted,games:games,moveExercises:moveExercises,latest:latest,
    categoryCounts:categoryCounts,xp:xp,level:level,streak:streak,practiceSessions:practiceSessions,
    puzzlesSolved:Math.max(Number(localProgress.puzzlesSolved)||0,Number(cloudProgress.puzzlesSolved)||0),
    puzzleElo:puzzleElo,
    openingMastered:completedCount(openings,'completed'),
    endgameMastered:completedCount(endgames,'completed'),
    tacticMastered:completedCount(tactics,'completedCategories'),
    accuracyGames:accuracyGames,
    accuracySummary:summarizeAccuracyGames(playedGames)
  };
}
function profileText(key,fallback){
  var value=window.ChessNovaI18n&&window.ChessNovaI18n.t?window.ChessNovaI18n.t(key):key;
  return !value||value===key?fallback:value;
}
function profileRankName(level){
  var ranks=['profile_rank_beginner','profile_rank_apprentice','profile_rank_player','profile_rank_competitor','profile_rank_challenger','profile_rank_expert','profile_rank_master','profile_rank_grand_master','profile_rank_champion','profile_rank_legend'];
  if(level>10)return profileText('profile_rank_legend','Légende')+' ★'+(level-10);
  return profileText(ranks[Math.max(0,Math.min(9,level-1))],'Niveau '+level);
}
function profileXPProgress(xp,level){
  var api=window.ChessNovaProgress;
  if(api&&typeof api.getXPProgress==='function')return Math.max(0,Math.min(100,Number(api.getXPProgress(xp))||0));
  var thresholds=[0,100,250,500,800,1200,1800,2500,3500,5000];
  var current=thresholds[Math.max(0,Math.min(9,level-1))]||0;
  var next=thresholds[Math.min(9,level)]||current;
  return next>current?Math.max(0,Math.min(100,(xp-current)/(next-current)*100)):0;
}
function formatAccuracyPercent(value){
  return value===null||value===undefined||!Number.isFinite(Number(value))?'—':Number(value).toLocaleString('fr-FR',{minimumFractionDigits:1,maximumFractionDigits:1})+' %';
}
function renderPlayerAccuracyPanel(summary){
  summary=summary||{};
  function changeText(period){
    if(period.delta===null||period.delta===undefined)return 'Évolution indisponible : pas encore assez de parties dans les deux périodes.';
    var sign=period.delta>0?'+':period.delta<0?'−':'±';
    return sign+' '+Math.abs(period.delta).toLocaleString('fr-FR',{minimumFractionDigits:1,maximumFractionDigits:1})+' points par rapport à la période précédente';
  }
  function card(title,record,change){
    var count=record&&Number(record.games)||0;
    var detail=count+' partie'+(count>1?'s':'')+' analysée'+(count>1?'s':'');
    return '<article class="profile-accuracy-card"><h4>'+title+'</h4><strong class="profile-accuracy-value">'+formatAccuracyPercent(record&&record.average)+'</strong><span class="profile-accuracy-count">'+detail+'</span>'+(change?'<span class="profile-accuracy-change">'+change+'</span>':'')+'</article>';
  }
  var hasAny=summary.all&&summary.all.average!==null;
  return '<section class="profile-accuracy-panel" aria-labelledby="profile-accuracy-title"><h4 id="profile-accuracy-title">Précision moyenne du joueur</h4>'+
    (hasAny?'<div class="profile-accuracy-grid">'+
      card('Toutes les parties',summary.all,'')+
      card('7 derniers jours',summary.week&&summary.week.current,changeText(summary.week||{}))+
      card('30 derniers jours',summary.month&&summary.month.current,changeText(summary.month||{}))+
    '</div><p class="profile-accuracy-note">Moyenne pondérée par le nombre de demi-coups analysés. Les évolutions comparent chaque période à la période précédente de même durée.</p>':
    '<p class="profile-accuracy-note">Aucune partie terminée avec précision disponible.</p>')+'</section>';
}
function profileNextLevelXP(xp,level){
  var api=window.ChessNovaProgress;
  if(api&&typeof api.getPrestigeXP==='function'){
    var apiTarget=api.getPrestigeXP(level+1);
    if(apiTarget!==null&&apiTarget!==undefined&&Number.isFinite(Number(apiTarget)))return Number(apiTarget);
  }
  var thresholds=[0,100,250,500,800,1200,1800,2500,3500,5000];
  return level>0&&level<thresholds.length-1?thresholds[level]:null;
}
function readDiagnosticProfile(){
  function read(key,fallback){try{return JSON.parse(localStorage.getItem(key)||'');}catch(_e){return fallback;}}
  var diagnostic=read('supachess-level-diagnostic',null);
  var games=read('supachess_games',[]);
  if(!diagnostic||!Array.isArray(games))return {diagnostic:diagnostic,games:[],ratedMoves:[],gameCount:0};
  var start=Date.parse(diagnostic.startedAt||'');
  var selected=games.filter(function(game){
    var started=Number.parseInt(String(game&&game.id||''),10);
    return game&&Number.isFinite(start)&&Number.isFinite(started)&&started>=start&&
      /stockfish/i.test(String(game.engineName||''))&&
      ['1-0','0-1','1/2-1/2'].includes(game.result)&&
      !game.abandoned&&!game.stopped&&game.termination!=='abandoned'&&game.termination!=='unterminated'&&
      Number(game.stats&&game.stats.moves)>0&&Array.isArray(game.moveGrades);
  }).sort(function(a,b){return Number.parseInt(String(a.id),10)-Number.parseInt(String(b.id),10);});
  var diagnosticGames=selected.slice(0,Math.max(10,Number(diagnostic.analyzedGamesAtCompletion)||10));
  var ratedMoves=[];
  diagnosticGames.forEach(function(game){
    var phaseByPly={};
    try{
      if(typeof Chess==='function'&&game.pgn){
        var board=new Chess();
        var loadPgn=board.load_pgn||board.loadPgn;
        if(typeof loadPgn==='function'){
          loadPgn.call(board,game.pgn);
          var history=board.history();
          for(var ply=history.length;ply>0;ply--){
            board.undo();
            var fen=board.fen();
            var moveNumber=Math.ceil(ply/2);
            var phase=globalThis.ReviewInsights&&typeof globalThis.ReviewInsights.phaseOf==='function'
              ? globalThis.ReviewInsights.phaseOf(fen,moveNumber)
              : moveNumber<=10?'opening':(!/[Qq]/.test((fen.split(' ')[0]||''))&&((fen.match(/[QRBNqrbn]/g)||[]).length<=6)?'endgame':'middlegame');
            phaseByPly[ply]=phase;
          }
        }
      }
    }catch(_e){}
    (game.moveGrades||[]).forEach(function(move){
      if(move&&move.color===game.userColor&&move.category&&move.category!=='unrated'){
        var category=move.category==='error'?'mistake':move.category;
        if(['brilliant','best','very-good','good','ok','inaccuracy','mistake','blunder'].includes(category)){
          ratedMoves.push({category:category,gameId:String(game.id),phase:phaseByPly[Number(move.ply)]||null});
        }
      }
    });
  });
  return {diagnostic:diagnostic,games:diagnosticGames,ratedMoves:ratedMoves,gameCount:diagnosticGames.length};
}
function renderDiagnosticProfile(){
  var report=readDiagnosticProfile();
  var diagnostic=report.diagnostic;
  if(!diagnostic)return '';
  var labels={'inaccuracy':'Imprécisions','mistake':'Erreurs','blunder':'Gaffes'};
  var categories=['inaccuracy','mistake','blunder'];
  var rated=report.ratedMoves;
  var counts={inaccuracy:0,mistake:0,blunder:0,solid:0};
  var phaseCounts={opening:{moves:0,issues:0},middlegame:{moves:0,issues:0},endgame:{moves:0,issues:0}};
  rated.forEach(function(move){
    if(categories.indexOf(move.category)>=0)counts[move.category]++;
    else counts.solid++;
    if(move.phase&&phaseCounts[move.phase]){
      phaseCounts[move.phase].moves++;
      if(categories.includes(move.category))phaseCounts[move.phase].issues++;
    }
  });
  var eligible=diagnostic.completed===true||report.gameCount>=10;
  var html='<section class="profile-diagnostic-report" aria-labelledby="profile-diagnostic-report-title" style="margin:18px 0;padding:16px;border:1px solid #4facfe;border-radius:14px;background:#202b3d;color:#f4f7fb">'+
    '<h4 id="profile-diagnostic-report-title" style="margin-top:0">Bilan de ton diagnostic</h4>';
  if(diagnostic.active&&report.gameCount<10){
    var completed=report.gameCount;
    return html+'<p>Diagnostic en cours : '+completed+'/10 parties terminées contre Stockfish. Le bilan apparaîtra ici après le seuil.</p></section>';
  }
  if(!eligible){
    return html+'<p>Diagnostic non terminé : '+Number(diagnostic.gamesCompletedBeforeEnd||diagnostic.analyzedGamesAtEnd||0)+'/10 parties admissibles. Termine un nouveau diagnostic pour établir ton profil.</p></section>';
  }
  html+='<p>Échantillon : '+report.gameCount+' partie(s) terminée(s), '+rated.length+' demi-coup(s) de ton camp évalué(s) par Stockfish. Les résultats décrivent cet échantillon et ne constituent pas un Elo FIDE.</p>';
  if(!rated.length){
    return html+'<p>Les parties sont comptées, mais aucune note de demi-coup exploitable n’a été sauvegardée pour ton camp. Le radar ne peut pas être calculé à partir de ces données.</p></section>';
  }
  var rate=function(predicate){return rated.length?Math.round(100*rated.filter(predicate).length/rated.length):0;};
  var metrics=[
    {label:'Coups solides',value:rate(function(move){return ['brilliant','best','very-good','good','ok'].includes(move.category);})},
    {label:'Imprécisions évitées',value:rate(function(move){return move.category!=='inaccuracy';})},
    {label:'Erreurs évitées',value:rate(function(move){return move.category!=='mistake';})},
    {label:'Gaffes évitées',value:rate(function(move){return move.category!=='blunder';})}
  ];
  var gameRates=report.games.map(function(game){
    var moves=(game.moveGrades||[]).filter(function(move){return move&&move.color===game.userColor&&move.category&&move.category!=='unrated';});
    return moves.length?100*moves.filter(function(move){return !['inaccuracy','error','mistake','blunder'].includes(move.category);}).length/moves.length:null;
  }).filter(function(value){return Number.isFinite(value);});
  var average=gameRates.length?gameRates.reduce(function(sum,value){return sum+value;},0)/gameRates.length:0;
  var variance=gameRates.length?gameRates.reduce(function(sum,value){return sum+Math.pow(value-average,2);},0)/gameRates.length:0;
  metrics.push({label:'Régularité',value:Math.max(0,Math.round(100-Math.sqrt(variance)*2))});
  var center={x:150,y:132},radius=74;
  function point(index,scale){var angle=(-Math.PI/2)+(Math.PI*2*index/metrics.length);return {x:center.x+Math.cos(angle)*radius*scale,y:center.y+Math.sin(angle)*radius*scale};}
  var ringScales=[.25,.5,.75,1];
  var rings=ringScales.map(function(scale){return metrics.map(function(_metric,index){var p=point(index,scale);return p.x.toFixed(1)+','+p.y.toFixed(1);}).join(' ');}).map(function(points){return '<polygon points="'+points+'" fill="none" stroke="#53647b" stroke-width="1"/>';}).join('');
  var ringLabels=ringScales.map(function(scale){var y=center.y-radius*scale+3;return '<text x="'+(center.x+4)+'" y="'+y.toFixed(1)+'" fill="#dce6f2" font-size="8">'+Math.round(scale*100)+'%</text>';}).join('');
  var axes=metrics.map(function(metric,index){var p=point(index,1);return '<line x1="'+center.x+'" y1="'+center.y+'" x2="'+p.x.toFixed(1)+'" y2="'+p.y.toFixed(1)+'" stroke="#53647b"/>';}).join('');
  var polygon=metrics.map(function(metric,index){var p=point(index,metric.value/100);return p.x.toFixed(1)+','+p.y.toFixed(1);}).join(' ');
  var labelsSvg=metrics.map(function(metric,index){var p=point(index,1.22);var anchor=p.x<center.x-8?'end':p.x>center.x+8?'start':'middle';var y=p.y+(p.y<center.y?0:12);return '<text x="'+p.x.toFixed(1)+'" y="'+y.toFixed(1)+'" text-anchor="'+anchor+'" fill="#f4f7fb" font-size="10">'+metric.label+' '+metric.value+'%</text>';}).join('');
  html+='<div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(280px,1fr));gap:12px;align-items:start"><article style="min-width:0;padding:12px;border:1px solid #53647b;border-radius:12px;background:rgba(12,20,32,.55)"><h5>Radar du jeu mesuré</h5><svg viewBox="0 0 300 264" role="img" aria-label="Radar du diagnostic : '+metrics.map(function(metric){return metric.label+' '+metric.value+' pour cent';}).join(', ')+'" style="display:block;width:min(100%,420px);height:auto;margin:0 auto">'+rings+axes+ringLabels+'<polygon points="'+polygon+'" fill="rgba(91,190,255,.28)" stroke="#68c5ff" stroke-width="2"/>'+labelsSvg+'</svg>'+
    '<p><strong>Légende :</strong> la surface bleue représente le score mesuré; l’échelle radiale va de 0 à 100 %. Plus la surface s’étend vers l’extérieur, plus le score est élevé. « Coups solides » regroupe les coups brillants, meilleurs, très bons, bons et OK. Les axes « imprécisions évitées », « erreurs évitées » et « gaffes évitées » montrent la part des coups notés hors de la catégorie indiquée. « Régularité » mesure la stabilité du taux de coups sans erreur classée d’une partie à l’autre.</p></article>';

  var categoryData=[
    {key:'solid',label:'Coups solides',count:counts.solid,color:'#51d98d'},
    {key:'inaccuracy',label:'Imprécisions',count:counts.inaccuracy,color:'#f2ca58'},
    {key:'mistake',label:'Erreurs',count:counts.mistake,color:'#f28d58'},
    {key:'blunder',label:'Gaffes',count:counts.blunder,color:'#f06478'}
  ].map(function(item){item.rate=100*item.count/rated.length;return item;});
  var categoryLegend='<ul aria-label="Légende des catégories" style="display:flex;flex-wrap:wrap;gap:6px 14px;list-style:none;padding:0;margin:6px 0 0">'+categoryData.map(function(item){return '<li style="display:inline-flex;align-items:center;gap:5px;font-size:12px;color:#f4f7fb"><span aria-hidden="true" style="display:inline-block;width:11px;height:11px;border-radius:2px;background:'+item.color+'"></span>'+item.label+' · '+item.count+' ('+Math.round(item.rate)+'%)</li>';}).join('')+'</ul>';
  var chartGrid=[0,25,50,75,100].map(function(value){var y=170-value*1.2;return '<line x1="60" y1="'+y+'" x2="510" y2="'+y+'" stroke="#53647b" stroke-width="1"/><text x="53" y="'+(y+4)+'" text-anchor="end" fill="#dce6f2" font-size="10">'+value+'%</text>';}).join('');
  var chartAxes='<line x1="60" y1="50" x2="60" y2="170" stroke="#dce6f2"/><line x1="60" y1="170" x2="510" y2="170" stroke="#dce6f2"/><text x="14" y="112" transform="rotate(-90 14 112)" text-anchor="middle" fill="#f4f7fb" font-size="11">Part des demi-coups notés (%)</text><text x="285" y="236" text-anchor="middle" fill="#f4f7fb" font-size="11">Catégorie de coup</text>';
  var bars=categoryData.map(function(item,index){
    var x=75+index*108;var height=item.rate*1.2;var y=170-height;
    return '<g><title>'+item.label+': '+item.count+' sur '+rated.length+' ('+Math.round(item.rate)+'%)</title><rect x="'+x+'" y="'+y.toFixed(1)+'" width="48" height="'+height.toFixed(1)+'" rx="4" fill="'+item.color+'"/><text x="'+(x+24)+'" y="'+Math.max(16,y-7).toFixed(1)+'" text-anchor="middle" fill="#fff" font-size="11">'+Math.round(item.rate)+'%</text><text x="'+(x+24)+'" y="188" text-anchor="middle" fill="#f4f7fb" font-size="10">'+item.label+'</text><text x="'+(x+24)+'" y="204" text-anchor="middle" fill="#c8d2e0" font-size="10">'+item.count+' coups</text></g>';
  }).join('');
  html+='<article style="min-width:0;padding:12px;border:1px solid #53647b;border-radius:12px;background:rgba(12,20,32,.55)"><h5>Répartition des coups notés</h5>'+categoryLegend+'<svg viewBox="0 0 540 245" role="img" aria-label="Répartition des coups notés parmi '+rated.length+' demi-coups; axe horizontal : catégorie de coup; axe vertical : part des demi-coups notés en pourcentage" style="display:block;width:100%;max-width:560px;height:auto;margin:8px auto">'+chartGrid+chartAxes+bars+'</svg></article>';
  var trendPoints=gameRates.map(function(value,index){var x=52+(gameRates.length===1?0:index*428/(gameRates.length-1));var y=166-value*1.25;return {x:x,y:y,value:value,index:index};});
  var trendGrid=[0,25,50,75,100].map(function(value){var y=166-value*1.25;return '<line x1="52" y1="'+y+'" x2="480" y2="'+y+'" stroke="#53647b"/><text x="45" y="'+(y+4)+'" text-anchor="end" fill="#dce6f2" font-size="10">'+value+'%</text>';}).join('');
  var trendTicks=trendPoints.map(function(point){return '<line x1="'+point.x.toFixed(1)+'" y1="166" x2="'+point.x.toFixed(1)+'" y2="171" stroke="#dce6f2"/><text x="'+point.x.toFixed(1)+'" y="184" text-anchor="middle" fill="#dce6f2" font-size="9">P'+(point.index+1)+'</text>';}).join('');
  var trendAxes='<line x1="52" y1="41" x2="52" y2="166" stroke="#dce6f2"/><line x1="52" y1="166" x2="480" y2="166" stroke="#dce6f2"/><text x="14" y="105" transform="rotate(-90 14 105)" text-anchor="middle" fill="#f4f7fb" font-size="10">Coups sans erreur classée (%)</text><text x="265" y="224" text-anchor="middle" fill="#f4f7fb" font-size="11">Numéro de partie · ordre chronologique</text>';
  var trendLegend='<p style="font-size:12px"><span aria-hidden="true" style="display:inline-block;width:18px;border-top:3px solid #68c5ff;vertical-align:middle;margin-right:6px"></span>Ligne bleue : part des coups notés sans imprécision, erreur ou gaffe. P1, P2… indiquent les parties dans l’ordre chronologique.</p>';
  var trendLine=trendPoints.map(function(point){return point.x.toFixed(1)+','+point.y.toFixed(1);}).join(' ');
  var trendDots=trendPoints.map(function(point){return '<circle cx="'+point.x.toFixed(1)+'" cy="'+point.y.toFixed(1)+'" r="4" fill="#68c5ff"><title>Partie '+(point.index+1)+': '+Math.round(point.value)+'% de coups sans erreur classée</title></circle>';}).join('');
  html+='<article style="min-width:0;padding:12px;border:1px solid #53647b;border-radius:12px;background:rgba(12,20,32,.55)"><h5>Évolution partie par partie</h5>'+trendLegend+'<svg viewBox="0 0 520 240" role="img" aria-label="Évolution du taux de coups sans erreur classée sur '+gameRates.length+' parties; axe horizontal : numéro de partie; axe vertical : pourcentage de coups sans erreur classée" style="display:block;width:100%;max-width:560px;height:auto;margin:8px auto">'+trendGrid+trendAxes+trendTicks+'<polyline points="'+trendLine+'" fill="none" stroke="#68c5ff" stroke-width="3" stroke-linejoin="round"/>'+trendDots+'</svg></article>';
  var depthGrid=[0,25,50,75,100].map(function(value){var y=180-value*1.12;return '<line x1="66" y1="'+y+'" x2="500" y2="'+y+'" stroke="#53647b"/><text x="58" y="'+(y+4)+'" text-anchor="end" fill="#dce6f2" font-size="9">'+value+'%</text>';}).join('');
  var depthBars=categoryData.map(function(item,index){
    var x=82+index*104;var base=180;var h=item.rate*1.12;var y=base-h;var depth=14;
    var top=(x+','+y.toFixed(1))+' '+(x+48+','+y.toFixed(1))+' '+(x+48+depth+','+(y-depth*.55).toFixed(1))+' '+(x+depth+','+(y-depth*.55).toFixed(1));
    var side=(x+48+','+y.toFixed(1))+' '+(x+48+','+base)+' '+(x+48+depth+','+(base-depth*.55).toFixed(1))+' '+(x+48+depth+','+(y-depth*.55).toFixed(1));
    var front=(x+','+y.toFixed(1))+' '+(x+48+','+y.toFixed(1))+' '+(x+48+','+base)+' '+x+','+base;
    return '<g><title>'+item.label+': '+item.count+' sur '+rated.length+' ('+Math.round(item.rate)+'%)</title><polygon points="'+side+'" fill="#26384d"/><polygon points="'+top+'" fill="#a8c7e4"/><polygon points="'+front+'" fill="'+item.color+'"/><text x="'+(x+24)+'" y="'+Math.max(28,y-8).toFixed(1)+'" text-anchor="middle" fill="#fff" font-size="11">'+Math.round(item.rate)+'%</text><text x="'+(x+31)+'" y="199" text-anchor="middle" fill="#f4f7fb" font-size="10">'+item.label+'</text></g>';
  }).join('');
  var depthAxes='<line x1="66" y1="68" x2="66" y2="180" stroke="#dce6f2"/><line x1="66" y1="180" x2="500" y2="180" stroke="#dce6f2"/><text x="14" y="125" transform="rotate(-90 14 125)" text-anchor="middle" fill="#f4f7fb" font-size="10">Part des demi-coups (%)</text><text x="280" y="232" text-anchor="middle" fill="#f4f7fb" font-size="11">Catégorie de coup</text><text x="470" y="52" text-anchor="end" fill="#dce6f2" font-size="9">Profondeur : perspective visuelle</text>';
  html+='<article style="min-width:0;padding:12px;border:1px solid #53647b;border-radius:12px;background:rgba(12,20,32,.55)"><h5>Vue 3D en perspective · mêmes données</h5>'+categoryLegend+'<svg viewBox="0 0 520 245" role="img" aria-label="Histogramme en perspective; axe horizontal : catégorie de coup; axe vertical : part des demi-coups notés en pourcentage; profondeur décorative sans unité" style="display:block;width:100%;max-width:560px;height:auto;margin:8px auto">'+depthGrid+depthAxes+depthBars+'</svg><p>La hauteur indique la part des demi-coups. L’épaisseur est décorative et ne représente pas une troisième mesure.</p></article>';
  var phaseLabels={opening:'ouverture',middlegame:'milieu de jeu',endgame:'finale'};
  var phaseRows=Object.keys(phaseCounts).map(function(key){var value=phaseCounts[key];return {key:key,moves:value.moves,issues:value.issues,rate:value.moves?value.issues/value.moves:0};}).filter(function(item){return item.moves>=3;}).sort(function(a,b){return b.rate-a.rate;});
  if(phaseRows.length){
    var weakestPhase=phaseRows[0];
    var strongestPhase=phaseRows[phaseRows.length-1];
    html+='<h5>Phases de jeu observées</h5><p>Phase la plus fragile de cet échantillon : <strong>'+phaseLabels[weakestPhase.key]+'</strong>, '+weakestPhase.issues+'/'+weakestPhase.moves+' demi-coup(s) classé(s) en imprécision, erreur ou gaffe. Phase la plus régulière : <strong>'+phaseLabels[strongestPhase.key]+'</strong>, '+(strongestPhase.moves-strongestPhase.issues)+'/'+strongestPhase.moves+' coups sans erreur classée.</p>';
  }else{
    html+='<p>Phases de jeu : pas assez de demi-coups classés par phase (minimum 3 par phase) pour désigner une force ou une lacune fiable.</p>';
  }
  var phaseRadar=[
    {key:'opening',label:'Ouverture',value:Math.round(100*phaseCounts.opening.moves/rated.length)},
    {key:'middlegame',label:'Milieu de jeu',value:Math.round(100*phaseCounts.middlegame.moves/rated.length)},
    {key:'endgame',label:'Finale',value:Math.round(100*phaseCounts.endgame.moves/rated.length)}
  ];
  var phaseCenter={x:170,y:112},phaseRadius=70;
  function phasePoint(index,scale){var angle=(-Math.PI/2)+(Math.PI*2*index/phaseRadar.length);return {x:phaseCenter.x+Math.cos(angle)*phaseRadius*scale,y:phaseCenter.y+Math.sin(angle)*phaseRadius*scale};}
  var phaseScales=[.25,.5,.75,1];
  var phaseRings=phaseScales.map(function(scale){return phaseRadar.map(function(_metric,index){var p=phasePoint(index,scale);return p.x.toFixed(1)+','+p.y.toFixed(1);}).join(' ');}).map(function(points){return '<polygon points="'+points+'" fill="none" stroke="#53647b"/>';}).join('');
  var phaseRingLabels=phaseScales.map(function(scale){var y=phaseCenter.y-phaseRadius*scale+3;return '<text x="'+(phaseCenter.x+4)+'" y="'+y.toFixed(1)+'" fill="#dce6f2" font-size="8">'+Math.round(scale*100)+'%</text>';}).join('');
  var phaseAxes=phaseRadar.map(function(metric,index){var p=phasePoint(index,1);return '<line x1="'+phaseCenter.x+'" y1="'+phaseCenter.y+'" x2="'+p.x.toFixed(1)+'" y2="'+p.y.toFixed(1)+'" stroke="#53647b"/>';}).join('');
  var phaseShape=phaseRadar.map(function(metric,index){var p=phasePoint(index,metric.value/100);return p.x.toFixed(1)+','+p.y.toFixed(1);}).join(' ');
  var phaseText=phaseRadar.map(function(metric,index){var p=phasePoint(index,1.2);return '<text x="'+p.x.toFixed(1)+'" y="'+(p.y+(p.y<phaseCenter.y?0:12)).toFixed(1)+'" text-anchor="'+(p.x<phaseCenter.x-8?'end':p.x>phaseCenter.x+8?'start':'middle')+'" fill="#f4f7fb" font-size="10">'+metric.label+' '+metric.value+'%</text>';}).join('');
  html+='<article style="min-width:0;padding:12px;border:1px solid #53647b;border-radius:12px;background:rgba(12,20,32,.55)"><h5>Radar des phases · volume observé</h5><svg viewBox="0 0 340 230" role="img" aria-label="Part des demi-coups notés par phase : '+phaseRadar.map(function(metric){return metric.label+' '+metric.value+' pour cent';}).join(', ')+'" style="display:block;width:min(100%,420px);height:auto;margin:8px auto">'+phaseRings+phaseAxes+phaseRingLabels+'<polygon points="'+phaseShape+'" fill="rgba(81,217,141,.22)" stroke="#51d98d" stroke-width="2"/>'+phaseText+'</svg><p><strong>Légende :</strong> surface verte = part des coups notés attribuée à cette phase; graduations radiales = pourcentage du total. Les axes sont ouverture, milieu de jeu et finale. Ce radar montre la répartition des observations, pas ton niveau dans chaque phase.</p></article></div>';
  var ranked=categories.map(function(key){return {key:key,count:counts[key],rate:Math.round(100*counts[key]/rated.length)};}).filter(function(item){return item.count>0;}).sort(function(a,b){return b.rate-a.rate||categories.indexOf(a.key)-categories.indexOf(b.key);});
  html+='<h5>Priorités de travail observées</h5>';
  if(ranked.length){
    html+='<ol>'+ranked.map(function(item){return '<li><strong>'+labels[item.key]+'</strong> : '+item.count+' coup(s), '+item.rate+'% des demi-coups notés dans cet échantillon.</li>';}).join('')+'</ol><p>Commence par la première catégorie, puis revois les positions concernées dans l’analyse de tes parties.</p>';
  }else html+='<p>Aucune imprécision, erreur ou gaffe classée dans les notes disponibles. Cela ne prouve pas l’absence de lacunes tactiques ou stratégiques.</p>';
  return html+'</section>';
}
function renderExerciseCharts(local){
  var categories=[
    {key:'inaccuracy',label:'Imprécisions',color:'#f2ca58'},
    {key:'mistake',label:'Erreurs',color:'#f28d58'},
    {key:'blunder',label:'Gaffes',color:'#f06478'}
  ].map(function(item){item.count=Number(local.categoryCounts[item.key])||0;return item;});
  var total=categories.reduce(function(sum,item){return sum+item.count;},0);
  if(!total)return '';
  var max=Math.max.apply(null,categories.map(function(item){return item.count;}));
  var ticks=[0,Math.ceil(max/2),max].filter(function(value,index,array){return array.indexOf(value)===index;});
  var barGrid=ticks.map(function(value){
    var x=150+330*value/(max||1);
    return '<line x1="'+x.toFixed(1)+'" y1="36" x2="'+x.toFixed(1)+'" y2="174" stroke="#53647b"/><text x="'+x.toFixed(1)+'" y="194" text-anchor="middle" fill="#dce6f2" font-size="12">'+value+'</text>';
  }).join('');
  var bars=categories.map(function(item,index){
    var y=50+index*45;var width=330*item.count/(max||1);
    return '<text x="140" y="'+(y+16)+'" text-anchor="end" fill="#f4f7fb" font-size="13">'+item.label+'</text><rect x="150" y="'+y+'" width="'+width.toFixed(1)+'" height="22" rx="4" fill="'+item.color+'"/><text x="'+(160+width).toFixed(1)+'" y="'+(y+16)+'" fill="#fff" font-size="12">'+item.count+'</text>';
  }).join('');
  var barChart='<svg class="profile-exercise-chart" viewBox="0 0 540 220" role="img" aria-label="Nombre d’exercices de correction enregistrés par catégorie; axe horizontal : nombre d’exercices; catégories : imprécisions, erreurs et gaffes" style="display:block;width:100%;height:auto">'+barGrid+bars+'<line x1="150" y1="36" x2="150" y2="174" stroke="#dce6f2"/><text x="315" y="216" text-anchor="middle" fill="#f4f7fb" font-size="13">Nombre d’exercices enregistrés</text></svg>';
  var center={x:170,y:112},radius=64;
  function point(index,scale){var angle=(-Math.PI/2)+(Math.PI*2*index/categories.length);return {x:center.x+Math.cos(angle)*radius*scale,y:center.y+Math.sin(angle)*radius*scale};}
  var rings=[.25,.5,.75,1].map(function(scale){
    return '<polygon points="'+categories.map(function(_item,index){var p=point(index,scale);return p.x.toFixed(1)+','+p.y.toFixed(1);}).join(' ')+'" fill="none" stroke="#53647b"/>';
  }).join('');
  var ringLabels=[25,50,75,100].map(function(value){var y=center.y-radius*value/100+3;return '<text x="'+(center.x+4)+'" y="'+y.toFixed(1)+'" fill="#dce6f2" font-size="9">'+value+'%</text>';}).join('');
  var axes=categories.map(function(_item,index){var p=point(index,1);return '<line x1="'+center.x+'" y1="'+center.y+'" x2="'+p.x.toFixed(1)+'" y2="'+p.y.toFixed(1)+'" stroke="#53647b"/>';}).join('');
  var shape=categories.map(function(item,index){var p=point(index,item.count/total);return p.x.toFixed(1)+','+p.y.toFixed(1);}).join(' ');
  var radarLabels=categories.map(function(item,index){var p=point(index,1.2);return '<text x="'+p.x.toFixed(1)+'" y="'+(p.y+(p.y<center.y?0:12)).toFixed(1)+'" text-anchor="'+(p.x<center.x-8?'end':p.x>center.x+8?'start':'middle')+'" fill="#f4f7fb" font-size="10">'+item.label+' '+Math.round(100*item.count/total)+'%</text>';}).join('');
  var radar='<svg class="profile-exercise-chart" viewBox="0 0 340 220" role="img" aria-label="Radar de la part de chaque catégorie dans les '+total+' exercices de correction enregistrés" style="display:block;width:100%;height:auto">'+rings+axes+ringLabels+'<polygon points="'+shape+'" fill="rgba(104,181,255,.25)" stroke="#68b5ff" stroke-width="2"/>'+radarLabels+'</svg>';
  var depthBars=categories.map(function(item,index){
    var x=62+index*142,base=170,height=100*item.count/(max||1),y=base-height,depth=12;
    var top=x+','+y.toFixed(1)+' '+(x+54)+','+y.toFixed(1)+' '+(x+54+depth)+','+(y-depth*.55).toFixed(1)+' '+(x+depth)+','+(y-depth*.55).toFixed(1);
    var side=(x+54)+','+y.toFixed(1)+' '+(x+54)+','+base+' '+(x+54+depth)+','+(base-depth*.55).toFixed(1)+' '+(x+54+depth)+','+(y-depth*.55).toFixed(1);
    var front=x+','+y.toFixed(1)+' '+(x+54)+','+y.toFixed(1)+' '+(x+54)+','+base+' '+x+','+base;
    return '<polygon points="'+side+'" fill="#26384d"/><polygon points="'+top+'" fill="#a8c7e4"/><polygon points="'+front+'" fill="'+item.color+'"/><text x="'+(x+27)+'" y="'+Math.max(18,y-7).toFixed(1)+'" text-anchor="middle" fill="#fff" font-size="12">'+item.count+'</text><text x="'+(x+32)+'" y="188" text-anchor="middle" fill="#f4f7fb" font-size="10">'+item.label+'</text>';
  }).join('');
  var depthGrid=ticks.map(function(value){var y=170-100*value/(max||1);return '<line x1="48" y1="'+y.toFixed(1)+'" x2="500" y2="'+y.toFixed(1)+'" stroke="#53647b"/><text x="42" y="'+(y+4).toFixed(1)+'" text-anchor="end" fill="#dce6f2" font-size="10">'+value+'</text>';}).join('');
  var depth='<svg class="profile-exercise-chart" viewBox="0 0 520 220" role="img" aria-label="Vue 3D des nombres d’exercices par catégorie; axe vertical : nombre d’exercices; profondeur décorative" style="display:block;width:100%;height:auto">'+depthGrid+depthBars+'<line x1="48" y1="70" x2="48" y2="170" stroke="#dce6f2"/><line x1="48" y1="170" x2="500" y2="170" stroke="#dce6f2"/><text x="20" y="122" transform="rotate(-90 20 122)" text-anchor="middle" fill="#f4f7fb" font-size="10">Nombre d’exercices</text></svg>';
  var card='border:1px solid #53647b;border-radius:12px;padding:12px;background:rgba(12,20,32,.55);min-width:0';
  return '<section class="profile-exercise-charts" aria-labelledby="profile-exercise-charts-title" style="margin:18px 0;padding:16px;border:1px solid #53647b;border-radius:14px;background:#202b3d;color:#f4f7fb"><h4 id="profile-exercise-charts-title" style="margin-top:0">Graphiques de mes exercices</h4><p>'+total+' exercices de correction enregistrés. Les graphiques décrivent leur répartition par catégorie; ils ne mesurent pas un niveau de jeu.</p><div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(min(100%,300px),1fr));gap:12px;align-items:start"><article style="'+card+'"><h5>Répartition par catégorie</h5>'+barChart+'</article><article style="'+card+'"><h5>Radar · part des exercices</h5>'+radar+'<p>Chaque axe indique la part de cette catégorie dans les exercices enregistrés.</p></article><article style="'+card+'"><h5>Vue 3D · mêmes nombres</h5>'+depth+'<p>La hauteur représente le nombre d’exercices; la profondeur est décorative.</p></article></div></section>';
}
function renderLocalLearningPanel(data){
  var local=readLocalLearningProgress(data);
  var labels={brilliant:profileText('profile_category_brilliant','Brillant'),best:profileText('profile_category_best','Meilleurs coups'),'very-good':profileText('profile_category_very_good','Très bons coups'),good:profileText('profile_category_good','Bons coups'),ok:profileText('profile_category_ok','Coups corrects'),inaccuracy:profileText('profile_category_inaccuracy','Imprécisions'),mistake:profileText('profile_category_mistake','Erreurs'),blunder:profileText('profile_category_blunder','Gaffes'),unrated:profileText('profile_category_unrated','Non évalués')};
  var weaknessSeverity={blunder:0,mistake:1,inaccuracy:2};
  var weaknesses=Object.keys(local.categoryCounts).filter(function(key){return key==='inaccuracy'||key==='mistake'||key==='blunder';}).sort(function(a,b){
    var byCount=local.categoryCounts[b]-local.categoryCounts[a];
    return byCount||weaknessSeverity[a]-weaknessSeverity[b];
  });
  var exercisesUrl=local.latest
    ? 'https://jira44.github.io/supachess/index.html?resume-exercises='+encodeURIComponent(local.latest.id)
    : 'https://jira44.github.io/supachess/index.html?open-review=1';
  var weaknessRanks=weaknesses.map(function(key){
    var match=local.games.reduce(function(best,game){
      var count=(Array.isArray(game.correctionExercises)?game.correctionExercises:[]).filter(function(exercise){return exercise.classification===key;}).length;
      return count>0&&(!best||count>best.count)?{game:game,count:count}:best;
    },null);
    return {
      key:key,
      count:local.categoryCounts[key],
      href:match&&match.game.id
        ? 'https://jira44.github.io/supachess/index.html?resume-exercises='+encodeURIComponent(match.game.id)+'&focus-category='+encodeURIComponent(key)
        : exercisesUrl
    };
  });
  var weaknessesUrl=weaknessRanks.length?weaknessRanks[0].href:'https://jira44.github.io/supachess/index.html?open-review=1';
  var weaknessFocusText=weaknessRanks.length
    ? 'Priorité n° 1 : '+(labels[weaknessRanks[0].key]||weaknessRanks[0].key)+' ('+weaknessRanks[0].count+')'
    : 'Analysez vos parties pour établir votre classement personnel.';
  var mastered=local.completed.length;
  var nextXP=profileNextLevelXP(local.xp,local.level);
  var xpRemaining=nextXP===null?null:Math.max(0,Math.ceil(nextXP-local.xp));
  var xpPercent=profileXPProgress(local.xp,local.level);
  var training=[
    {label:profileText('profile_mastered_lessons','Leçons maîtrisées'),value:mastered,href:'https://jira44.github.io/supachess/book-lessons.html?next=1'},
    {label:profileText('profile_openings_mastered','Fondamentaux des ouvertures'),value:local.openingMastered,href:'https://jira44.github.io/supachess-web/TRAINING_OPENINGS.html'},
    {label:profileText('profile_endgames_mastered','Fondamentaux des finales'),value:local.endgameMastered,href:'https://jira44.github.io/supachess-web/TRAINING_ENDGAMES.html'},
    {label:profileText('profile_tactics_mastered','Thèmes tactiques maîtrisés'),value:local.tacticMastered,href:'https://jira44.github.io/supachess-web/TRAINING_TACTICS.html'},
    {label:profileText('profile_puzzles_solved','Problèmes résolus'),value:local.puzzlesSolved,href:'https://jira44.github.io/supachess-web/TRAINING_TACTICS.html'}
  ];
  var html='<section class="profile-learning" aria-labelledby="profile-learning-title"><h3 id="profile-learning-title">'+profileText('profile_learning_title','Mon apprentissage')+'</h3>'+
    '<div class="profile-xp-card"><div class="profile-xp-heading"><div><strong>'+profileText('profile_level','Niveau')+' '+local.level+'</strong><span>'+escapeProfileText(profileRankName(local.level))+'</span></div><strong>'+local.xp+' '+profileText('profile_xp','XP')+'</strong></div>'+
    '<div class="profile-xp-track" role="progressbar" aria-label="'+profileText('profile_xp_progress','Progression des XP')+'" aria-valuemin="0" aria-valuemax="100" aria-valuenow="'+Math.round(xpPercent)+'"><span style="width:'+xpPercent.toFixed(1)+'%"></span></div>'+
    '<small>'+escapeProfileText(profileText('profile_xp_to_next','Progression vers le niveau suivant'))+': '+Math.round(xpPercent)+'%'+(nextXP!==null?' · '+profileText('profile_next_level_at','prochain niveau à')+' '+Number(nextXP).toLocaleString('fr-FR')+' XP · '+profileText('profile_xp_remaining','XP restantes pour atteindre le niveau suivant')+' : '+xpRemaining+' XP':'')+'</small></div>'+
    '<div class="profile-learning-stats"><div><strong>'+local.completed.length+' / '+local.attempted.length+'</strong><span>'+profileText('profile_lessons_mastered_attempted','leçons maîtrisées / commencées')+'</span></div><div><strong>'+local.moveExercises+'</strong><span>'+profileText('profile_correction_moves','demi-coups à revoir')+'</span></div><div><strong>'+local.puzzlesSolved+'</strong><span>'+profileText('profile_puzzles_solved','problèmes résolus')+'</span></div><div><strong>'+local.practiceSessions+'</strong><span>'+profileText('profile_practice_sessions','séances d’entraînement')+'</span></div></div>'+
    renderPlayerAccuracyPanel(local.accuracySummary)+
    renderExerciseCharts(local)+renderDiagnosticProfile()+
    '<h4>'+profileText('profile_mastery_title','Maîtrise et progression')+'</h4><ul class="profile-mastery-list">'+training.map(function(item){var label=escapeProfileText(item.label);var value='<strong>'+item.value+'</strong>';return '<li>'+(item.href?'<a class="profile-mastery-link" href="'+item.href+'" aria-label="'+label+' : '+item.value+'">'+label+value+'</a>':'<div class="profile-mastery-entry">'+label+value+'</div>')+'</li>';}).join('')+'</ul>'+
    '<div class="profile-learning-actions"><div class="profile-resume-card"><a class="profile-resume-link" href="'+weaknessesUrl+'"><span>🎯 Travailler mes plus grandes lacunes<small style="display:block;font-weight:500;opacity:.82;margin-top:3px">'+escapeProfileText(weaknessFocusText)+'</small></span><span aria-hidden="true">›</span></a></div><a class="profile-diagnostic-button" role="button" href="index.html?start-diagnostic=1#level-diagnostic-banner">🧭 Passer le diagnostic de niveau</a><small class="profile-diagnostic-help">Relance un bilan de 10 parties analysées par Stockfish.</small><div class="profile-resume-card"><a class="profile-resume-link" href="'+exercisesUrl+'"><span>'+profileText('profile_resume_exercises','Reprendre mes exercices')+'</span><span aria-hidden="true">›</span></a></div><div class="profile-resume-card"><a class="profile-resume-link" href="https://jira44.github.io/supachess/book-lessons.html?next=1"><span>'+profileText('profile_resume_lessons','Reprendre mes leçons')+'</span><span aria-hidden="true">›</span></a></div><div class="profile-resume-card"><a class="profile-resume-link" href="https://jira44.github.io/supachess-web/TRAINING_OPENINGS.html"><span>'+profileText('profile_resume_mastery','Reprendre l’entraînement de maîtrise')+'</span><span aria-hidden="true">›</span></a></div></div>';
  if(weaknessRanks.length){
    html+='<h4>Classement de mes lacunes</h4><ol class="profile-learning-list">'+weaknessRanks.map(function(item,index){return '<li><a class="profile-mastery-link" href="'+item.href+'" aria-label="Rang '+(index+1)+' : '+escapeProfileText(labels[item.key]||item.key)+' : '+item.count+' exercices"><span>'+escapeProfileText(labels[item.key]||item.key)+'</span><strong>'+item.count+'</strong></a></li>';}).join('')+'</ol>';
  }else if(local.moveExercises){html+='<p class="profile-learning-note">'+profileText('profile_no_recorded_errors','Aucune imprécision, erreur ou gaffe enregistrée dans les exercices disponibles.')+'</p>';}
  var points=local.completed.map(function(item){return item.progress.completedAt?new Date(item.progress.completedAt).getTime():null;}).filter(function(time){return Number.isFinite(time);}).sort(function(a,b){return a-b;});
  if(points.length>1){
    var coords=points.map(function(_time,index){var x=8+index*164/(points.length-1);var y=54-(index+1)*44/points.length;return x.toFixed(1)+','+y.toFixed(1);}).join(' ');
    html+='<h4>'+profileText('profile_lesson_progress','Progression des leçons')+'</h4><svg class="profile-learning-chart" viewBox="0 0 180 64" role="img" aria-label="'+profileText('profile_lesson_chart_alt','Cumul des leçons maîtrisées')+'"><polyline points="8,56 '+coords+'" fill="none" stroke="#65d6a6" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"></polyline></svg>';
  }else{html+='<p class="profile-learning-note">'+profileText('profile_chart_empty','Terminez plusieurs leçons pour afficher votre courbe de progression.')+'</p>';}
  if(local.accuracyGames.length>1){
    var accuracyCoords=local.accuracyGames.map(function(value,index){var x=8+index*164/(local.accuracyGames.length-1);var y=56-value*.48;return x.toFixed(1)+','+y.toFixed(1);}).join(' ');
    html+='<h4>'+profileText('profile_accuracy_progress','Précision des parties récentes')+'</h4><svg class="profile-learning-chart" viewBox="0 0 180 64" role="img" aria-label="'+profileText('profile_accuracy_chart_alt','Précision par partie récente')+'"><polyline points="'+accuracyCoords+'" fill="none" stroke="#68b5ff" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"></polyline></svg>';
  }else{html+='<p class="profile-learning-note">'+profileText('profile_accuracy_empty','Enregistrez au moins deux parties analysées pour afficher votre courbe de précision.')+'</p>';}
  return html+'</section>';
}
function renderProfileModal(data){
  var overlay=document.getElementById('profile-modal');
  if(overlay&&!overlay.querySelector('#profile-content')){overlay.remove();overlay=null;}
  if(!overlay){
    overlay=document.createElement('div');
    overlay.id='profile-modal';
    overlay.style.cssText='position:fixed;inset:0;background:rgba(0,0,0,.7);display:flex;align-items:center;justify-content:center;z-index:9999;padding:16px;overflow:auto;';
    overlay.innerHTML='<div id="profile-box" style="background:#1a1f2e;border:1px solid #4facfe;border-radius:16px;padding:24px;width:min(1040px,100%);max-height:90vh;overflow:auto;position:relative;"><button id="profile-close" type="button" style="position:absolute;top:8px;right:12px;background:none;border:none;color:#aaa;font-size:22px;cursor:pointer;" aria-label="'+profileText('profile_close','Fermer le profil')+'">×</button><div id="profile-content"></div></div>';
    overlay.querySelector("#profile-close").addEventListener('click', function(){ overlay.remove(); });
    overlay.addEventListener('click', function(e){ if(e.target===overlay) overlay.remove(); });
    document.body.appendChild(overlay);
  }
  var box=document.getElementById('profile-content');
  if(!data){ box.innerHTML='<p style="color:#f66">'+profileText('profile_not_found','Profil introuvable')+'</p>'; return; }
  var name=escapeProfileText(data.displayName||profileText('profile_guest','Joueur')), email=escapeProfileText(data.email||'');
  var photo=escapeProfileText(data.photoURL||'https://ui-avatars.com/api/?name='+encodeURIComponent(data.displayName||'?'));
  var html='<div style="text-align:center"><img src="'+photo+'" alt="" style="width:64px;height:64px;border-radius:50%"><h3 style="margin:8px 0 4px">'+name+'</h3><p style="opacity:.6;font-size:.85em">'+email+'</p></div>';
  html+='<div style="margin-top:16px;display:grid;gap:10px">';
  Object.keys(GAME_TYPES).forEach(function(k){
    var st=data.stats&&data.stats[k]||null;
    var label=profileText('profile_game_'+k,GAME_TYPES[k].label);
    var games=Number(st&&st.played)||0;
    var summary=games?'<b>'+Number(st.rating||1200)+'</b> ELO · '+games+' '+profileText('profile_games','parties')+' ('+Number(st.wins||0)+' '+profileText('profile_wins','victoires')+' / '+Number(st.losses||0)+' '+profileText('profile_losses','défaites')+' / '+Number(st.draws||0)+' '+profileText('profile_draws','nulles')+')':profileText('profile_no_game_data','Aucune donnée de partie pour le moment');
    html+='<div style="background:rgba(255,255,255,.06);padding:10px 12px;border-radius:10px;display:flex;justify-content:space-between;align-items:center;gap:8px;flex-wrap:wrap"><span>'+GAME_TYPES[k].icon+' '+escapeProfileText(label)+'</span><span>'+summary+'</span></div>';
  });
  html+='</div>';
  if(auth&&auth.currentUser&&auth.currentUser.uid===data.uid)html+=renderLocalLearningPanel(data);
  box.innerHTML=html;
}
function renderOwnProfileFallback(user){
  if(!user||!user.uid)return;
  renderProfileModal({uid:user.uid,displayName:user.displayName||user.email&&user.email.split('@')[0]||profileText('profile_guest','Joueur'),email:user.email||'',photoURL:user.photoURL||'',stats:{}});
}
function initSearchBar(){
  var header=document.querySelector('.header');
  if(!header||document.getElementById('user-search-wrap')) return;
  var wrap=document.createElement('div');
  wrap.id='user-search-wrap';
  wrap.style.cssText='max-width:520px;margin:14px auto 0;position:relative;';
  wrap.innerHTML='<input id="user-search" placeholder="🔍 Rechercher un joueur (nom ou email) — cliquer pour voir profil" style="width:100%;padding:10px 14px;border-radius:20px;border:1px solid rgba(255,255,255,.2);background:rgba(0,0,0,.35);color:#fff;outline:none;"><div id="user-search-results" style="position:absolute;top:100%;left:0;right:0;background:#1a1f2e;border:1px solid #333;border-radius:12px;margin-top:6px;display:none;max-height:240px;overflow-y:auto;z-index:50;"></div>';
  header.appendChild(wrap);
  var inp=document.getElementById('user-search');
  var res=document.getElementById('user-search-results');
  var timer=null;
  inp.addEventListener('input', function(){
    clearTimeout(timer);
    var q=this.value.trim();
    if(!q){ res.style.display='none'; return; }
    timer=setTimeout(function(){
      searchUsers(q,8).then(function(list){
        if(!list.length){ res.innerHTML='<div style="padding:10px;opacity:.6">Aucun joueur trouvé</div>'; res.style.display='block'; return; }
        res.innerHTML=list.map(function(u){
          return '<div class="search-hit" data-uid="'+u.uid+'" style="padding:8px 12px;display:flex;align-items:center;gap:10px;cursor:pointer;border-bottom:1px solid rgba(255,255,255,.06)"><img src="'+(u.photoURL||'https://ui-avatars.com/api/?name='+encodeURIComponent(u.displayName||'?'))+'" style="width:28px;height:28px;border-radius:50%"><span>'+u.displayName+'</span><span style="opacity:.5;font-size:.8em;margin-left:auto">'+u.email+'</span></div>';
        }).join('');
        res.style.display='block';
        res.querySelectorAll('.search-hit').forEach(function(el){
          el.addEventListener('click', function(){ res.style.display='none'; getProfile(el.getAttribute('data-uid')).then(renderProfileModal); });
        });
      });
    }, 280);
  });
  document.addEventListener('click', function(e){ if(!wrap.contains(e.target)) res.style.display='none'; });
}
function initRankingSection(){
  if(document.getElementById('ranking-section')) return;
  var container=document.querySelector('.container');
  if(!container) return;
  var sec=document.createElement('section');
  sec.id='ranking-section';
  sec.style.cssText='margin:40px 0;padding:24px;background:rgba(0,0,0,.35);border-radius:16px;border:1px solid rgba(255,255,255,.1)';
  sec.innerHTML='<h2 style="text-align:center;color:#ffd700;margin-bottom:16px">🏆 Classements Top — par type de jeu</h2><div style="display:flex;justify-content:center;gap:10px;margin-bottom:16px"><button class="rank-tab" data-type="puzzle" style="padding:8px 16px;border-radius:20px;border:1px solid #4facfe;background:#4facfe;color:#fff;cursor:pointer">🧩 Puzzle</button><button class="rank-tab" data-type="classic3s" style="padding:8px 16px;border-radius:20px;border:1px solid #666;background:transparent;color:#fff;cursor:pointer">⚡ Classic 3s</button><button class="rank-tab" data-type="classic5s" style="padding:8px 16px;border-radius:20px;border:1px solid #666;background:transparent;color:#fff;cursor:pointer">⏱️ Classic 5s</button></div><div id="ranking-list" style="display:grid;gap:8px"></div>';
  var footer=document.querySelector('.footer');
  if(footer) container.insertBefore(sec, footer);
  else container.appendChild(sec);
  function load(type){
    sec.querySelectorAll('.rank-tab').forEach(function(b){ b.style.background=b.getAttribute('data-type')===type?'#4facfe':'transparent'; b.style.borderColor=b.getAttribute('data-type')===type?'#4facfe':'#666'; });
    var list=document.getElementById('ranking-list');
    list.innerHTML='<div style="text-align:center;opacity:.6">Chargement...</div>';
    getTopRanking(type,10).then(function(top){
      if(!top.length){ list.innerHTML='<div style="text-align:center;opacity:.6">Aucun classement — jouez pour apparaître !</div>'; return; }
      list.innerHTML=top.map(function(u,i){
        var medal=i===0?'🥇':i===1?'🥈':i===2?'🥉':(i+1+'.');
        return '<div style="display:flex;align-items:center;gap:12px;padding:10px 12px;background:rgba(255,255,255,.06);border-radius:10px;cursor:pointer" data-uid="'+u.uid+'" class="rank-row"><span style="width:28px;text-align:center">'+medal+'</span><span style="flex:1">'+u.displayName+'</span><span style="font-weight:bold;color:#ffd700">'+u.rating+' ELO</span></div>';
      }).join('');
      list.querySelectorAll('.rank-row').forEach(function(el){ el.addEventListener('click', function(){ getProfile(el.getAttribute('data-uid')).then(renderProfileModal); }); });
    });
  }
  sec.querySelectorAll('.rank-tab').forEach(function(b){ b.addEventListener('click', function(){ load(b.getAttribute('data-type')); }); });
  load('puzzle');
}
window.SupaProfiles={init:init, ensureUserProfile:ensureUserProfile, updateStats:updateStats, searchUsers:searchUsers, getTopRanking:getTopRanking, getProfile:getProfile, renderProfileModal:renderProfileModal, readLocalLearningProgress:readLocalLearningProgress, summarizeAccuracyGames:summarizeAccuracyGames, renderLocalLearningPanel:renderLocalLearningPanel, renderOwnProfileFallback:renderOwnProfileFallback, initSearchBar:initSearchBar, initRankingSection:initRankingSection, GAME_TYPES:GAME_TYPES};
})();
