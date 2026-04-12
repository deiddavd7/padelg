import React from 'react'

export default function TabEventi({
  user,
  mostraFormEvento, setMostraFormEvento,
  nuovoEventoTitolo, setNuovoEventoTitolo,
  nuovoEventoTipo, setNuovoEventoTipo,
  nuovoEventoMax, setNuovoEventoMax,
  nuovoEventoData, setNuovoEventoData,
  creaEvento, inviando,
  eventi, mioGiocatoreId,
  eliminaEvento, iscrivitiEvento, disiscrivitiEvento, avviaEvento, ricaricaDashboard,
  giocatori
}: any) {

  return (
    <div className="animate-in fade-in slide-in-from-right-4 duration-300 flex-1">
      <div className="flex items-center gap-3 mb-6">
        <span className="text-3xl">🏅</span>
        <div>
          <h2 className="text-2xl font-black italic text-yellow-400 leading-none">Bacheca Eventi</h2>
          <p className="text-xs text-blue-200 font-bold uppercase">Tornei & Americane</p>
        </div>
      </div>

      {user && (
        <div className="mb-8">
          {!mostraFormEvento ? (
            <button onClick={()=>setMostraFormEvento(true)} className="w-full bg-gradient-to-r from-yellow-400 to-yellow-500 text-blue-900 p-4 rounded-3xl font-black uppercase text-sm shadow-xl flex justify-center items-center gap-2 border border-yellow-300">➕ Organizza Evento</button>
          ) : (
            <div className="bg-white p-6 rounded-3xl text-blue-900 shadow-2xl">
              <div className="flex justify-between items-center mb-6">
                <h3 className="font-black uppercase text-sm tracking-widest">Nuova Locandina</h3>
                <button onClick={()=>setMostraFormEvento(false)} className="bg-gray-100 text-gray-500 px-3 py-1 rounded-full font-bold text-xs">ANNULLA</button>
              </div>
              <div className="space-y-4 mb-6">
                <div>
                  <label className="text-[10px] font-bold text-gray-500 uppercase ml-1">Nome Evento</label>
                  <input type="text" value={nuovoEventoTitolo} onChange={e=>setNuovoEventoTitolo(e.target.value)} className="w-full p-3 bg-gray-50 rounded-xl font-bold outline-none border border-gray-200" />
                </div>
                <div className="flex gap-3">
                  <div className="w-1/2">
                    <label className="text-[10px] font-bold text-gray-500 uppercase ml-1">Tipo</label>
                    <select value={nuovoEventoTipo} onChange={e=>setNuovoEventoTipo(e.target.value)} className="w-full p-3 bg-gray-50 rounded-xl font-bold outline-none border border-gray-200">
                      <option value="Americana">Americana</option>
                      <option value="Torneo">Torneo (Auto)</option>
                    </select>
                  </div>
                  <div className="w-1/2">
                    <label className="text-[10px] font-bold text-gray-500 uppercase ml-1">Max Giocatori (min 5)</label>
                    <input type="number" min="5" value={nuovoEventoMax} onChange={e=>setNuovoEventoMax(Number(e.target.value))} className="w-full p-3 bg-gray-50 rounded-xl font-bold outline-none border border-gray-200" />
                  </div>
                </div>
                <div>
                  <label className="text-[10px] font-bold text-gray-500 uppercase ml-1">Data</label>
                  <input type="date" value={nuovoEventoData} onChange={e=>setNuovoEventoData(e.target.value)} className="w-full p-3 bg-gray-50 rounded-xl font-bold outline-none border border-gray-200" />
                </div>
              </div>
              <button onClick={creaEvento} disabled={inviando} className="w-full bg-blue-600 text-white p-4 rounded-xl font-black uppercase shadow-lg">
                {inviando ? 'Creazione...' : 'Lancia Evento'}
              </button>
            </div>
          )}
        </div>
      )}

      <div className="flex flex-col gap-5">
        {eventi.map((ev: any) => {
          const iscritti = ev.iscritti || []; 
          const isIscritto = iscritti.includes(mioGiocatoreId); 
          const isPieno = iscritti.length >= ev.max_iscritti; 
          const eMio = ev.creatore_id === mioGiocatoreId;
          return (
            <div key={ev.id} className={`bg-white rounded-3xl overflow-hidden shadow-2xl flex flex-col relative border-2 ${ev.stato==='In Corso' ? 'border-yellow-400' : 'border-gray-100'}`}>
              <div className="absolute top-4 right-4 flex gap-2">
                {eMio && ev.stato === 'Aperto' && <button onClick={() => eliminaEvento(ev.id)} className="bg-red-500/90 hover:bg-red-600 text-white w-6 h-6 rounded-full flex items-center justify-center text-xs font-black shadow-md">✖</button>}
                <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase shadow-md ${ev.stato === 'In Corso' ? 'bg-yellow-400 text-blue-900 animate-pulse' : ev.stato === 'Chiuso' ? 'bg-gray-200 text-gray-500' : 'bg-blue-900/90 text-yellow-400'}`}>{ev.stato === 'Aperto' ? ev.tipo : ev.stato}</span>
              </div>
              <div className="p-6 pb-4">
                <span className="text-[10px] font-black uppercase text-gray-400">{ev.data_evento.split('-').reverse().join('/')}</span>
                <h3 className="text-xl font-black text-blue-900 uppercase leading-tight mt-1 pr-16">{ev.titolo}</h3>
                {ev.stato === 'Aperto' && (
                  <div className="mt-5">
                    <div className="flex justify-between items-end mb-1"><span className="text-[10px] font-bold text-gray-500 uppercase">Iscrizioni</span><span className="text-xs font-black">{iscritti.length} / {ev.max_iscritti}</span></div>
                    <div className="w-full bg-gray-100 rounded-full h-3 overflow-hidden shadow-inner"><div className={`h-full transition-all duration-1000 ${isPieno?'bg-red-500':'bg-green-500'}`} style={{ width: `${(iscritti.length/ev.max_iscritti)*100}%` }}></div></div>
                  </div>
                )}
                {iscritti.length > 0 && (
                  <div className="mt-4 pt-4 border-t border-gray-100">
                    <span className="text-[10px] font-bold text-gray-400 uppercase block mb-2">Partecipanti:</span>
                    <div className="flex flex-wrap gap-2">
                      {iscritti.map((idIscritto: string) => { 
                        const gioc = giocatori.find((g: any) => g.id.toString() === idIscritto); 
                        return gioc ? <span key={idIscritto} className="bg-gray-100 border border-gray-200 text-blue-900 px-2 py-1 rounded-lg text-[10px] font-bold shadow-sm">{gioc.Nome}</span> : null; 
                      })}
                    </div>
                  </div>
                )}
              </div>
              <div className="bg-gray-50 p-4 flex flex-col gap-3 border-t border-gray-100">
                {ev.stato === 'Aperto' && (
                  <>
                    {!user ? <button disabled className="w-full bg-gray-300 text-white py-3 rounded-xl text-xs font-black uppercase">Fai Log in</button> : isIscritto ? <button onClick={()=>disiscrivitiEvento(ev)} className="w-full bg-red-100 text-red-600 py-3 rounded-xl text-xs font-black uppercase">Ritirati</button> : isPieno ? <button disabled className="w-full bg-gray-300 text-white py-3 rounded-xl text-xs font-black uppercase">Posti Esauriti</button> : <button onClick={()=>iscrivitiEvento(ev)} className="w-full bg-green-500 text-white py-3 rounded-xl text-xs font-black uppercase shadow-md">✅ Iscriviti</button>}
                    {eMio && <button onClick={()=>avviaEvento(ev)} className="w-full mt-2 border-2 border-yellow-400 text-yellow-600 hover:bg-yellow-50 py-3 rounded-xl text-xs font-black uppercase">🚀 Avvia Evento / Crea Tabellone</button>}
                  </>
                )}
                {(ev.stato === 'In Corso' || ev.stato === 'Chiuso') && ( <button onClick={()=>ricaricaDashboard(ev.id)} className={`w-full ${ev.stato==='Chiuso'?'bg-gray-800':'bg-blue-600 hover:bg-blue-700'} text-white py-3 rounded-xl text-xs font-black uppercase shadow-md flex justify-center items-center gap-2`}>🎾 Apri Tabellone & Risultati</button> )}
              </div>
            </div>
          )
        })}
      </div>
      <div className="h-32 w-full shrink-0"></div>
    </div>
  )
}
