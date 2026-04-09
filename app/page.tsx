'use client'
import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'

export default function Home() {
  const [giocatori, setGiocatori] = useState<any[]>([])
  const [partite, setPartite] = useState<any[]>([])
  const [user, setUser] = useState<any>(null)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [nuovoNome, setNuovoNome] = useState('')
  const [fileFoto, setFileFoto] = useState<File | null>(null)
  const [inviando, setInviando] = useState(false)
  const [mostraLogin, setMostraLogin] = useState(false)

  // Stati per la MODIFICA profilo
  const [editingId, setEditingId] = useState<any>(null)
  const [editNome, setEditNome] = useState('')
  const [editFotoFile, setEditFotoFile] = useState<File | null>(null)
  const [salvataggioInCorso, setSalvataggioInCorso] = useState(false)

  // Stati per REGISTRA PARTITA
  const [mostraFormPartita, setMostraFormPartita] = useState(false)
  const [vincitoreId, setVincitoreId] = useState('')
  const [sconfittoId, setSconfittoId] = useState('')
  const [risultatoMatch, setRisultatoMatch] = useState('')

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => setUser(session?.user ?? null))
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => setUser(session?.user ?? null))
    prendiGiocatori()
    prendiPartite()
    return () => subscription.unsubscribe()
  }, [])

  const prendiGiocatori = async () => {
    const { data } = await supabase.from('giocatori').select('*').order('Punti', { ascending: false })
    if (data) setGiocatori(data)
  }

  const prendiPartite = async () => {
    const { data } = await supabase.from('partite').select('*').order('created_at', { ascending: false }).limit(10)
    if (data) setPartite(data)
  }

  const handleAuth = async (type: 'LOGIN' | 'SIGNUP') => {
    const { error } = type === 'LOGIN' 
      ? await supabase.auth.signInWithPassword({ email, password })
      : await supabase.auth.signUp({ email, password })
    if (error) alert(error.message)
    else setMostraLogin(false)
  }

  const uploadFotoHelper = async (file: File) => {
    const nomeFile = `${Date.now()}_${user.id}_foto`
    const { error: upErr } = await supabase.storage.from('foto_giocatori').upload(nomeFile, file)
    if (!upErr) {
      const { data: pub } = supabase.storage.from('foto_giocatori').getPublicUrl(nomeFile)
      return pub.publicUrl
    }
    return null
  }

  const creaProfiloGiocatore = async () => {
    if (!nuovoNome.trim() || !user) return
    setInviando(true)
    let urlFoto = ""
    if (fileFoto) {
      const url = await uploadFotoHelper(fileFoto)
      if (url) urlFoto = url
    }
    const { error } = await supabase.from('giocatori').insert([{ Nome: nuovoNome, Punti: 1000, user_id: user.id, foto: urlFoto, partite: 0 }])
    if (!error) { setNuovoNome(''); setFileFoto(null); prendiGiocatori(); }
    setInviando(false)
  }

  const salvaModifica = async (idRiga: any) => {
    setSalvataggioInCorso(true)
    let updateData: any = { Nome: editNome }
    if (editFotoFile) {
      const url = await uploadFotoHelper(editFotoFile)
      if (url) updateData.foto = url
    }
    await supabase.from('giocatori').update(updateData).eq('id', idRiga)
    setEditingId(null); setEditFotoFile(null); prendiGiocatori();
    setSalvataggioInCorso(false)
  }

  const registraRisultato = async (idRiga: any, punti: number, variaz: number) => {
    await supabase.from('giocatori').update({ Punti: punti + variaz }).eq('id', idRiga)
    prendiGiocatori()
  }

  // --- FUNZIONE: SALVA MATCH UFFICIALE (Aggiornata a +50) ---
  const salvaMatch = async () => {
    if (!vincitoreId || !sconfittoId || !risultatoMatch.trim()) return alert("Compila tutti i campi!")
    if (vincitoreId === sconfittoId) return alert("Un giocatore non può giocare contro se stesso!")
    
    setInviando(true)
    const vincitore = giocatori.find(g => g.id.toString() === vincitoreId)
    const sconfitto = giocatori.find(g => g.id.toString() === sconfittoId)

    // 1. Salva la partita nello storico
    const { error } = await supabase.from('partite').insert([{
      vincitore: vincitore.Nome,
      sconfitto: sconfitto.Nome,
      risultato: risultatoMatch
    }])

    if (!error) {
      // 2. Aggiorna i punti (+50 al vincitore, nessuno allo sconfitto)
      await supabase.from('giocatori').update({ Punti: vincitore.Punti + 50 }).eq('id', vincitore.id)
      
      // Resetta il form e ricarica i dati
      setVincitoreId('')
      setSconfittoId('')
      setRisultatoMatch('')
      setMostraFormPartita(false)
      prendiGiocatori()
      prendiPartite()
    } else {
      alert("Errore salvataggio partita: " + error.message)
    }
    setInviando(false)
  }

  return (
    <main className="min-h-screen bg-[#005bb7] text-white p-4 font-sans flex flex-col items-center overflow-x-hidden">
      <div className="fixed top-40 left-0 w-[150%] h-2 bg-white/10 -rotate-3 -translate-x-10 pointer-events-none z-0"></div>
      
      <div className="w-full max-w-md relative z-10">
        
        <div className="flex justify-end mb-4">
          {user ? (
            <button onClick={() => supabase.auth.signOut()} className="text-[10px] font-bold underline bg-blue-900/50 px-3 py-1 rounded-full">LOGOUT ({user.email})</button>
          ) : (
            <button onClick={() => setMostraLogin(!mostraLogin)} className="bg-yellow-300 text-blue-900 px-4 py-1 rounded-full text-[10px] font-black uppercase shadow-md transition-transform active:scale-95">
              {mostraLogin ? 'Annulla' : 'Login / Registrati'}
            </button>
          )}
        </div>

        <h1 className="text-6xl md:text-7xl font-black italic text-yellow-300 mb-8 text-center drop-shadow-xl tracking-tighter">padelg</h1>

        {/* LOGIN E CREAZIONE PROFILO */}
        {mostraLogin && !user && (
          <div className="bg-white p-6 rounded-[2rem] text-black mb-8 border-4 border-blue-900 shadow-2xl animate-in fade-in">
            <input type="email" placeholder="Email" value={email} onChange={e => setEmail(e.target.value)} className="w-full p-4 mb-2 bg-gray-100 rounded-xl font-bold outline-none" />
            <input type="password" placeholder="Password" value={password} onChange={e => setPassword(e.target.value)} className="w-full p-4 mb-4 bg-gray-100 rounded-xl font-bold outline-none" />
            <button onClick={() => handleAuth('LOGIN')} className="w-full bg-blue-600 text-white p-4 rounded-xl font-black uppercase shadow-md">Entra</button>
            <button onClick={() => handleAuth('SIGNUP')} className="w-full text-blue-600 text-[10px] font-bold uppercase underline text-center mt-4">Registrati</button>
          </div>
        )}

        {user && !giocatori.some(g => g.user_id === user.id) && (
          <div className="bg-yellow-300 p-6 rounded-[2rem] text-blue-900 mb-8 border-4 border-white shadow-xl animate-bounce-short">
            <input type="text" placeholder="Tuo Nome Ufficiale" value={nuovoNome} onChange={e => setNuovoNome(e.target.value)} className="w-full p-4 mb-3 rounded-xl font-bold outline-none shadow-inner" />
            <input type="file" accept="image/*" onChange={e => setFileFoto(e.target.files?.[0] || null)} className="text-[10px] mb-4 w-full" />
            <button onClick={creaProfiloGiocatore} disabled={inviando} className="w-full bg-blue-900 text-white p-4 rounded-xl font-black uppercase">Crea Profilo</button>
          </div>
        )}

        {/* TASTO NUOVO MATCH */}
        {user && giocatori.length > 1 && (
          <div className="mb-8">
            {!mostraFormPartita ? (
              <button onClick={() => setMostraFormPartita(true)} className="w-full bg-green-500 text-white p-4 rounded-2xl font-black uppercase text-sm shadow-[0_10px_0_rgb(22,163,74)] hover:translate-y-1 hover:shadow-[0_5px_0_rgb(22,163,74)] transition-all flex justify-center items-center gap-2">
                <span>🎾</span> Registra Nuovo Match
              </button>
            ) : (
              <div className="bg-white p-6 rounded-[2rem] text-black border-4 border-green-500 shadow-xl animate-in zoom-in duration-200">
                <div className="flex justify-between items-center mb-4">
                  <p className="font-black uppercase text-xs text-green-600 tracking-widest">Referto Partita</p>
                  <button onClick={() => setMostraFormPartita(false)} className="text-gray-400 font-bold text-[10px]">ANNULLA</button>
                </div>
                
                <select value={vincitoreId} onChange={e => setVincitoreId(e.target.value)} className="w-full p-3 mb-2 bg-green-50 rounded-xl font-bold outline-none border border-green-200 text-green-900">
                  <option value="">🏆 Seleziona Vincitore</option>
                  {giocatori.map(g => <option key={g.id} value={g.id}>{g.Nome}</option>)}
                </select>

                <select value={sconfittoId} onChange={e => setSconfittoId(e.target.value)} className="w-full p-3 mb-2 bg-red-50 rounded-xl font-bold outline-none border border-red-200 text-red-900">
                  <option value="">🥵 Seleziona Sconfitto</option>
                  {giocatori.map(g => <option key={g.id} value={g.id}>{g.Nome}</option>)}
                </select>

                <input type="text" placeholder="Risultato (es. 6-4, 6-2)" value={risultatoMatch} onChange={e => setRisultatoMatch(e.target.value)} className="w-full p-3 mb-4 bg-gray-100 rounded-xl font-bold outline-none text-center" />
                
                <button onClick={salvaMatch} disabled={inviando} className="w-full bg-green-500 text-white p-3 rounded-xl font-black uppercase disabled:opacity-50">
                  {inviando ? 'Salvataggio...' : 'Conferma Risultato'}
                </button>
                <p className="text-[8px] text-center text-gray-400 mt-2 font-bold uppercase">Il vincitore guadagnerà +50 punti in automatico</p>
              </div>
            )}
          </div>
        )}

        {/* RANKING ATLETI */}
        <div className="bg-white rounded-[2.5rem] shadow-2xl overflow-hidden text-black border-4 border-blue-900 mb-8">
          <div className="bg-gray-800 p-4 text-white text-center font-black uppercase text-[10px] tracking-widest italic">Ranking Atleti</div>
          <div className="divide-y divide-gray-100">
            {giocatori.map((g, index) => (
              <div key={g.id} className="p-3 flex justify-between items-center hover:bg-blue-50 transition-colors">
                <div className="flex items-center gap-2 flex-1 min-w-0">
                  <span className={`text-lg font-black w-6 ${index === 0 ? 'text-yellow-500' : 'text-blue-200'}`}>{index + 1}°</span>
                  {g.foto ? <img src={g.foto} className="w-10 h-10 rounded-full object-cover border-2 border-blue-600 shrink-0" /> : <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-300 font-black shrink-0">?</div>}
                  
                  <div className="flex flex-col min-w-0 flex-1">
                    {editingId === g.id ? (
                      <div className="flex flex-col gap-1 p-1">
                        <input value={editNome} onChange={(e) => setEditNome(e.target.value)} className="border-2 border-blue-400 p-1 rounded font-bold text-xs uppercase" />
                        <input type="file" accept="image/*" onChange={(e) => setEditFotoFile(e.target.files?.[0] || null)} className="text-[9px]" />
                        <div className="flex gap-1">
                          <button onClick={() => salvaModifica(g.id)} className="bg-green-500 text-white text-[9px] px-2 py-1 rounded font-black">OK</button>
                          <button onClick={() => setEditingId(null)} className="bg-gray-200 text-gray-500 text-[9px] px-2 py-1 rounded font-black">X</button>
                        </div>
                      </div>
                    ) : (
                      <div className="flex items-center gap-1 flex-wrap">
                        <span className="font-extrabold text-sm uppercase text-blue-900 truncate">{g.Nome}</span>
                        {user && g.user_id === user.id && (
                          <button onClick={() => { setEditingId(g.id); setEditNome(g.Nome); }} className="text-[8px] bg-yellow-300 text-blue-900 px-2 py-0.5 rounded-full font-black uppercase">Tu ✏️</button>
                        )}
                      </div>
                    )}
                  </div>
                </div>
                
                {/* TASTINI MANUALI (+50 E -50) */}
                {editingId !== g.id && (
                  <div className="flex items-center gap-1 shrink-0">
                    <button onClick={() => registraRisultato(g.id, g.Punti, -50)} className="w-6 h-6 bg-slate-100 rounded-md font-black text-xs text-gray-400 hover:bg-red-500 hover:text-white transition-all">-</button>
                    <button onClick={() => registraRisultato(g.id, g.Punti, 50)} className="w-6 h-6 bg-blue-100 text-blue-600 rounded-md font-black text-xs hover:bg-blue-600 hover:text-white transition-all">+</button>
                    <div className="bg-blue-50 p-1 rounded-xl min-w-[45px] text-center border border-blue-100">
                      <span className="text-base font-black text-blue-700 leading-none">{g.Punti}</span>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* STORICO MATCH (FEED) */}
        {partite.length > 0 && (
          <div className="bg-white rounded-3xl shadow-xl overflow-hidden text-black mb-10 opacity-90">
             <div className="bg-blue-900 p-3 text-white text-center font-black uppercase text-[10px] tracking-widest">Ultime Partite</div>
             <div className="p-4 flex flex-col gap-3 bg-gray-50">
               {partite.map(p => (
                 <div key={p.id} className="bg-white border border-gray-100 p-3 rounded-2xl shadow-sm flex flex-col gap-2">
                   <div className="flex justify-between items-center text-xs font-black uppercase">
                     <span className="text-green-600 truncate w-1/3 text-right">🏆 {p.vincitore}</span>
                     <span className="text-gray-300 px-2">VS</span>
                     <span className="text-red-500 truncate w-1/3 text-left">{p.sconfitto} 🥵</span>
                   </div>
                   <div className="text-center font-black text-sm bg-gray-100 rounded-lg py-1 border border-gray-200">
                     {p.risultato}
                   </div>
                 </div>
               ))}
             </div>
          </div>
        )}

      </div>
    </main>
  )
}
