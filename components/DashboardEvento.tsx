import React from 'react'

export default function DashboardEvento({
  dashboardEvento, setDashboardEvento,
  giocatori, mioGiocatoreId,
  salvaRisultatoGenerico, chiudiEvento, inviando
}: any) {

  const getNomeG = (id: any) => giocatori.find((g: any) => g.id.toString() === id.toString())?.Nome || '???'

  const condividiMatchEventoWA = (p: any) => {
    const nomeEvento = dashboardEvento.titolo.toUpperCase();
    const sqA = p.sqA.map((id: any) => getNomeG(id)).join(' & ');
    const sqB = p.sqB.map((id: any) => getNomeG(id)).join(' & ');
    const testo = `🎾 *${nomeEvento}* 🎾\n📌 _${p.fase}_\n\n🏆 *${sqA}* vs *${sqB}*\n📊 Risultato: *${p.gameA} - ${p.gameB}*\n\nSegui il tabellone live su PadelApp! 🚀`;
    window.open(`https://wa.me/?text=${encodeURIComponent(testo)}`, '_blank');
  }

  const condividiVerdettoFinaleWA = (vincitori: any[]) => {
    const nomeEvento = dashboardEvento.titolo.toUpperCase();
    let messaggio = `🏆 *VERDETTO FINALE: ${nomeEvento}* 🏆\n\n`;
    if (dashboardEvento.tipo === 'Americana') {
      messaggio += `🥇 1° Posto: *${vincitori[0].nome}* (${vincitori[0].fatti} game)\n🥈 2° Posto: *${vincitori[1].nome}*\n🥉 3° Posto: *${vincitori[2].nome}*\n\n`;
    } else {
      messaggio += `🥇 I CAMPIONI: *${vincitori.join(' & ')}* 🥇\n\n`;
    }
    messaggio += `Complimenti a tutti i partecipanti! Guarda la classifica aggiornata nell'app. 🎾🔥`;
    window.open(`https://wa.me/?text=${encodeURIComponent(messaggio)}`, '_blank');
  }

  const condividiTabelloneLiveWA = () => {
    const nomeEvento = dashboardEvento.titolo.toUpperCase();
    let testo = `🔴 *LIVE: ${nomeEvento}* 🔴\n\n`;
    if (dashboardEvento.tipo === 'Americana') {
      const top3 = classificaAmericana().slice(0, 3);
      testo += `🏆 *Top 3 Provvisoria:*\n`;
      top3.forEach((s: any, i: number) => { testo += `${i+1}° ${s.nome} (${s.fatti} pt)\n`; });
    } else {
      testo += `🔥 Le sfide sono infuocate e il tabellone si sta aggiornando!\n`;
    }
    testo += `\nEntra nell'App per vedere tutti i risultati in tempo reale! 🚀🎾`;
    window.open(`https://wa.me/?text=${encodeURIComponent(testo)}`, '_blank');
  }

  const classificaAmericana = () => {
    const stats: Record<string, any> = {};
    dashboardEvento.iscritti.forEach((id: string) => { stats[id] = { id, nome: getNomeG(id), fatti: 0, subiti: 0, vinte: 0 }; });
    dashboardEvento.partite_evento.forEach((p: any) => {
      if (p.gameA !== '' && p.gameB !== '') {
        p.sqA.forEach((id: string) => { stats[id].fatti += Number(p.gameA); stats[id].subiti += Number(p.gameB); if (Number(p.gameA) > Number(p.gameB)) stats[id].vinte++; });
        p.sqB.forEach((id: string) => { stats[id].fatti += Number(p.gameB); stats[id].subiti += Number(p.gameA); if (Number(p.gameB) > Number(p.gameA)) stats[id].vinte++; });
      }
    });
    return Object.values(stats).sort((a: any, b: any) => b.fatti - a.fatti || (b.fatti - b.subiti) - (a.fatti - a.subiti));
  }

  const finaleTorneo = dashboardEvento.partite_evento.find((p: any) => p.fase === 'Finale');
  const vincitoreTorneo = finaleTorneo && finaleTorneo.gameA !== '' ? (finaleTorneo.gameA > finaleTorneo.gameB ? finaleTorneo.sqA : finaleTorneo.sqB) : null;

  return (
    // 🎨 Rimosso l'effetto vetro (backdrop-blur) e impostati i colori identici alla pagina principale
    <div className="fixed inset-0 z-[80] bg-[#005bb7] dark:bg-slate-950 overflow-y-auto p-4 sm:p-8 animate-in fade-in transition-colors duration-500">
      
      {/* 🎾 SFONDO GRAFICO: IL CAMPO DA PADEL AGGIUNTO ANCHE QUI! */}
      <div className="fixed inset-0 pointer-events-none z-0 flex justify-center items-center overflow-hidden opacity-10 dark:opacity-20 transition-opacity duration-500">
        <div className="relative w-[200vw] h-[150vh] sm:w-[120vw] sm:h-[120vh] border-[6px] border-white -rotate-12 scale-110">
          <div className="absolute top-1/2 left-0 w-full h-[6px] bg-white -translate-y-1/2"></div>
          <div className="absolute top-[25%] left-0 w-full h-[6px] bg-white"></div>
          <div className="absolute top-[75%] left-0 w-full h-[6px] bg-white"></div>
          <div className="absolute top-[25%] left-1/2 w-[6px] h-[50%] bg-white -translate-x-1/2"></div>
        </div>
      </div>

      {/* 📦 CONTENUTO (con z-10 per stare sopra alle linee del campo) */}
      <div className="max-w-4xl mx-auto pb-20 relative z-10">
        
        <div className="flex justify-between items-center mb-8">
          <div>
            <h2 className="text-3xl font-black text-yellow-400 italic uppercase tracking-tighter">{dashboardEvento.titolo}</h2>
            <span className="bg-white/20 dark:bg-white/10 text-white px-3 py-1 rounded-full text-[10px] font-bold uppercase mt-2 inline-block shadow-sm">⚡ {dashboardEvento.tipo}</span>
          </div>
          <button onClick={() => setDashboardEvento(null)} className="bg-white/20 dark:bg-white/10 hover:bg-white/30 p-3 rounded-full text-white transition-colors">✖️</button>
        </div>

        {/* 🏆 SEZIONE PODIO FINALE */}
        {(dashboardEvento.stato === 'Chiuso' || vincitoreTorneo) && (
          <div className="mb-10 bg-gradient-to-br from-yellow-400 via-yellow-500 to-orange-500 p-1 rounded-[3rem] shadow-[0_20px_50px_rgba(234,179,8,0.3)]">
            <div className="bg-blue-900 dark:bg-slate-900 rounded-[2.8rem] p-8 text-center transition-colors">
              <span className="text-5xl mb-4 block">🏆</span>
              <h3 className="text-2xl font-black text-white uppercase italic">Hall of Fame</h3>
              
              <div className="mt-6 flex flex-col gap-3">
                {dashboardEvento.tipo === 'Americana' ? (
                  classificaAmericana().slice(0, 3).map((s: any, i: number) => (
                    <div key={s.id} className={`flex justify-between items-center p-4 rounded-2xl ${i===0?'bg-yellow-400/20 border border-yellow-400/50':'bg-white/10'}`}>
                       <span className="font-black text-white">{i+1}° {s.nome}</span>
                       <span className="text-yellow-400 font-black">{s.fatti} Game</span>
                    </div>
                  ))
                ) : (
                  vincitoreTorneo && (
                    <div className="bg-yellow-400/20 border border-yellow-400/50 p-6 rounded-2xl">
                      <span className="text-xs font-black text-yellow-500 uppercase block mb-2">I Campioni</span>
                      <span className="text-2xl font-black text-white uppercase">{vincitoreTorneo.map((id: any) => getNomeG(id)).join(' & ')}</span>
                    </div>
                  )
                )}
              </div>

              <button onClick={() => condividiVerdettoFinaleWA(dashboardEvento.tipo === 'Americana' ? classificaAmericana() : vincitoreTorneo.map((id: any) => getNomeG(id)))} className="mt-8 w-full bg-[#25D366] text-white p-4 rounded-2xl font-black uppercase text-sm shadow-xl flex items-center justify-center gap-3 hover:scale-105 transition-transform">
                <span className="text-xl">📢</span> Condividi Verdetto Finale
              </button>
            </div>
          </div>
        )}

        {/* CLASSIFICA LIVE AMERICANA */}
        {dashboardEvento.tipo === 'Americana' && dashboardEvento.stato !== 'Chiuso' && (
          <section className="mb-10 bg-white/10 dark:bg-white/5 rounded-[2.5rem] p-6 border border-white/20 dark:border-white/10 shadow-lg backdrop-blur-sm">
            <h3 className="text-sm font-black text-yellow-300 dark:text-blue-300 uppercase tracking-widest mb-4">Classifica Live</h3>
            <div className="space-y-2">
              {classificaAmericana().map((s: any, i: number) => (
                <div key={s.id} className="flex justify-between items-center bg-white/10 p-3 rounded-2xl border border-white/10">
                  <div className="flex items-center gap-3">
                    <span className={`w-6 h-6 flex items-center justify-center rounded-lg text-[10px] font-black ${i===0?'bg-yellow-400 text-blue-900':i===1?'bg-gray-200 text-gray-700':'bg-blue-800 text-blue-200'}`}>{i+1}</span>
                    <span className="font-bold text-sm uppercase text-white">{s.nome}</span>
                  </div>
                  <div className="flex gap-4 text-center">
                    <div><span className="block text-[8px] text-white/60 font-bold uppercase">Game</span><span className="text-sm font-black text-yellow-400">{s.fatti}</span></div>
                    <div><span className="block text-[8px] text-white/60 font-bold uppercase">V</span><span className="text-sm font-black text-green-400">{s.vinte}</span></div>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* TABELLONE MATCH */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {(dashboardEvento.partite_evento || []).map((p: any) => (
            <div key={p.id} className="bg-white dark:bg-slate-900 rounded-3xl p-5 shadow-2xl border border-blue-200/50 dark:border-slate-800 flex flex-col gap-4 transition-colors">
              <div className="flex justify-between items-center">
                <span className="text-[10px] font-black text-blue-500 dark:text-blue-400 uppercase tracking-widest">{p.fase}</span>
                {p.gameA !== '' && (
                  <button onClick={() => condividiMatchEventoWA(p)} className="bg-[#25D366] p-2 rounded-xl text-white shadow-lg active:scale-90 transition-transform">
                    <svg viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51a12.8 12.8 0 0 0-.57-.01c-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.82 9.82 0 0 1 2.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 0 0-3.48-8.413z"/></svg>
                  </button>
                )}
              </div>
              
              <div className="flex items-center gap-3">
                <div className="flex-1 space-y-2">
                  <div className="flex justify-between items-center bg-blue-50 dark:bg-slate-800 p-2 rounded-xl border border-blue-100 dark:border-slate-700">
                    <span className="text-[10px] font-black text-blue-900 dark:text-white uppercase truncate pr-2">
                      {p.sqA.length > 0 ? p.sqA.map((id: any) => getNomeG(id)).join(' + ') : 'In attesa...'}
                    </span>
                    <input id={`gA-${p.id}`} type="number" defaultValue={p.gameA} placeholder="0" className="w-10 bg-white dark:bg-slate-950 text-center font-black rounded-lg border border-gray-200 dark:border-slate-700 outline-none text-blue-600 dark:text-blue-400" />
                  </div>
                  <div className="flex justify-between items-center bg-gray-50 dark:bg-slate-800 p-2 rounded-xl border border-gray-200 dark:border-slate-700">
                    <span className="text-[10px] font-black text-gray-600 dark:text-slate-400 uppercase truncate pr-2">
                      {p.sqB.length > 0 ? p.sqB.map((id: any) => getNomeG(id)).join(' + ') : 'In attesa...'}
                    </span>
                    <input id={`gB-${p.id}`} type="number" defaultValue={p.gameB} placeholder="0" className="w-10 bg-white dark:bg-slate-950 text-center font-black rounded-lg border border-gray-200 dark:border-slate-700 outline-none text-gray-500" />
                  </div>
                </div>
                <button onClick={() => salvaRisultatoGenerico(p.id)} disabled={inviando} className="bg-blue-600 dark:bg-blue-500 p-4 rounded-2xl text-white shadow-lg active:scale-95 disabled:opacity-50 transition-transform">💾</button>
              </div>
            </div>
          ))}
        </div>

        {/* 🟢 TASTO WHATSAPP LIVE SOTTO IL TABELLONE */}
        {dashboardEvento.stato === 'In Corso' && (
          <div className="mt-8 flex justify-center backdrop-blur-sm bg-white/5 dark:bg-slate-900/50 p-4 rounded-[2rem] border border-white/10">
            <button onClick={condividiTabelloneLiveWA} className="bg-[#25D366] hover:bg-[#20b858] text-white px-6 py-3 rounded-2xl text-sm font-black uppercase shadow-lg flex items-center justify-center gap-2 transition-colors active:scale-95 w-full">
              <svg viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51a12.8 12.8 0 0 0-.57-.01c-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.82 9.82 0 0 1 2.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 0 0-3.48-8.413z"/></svg>
              Condividi Andamento Live
            </button>
          </div>
        )}

        {/* BOTTONE CHIUSURA FINALE */}
        {dashboardEvento.stato === 'In Corso' && (
          <div className="mt-8 p-8 bg-blue-900 dark:bg-slate-900 rounded-[3rem] text-center shadow-2xl border border-blue-800/50 dark:border-slate-800">
            <h3 className="text-xl font-black text-white uppercase mb-4">Concludi Torneo</h3>
            <button onClick={chiudiEvento} disabled={inviando} className="w-full bg-yellow-400 text-blue-900 p-5 rounded-3xl font-black uppercase shadow-xl disabled:opacity-50">🏆 Conferma Vincitori e Chiudi</button>
          </div>
        )}


      
      </div>

    </div>

  )
}

