'use client'
import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'

export default function Home() {
  const [giocatori, setGiocatori] = useState<any[]>([])
  const [nuovoNome, setNuovoNome] = useState('')
  const [fileFoto, setFileFoto] = useState<File | null>(null)
  const [caricamento, setCaricamento] = useState(true)
  const [inviando, setInviando] = useState(false)

  const prendiGiocatori = async () => {
    const { data, error } = await supabase
      .from('giocatori')
      .select('*')
      .order('Punti', { ascending: false })
    if (!error) setGiocatori(data || [])
    setCaricamento(false)
  }

  useEffect(() => { prendiGiocatori() }, [])

  const aggiungiGiocatore = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!nuovoNome.trim()) return
    setInviando(true)

    let urlFoto = ""
    if (fileFoto) {
      const nomeFile = `${Date.now()}_${fileFoto.name}`
      const { data, error: uploadError } = await supabase.storage
        .from('foto_giocatori')
        .upload(nomeFile, fileFoto)

      if (!uploadError) {
        const { data: publicData } = supabase.storage
          .from('foto_giocatori')
          .getPublicUrl(nomeFile)
        urlFoto = publicData.publicUrl
      }
    }

    const { error } = await supabase
      .from('giocatori')
      .insert([{ Nome: nuovoNome, Punti: 1000, partite: 0, foto: urlFoto }])

    if (!error) {
      setNuovoNome('')
      setFileFoto(null)
      const fileInput = document.getElementById('foto-input') as HTMLInputElement
      if (fileInput) fileInput.value = ''
      prendiGiocatori()
    }
    setInviando(false)
  }

  const registraRisultato = async (id: any, puntiAttuali: number, partiteAttuali: number, variazione: number) => {
    const { error } = await supabase
      .from('giocatori')
      .update({ Punti: puntiAttuali + variazione, partite: (partiteAttuali || 0) + 1 })
      .eq('id', id)
    if (!error) prendiGiocatori()
  }

  return (
    <main className="relative flex min-h-screen flex-col items-center bg-[#005bb7] text-white p-4 font-sans overflow-x-hidden">
      
      {/* LINEA DEL CAMPO ESTESA */}
      <div className="absolute top-32 left-0 w-[150%] h-2 bg-white/20 -rotate-3 -translate-x-10 pointer-events-none shadow-[0_0_15px_rgba(255,255,255,0.3)]"></div>
      
      <div className="relative z-10 flex flex-col items-center w-full max-w-lg mx-auto">
        <h1 className="text-5xl md:text-7xl font-black mb-1 italic tracking-tighter text-yellow-300 drop-shadow-lg text-center">padelg</h1>
        <p className="text-blue-100 mb-6 font-bold tracking-[0.2em] uppercase text-[9px] md:text-[11px] bg-blue-900/50 px-4 py-1 rounded-full border border-white/10">
          World Ranking Live
        </p>
        
        {/* FORM RESPONSIVE */}
        <form onSubmit={aggiungiGiocatore} className="w-full mb-8 flex flex-col gap-3 bg-blue-900/40 p-4 md:p-6 rounded-[2rem] backdrop-blur-md border border-white/20 shadow-xl">
          <input 
            type="text" 
            placeholder="Nome campione..." 
            value={nuovoNome}
            onChange={(e) => setNuovoNome(e.target.value)}
            className="w-full p-4 rounded-2xl bg-gray-800 text-white font-bold outline-none placeholder:text-gray-400 focus:ring-2 focus:ring-yellow-300 transition-all text-sm md:text-base"
          />
          <div className="flex flex-col sm:flex-row items-center gap-3">
            <input 
              id="foto-input"
              type="file" accept="image/*" 
              onChange={(e) => setFileFoto(e.target.files?.[0] || null)}
              className="text-[10px] md:text-xs file:bg-blue-600 file:text-white file:border-none file:px-3 file:py-2 file:rounded-xl file:font-bold cursor-pointer w-full sm:flex-1"
            />
            <button type="submit" disabled={inviando} className="w-full sm:w-auto bg-yellow-300 text-blue-900 font-black px-8 py-3 rounded-2xl hover:bg-white transition-all uppercase text-xs shadow-md active:scale-95 disabled:opacity-50">
              {inviando ? '...' : 'ADD'}
            </button>
          </div>
        </form>

        {/* CARD CLASSIFICA RESPONSIVE */}
        <div className="w-full bg-white rounded-[2.5rem] shadow-[0_30px_60px_rgba(0,0,0,0.4)] overflow-hidden text-black border-4 border-blue-900 mb-10">
          <div className="bg-gray-800 p-4 font-black text-center text-white uppercase tracking-widest text-[10px] md:text-xs">
             Classifica Campioni 
          </div>
          
          <div className="divide-y divide-gray-100">
            {giocatori.length > 0 ? (
              giocatori.map((g, index) => (
                <div key={g.id || `p-${index}`} className="p-4 md:p-5 flex justify-between items-center hover:bg-blue-50 transition-colors">
                  <div className="flex items-center gap-2 md:gap-4 flex-1 min-w-0">
                    <span className={`text-lg md:text-xl font-black w-6 md:w-8 ${index === 0 ? 'text-yellow-500' : index === 1 ? 'text-gray-400' : index === 2 ? 'text-orange-400' : 'text-blue-200'}`}>
                      {index + 1}°
                    </span>
                    
                    <div className="relative shrink-0">
                      {g.foto ? (
                        <img src={g.foto} alt="" className="w-10 h-10 md:w-14 h-14 rounded-full object-cover border-2 border-blue-600 shadow-sm" />
                      ) : (
                        <div className="w-10 h-10 md:w-14 h-14 rounded-full bg-blue-100 flex items-center justify-center text-blue-300 font-black text-lg md:text-xl">?</div>
                      )}
                    </div>

                    <div className="flex flex-col min-w-0">
                      <span className="font-extrabold text-sm md:text-lg uppercase text-blue-900 leading-tight truncate">{g.Nome}</span>
                      <span className="text-[9px] md:text-[10px] text-gray-400 font-bold uppercase">{g.partite || 0} Match</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 md:gap-4 ml-2">
                    <div className="flex gap-1">
                      <button onClick={() => registraRisultato(g.id, g.Punti, g.partite, -10)} className="w-8 h-8 md:w-10 md:h-10 flex items-center justify-center bg-slate-100 text-slate-400 rounded-xl font-black hover:bg-red-500 hover:text-white transition-all shadow-sm">-</button>
                      <button onClick={() => registraRisultato(g.id, g.Punti, g.partite, 10)} className="w-8 h-8 md:w-10 md:h-10 flex items-center justify-center bg-blue-100 text-blue-600 rounded-xl font-black hover:bg-blue-600 hover:text-white transition-all shadow-sm">+</button>
                    </div>
                    <div className="flex flex-col items-end min-w-[50px] md:min-w-[70px] bg-blue-50 p-1 md:p-2 rounded-2xl border border-blue-100">
                      <span className="text-lg md:text-2xl font-black text-blue-700 leading-none">{g.Punti}</span>
                      <span className="text-[7px] md:text-[9px] text-blue-400 uppercase font-black">pts</span>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="p-10 text-center text-gray-300 font-bold italic">
                {caricamento ? "Caricamento campo..." : "In attesa di campioni..."}
              </div>
            )}
          </div>
        </div>
      </div>
    </main>
  )
}
