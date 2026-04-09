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

    if (error) {
      console.error("Errore lettura:", error.message)
    } else {
      setGiocatori(data || [])
    }
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
      .insert([{ Nome: nuovoNome, Punti: 1000 }])

    if (error) {
      alert("Errore inserimento: " + error.message)
    } else {
      setNuovoNome('')
      prendiGiocatori()
    }
  }

  const aggiornaPunti = async (id: any, puntiAttuali: number, variazione: number) => {
    const { error } = await supabase
      .from('giocatori')
      .update({ Punti: puntiAttuali + variazione })
      .eq('id', id)

    if (error) {
      alert("Errore aggiornamento: " + error.message)
    } else {
      prendiGiocatori()
    }
  }

  return (
    <main className="flex min-h-screen flex-col items-center bg-green-600 text-white p-4 font-sans">
      <h1 className="text-6xl font-black mb-2 italic tracking-tighter text-yellow-300">padelg</h1>
      <p className="text-white mb-8 font-medium tracking-widest uppercase text-xs">Ranking Live</p>
      
      <form onSubmit={aggiungiGiocatore} className="w-full max-w-md mb-8 flex gap-2">
        <input 
          type="text" 
          placeholder="Scrivi nome e cognome..." 
          value={nuovoNome}
          onChange={(e) => setNuovoNome(e.target.value)}
          className="flex-1 p-4 rounded-2xl text-black font-bold outline-none shadow-lg"
        />
        <button type="submit" className="bg-yellow-300 text-green-800 font-black px-6 rounded-2xl shadow-lg hover:bg-white transition-all active:scale-95">
          UNISCITI
        </button>
      </form>

      <div className="w-full max-w-md bg-white rounded-3xl shadow-2xl overflow-hidden text-black">
        <div className="bg-gray-800 p-4 font-bold text-center text-white uppercase tracking-widest text-sm">
          Classifica Campioni
        </div>
        
        <div className="divide-y divide-gray-100">
          {giocatori.length > 0 ? (
            giocatori.map((g, index) => (
              <div key={g.id || index} className="p-5 flex justify-between items-center hover:bg-gray-50 transition-colors">
                <div className="flex items-center gap-4 flex-1">
                  <span className={`text-lg font-black w-8 ${index < 3 ? 'text-yellow-500' : 'text-gray-300'}`}>
                    {index + 1}°
                  </span>
                  <span className="font-extrabold text-lg uppercase leading-tight">
                    {g.Nome}
                  </span>
                </div>

                <div className="flex items-center gap-4">
                  <div className="flex gap-2">
                    <button 
                      onClick={() => aggiornaPunti(g.id, g.Punti, -10)}
                      className="w-10 h-10 flex items-center justify-center bg-red-100 text-red-600 rounded-full font-black hover:bg-red-600 hover:text-white transition-all active:scale-90"
                    >
                      -
                    </button>
                    <button 
                      onClick={() => aggiornaPunti(g.id, g.Punti, 10)}
                      className="w-10 h-10 flex items-center justify-center bg-green-100 text-green-600 rounded-full font-black hover:bg-green-600 hover:text-white transition-all active:scale-90"
                    >
                      +
                    </button>
                  </div>

                  <div className="flex flex-col items-end min-w-[60px]">
                    <span className="text-2xl font-black text-green-600">{g.Punti}</span>
                    <span className="text-[10px] text-gray-400 uppercase font-bold">punti</span>
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className="p-10 text-center text-gray-400 font-bold">
              {caricamento ? "CARICAMENTO..." : "NESSUN GIOCATORE"}
            </div>
          )}
        </div>
      </div>
    </main>
  )
}
