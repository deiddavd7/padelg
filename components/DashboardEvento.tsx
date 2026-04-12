import React from 'react'

export default function DashboardEvento({
  dashboardEvento, setDashboardEvento,
  giocatori, mioGiocatoreId,
  salvaRisultatoGenerico, chiudiEvento, inviando,
  evFase, setEvFase,
  evSqA1, setEvSqA1, evSqA2, setEvSqA2,
  evSqB1, setEvSqB1, evSqB2, setEvSqB2,
  evGameA, setEvGameA, evGameB, setEvGameB
}: any) {

  // Funzione spostata qui: calcola la classifica in tempo reale solo quando apriamo il tabellone
  const calcolaClassificaAmericana = () => {
    if (!dashboardEvento) return [];
    let stats: Record<string, { nome: string, giocate: number, gameFatti: number, gameSubiti: number, vinte: number }> = {};
    (dashboardEvento.iscritti || []).forEach((id: string) => { const g = giocatori.find((x:any) => x.id.toString() === id); stats[id] = { nome: g?.Nome || 'Sconosciuto', giocate: 0, gameFatti: 0, gameSubiti: 0, vinte: 0 }; });
    (dashboardEvento.partite_evento || []).forEach((p: any) => {
      if (p.gameA !== '' && p.gameB !== '') {
        p.sqA.forEach((id: string) => { if(stats[id]) { stats[id].giocate++; stats[id].gameFatti += p.gameA; stats[id].gameSubiti += p.gameB; if(p.gameA > p.gameB) stats[id].vinte++; } });
        p.sqB.forEach((id: string) => { if(stats[id]) { stats[id].giocate++; stats[id].gameFatti += p.gameB; stats[id].gameSubiti += p.gameA; if(p.gameB > p.gameA) stats[id].vinte++; } });
      }
    });
    return Object.values(stats).sort((a, b) => b.gameFatti - a.gameFatti || (b.gameFatti - b.gameSubiti) - (a.gameFatti - a.gameSubiti));
  }

  return (
    <div className="fixed inset-0 z-[100] bg-[#f8fafc] overflow-y-auto flex flex-col text-blue-900 animate-in slide-in-from-bottom-8 duration-300">
      <div className="bg-blue-900 text-white p-6 pt-12 relative shadow-lg shrink-0">
        <button onClick={() => setDashboardEvento(null)} className="absolute top-6 right-4 bg-white/20 hover:bg-white/40 p-2 rounded-full backdrop-blur-md transition-colors">✖️</button>
        <h2 className="text-2xl font-black uppercase tracking-tight pr-10">{dashboardEvento.titolo}</h2>
        <span className="bg-yellow-400 text-blue-900 px-2 py-1 rounded-md text-[10px] font-black uppercase mt-2 inline-block">LIVE TABELLONE ({dashboardEvento.tipo})</span>
      </div>

      <div className="p-4 flex-1 flex flex-col gap-6 pb-24 max-w-lg mx-auto w-full">
        
        {dashboardEvento.tipo === 'Americana' ? (
          <div className="bg-white rounded-3xl p-4 shadow-xl border border-gray-200">
            <h3 className="text-xs font-black uppercase text-gray-500 mb-3 text-center">Classifica Live (Game Fatti)</h3>
            <div className="flex flex-col gap-2">
              {calcolaClassificaAmericana().map((stat, i) => (
                <div key={i} className="flex items-center justify-between bg-gray-50 p-3 rounded-2xl border border-gray-100">
                  <div className="flex items-center gap-3">
                    <div className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-black ${i===0?'bg-yellow-400 text-blue-900':i===1?'bg-gray-300 text-gray-700':'bg-blue-100 text-blue-800'}`}>{i+1}</div>
                    <span className="font-bold text-sm uppercase text-blue-900">{stat.nome}</span>
                  </div>
                  <div className="flex items-center gap-3 text-right">
                    <div className="flex flex-col"><span className="text-[10px] font-bold text-gray-400 leading-none">Vinte</span><span className="text-xs font-black text-green-600">{stat.vinte}</span></div>
                    <div className="w-px h-6 bg-gray-200"></div>
                    <div className="flex flex-col"><span className="text-[10px] font-bold text-gray-400 leading-none">Game</span><span className="text-lg font-black text-blue-600 leading-none">{stat.gameFatti}</span></div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className="bg-white rounded-3xl p-4 shadow-xl border border-gray-200">
            <h3 className="text-xs font-black uppercase text-gray-500 mb-3 text-center">Tabellone Torneo</h3>
            {['Finale', 'Semifinale', 'Quarti', 'Ottavi'].map(fase => {
              const matchFase = (dashboardEvento.partite_evento || []).filter((p:any) => p.fase === fase);
              if (matchFase.length === 0) return null;
              
              return (
                <div key={fase} className="mb-4">
                  <h4 className="text-center font-black text-blue-800 bg-blue-100 rounded-md text-[10px] py-1 mb-2 uppercase">{fase}</h4>
                  <div className="flex flex-col gap-2">
                    {matchFase.map((p:any, i:number) => {
                      const nA1=giocatori.find((g:any)=>g.id.toString()===p.sqA?.[0])?.Nome || '---'; const nA2=giocatori.find((g:any)=>g.id.toString()===p.sqA?.[1])?.Nome || '---';
                      const nB1=giocatori.find((g:any)=>g.id.toString()===p.sqB?.[0])?.Nome || '---'; const nB2=giocatori.find((g:any)=>g.id.toString()===p.sqB?.[1])?.Nome || '---';
                      const isGiocata = p.gameA !== '' && p.gameB !== '';
                      const vA = p.gameA > p.gameB; const vB = p.gameB > p.gameA;
                      
                      return (
                        <div key={p.id} className={`w-full flex flex-col gap-2 p-3 rounded-2xl border ${isGiocata ? 'bg-gray-50 border-gray-200' : 'bg-blue-50/50 border-blue-200 shadow-sm'}`}>
                          <div className="flex justify-between items-center text-[10px] font-bold uppercase w-full">
                            <div className={`flex flex-col w-[35%] leading-tight text-center ${vA?'text-green-700 font-black':'text-gray-400'}`}><span>{nA1}</span><span>{nA2}</span></div>
                            
                            {isGiocata ? (
                              <div className="bg-white px-2 py-1 rounded shadow-sm border font-black text-lg w-[30%] text-center shrink-0"><span className={vA?'text-green-600':'text-gray-500'}>{p.gameA}</span> - <span className={vB?'text-green-600':'text-gray-500'}>{p.gameB}</span></div>
                            ) : (
                              <div className="flex gap-1 w-[30%] justify-center shrink-0">
                                 <input type="number" id={`gA-${p.id}`} disabled={p.sqA.length===0} className="w-10 p-2 text-center border border-blue-200 rounded-lg font-black text-blue-600 bg-white shadow-inner outline-none disabled:opacity-50" />
                                 <span className="mt-2 text-gray-400">-</span>
                                 <input type="number" id={`gB-${p.id}`} disabled={p.sqB.length===0} className="w-10 p-2 text-center border border-orange-200 rounded-lg font-black text-orange-600 bg-white shadow-inner outline-none disabled:opacity-50" />
                              </div>
                            )}
                            <div className={`flex flex-col w-[35%] leading-tight text-center ${vB?'text-green-700 font-black':'text-gray-400'}`}><span>{nB1}</span><span>{nB2}</span></div>
                          </div>
                          {!isGiocata && p.sqA.length>0 && p.sqB.length>0 && (dashboardEvento.creatore_id === mioGiocatoreId || (dashboardEvento.iscritti || []).includes(mioGiocatoreId)) && (
                             <button onClick={() => salvaRisultatoGenerico(p.id)} disabled={inviando} className="w-full mt-1 bg-blue-600 text-white text-[10px] font-black py-2 rounded-lg uppercase shadow-md disabled:opacity-50">Invia e Passa il Turno</button>
                          )}
                        </div>
                      )
                    })}
                  </div>
                </div>
              )
            })}
            {(dashboardEvento.partite_evento?.length === 0) && <p className="text-center text-[10px] font-bold text-gray-400">Nessuna partita registrata.</p>}
          </div>
        )}

        {dashboardEvento.tipo === 'Torneo' && (dashboardEvento.creatore_id === mioGiocatoreId || (dashboardEvento.iscritti || []).includes(mioGiocatoreId)) && dashboardEvento.stato !== 'Chiuso' && (
          <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-3xl p-5 shadow-inner border border-blue-200">
            <h3 className="text-xs font-black uppercase text-blue-800 mb-4 text-center">Aggiungi Match Manuale</h3>
            <div className="flex flex-col gap-4">
              <div className="bg-white p-3 rounded-2xl shadow-sm border border-blue-100">
                <span className="text-[10px] font-black uppercase text-blue-500 mb-1 block">Fase del Torneo</span>
                <select value={evFase} onChange={e=>setEvFase(e.target.value)} className="w-full p-2 bg-gray-50 rounded-lg text-sm font-black text-blue-900 outline-none border cursor-pointer">
                  <option value="Ottavi">Ottavi di Finale</option><option value="Quarti">Quarti di Finale</option><option value="Semifinale">Semifinale</option><option value="Finale">Finale</option>
                </select>
              </div>
              <div className="bg-white p-3 rounded-2xl shadow-sm border border-blue-100">
                <span className="text-[10px] font-black uppercase text-blue-500 mb-2 block">Squadra A</span>
                <div className="flex gap-2">
                  <select value={evSqA1} onChange={e=>setEvSqA1(e.target.value)} className="w-1/2 p-2 bg-gray-50 rounded-lg text-xs font-bold outline-none border"><option value="">Gioc. 1</option>{(dashboardEvento.iscritti||[]).map((id:string)=>{const g=giocatori.find((x:any)=>x.id.toString()===id); return g&&<option key={id} value={id}>{g.Nome}</option>})}</select>
                  <select value={evSqA2} onChange={e=>setEvSqA2(e.target.value)} className="w-1/2 p-2 bg-gray-50 rounded-lg text-xs font-bold outline-none border"><option value="">Gioc. 2</option>{(dashboardEvento.iscritti||[]).map((id:string)=>{const g=giocatori.find((x:any)=>x.id.toString()===id); return g&&<option key={id} value={id}>{g.Nome}</option>})}</select>
                </div>
                <input type="number" placeholder="Game Vinti da Sq. A" value={evGameA} onChange={e=>setEvGameA(Number(e.target.value))} className="w-full mt-2 p-3 bg-gray-50 rounded-xl font-black text-center text-blue-900 border border-blue-200" />
              </div>
              <div className="bg-white p-3 rounded-2xl shadow-sm border border-orange-100">
                <span className="text-[10px] font-black uppercase text-orange-500 mb-2 block">Squadra B</span>
                <div className="flex gap-2">
                  <select value={evSqB1} onChange={e=>setEvSqB1(e.target.value)} className="w-1/2 p-2 bg-gray-50 rounded-lg text-xs font-bold outline-none border"><option value="">Gioc. 1</option>{(dashboardEvento.iscritti||[]).map((id:string)=>{const g=giocatori.find((x:any)=>x.id.toString()===id); return g&&<option key={id} value={id}>{g.Nome}</option>})}</select>
                  <select value={evSqB2} onChange={e=>setEvSqB2(e.target.value)} className="w-1/2 p-2 bg-gray-50 rounded-lg text-xs font-bold outline-none border"><option value="">Gioc. 2</option>{(dashboardEvento.iscritti||[]).map((id:string)=>{const g=giocatori.find((x:any)=>x.id.toString()===id); return g&&<option key={id} value={id}>{g.Nome}</option>})}</select>
                </div>
                <input type="number" placeholder="Game Vinti da Sq. B" value={evGameB} onChange={e=>setEvGameB(Number(e.target.value))} className="w-full mt-2 p-3 bg-gray-50 rounded-xl font-black text-center text-orange-900 border border-orange-200" />
              </div>
            </div>
          </div>
        )}

        {dashboardEvento.tipo === 'Americana' && dashboardEvento.partite_evento?.length > 0 && (
          <div className="bg-white rounded-3xl p-4 shadow-xl border border-gray-200 mt-2">
            <h3 className="text-xs font-black uppercase text-gray-500 mb-3 text-center">Calendario Americana</h3>
            <div className="flex flex-col gap-3">
              {(dashboardEvento.partite_evento||[]).map((p:any) => {
                const nA1=giocatori.find((g:any)=>g.id.toString()===p.sqA[0])?.Nome; const nA2=giocatori.find((g:any)=>g.id.toString()===p.sqA[1])?.Nome;
                const nB1=giocatori.find((g:any)=>g.id.toString()===p.sqB[0])?.Nome; const nB2=giocatori.find((g:any)=>g.id.toString()===p.sqB[1])?.Nome;
                const isGiocata = p.gameA !== '' && p.gameB !== '';

                return (
                  <div key={p.id} className={`w-full flex flex-col gap-2 p-3 rounded-2xl border ${isGiocata ? 'bg-gray-50 border-gray-200' : 'bg-blue-50/50 border-blue-200 shadow-sm'}`}>
                    <span className="text-[10px] font-black text-blue-500 uppercase text-center block">{p.fase}</span>
                    <div className="flex justify-between items-center text-[10px] font-bold uppercase w-full">
                      <div className="flex flex-col w-[35%] text-blue-900 leading-tight text-center"><span>{nA1}</span><span>{nA2}</span></div>
                      
                      {isGiocata ? (
                        <div className="bg-white px-2 py-1 rounded shadow-sm border font-black text-lg w-[30%] text-center shrink-0"><span className="text-blue-600">{p.gameA}</span> - <span className="text-orange-600">{p.gameB}</span></div>
                      ) : (
                        <div className="flex gap-1 w-[30%] justify-center shrink-0">
                           <input type="number" id={`gA-${p.id}`} className="w-10 p-2 text-center border border-blue-200 rounded-lg font-black text-blue-600 bg-white shadow-inner outline-none" />
                           <span className="mt-2 text-gray-400">-</span>
                           <input type="number" id={`gB-${p.id}`} className="w-10 p-2 text-center border border-orange-200 rounded-lg font-black text-orange-600 bg-white shadow-inner outline-none" />
                        </div>
                      )}
                      <div className="flex flex-col w-[35%] text-orange-900 leading-tight text-center"><span>{nB1}</span><span>{nB2}</span></div>
                    </div>
                    {!isGiocata && (dashboardEvento.creatore_id === mioGiocatoreId || (dashboardEvento.iscritti || []).includes(mioGiocatoreId)) && (
                       <button onClick={() => salvaRisultatoGenerico(p.id)} disabled={inviando} className="w-full mt-1 bg-blue-600 text-white text-[10px] font-black py-2 rounded-lg uppercase shadow-md disabled:opacity-50">Salva Risultato</button>
                    )}
                  </div>
                )
              })}
            </div>
          </div>
        )}
        
        {dashboardEvento.stato === 'In Corso' && dashboardEvento.creatore_id === mioGiocatoreId && (
           <button onClick={chiudiEvento} disabled={inviando} className="w-full mt-4 bg-gradient-to-r from-yellow-400 to-yellow-500 text-blue-900 py-4 rounded-2xl text-sm font-black uppercase shadow-xl hover:scale-[1.02] transition-transform flex items-center justify-center gap-2">
             🏆 Concludi Evento e Assegna Punti
           </button>
        )}

        <div className="h-10"></div>
      </div>
    </div>
  )
}
