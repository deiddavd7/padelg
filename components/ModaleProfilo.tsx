import React from 'react'

export default function ModaleProfilo({
  profiloAperto, setProfiloAperto,
  mioGiocatoreId,
  isEditingProfilo, setIsEditingProfilo,
  editNome, setEditNome,
  editEta, setEditEta,
  editLato, setEditLato,
  editRacchetta, setEditRacchetta,
  setEditFotoFile,
  salvataggioInCorso, salvaSchedaTecnica,
  storicoElo,
  partite, giocatori
}: any) {

  // ==========================================
  // FUNZIONI GRAFICHE E STATISTICHE SPOSTATE QUI
  // ==========================================
  const getLivello = (punti: number) => {
    if(punti < 200) return { nome: 'Principiante', icona: '🌱', bg: 'bg-green-100', text: 'text-green-700' };
    if(punti < 500) return { nome: 'Bandeja di Bronzo', icona: '🥉', bg: 'bg-orange-100', text: 'text-orange-800' };
    if(punti < 800) return { nome: 'Vibora d\'Argento', icona: '🥈', bg: 'bg-gray-200', text: 'text-gray-800' };
    return { nome: 'Por Tres d\'Oro', icona: '🥇', bg: 'bg-yellow-200', text: 'text-yellow-800' };
  }

  const calcolaWinRate = (v:number,g:number) => {if(!g)return 0;return Math.round((v/g)*100);}
  
  const getBadges = (g: any) => {
    const badges = [];
    if (g.partite >= 1) badges.push({ icon: '🎾', desc: 'Battesimo' });
    if (g.partite >= 10) badges.push({ icon: '🛡️', desc: 'Veterano' });
    if (g.partite >= 5 && calcolaWinRate(g.vinte, g.partite) >= 60) badges.push({ icon: '🔥', desc: 'Cecchino' });
    if (g.Punti >= 800) badges.push({ icon: '👑', desc: 'Top Player' });
    return badges;
  }

  const WinRateDonut = ({ vinte, giocate }: { vinte: number, giocate: number }) => {
    const winRate = calcolaWinRate(vinte, giocate); const radius = 36; const circumference = 2 * Math.PI * radius; const strokeDashoffset = circumference - (winRate / 100) * circumference;
    return (
      <div className="relative flex items-center justify-center">
        <svg className="transform -rotate-90 w-28 h-28 drop-shadow-md">
          <circle cx="56" cy="56" r={radius} stroke="#fee2e2" strokeWidth="12" fill="transparent" />
          <circle cx="56" cy="56" r={radius} stroke="#22c55e" strokeWidth="12" fill="transparent" strokeDasharray={circumference} strokeDashoffset={strokeDashoffset} className="transition-all duration-1000 ease-out" strokeLinecap="round" />
        </svg>
        <div className="absolute flex flex-col items-center justify-center text-center"><span className="text-2xl font-black text-blue-900 leading-none">{winRate}%</span><span className="text-[8px] font-bold text-gray-400 uppercase tracking-widest mt-1">Win Rate</span></div>
      </div>
    );
  };

  const LineChart = ({ data }: { data: any[] }) => {
    if (!data || data.length < 2) return <div className="text-center text-[10px] text-gray-400 mt-4">Gioca almeno 2 partite per vedere il grafico.</div>;
    const maxP = Math.max(...data.map(d => d.punti));
    const minP = Math.min(...data.map(d => d.punti));
    const range = maxP - minP === 0 ? 1 : maxP - minP;
    
    const points = data.map((d, i) => {
      const x = (i / (data.length - 1)) * 100;
      const y = 100 - ((d.punti - minP) / range) * 100;
      return `${x},${y}`;
    }).join(' ');

    return (
      <div className="relative w-full h-32 mt-4 pt-2">
        <svg viewBox="0 -10 100 120" preserveAspectRatio="none" className="w-full h-full overflow-visible">
          <polyline fill="none" stroke="#eab308" strokeWidth="3" points={points} strokeLinecap="round" strokeLinejoin="round" />
          {data.map((d, i) => (
             <circle key={i} cx={(i / (data.length - 1)) * 100} cy={100 - ((d.punti - minP) / range) * 100} r="2" fill="#1e3a8a" stroke="#eab308" strokeWidth="1" />
          ))}
        </svg>
        <div className="absolute top-0 left-0 text-[8px] text-gray-400 font-bold">Max: {maxP}</div>
        <div className="absolute bottom-0 left-0 text-[8px] text-gray-400 font-bold">Min: {minP}</div>
      </div>
    );
  }

  const calcolaStatisticheAvanzate = (giocatoreId: string) => {
    const p = partite.filter((x:any) => x.stato === 'Confermato' && (x.v1_id === giocatoreId || x.v2_id === giocatoreId || x.s1_id === giocatoreId || x.s2_id === giocatoreId));
    const partnerCount: Record<string, { nome: string, insieme: number, vinteInsieme: number }> = {};
    p.forEach((x:any) => { 
      const haVinto = x.v1_id === giocatoreId || x.v2_id === giocatoreId; let partnerId = null; 
      if (x.v1_id === giocatoreId) partnerId = x.v2_id; else if (x.v2_id === giocatoreId) partnerId = x.v1_id; else if (x.s1_id === giocatoreId) partnerId = x.s2_id; else if (x.s2_id === giocatoreId) partnerId = x.s1_id;
      if (partnerId) { const partner = giocatori.find((g:any) => g.id.toString() === partnerId); if (partner) { if (!partnerCount[partnerId]) partnerCount[partnerId] = { nome: partner.Nome, insieme: 0, vinteInsieme: 0 }; partnerCount[partnerId].insieme += 1; if (haVinto) partnerCount[partnerId].vinteInsieme += 1; } }
    });
    return { partiteGiocatore: p, partnerPreferiti: Object.values(partnerCount).sort((a:any, b:any) => b.insieme - a.insieme).slice(0, 3) };
  }

  const calcolaTestaATesta = (idAvversario: string) => {
    if (!mioGiocatoreId || idAvversario === mioGiocatoreId) return null;
    let giocateContro = 0; let vinteIo = 0; let vinteLui = 0;
    partite.forEach((p:any) => {
      if (p.stato !== 'Confermato') return;
      const ioVincitore = p.v1_id === mioGiocatoreId || p.v2_id === mioGiocatoreId;
      const luiSconfitto = p.s1_id === idAvversario || p.s2_id === idAvversario;
      const luiVincitore = p.v1_id === idAvversario || p.v2_id === idAvversario;
      const ioSconfitto = p.s1_id === mioGiocatoreId || p.s2_id === mioGiocatoreId;
      if (ioVincitore && luiSconfitto) { giocateContro++; vinteIo++; }
      else if (luiVincitore && ioSconfitto) { giocateContro++; vinteLui++; }
    });
    if (giocateContro === 0) return null;
    return { giocateContro, vinteIo, vinteLui };
  }

  return (
    <div className="fixed inset-0 z-[70] bg-gray-50 overflow-y-auto flex justify-center animate-in fade-in">
      <div className="w-full max-w-2xl min-h-screen flex flex-col relative text-blue-900 pb-20"> 
        
        <div className="bg-blue-900 text-white p-6 sm:p-8 relative shadow-lg">
          <button onClick={() => setProfiloAperto(null)} className="absolute top-4 right-4 bg-white/20 hover:bg-white/40 p-2 rounded-full backdrop-blur-md z-10 transition-colors">✖️</button>
          
          {mioGiocatoreId === profiloAperto.id.toString() && !isEditingProfilo && (
            <button onClick={() => setIsEditingProfilo(true)} className="absolute top-4 right-16 bg-yellow-400 hover:bg-yellow-300 text-blue-900 px-3 py-1.5 rounded-lg text-xs font-black uppercase shadow-lg transition-colors z-10 flex items-center gap-1">✏️ Modifica</button>
          )}

          <div className="flex items-center gap-5 mt-4">
            {profiloAperto.foto ? ( <img src={profiloAperto.foto} className="w-24 h-24 rounded-full border-4 border-yellow-400 object-cover shadow-2xl shrink-0" /> ) : ( <div className="w-24 h-24 rounded-full bg-blue-800 flex items-center justify-center text-3xl font-black border-4 border-yellow-400 shadow-2xl shrink-0">?</div> )}
            
            <div className="flex-1">
              <h2 className="text-3xl font-black uppercase tracking-tight leading-none break-words">{profiloAperto.Nome}</h2>
              
              {!isEditingProfilo && (
                <div className="mt-1">
                  <span className={`text-[10px] font-black uppercase px-2 py-0.5 rounded-md inline-block ${getLivello(profiloAperto.Punti || 0).bg} ${getLivello(profiloAperto.Punti || 0).text}`}>
                    {getLivello(profiloAperto.Punti || 0).icona} {getLivello(profiloAperto.Punti || 0).nome}
                  </span>
                </div>
              )}

              <div className="flex flex-wrap gap-2 mt-2">
                <span className="bg-yellow-400 text-blue-900 px-3 py-1 rounded-lg text-xs font-black uppercase shadow-md">#{profiloAperto.posizione} Ranking</span>
                <span className="bg-blue-800 border border-blue-700 px-3 py-1 rounded-lg text-xs font-black uppercase shadow-md">{profiloAperto.Punti} Pts</span>
              </div>
              
              {!isEditingProfilo && (
                <div className="flex flex-wrap gap-2 mt-3">
                  {profiloAperto.eta && <span className="bg-white/10 border border-white/20 px-2 py-1 rounded text-[10px] font-bold uppercase">🎂 {profiloAperto.eta} Anni</span>}
                  {profiloAperto.lato && <span className="bg-white/10 border border-white/20 px-2 py-1 rounded text-[10px] font-bold uppercase">🎾 {profiloAperto.lato}</span>}
                  {profiloAperto.racchetta && <span className="bg-white/10 border border-white/20 px-2 py-1 rounded text-[10px] font-bold uppercase">🏸 {profiloAperto.racchetta}</span>}
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="p-6 space-y-8 flex-1 -mt-4 rounded-t-3xl bg-gray-50 relative z-20">
          
          {isEditingProfilo ? (
            <div className="bg-white p-6 rounded-3xl border border-gray-200 shadow-inner animate-in slide-in-from-top-4">
              <h3 className="text-sm font-black uppercase text-blue-900 tracking-widest mb-4">Aggiorna Scheda Tecnica</h3>
              <div className="space-y-4">
                <div><label className="text-[10px] font-bold text-gray-500 uppercase ml-1">Nome Ufficiale</label><input type="text" value={editNome} onChange={(e) => setEditNome(e.target.value)} className="w-full p-3 bg-gray-50 rounded-xl font-bold border border-gray-200 outline-none" /></div>
                <div className="flex gap-3"><div className="w-1/3"><label className="text-[10px] font-bold text-gray-500 uppercase ml-1">Età</label><input type="number" value={editEta} onChange={(e) => setEditEta(e.target.value)} className="w-full p-3 bg-gray-50 rounded-xl font-bold border border-gray-200 outline-none" /></div><div className="w-2/3"><label className="text-[10px] font-bold text-gray-500 uppercase ml-1">Lato Preferito</label><select value={editLato} onChange={(e) => setEditLato(e.target.value)} className="w-full p-3 bg-gray-50 rounded-xl font-bold border border-gray-200 outline-none text-blue-900 cursor-pointer"><option value="">Seleziona...</option><option value="Sinistra">Sinistra</option><option value="Destra">Destra</option><option value="Entrambi">Entrambi</option></select></div></div>
                <div><label className="text-[10px] font-bold text-gray-500 uppercase ml-1">Racchetta Utilizzata</label><input type="text" value={editRacchetta} onChange={(e) => setEditRacchetta(e.target.value)} className="w-full p-3 bg-gray-50 rounded-xl font-bold border border-gray-200 outline-none" /></div>
                <div><label className="text-[10px] font-bold text-gray-500 uppercase ml-1">Cambia Foto Profilo</label><input type="file" accept="image/*" onChange={(e) => setEditFotoFile(e.target.files?.[0] || null)} className="w-full p-2 bg-gray-50 rounded-xl text-xs border border-gray-200 cursor-pointer" /></div>
                <div className="flex gap-3 mt-6 pt-4 border-t border-gray-100"><button onClick={() => setIsEditingProfilo(false)} className="flex-1 bg-gray-200 text-gray-700 py-3 rounded-xl font-black uppercase text-xs">Annulla</button><button onClick={salvaSchedaTecnica} disabled={salvataggioInCorso} className="flex-1 bg-green-500 text-white py-3 rounded-xl font-black uppercase text-xs shadow-md disabled:opacity-50">{salvataggioInCorso ? 'Salvataggio...' : 'Salva Profilo'}</button></div>
              </div>
            </div>
          ) : (
            <>
              {/* 📉 GRAFICO STORICO ELO */}
              <section>
                <h3 className="text-xs font-black uppercase text-gray-400 tracking-widest mb-3">Andamento Ranking</h3>
                <div className="bg-white border border-gray-100 rounded-3xl p-4 shadow-sm flex flex-col items-center">
                   <LineChart data={storicoElo} />
                </div>
              </section>

              {getBadges(profiloAperto).length > 0 && (
                <section>
                  <h3 className="text-xs font-black uppercase text-gray-400 tracking-widest mb-3">Medagliere</h3>
                  <div className="flex flex-wrap gap-2">
                    {getBadges(profiloAperto).map((badge, i) => (
                      <div key={i} className="bg-white border border-gray-100 px-3 py-2 rounded-xl shadow-sm flex items-center gap-2">
                        <span className="text-xl">{badge.icon}</span>
                        <span className="text-[10px] font-black uppercase text-blue-900">{badge.desc}</span>
                      </div>
                    ))}
                  </div>
                </section>
              )}

              {calcolaTestaATesta(profiloAperto.id.toString()) && (
                <section>
                  <h3 className="text-xs font-black uppercase text-gray-400 tracking-widest mb-3">⚔️ Testa a Testa (vs Te)</h3>
                  <div className="bg-gradient-to-br from-blue-900 to-blue-800 rounded-3xl p-5 shadow-lg flex items-center justify-between border border-blue-700">
                    <div className="flex flex-col items-center"><span className="text-[10px] font-bold text-blue-300 uppercase mb-1">Hai Vinto</span><span className="text-3xl font-black text-green-400 leading-none">{calcolaTestaATesta(profiloAperto.id.toString())?.vinteIo}</span></div>
                    <div className="flex flex-col items-center text-center"><span className="text-[10px] font-bold text-gray-400 uppercase bg-blue-950 px-2 py-1 rounded-md">Tot: {calcolaTestaATesta(profiloAperto.id.toString())?.giocateContro} Match</span></div>
                    <div className="flex flex-col items-center"><span className="text-[10px] font-bold text-blue-300 uppercase mb-1">Ha Vinto</span><span className="text-3xl font-black text-red-400 leading-none">{calcolaTestaATesta(profiloAperto.id.toString())?.vinteLui}</span></div>
                  </div>
                </section>
              )}

              <section className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100 flex flex-col sm:flex-row items-center gap-6">
                <div className="shrink-0"><WinRateDonut vinte={profiloAperto.vinte} giocate={profiloAperto.partite} /></div>
                <div className="flex-1 grid grid-cols-3 gap-2 w-full text-center">
                  <div className="bg-gray-50 p-3 rounded-2xl"><span className="block text-2xl font-black text-blue-900">{profiloAperto.partite || 0}</span><span className="text-[9px] font-bold text-gray-500 uppercase">Match</span></div>
                  <div className="bg-green-50 p-3 rounded-2xl"><span className="block text-2xl font-black text-green-600">{profiloAperto.vinte || 0}</span><span className="text-[9px] font-bold text-green-700 uppercase">Vittorie</span></div>
                  <div className="bg-red-50 p-3 rounded-2xl"><span className="block text-2xl font-black text-red-600">{profiloAperto.perse || 0}</span><span className="text-[9px] font-bold text-red-700 uppercase">Sconfitte</span></div>
                </div>
              </section>

              <section>
                <h3 className="text-sm font-black uppercase text-gray-400 tracking-widest mb-3">Top Partner</h3>
                <div className="bg-white rounded-3xl p-5 shadow-sm border border-gray-100 flex flex-col gap-4">
                  {(() => {
                    const { partnerPreferiti } = calcolaStatisticheAvanzate(profiloAperto.id.toString());
                    if (partnerPreferiti.length === 0) return <p className="text-sm text-gray-400 font-bold text-center py-4">Nessun dato.</p>;
                    return partnerPreferiti.map((partner: any, i: number) => {
                      const partnerWinRate = Math.round((partner.vinteInsieme / partner.insieme) * 100);
                      return (
                        <div key={i} className="flex flex-col gap-1">
                          <div className="flex justify-between items-end"><span className="font-black text-blue-900 uppercase text-sm">{partner.nome}</span><span className="text-[10px] font-bold text-gray-500">{partner.insieme} Match giocati</span></div>
                          <div className="w-full bg-gray-100 rounded-full h-3 flex items-center relative overflow-hidden"><div className={`h-full transition-all duration-1000 ${partnerWinRate >= 50 ? 'bg-green-500' : 'bg-orange-500'}`} style={{ width: `${partnerWinRate}%` }}></div></div>
                          <span className={`text-[10px] font-black mt-0.5 text-right ${partnerWinRate >= 50 ? 'text-green-600' : 'text-orange-600'}`}>{partnerWinRate}% Vinte insieme</span>
                        </div>
                      );
                    });
                  })()}
                </div>
              </section>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
