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
function renderLocalLearningPanel(data){
  var local=readLocalLearningProgress(data);
  var labels={brilliant:profileText('profile_category_brilliant','Brillant'),best:profileText('profile_category_best','Meilleurs coups'),'very-good':profileText('profile_category_very_good','Très bons coups'),good:profileText('profile_category_good','Bons coups'),ok:profileText('profile_category_ok','Coups corrects'),inaccuracy:profileText('profile_category_inaccuracy','Imprécisions'),mistake:profileText('profile_category_mistake','Erreurs'),blunder:profileText('profile_category_blunder','Gaffes'),unrated:profileText('profile_category_unrated','Non évalués')};
  var weaknesses=Object.keys(local.categoryCounts).filter(function(key){return key==='inaccuracy'||key==='mistake'||key==='blunder';}).sort(function(a,b){return local.categoryCounts[b]-local.categoryCounts[a];});
  var exercisesUrl=local.latest
    ? 'https://jira44.github.io/supachess/index.html?resume-exercises='+encodeURIComponent(local.latest.id)
    : 'https://jira44.github.io/supachess/index.html?open-review=1';
  var focusWeaknesses=weaknesses.slice(0,2);
  var weaknessGame=focusWeaknesses.length?local.games.reduce(function(best,game){
    var score=(Array.isArray(game.correctionExercises)?game.correctionExercises:[]).reduce(function(sum,exercise){
      var rank=focusWeaknesses.indexOf(exercise.classification);
      return sum+(rank===0?3:rank===1?1:0);
    },0);
    return score>0&&(!best||score>best.score)?{game:game,score:score}:best;
  },null):null;
  var weaknessesUrl=weaknessGame
    ? 'https://jira44.github.io/supachess/index.html?resume-exercises='+encodeURIComponent(weaknessGame.game.id)
    : weaknesses.length?exercisesUrl:'https://jira44.github.io/supachess/index.html?open-review=1';
  var weaknessFocusText=focusWeaknesses.length
    ? 'Priorité : '+(labels[focusWeaknesses[0]]||focusWeaknesses[0])+' ('+local.categoryCounts[focusWeaknesses[0]]+')'
    : 'Analysez vos parties pour repérer vos lacunes.';
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
    '<h4>'+profileText('profile_mastery_title','Maîtrise et progression')+'</h4><ul class="profile-mastery-list">'+training.map(function(item){var label=escapeProfileText(item.label);var value='<strong>'+item.value+'</strong>';return '<li>'+(item.href?'<a class="profile-mastery-link" href="'+item.href+'" aria-label="'+label+' : '+item.value+'">'+label+value+'</a>':'<div class="profile-mastery-entry">'+label+value+'</div>')+'</li>';}).join('')+'</ul>'+
    '<div class="profile-learning-actions"><div class="profile-resume-card"><a class="profile-resume-link" href="'+weaknessesUrl+'"><span>🎯 Travailler mes plus grandes lacunes<small style="display:block;font-weight:500;opacity:.82;margin-top:3px">'+escapeProfileText(weaknessFocusText)+'</small></span><span aria-hidden="true">›</span></a></div><a class="profile-diagnostic-button" role="button" href="index.html?start-diagnostic=1#level-diagnostic-banner">🧭 Passer le diagnostic de niveau</a><small class="profile-diagnostic-help">Relance un bilan de 10 parties analysées par Stockfish.</small><div class="profile-resume-card"><a class="profile-resume-link" href="'+exercisesUrl+'"><span>'+profileText('profile_resume_exercises','Reprendre mes exercices')+'</span><span aria-hidden="true">›</span></a></div><div class="profile-resume-card"><a class="profile-resume-link" href="https://jira44.github.io/supachess/book-lessons.html?next=1"><span>'+profileText('profile_resume_lessons','Reprendre mes leçons')+'</span><span aria-hidden="true">›</span></a></div><div class="profile-resume-card"><a class="profile-resume-link" href="https://jira44.github.io/supachess-web/TRAINING_OPENINGS.html"><span>'+profileText('profile_resume_mastery','Reprendre l’entraînement de maîtrise')+'</span><span aria-hidden="true">›</span></a></div></div>';
  if(weaknesses.length){
    html+='<h4>'+profileText('profile_work_on','À travailler dans vos parties')+'</h4><ul class="profile-learning-list">'+weaknesses.slice(0,3).map(function(key){return '<li>'+escapeProfileText(labels[key]||key)+' : '+local.categoryCounts[key]+'</li>';}).join('')+'</ul>';
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
    overlay.innerHTML='<div id="profile-box" style="background:#1a1f2e;border:1px solid #4facfe;border-radius:16px;padding:24px;width:min(680px,100%);max-height:90vh;overflow:auto;position:relative;"><button id="profile-close" type="button" style="position:absolute;top:8px;right:12px;background:none;border:none;color:#aaa;font-size:22px;cursor:pointer;" aria-label="'+profileText('profile_close','Fermer le profil')+'">×</button><div id="profile-content"></div></div>';
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
