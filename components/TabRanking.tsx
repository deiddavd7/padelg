import React from 'react'

// Questa "interface" spegne gli errori rossi di TypeScript
interface TabRankingProps {
  user: any; giocatori: any[]; partite: any[]; mioGiocatoreId: string | null;
  apriProfilo: (g: any, i: number) => void;
  mostraFormPartita: boolean; setMostraFormPartita: (b: boolean) => void;
  vincitore1Id: string; setVincitore1Id: (s: string) => void;
  vincitore2Id: string; setVincitore2Id: (s: string) => void;
  sconfitto1Id: string; setSconfitto1Id: (s: string) => void;
  sconfitto2Id: string; setSconfitto2Id: (s: string) => void;
  risultatoMatch: string; setRisultatoMatch: (s: string) => void;
  campoMatch: string; setCampoMatch: (s: string) => void;
  salvaMatch: () => void;
  confermaMatch: (m: any) => void;
  contestaMatch: (id: any) => void;
  eliminaMatch: (id: any) => void;
  inviando: boolean;
}

export default function TabRanking({
  user, giocatori, partite, mioGiocatoreId, apriProfilo,
  mostraFormPartita, setMostraFormPartita,
  vincitore1Id, setVincitore1Id, vincitore2Id, setVincitore2Id,
  sconfitto1Id, setSconfitto1Id, sconfitto2Id, setSconfitto2Id,
  risultatoMatch, setRisultatoMatch,
  campoMatch, setCampoMatch,
  salvaMatch, confermaMatch, contestaMatch, eliminaMatch, inviando
}: TabRankingProps) {

  const getLivello = (p: number) => {
    if (p < 200) return { nome: 'Principiante', emoji: '🌱', class: 'bg-green-100 text-green-700 dark:bg-green-900/50 dark:text-green-400' };
    if (p < 500) return { nome: 'Bronzo', emoji: '🥉', class: 'bg-orange-100 text-orange-700 dark:bg-orange-900/50 dark:text-orange-400' };
    if (p < 800) return { nome: 'Argento', emoji: '🥈', class: 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300' };
    return { nome: 'Oro', emoji: '🥇', class: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/50 dark:text-yellow-400' };
  }

  // 🟢 FUNZIONE MAGICA WHATSAPP
  const condividiRisultatoWA = (p: any) => {
    const testo = `🔥 *NUOVO RISULTATO SU PADEL APP* 🔥\n\n🏆 ${p.vincitore}\n🥵 ${p.sconfitto}\n\n🎾 Risultato: *${p.risultato}*\n📍 ${p.campo ? p.campo : 'Circolo'}\n\nGuarda la classifica ufficiale sull'app!`;
    const url = `https://wa.me/?text=${encodeURIComponent(testo)}`;
    window.open(url, '_blank');
  }

  return (
    <div className="space-y-4 animate-in fade-in duration-300">
      
      {/* LEADERBOARD */}
      <div className="flex items-center gap-2 mb-2"><span className="text-2xl">🏆</span><h2 className="text-xl font-black italic text-yellow-400 uppercase">Leaderboard</h2></div>
      {giocatori.map((g: any, i: number) => {
        const liv = getLivello(g.Punti || 0);
        return (
          <div key={g.id} onClick={()=>apriProfilo(g, i)} className="bg-white dark:bg-slate-900 p-4 sm:p-5 rounded-[2rem] shadow-xl flex justify-between items-center border border-white/20 dark:border-slate-800 cursor-pointer active:scale-95 transition-transform min-w-0">
            <div className="flex items-center gap-3 sm:gap-4 flex-1 min-w-0">
              <div className={`w-10 h-10 shrink-0 flex items-center justify-center rounded-2xl font-black text-lg ${i===0?'bg-yellow-400 text-blue-900':i===1?'bg-gray-200 text-gray-500':'bg-blue-50 text-blue-300 dark:bg-slate-800 dark:text-slate-500'}`}>{i+1}</div>
              
              {/* 📸 FOTO */}
              {g.foto ? (
                <img src={g.foto} className="w-12 h-12 sm:w-14 sm:h-14 rounded-full object-cover border-4 border-gray-50 dark:border-slate-800 shadow-sm shrink-0"/>
              ) : (
                <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-full bg-blue-50 dark:bg-slate-800 flex items-center justify-center text-blue-300 dark:text-slate-600 font-black text-xl border-4 border-white dark:border-slate-700 shadow-sm shrink-0">?</div>
              )}

              <div className="flex flex-col min-w-0 flex-1">
                <span className="font-black text-blue-900 dark:text-white uppercase leading-none truncate">{g.Nome}</span>
                <span className={`text-[9px] font-bold uppercase mt-1 w-max px-2 py-0.5 rounded ${liv.class}`}>{liv.emoji} {liv.nome}</span>
                
                {/* 📊 STATISTICHE */}
                <div className="w-full flex gap-3 text-[10px] font-bold mt-1">
                  <span className="text-gray-400 dark:text-slate-500">Match: {g.partite||0}</span>
                  <span className="text-green-500">V: {g.vinte||0}</span>
                  <span className="text-red-400">S: {g.perse||0}</span>
                </div>
              </div>
            </div>
            <div className="bg-blue-600 dark:bg-blue-500 px-4 py-2 rounded-2xl shadow-md shrink-0"><span className="text-xl font-black text-white">{g.Punti}</span></div>
          </div>
        )
      })}

      {/* FORM INSERIMENTO RISULTATO */}
      {user && giocatori.length > 3 && (
        <div className="pt-6">
          {!mostraFormPartita ? ( 
            <button onClick={()=>setMostraFormPartita(true)} className="w-full bg-yellow-400 text-blue-900 p-5 rounded-3xl font-black uppercase text-sm shadow-xl hover:-translate-y-1 transition-all flex justify-center items-center gap-3"><span className="text-2xl">🎾</span> Inserisci Risultato</button> 
          ) : (
            <div className="bg-white dark:bg-slate-900 p-6 sm:p-8 rounded-3xl text-black dark:text-white border border-gray-100 dark:border-slate-800 shadow-2xl">
              <div className="flex justify-between items-center mb-6"><h3 className="font-black uppercase text-sm text-blue-900 dark:text-yellow-400 tracking-widest">Risultato Passato</h3><button onClick={()=>setMostraFormPartita(false)} className="bg-gray-100 dark:bg-slate-800 hover:bg-gray-200 dark:hover:bg-slate-700 text-gray-500 dark:text-slate-400 px-3 py-1 rounded-full font-bold text-xs">ANNULLA</button></div>
              <div className="space-y-4 mb-6">
                <div className="bg-blue-50 dark:bg-slate-800 p-4 rounded-2xl border border-blue-100 dark:border-slate-700"><span className="text-xs font-black uppercase text-blue-800 dark:text-blue-300 mb-2 block">🏆 Vincenti</span><div className="flex gap-2"><select value={vincitore1Id} onChange={e=>setVincitore1Id(e.target.value)} className="w-1/2 p-3 bg-white dark:bg-slate-900 rounded-xl font-bold text-sm outline-none border dark:border-slate-700"><option value="">Gioc. 1</option>{giocatori.map((g:any)=><option key={g.id} value={g.id}>{g.Nome}</option>)}</select><select value={vincitore2Id} onChange={e=>setVincitore2Id(e.target.value)} className="w-1/2 p-3 bg-white dark:bg-slate-900 rounded-xl font-bold text-sm outline-none border dark:border-slate-700"><option value="">Gioc. 2</option>{giocatori.map((g:any)=><option key={g.id} value={g.id}>{g.Nome}</option>)}</select></div></div>
                <div className="bg-gray-50 dark:bg-slate-800 p-4 rounded-2xl border border-gray-200 dark:border-slate-700"><span className="text-xs font-black uppercase text-gray-500 dark:text-slate-400 mb-2 block">🥵 Sconfitti</span><div className="flex gap-2"><select value={sconfitto1Id} onChange={e=>setSconfitto1Id(e.target.value)} className="w-1/2 p-3 bg-white dark:bg-slate-900 rounded-xl font-bold text-sm outline-none border dark:border-slate-700"><option value="">Gioc. 1</option>{giocatori.map((g:any)=><option key={g.id} value={g.id}>{g.Nome}</option>)}</select><select value={sconfitto2Id} onChange={e=>setSconfitto2Id(e.target.value)} className="w-1/2 p-3 bg-white dark:bg-slate-900 rounded-xl font-bold text-sm outline-none border dark:border-slate-700"><option value="">Gioc. 2</option>{giocatori.map((g:any)=><option key={g.id} value={g.id}>{g.Nome}</option>)}</select></div></div>
                <div className="grid grid-cols-2 gap-3">
                  <input type="text" placeholder="Risultato (es 6-4 6-2)" value={risultatoMatch} onChange={e=>setRisultatoMatch(e.target.value)} className="col-span-2 p-4 bg-gray-50 dark:bg-slate-900 rounded-2xl font-bold text-center border border-gray-200 dark:border-slate-700 outline-none" />
                  <input type="text" placeholder="Campo (Opzionale)" value={campoMatch} onChange={e=>setCampoMatch(e.target.value)} className="col-span-2 p-4 bg-gray-50 dark:bg-slate-900 rounded-2xl font-bold text-sm border border-gray-200 dark:border-slate-700 outline-none" />
                </div>
              </div>
              <button onClick={salvaMatch} disabled={inviando} className="w-full bg-blue-600 dark:bg-blue-500 text-white p-4 rounded-2xl font-black uppercase shadow-lg disabled:opacity-50">{inviando?'Invio...':'Invia Risultato'}</button>
            </div>
          )}
        </div>
      )}

      {/* ULTIME SFIDE */}
      {partite.length > 0 && (
        <div className="pt-6">
          <div className="flex items-center gap-4 mb-6 px-2"><h2 className="text-xl font-black text-blue-100 dark:text-slate-400 tracking-tight uppercase">Ultime Sfide</h2><div className="h-px flex-1 bg-white/30 dark:bg-slate-700"></div></div>
          <div className="flex flex-col gap-5">
            {partite.map((p: any) => { 
              const sonoCoinvolto = mioGiocatoreId && (p.s1_id === mioGiocatoreId || p.s2_id === mioGiocatoreId || p.v1_id === mioGiocatoreId || p.v2_id === mioGiocatoreId); 
              return ( 
                <div key={p.id} className="bg-white/15 dark:bg-slate-900/50 backdrop-blur-md border border-white/20 dark:border-slate-800 p-5 rounded-3xl shadow-xl flex flex-col gap-3"> 
                  <div className="flex justify-between items-center mb-2"><span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase shadow-inner ${p.stato === 'Confermato' ? 'bg-green-500 text-white' : p.stato?.includes('Contestato') ? 'bg-red-500 text-white' : 'bg-yellow-400 text-blue-900 animate-pulse'}`}>{p.stato || 'In attesa'}</span><span className="text-[10px] text-blue-200 dark:text-slate-500 font-bold">{new Date(p.created_at).toLocaleDateString('it-IT')}</span></div> 
                  <div className="flex justify-between items-center text-sm font-black uppercase tracking-tight"><div className="flex flex-col w-[42%]"><span className="text-yellow-400 text-[10px] mb-1">Vincitori 🏆</span><span className="text-white leading-tight">{p.vincitore}</span></div><div className="w-[16%] text-center"><span className="bg-blue-900/80 dark:bg-slate-950 text-blue-200 dark:text-slate-500 px-2 py-1.5 rounded-xl text-[10px] shadow-inner">VS</span></div><div className="flex flex-col w-[42%] text-right"><span className="text-white/60 dark:text-slate-400 text-[10px] mb-1">Sconfitti</span><span className="text-blue-100 leading-tight">{p.sconfitto}</span></div></div> 
                  <div className="bg-blue-900/60 dark:bg-slate-950/50 rounded-2xl p-3 border border-blue-800/50 dark:border-slate-800 mt-2 text-sm flex justify-between items-center shadow-inner"><span className="text-yellow-400 font-black text-lg">{p.risultato}</span>{p.campo && <span className="text-[10px] text-blue-100 dark:text-slate-400 uppercase font-bold bg-blue-800/80 dark:bg-slate-800 px-2 py-1 rounded-lg border border-blue-700 dark:border-slate-700">📍 {p.campo}</span>}</div> 
                  
                  {/* BOTTONI CONFERMA/CONTESTA/ELIMINA */}
                  {sonoCoinvolto && p.stato === 'In attesa' && ( 
                    <div className="flex gap-3 mt-3 pt-4 border-t border-white/10 dark:border-slate-800">
                      <button onClick={() => confermaMatch(p)} className="flex-1 bg-green-500 text-white py-3 rounded-xl text-xs font-black uppercase shadow-lg">✅ Conferma</button>
                      <button onClick={() => contestaMatch(p.id)} className="flex-1 bg-red-500/90 text-white py-3 rounded-xl text-xs font-black uppercase shadow-lg">❌ Contesta</button>
                    </div> 
                  )} 
                  {sonoCoinvolto && p.stato?.includes('Contestato') && (
                    <div className="mt-3 pt-4 border-t border-white/10 dark:border-slate-800">
                      <button onClick={() => eliminaMatch(p.id)} className="w-full bg-red-600 text-white py-3 rounded-xl text-xs font-black uppercase shadow-lg">🗑️ Elimina Risultato</button>
                    </div>
                  )}

                  {/* 🟢 TASTO WHATSAPP (Sempre visibile per tutti i match) */}
                  <div className="mt-1 pt-3 border-t border-white/5 dark:border-slate-800">
                    <button onClick={() => condividiRisultatoWA(p)} className="w-full bg-[#25D366] hover:bg-[#20b858] text-white py-2.5 rounded-xl text-xs font-black uppercase shadow-lg flex items-center justify-center gap-2 transition-colors">
                      <svg viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51a12.8 12.8 0 0 0-.57-.01c-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.82 9.82 0 0 1 2.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 0 0-3.48-8.413z"/></svg>
                      Condividi Risultato
                    </button>
                  </div>

                </div> 
              )
            })}
          </div>
        </div>
      )}

    </div>
  )
}
