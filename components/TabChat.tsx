import React, { useState, FormEvent } from 'react'

export default function TabChat({
  messaggi,
  mioGiocatoreId,
  chatEndRef,
  onInviaMessaggio,
  user
}: any) {
  // Guarda che figata: lo stato del nuovo messaggio ora vive solo qui dentro!
  // Abbiamo tolto un peso a page.tsx
  const [nuovoMessaggio, setNuovoMessaggio] = useState('')

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (!nuovoMessaggio.trim()) return;
    
    // Passiamo il testo all'app principale per salvarlo nel database
    onInviaMessaggio(nuovoMessaggio);
    
    // Svuotiamo il campo dopo l'invio
    setNuovoMessaggio('');
  }

  return (
    <div className="flex flex-col h-[65vh] animate-in fade-in duration-300">
      <div className="flex items-center gap-3 mb-4">
        <span className="text-3xl">💬</span>
        <div>
          <h2 className="text-2xl font-black italic text-yellow-400 leading-none">Spogliatoio</h2>
          <p className="text-xs text-blue-200 font-bold uppercase">Chat Ufficiale</p>
        </div>
      </div>

      <div className="flex-1 bg-white/10 backdrop-blur-md rounded-3xl p-4 overflow-y-auto flex flex-col gap-3 border border-white/20 shadow-inner">
        {messaggi.length === 0 ? (
          <div className="m-auto text-center text-blue-200 font-bold text-sm opacity-60">Nessun messaggio.</div>
        ) : (
          messaggi.map((msg: any, i: number) => {
            const isMine = msg.mittente_id === mioGiocatoreId;
            return (
              <div key={msg.id || i} className={`flex flex-col w-3/4 max-w-[280px] ${isMine ? 'self-end items-end' : 'self-start items-start'}`}>
                <span className="text-[10px] text-blue-200 font-bold mb-1 mx-1">{isMine ? 'Tu' : msg.mittente_nome}</span>
                <div className={`p-3 rounded-2xl shadow-md ${isMine ? 'bg-yellow-400 text-blue-900 rounded-tr-sm' : 'bg-white text-blue-900 rounded-tl-sm'}`}>
                  <p className="text-sm font-bold leading-snug">{msg.testo}</p>
                </div>
                {msg.created_at && (
                  <span className="text-[8px] text-blue-200/60 mt-1 mx-1 font-bold">
                    {new Date(msg.created_at).toLocaleTimeString('it-IT', { hour: '2-digit', minute: '2-digit' })}
                  </span>
                )}
              </div>
            )
          })
        )}
        <div ref={chatEndRef} />
      </div>

      <div className="mt-4 shrink-0"> 
        {user ? (
          <form onSubmit={handleSubmit} className="flex gap-2">
            <input 
              type="text" 
              placeholder="Scrivi..." 
              value={nuovoMessaggio} 
              onChange={e => setNuovoMessaggio(e.target.value)} 
              className="flex-1 p-4 bg-white rounded-2xl text-blue-900 font-bold outline-none shadow-lg focus:border-yellow-400" 
            />
            <button type="submit" disabled={!nuovoMessaggio.trim()} className="bg-yellow-400 text-blue-900 p-4 rounded-2xl font-black uppercase shadow-lg disabled:opacity-50">
              Invia
            </button>
          </form>
        ) : (
          <div className="bg-blue-900/60 p-4 rounded-2xl text-center border border-blue-800/50">
            <p className="text-xs font-bold text-yellow-400 uppercase">Devi fare l'accesso</p>
          </div>
        )}
      </div>
    </div>
  )
}
