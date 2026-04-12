import React from 'react'

export default function TabPrenotazioni({
  mioGiocatoreId,
  invitiPendenti,
  rispondiInvito,
  prossimiGiorni,
  giornoSelezionato,
  setGiornoSelezionato,
  getPrevisioneMeteo,
  campoSelezionato,
  setCampoSelezionato,
  slotGiornalieri,
  prenotazioni,
  prenotaSlot,
  eliminaPrenotazione,
  gestioneInviti,
  setGestioneInviti,
  apriGestioneInviti,
  invitoG2, setInvitoG2,
  invitoG3, setInvitoG3,
  invitoG4, setInvitoG4,
  giocatori,
  salvaInviti,
  lanciaSOS,
  addToGoogleCalendar,
  inviando
}: any) {

  return (
    <div className="animate-in fade-in slide-in-from-right-4 duration-300 flex-1">
      <div className="flex items-center gap-3 mb-6">
        <span className="text-3xl">📅</span>
        <div>
          <h2 className="text-2xl font-black italic text-yellow-400 leading-none">Prenota Campo</h2>
          <p className="text-xs text-blue-200 font-bold uppercase">Gestione e Inviti</p>
        </div>
      </div>
       
      {/* INVITI PENDENTI */}
      {invitiPendenti.length > 0 && (
        <div className="bg-gradient-to-r from-yellow-400 to-yellow-500 rounded-3xl p-5 shadow-2xl mb-8 border border-yellow-300 animate-pulse">
          <h3 className="text-blue-900 font-black uppercase text-sm mb-3">📬 Sei stato convocato!</h3>
          <div className="flex flex-col gap-3">
            {invitiPendenti.map((invito: any) => {
              const miaColonnaStato = invito.g2_id === mioGiocatoreId ? 'g2_stato' : (invito.g3_id === mioGiocatoreId ? 'g3_stato' : 'g4_stato');
              const miaColonnaId = invito.g2_id === mioGiocatoreId ? 'g2_id' : (invito.g3_id === mioGiocatoreId ? 'g3_id' : 'g4_id');
              return (
                <div key={invito.id} className="bg-white/40 p-3 rounded-2xl backdrop-blur-md border border-white/50">
                  <p className="text-blue-900 font-bold text-sm leading-tight mb-2"><span className="font-black">{invito.creatore_nome}</span> ti ha invitato a giocare il <span className="font-black bg-white/50 px-1 rounded">{invito.data_slot.split('-').reverse().join('/')}</span> alle <span className="font-black bg-white/50 px-1 rounded">{invito.ora_inizio}</span> nel <span className="font-black">{invito.campo}</span>.</p>
                  <div className="flex gap-2">
                    <button onClick={() => rispondiInvito(invito, miaColonnaStato, 'Accettato', miaColonnaId)} disabled={inviando} className="flex-1 bg-blue-600 text-white font-black text-xs py-2 rounded-xl uppercase shadow-md hover:bg-blue-700">Accetta</button>
                    <button onClick={() => rispondiInvito(invito, miaColonnaStato, 'Rifiutato', miaColonnaId)} disabled={inviando} className="flex-1 bg-red-500 text-white font-black text-xs py-2 rounded-xl uppercase shadow-md hover:bg-red-600">Rifiuta</button>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}
       
      {/* SELETTORE DATA E CAMPO CON METEO REALE 🌦️ */}
      <div className="flex gap-2 overflow-x-auto pb-4 mb-4 scrollbar-hide snap-x">
        {prossimiGiorni.map((g: any, i: number) => ( 
          <button key={i} onClick={()=>setGiornoSelezionato(g.dataStr)} className={`snap-center shrink-0 p-3 rounded-2xl flex flex-col items-center justify-center min-w-[80px] border transition-all ${giornoSelezionato===g.dataStr?'bg-yellow-400 text-blue-900 border-yellow-300 scale-105 shadow-md':'bg-white/10 text-white border-white/20 hover:bg-white/20'}`}>
            <span className="text-xl mb-1 drop-shadow-sm">{getPrevisioneMeteo(g.dataStr).split(' ')[0]}</span>
            <span className="text-[10px] font-bold uppercase mb-1 opacity-80">{i===0?'Oggi':i===1?'Domani':g.label.split(' ')[0]}</span>
            <span className="text-2xl font-black leading-none">{g.dataStr.split('-')[2]}</span>
          </button> 
        ))}
      </div>
      <div className="flex bg-blue-900/50 p-1 rounded-2xl backdrop-blur-md mb-6 border border-blue-800/50">
        <button onClick={()=>setCampoSelezionato('Campo 1')} className={`flex-1 py-3 rounded-xl font-black uppercase text-sm ${campoSelezionato==='Campo 1'?'bg-blue-600 text-white':'text-blue-200'}`}>Campo 1</button>
        <button onClick={()=>setCampoSelezionato('Campo 2')} className={`flex-1 py-3 rounded-xl font-black uppercase text-sm ${campoSelezionato==='Campo 2'?'bg-blue-600 text-white':'text-blue-200'}`}>Campo 2</button>
      </div>
       
      {/* LISTA SLOT */}
      <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-3xl p-2 flex flex-col gap-2">
        {slotGiornalieri.map((slot: any, idx: number) => {
          const p = prenotazioni.find((x: any) => x.campo === campoSelezionato && x.data_slot === giornoSelezionato && x.ora_inizio === slot.inizio);
          const occ = !!p; 
          const eMio = p && p.creatore_id === mioGiocatoreId;
          let conf = 1; 
          if(p?.g2_stato==='Accettato') conf++; 
          if(p?.g3_stato==='Accettato') conf++; 
          if(p?.g4_stato==='Accettato') conf++;

          return (
            <div key={idx} className={`flex flex-col p-4 rounded-2xl ${occ?(eMio?'bg-blue-800 border-blue-400/50':'bg-red-900/40 border-red-500/20 opacity-70'):'bg-white text-blue-900 shadow-sm'}`}>
              <div className="flex justify-between items-center w-full">
                <div className="flex flex-col">
                  <span className={`text-lg font-black ${occ?'text-white':'text-blue-900'}`}>{slot.inizio} - {slot.fine}</span>
                  {occ && <span className="text-[10px] font-bold uppercase mt-1 text-gray-300">Da: {p.creatore_nome}</span>}
                  <span className="text-[9px] font-bold text-blue-300 mt-1">{getPrevisioneMeteo(giornoSelezionato)}</span>
                </div>
                {!occ ? (
                  <button onClick={()=>prenotaSlot(slot)} className="bg-yellow-400 text-blue-900 px-4 py-2 rounded-xl text-xs font-black uppercase">Prenota</button>
                ) : eMio ? (
                  <button onClick={()=>eliminaPrenotazione(p.id)} className="bg-red-500 text-white px-3 py-1.5 rounded-lg text-[10px] font-black uppercase">Cancella</button>
                ) : (
                  <span className="text-xs font-bold uppercase text-red-300 bg-red-900/50 px-3 py-1.5 rounded-lg">Occupato</span>
                )}
              </div>
              {occ && eMio && (
                <div className="mt-4 pt-3 border-t border-blue-700/50 flex flex-col gap-3">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] uppercase font-bold text-blue-200">Stato Campo: {conf}/4</span>
                    <div className="flex gap-1">{[1,2,3,4].map(n => <div key={n} className={`w-3 h-3 rounded-full ${n<=conf?'bg-green-400':'bg-blue-900/50 border border-blue-400'}`}></div>)}</div>
                  </div>
                  {gestioneInviti?.id===p.id ? (
                    <div className="bg-white p-3 rounded-xl flex flex-col gap-2">
                      <span className="text-xs font-black text-blue-900 uppercase text-center mb-1">Seleziona Compagni</span>
                      {[ {label:'Gioc. 2',val:invitoG2,set:setInvitoG2,stato:p.g2_stato}, {label:'Gioc. 3',val:invitoG3,set:setInvitoG3,stato:p.g3_stato}, {label:'Gioc. 4',val:invitoG4,set:setInvitoG4,stato:p.g4_stato} ].map((c,i)=>( 
                        <div key={i} className="flex gap-2 items-center">
                          <select value={c.val} onChange={e=>c.set(e.target.value)} disabled={c.stato==='Accettato'} className="flex-1 p-2 bg-gray-50 rounded-lg text-xs font-bold text-blue-900 border outline-none">
                            <option value="">-- {c.label} --</option>
                            {giocatori.map((g: any) => g.id.toString()!==mioGiocatoreId && (<option key={g.id} value={g.id}>{g.Nome}</option>))}
                          </select>
                          {c.stato && (<span className={`text-[9px] font-black uppercase px-2 py-1 rounded w-[60px] text-center ${c.stato==='Accettato'?'bg-green-100 text-green-700':c.stato==='Rifiutato'?'bg-red-100 text-red-700':'bg-yellow-100 text-yellow-700'}`}>{c.stato==='In attesa'?'Attesa':c.stato}</span>)}
                        </div> 
                      ))} 
                      <div className="flex gap-2 mt-2">
                        <button onClick={()=>setGestioneInviti(null)} className="flex-1 bg-gray-200 text-gray-600 text-xs py-2 rounded-lg font-black uppercase">Annulla</button>
                        <button onClick={salvaInviti} className="flex-1 bg-blue-600 text-white text-xs py-2 rounded-lg font-black uppercase">Invia Inviti</button>
                      </div>
                    </div>
                  ) : (
                    <div className="flex flex-col gap-2">
                      <button onClick={()=>apriGestioneInviti(p)} className="w-full bg-blue-600 text-white py-2 rounded-xl text-xs font-black uppercase">➕ Gestisci Giocatori</button>
                      <div className="flex gap-2">
                        {conf < 4 && <button onClick={() => lanciaSOS(p)} className="flex-1 bg-red-500/90 text-white py-2 rounded-xl text-[10px] font-black uppercase shadow-md flex justify-center items-center gap-1">🆘 SOS Quarto</button>}
                        <button onClick={() => addToGoogleCalendar(p)} className="flex-1 bg-white/20 text-white py-2 rounded-xl text-[10px] font-black uppercase shadow-md border border-white/30 flex justify-center items-center gap-1">📅 Add Calendar</button>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
