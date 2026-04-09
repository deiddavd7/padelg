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
      
      {/* LINEA DEL CAMPO (Striscia Bianca) */}
      <div className="absolute top-40 left-0 w-full h-2 bg-white/20 -rotate-2 scale-110 pointer-events-none shadow-[0_0_15px_rgba(255,255,255,0.3)]"></div>
      <div className="absolute bottom-20 left-0 w-full h-1 bg-white/10 rotate-1 scale-110 pointer-events-none"></div>

      {/* CONTENUTO SOPRA LE LINEE */}
      <div className="relative z-10 flex flex-col items-center w-full">
        <h1 className="text-6xl font-black mb-1 italic tracking-tighter text-yellow-300 drop-shadow-[0_2px_10px_rgba(0,0,0,0.3)]">padelg</h1>
        <p className="text-blue-100 mb-8 font-bold tracking-[0.3em] uppercase text-[10px] bg-blue-900/50 px-4 py-1 rounded-full border border-white/10">
          World Ranking Live
        </p>
        
        {/* FORM CON COLORE COORDINATO */}
        <form onSubmit={aggiungiGiocatore} className="w-full max-w-md mb-8 flex flex-col gap-3 bg-blue-900/40 p-4 rounded-3xl backdrop-blur-md border border-white/20 shadow-xl">
          <input 
            type="text" 
            placeholder="Nome campione..." 
            value={nuovoNome}
            onChange={(e) => setNuovoNome(e.target.value)}
            className="p-4 rounded-2xl bg-gray-800 text-white font-bold outline-none placeholder:text-gray-400 focus:ring-2 focus:ring-yellow-300 transition-all shadow-lg"
          />
          <div className="flex items-center gap-2">
            <input 
              id="foto-input"
              type="file" accept="image/*" 
              onChange={(e) => setFileFoto(e.target.files?.[0] || null)}
              className="text-xs file:bg-yellow-300 file:border-none file:px-3 file:py-2 file:rounded-xl file:font-black file:text-blue-900 cursor-pointer flex-1"
            />
            <button type="submit" disabled={inviando} className="bg-yellow-300 text-blue-900 font-black px-6 py-2 rounded-xl hover:bg-white transition-all uppercase text-xs active:scale-95 disabled:opacity-50 shadow-md">
              {inviando ? '...' : 'Add'}
            </button>
          </div>
        </form>

        {/* CARD CLASSIFICA */}
        <div className="w-full max-w-md bg-white rounded-[2rem] shadow-[0_20px_50px_rgba(0,0,0,0.5)] overflow-hidden text-black border-4 border-blue-900">
          <div className="bg-gray-800 p-4 font-black text-center text-white uppercase tracking-widest text-xs flex justify-center items-center gap-2">
             Classifica Campioni 
          </div>
          
          <div className="divide-y divide-gray-100">
            {giocatori.length > 0 ? (
              giocatori.map((g, index) => (
                <div key={g.id} className="p-4 flex justify-between items-center hover:bg-blue-50 transition-colors">
                  <div className="flex items-center gap-3 flex-1">
                    <span className={`text-xl font-black w-8 ${index === 0 ? 'text-yellow-500' : index === 1 ? 'text-gray-400' : index === 2 ? 'text-orange-400' : 'text-blue-200'}`}>
                      {index + 1}°
                    </span>
                    
                    {g.foto ? (
                      <img src={g.foto} alt={g.Nome} className="w-12 h-12 rounded-full object-cover border-2 border-blue-600 shadow-sm" />
                    ) : (
                      <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center text-blue-300 font-black text-xl">?</div>
                    )}

                    <div className="flex flex-col">
                      <span className="font-extrabold text-md uppercase text-blue-900 leading-none mb-1">{g.Nome}</span>
                      <span className="text-[10px] text-gray-400 font-bold uppercase">{g.partite || 0} Match</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <div className="flex gap-1">
                      <button onClick={() => registraRisultato(g.id, g.Punti, g.partite, -10)} className="w-8 h-8 flex items-center justify-center bg-slate-100 text-slate-400 rounded-lg font-black hover:bg-red-500 hover:text-white transition-all shadow-sm">-</button>
                      <button onClick={() => registraRisultato(g.id, g.Punti, g.partite, 10)} className="w-8 h-8 flex items-center justify-center bg-blue-100 text-blue-600 rounded-lg font-black hover:bg-blue-600 hover:text-white transition-all shadow-sm">+</button>
                    </div>
                    <div className="flex flex-col items-end min-w-[55px] bg-blue-50 p-1 rounded-xl border border-blue-100">
                      <span className="text-xl font-black text-blue-700 leading-none">{g.Punti}</span>
                      <span className="text-[8px] text-blue-400 uppercase font-black">pts</span>
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
