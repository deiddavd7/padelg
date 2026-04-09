'use client'
import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'

export default function Home() {
  const [giocatori, setGiocatori] = useState<any[]>([])
  const [nuovoNome, setNuovoNome] = useState('')
  const [caricamento, setCaricamento] = useState(true)

  const prendiGiocatori = async () => {
    const { data, error } = await supabase
      .from('giocatori')
      .select('*')
      .order('Punti', { ascending: false })
    if (!error) setGiocatori(data || [])
    setCaricamento(false)
  }

  useEffect(() => {
    prendiGiocatori()
  }, [])

  const aggiungiGiocatore = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!nuovoNome.trim()) return
    const { error } = await supabase
      .from('giocatori')
      .insert([{ Nome: nuovoNome, Punti: 1000, partite: 0 }])
    if (!error) {
      setNuovoNome('')
      prendiGiocatori()
    }
  }

  const registraRisultato = async (id: any, puntiAttuali: number, partiteAttuali: number, variazione: number) => {
    const { error } = await supabase
      .from('giocatori')
      .update({ 
        Punti: puntiAttuali + variazione,
        partite: (partiteAttuali || 0) + 1 
      })
      .eq('id', id)
    if (!error) prendiGiocatori()
  }

  return (
    <main className="flex min-h-screen flex-col items-center bg-blue-700 text-white p-4 font-sans">
      <h1 className="text-6xl font-black mb-1 italic tracking-tighter text-yellow-300 drop-shadow-md">padelg</h1>
      <p className="text-blue-100 mb-8 font-bold tracking-[0.3em] uppercase text-[10px] bg-blue-800 px-4 py-1 rounded-full">
        World Ranking Live
      </p>
      
      <form onSubmit={aggiungiGiocatore} className="w-full max-w-md mb-8 flex gap-2 bg-blue-800/50 p-3 rounded-3xl backdrop-blur-sm border border-blue-500/30">
        <input 
          type="text" 
          placeholder="Nome campione..." 
          value={nuovoNome}
          onChange={(e) => setNuovoNome(e.target.value)}
          className="flex-1 p-4 rounded-2xl text-black font-bold outline-none bg-white"
        />
        <button type="submit" className="bg-yellow-300 text-blue-900 font-black px-6 rounded-2xl hover:bg-white transition-all uppercase text-xs">
          Add
        </button>
      </form>

      <div className="w-full max-w-md bg-white rounded-[2rem] shadow-2xl overflow-hidden text-black border-4 border-blue-800">
        <div className="bg-blue-900 p-4 font-black text-center text-white uppercase tracking-widest text-xs">
          ★ Classifica Campioni ★
        </div>
        
        <div className="divide-y divide-gray-100">
          {giocatori.length > 0 ? (
            giocatori.map((g, index) => (
              <div key={g.id || index} className="p-5 flex justify-between items-center">
                <div className="flex items-center gap-4 flex-1">
                  <span className="text-xl font-black w-8 text-blue-200">{index + 1}°</span>
                  <div className="flex flex-col">
                    <span className="font-extrabold text-lg uppercase text-blue-900">{g.Nome}</span>
                    <span className="text-[10px] text-gray-400 font-bold uppercase">{g.partite || 0} Match</span>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <div className="flex gap-1">
                    <button onClick={() => registraRisultato(g.id, g.Punti, g.partite, -10)} className="w-9 h-9 bg-slate-100 text-slate-400 rounded-xl font-black">-</button>
                    <button onClick={() => registraRisultato(g.id, g.Punti, g.partite, 10)} className="w-9 h-9 bg-blue-100 text-blue-600 rounded-xl font-black">+</button>
                  </div>
                  <div className="flex flex-col items-end min-w-[65px] bg-blue-50 p-2 rounded-2xl border border-blue-100">
                    <span className="text-2xl font-black text-blue-700">{g.Punti}</span>
                    <span className="text-[9px] text-blue-400 uppercase font-black">pts</span>
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className="p-10 text-center text-gray-300 font-bold italic">
              {caricamento ? "Caricamento campo..." : "Nessun giocatore"}
            </div>
          )}
        </div>
      </div>
    </main>
  )
}
