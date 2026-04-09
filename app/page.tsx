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

  const [editingId, setEditingId] = useState<any>(null)
  const [editNome, setEditNome] = useState('')
  const [editFotoFile, setEditFotoFile] = useState<File | null>(null)
  const [salvataggioInCorso, setSalvataggioInCorso] = useState(false)

  const [mostraFormPartita, setMostraFormPartita] = useState(false)
  const [vincitore1Id, setVincitore1Id] = useState('')
  const [vincitore2Id, setVincitore2Id] = useState('')
  const [sconfitto1Id, setSconfitto1Id] = useState('')
  const [sconfitto2Id, setSconfitto2Id] = useState('')
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
    const { error } = await supabase.from('giocatori').insert([{ 
      Nome: nuovoNome, 
      Punti: 0, 
      user_id: user.id, 
      foto: urlFoto, 
      partite: 0,
      vinte: 0,
      perse: 0 
    }])
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

  const salvaMatch = async () => {
    if (!vincitore1Id || !vincitore2Id || !sconfitto1Id || !sconfitto2Id || !risultatoMatch.trim()) {
      return alert("Compila tutti i campi!")
    }
    
    const giocatoriSelezionati = new Set([vincitore1Id, vincitore2Id, sconfitto1Id, sconfitto2Id])
    if (giocatoriSelezionati.size !== 4) {
      return alert("Hai selezionato lo stesso giocatore più di una volta!")
    }
    
    setInviando(true)
    const v1 = giocatori.find(g => g.id.toString() === vincitore1Id)
    const v2 = giocatori.find(g => g.id.toString() === vincitore2Id)
    const s1 = giocatori.find(g => g.id.toString() === sconfitto1Id)
    const s2 = giocatori.find(g => g.id.toString() === sconfitto2Id)

    const nomeVincitori = `${v1.Nome} & ${v2.Nome}`
    const nomeSconfitti = `${s1.Nome} & ${s2.Nome}`

    const { error } = await supabase.from('partite').insert([{
      vincitore: nomeVincitori,
      sconfitto: nomeSconfitti,
      risultato: risultatoMatch
    }])

    if (!error) {
      // AGGIORNAMENTO STATISTICHE E PUNTI
      await supabase.from('giocatori').update({ 
        Punti: v1.Punti + 50, 
        partite: (v1.partite || 0) + 1, 
        vinte: (v1.vinte || 0) + 1 
      }).eq('id', v1.id)
      
      await supabase.from('giocatori').update({ 
        Punti: v2.Punti + 50, 
        partite: (v2.partite || 0) + 1, 
        vinte: (v2.vinte || 0) + 1 
      }).eq('id', v2.id)

      await supabase.from('giocatori').update({ 
        partite: (s1.partite || 0) + 1, 
        perse: (s1.perse || 0) + 1 
      }).eq('id', s1.id)
      
      await supabase.from('giocatori').update({ 
        partite: (s2.partite || 0) + 1, 
        perse: (s2.perse || 0) + 1 
      }).eq('id', s2.id)
      
      setVincitore1Id('')
      setVincitore2Id('')
      setSconfitto1Id('')
      setSconfitto2Id('')
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
    <main className="min-h-screen bg-[#005bb7] text-white p-4 sm:p-8 font-sans flex flex-col items-center overflow-x-hidden relative">
      <div className="fixed inset-0 pointer-events-none z-0 flex justify-center items-center overflow-hidden opacity-20">
        <div className="relative w-[200vw] h-[150vh] sm:w-[120vw] sm:h-[120vh] border-[6px] border-white -rotate-12 scale-110">
          <div className="absolute top-1/2 left-0 w-full h-[6px] bg-white -translate-y-1/2"></div>
          <div className="absolute top-[25%] left-0 w-full h-[6px] bg-white"></div>
          <div className="absolute top-[75%] left-0 w-full h-[6px] bg-white"></div>
          <div className="absolute top-[25%] left-1/2 w-[6px] h-[50%] bg-white -translate-x-1/2"></div>
        </div>
      </div>
      
      <div className="w-full max-w-lg relative z-10">
        
        <div className="flex justify-end mb-6">
          {user ? (
            <button onClick={() => supabase.auth.signOut()} className="text-[11px] font-bold text-blue-200 hover:text-white transition-colors bg-blue-900/60 px-4 py-2 rounded-full backdrop-blur-sm border border-blue-800/50">
              LOGOUT ({user.email})
            </button>
          ) : (
            <button onClick={() => setMostraLogin(!mostraLogin)} className="bg-yellow-400 text-blue-900 px-5 py-2.5 rounded-full text-xs font-black uppercase shadow-[0_4px_14px_0_rgba(250,204,21,0.39)] hover:shadow-[0_6px_20px_rgba(250,204,21,0.23)] hover:bg-yellow-300 transition-all active:scale-95">
              {mostraLogin ? 'Annulla' : 'Entra in Campo'}
            </button>
          )}
        </div>

        <div className="text-center mb-10">
          <h1 className="text-6xl md:text-8xl font-black italic text-yellow-400 drop-shadow-[0_5px_5px_rgba(0,0,0,0.3)] tracking-tighter">padelg<span className="text-white text-4xl">.</span></h1>
          <p className="text-blue-100 text-sm md:text-base font-bold tracking-widest uppercase mt-2 opacity-90 drop-shadow-md">Official Ranking</p>
        </div>

        {mostraLogin && !user && (
          <div className="bg-white p-8 rounded-3xl text-black mb-10 shadow-2xl animate-in fade-in zoom-in duration-300 border border-gray-100">
            <h2 className="text-2xl font-black text-blue-900 mb-6 text-center tracking-tight">Accedi o Registrati</h2>
            <input type="email" placeholder="La tua Email" value={email} onChange={e => setEmail(e.target.value)} className="w-full p-4 mb-3 bg-gray-50 rounded-2xl font-semibold outline-none focus:ring-2 focus:ring-blue-500 transition-all border border-gray-200" />
            <input type="password" placeholder="Password (min. 6 caratteri)" value={password} onChange={e => setPassword(e.target.value)} className="w-full p-4 mb-6 bg-gray-50 rounded-2xl font-semibold outline-none focus:ring-2 focus:ring-blue-500 transition-all border border-gray-200" />
            <div className="flex flex-col gap-3">
              <button onClick={() => handleAuth('LOGIN')} className="w-full bg-blue-600 text-white p-4 rounded-2xl font-black uppercase text-sm shadow-lg hover:bg-blue-700 transition-all active:scale-95">Accedi</button>
              <button onClick={() => handleAuth('SIGNUP')} className="w-full bg-blue-50 text-blue-700 p-4 rounded-2xl font-black uppercase text-sm hover:bg-blue-100 transition-all active:scale-95">Crea un nuovo account</button>
            </div>
          </div>
        )}

        {user && !giocatori.some(g => g.user_id === user.id) && (
          <div className="bg-gradient-to-br from-yellow-300 to-yellow-500 p-8 rounded-3xl text-blue-900 mb-10 shadow-2xl animate-in slide-in-from-bottom-4">
            <h2 className="text-xl font-black uppercase mb-4 text-center tracking-widest">Crea il tuo profilo</h2>
            <input type="text" placeholder="Nome e Cognome Ufficiale" value={nuovoNome} onChange={e => setNuovoNome(e.target.value)} className="w-full p-4 mb-4 rounded-2xl font-black outline-none shadow-inner text-blue-900 placeholder:text-blue-900/40" />
            <div className="bg-white/30 p-4 rounded-2xl mb-6 backdrop-blur-sm border border-white/40">
              <p className="text-xs font-bold uppercase mb-2">Foto Profilo (Consigliata)</p>
              <input type="file" accept="image/*" onChange={e => setFileFoto(e.target.files?.[0] || null)} className="text-xs w-full font-semibold file:bg-blue-900 file:text-white file:border-none file:px-4 file:py-2 file:rounded-xl file:font-bold file:mr-3 cursor-pointer" />
            </div>
            <button onClick={creaProfiloGiocatore} disabled={inviando} className="w-full bg-blue-900 text-white p-4 rounded-2xl font-black uppercase text-sm shadow-xl hover:shadow-2xl transition-all active:scale-95 disabled:opacity-50">
              {inviando ? 'Creazione in corso...' : 'Scendi in Campo'}
            </button>
          </div>
        )}

        {user && giocatori.length > 3 && (
          <div className="mb-10">
            {!mostraFormPartita ? (
              <button onClick={() => setMostraFormPartita(true)} className="w-full bg-yellow-400 text-blue-900 p-5 rounded-3xl font-black uppercase text-sm shadow-xl hover:-translate-y-1 hover:shadow-2xl transition-all flex justify-center items-center gap-3 border-2 border-yellow-300">
                <span className="text-2xl">🎾</span> Registra Nuovo Match
              </button>
            ) : (
              <div className="bg-white p-8 rounded-3xl text-black border border-gray-100 shadow-2xl animate-in zoom-in-95 duration-200">
                <div className="flex justify-between items-center mb-6">
                  <h3 className="font-black uppercase text-sm text-blue-900 tracking-widest">Referto Ufficiale</h3>
                  <button onClick={() => setMostraFormPartita(false)} className="bg-gray-100 hover:bg-gray-200 text-gray-500 px-3 py-1 rounded-full font-bold text-xs transition-colors">ANNULLA</button>
                </div>
                
                <div className="space-y-4 mb-6">
                  <div className="bg-blue-50 p-4 rounded-2xl border border-blue-100">
                    <span className="text-xs font-black uppercase text-blue-800 mb-2 block">🏆 Squadra Vincente</span>
                    <div className="flex flex-col gap-2">
                      <select value={vincitore1Id} onChange={e => setVincitore1Id(e.target.value)} className="w-full p-3 bg-white rounded-xl font-bold outline-none border border-blue-200 focus:border-blue-500 text-blue-900 transition-all appearance-none cursor-pointer text-sm">
                        <option value="">Giocatore 1</option>
                        {giocatori.map(g => <option key={g.id} value={g.id}>{g.Nome}</option>)}
                      </select>
                      <select value={vincitore2Id} onChange={e => setVincitore2Id(e.target.value)} className="w-full p-3 bg-white rounded-xl font-bold outline-none border border-blue-200 focus:border-blue-500 text-blue-900 transition-all appearance-none cursor-pointer text-sm">
                        <option value="">Giocatore 2</option>
                        {giocatori.map(g => <option key={g.id} value={g.id}>{g.Nome}</option>)}
                      </select>
                    </div>
                  </div>

                  <div className="bg-gray-50 p-4 rounded-2xl border border-gray-200">
                    <span className="text-xs font-black uppercase text-gray-500 mb-2 block">🥵 Squadra Sconfitta</span>
                    <div className="flex flex-col gap-2">
                      <select value={sconfitto1Id} onChange={e => setSconfitto1Id(e.target.value)} className="w-full p-3 bg-white rounded-xl font-bold outline-none border border-gray-200 focus:border-gray-400 text-gray-600 transition-all appearance-none cursor-pointer text-sm">
                        <option value="">Giocatore 1</option>
                        {giocatori.map(g => <option key={g.id} value={g.id}>{g.Nome}</option>)}
                      </select>
                      <select value={sconfitto2Id} onChange={e => setSconfitto2Id(e.target.value)} className="w-full p-3 bg-white rounded-xl font-bold outline-none border border-gray-200 focus:border-gray-400 text-gray-600 transition-all appearance-none cursor-pointer text-sm">
                        <option value="">Giocatore 2</option>
                        {giocatori.map(g => <option key={g.id} value={g.id}>{g.Nome}</option>)}
                      </select>
                    </div>
                  </div>

                  <input type="text" placeholder="Risultato (es. 6-4, 6-2)" value={risultatoMatch} onChange={e => setRisultatoMatch(e.target.value)} className="w-full p-4 bg-gray-50 rounded-2xl font-bold outline-none text-center focus:ring-2 focus:ring-blue-500 border border-gray-200 transition-all" />
                </div>
                
                <button onClick={salvaMatch} disabled={inviando} className="w-full bg-blue-600 hover:bg-blue-700 text-white p-4 rounded-2xl font-black uppercase shadow-lg transition-all active:scale-95 disabled:opacity-50 flex items-center justify-center gap-2">
                  {inviando ? 'Salvataggio in corso...' : 'Conferma Referto'}
                </button>
              </div>
            )}
          </div>
        )}

        {/* RANKING ATLETI */}
        <div className="mb-12">
          <div className="flex items-center gap-4 mb-6 px-2">
            <h2 className="text-2xl font-black italic text-yellow-400 tracking-tight drop-shadow-md">Leaderboard</h2>
            <div className="h-1 flex-1 bg-gradient-to-r from-yellow-400 to-transparent rounded-full opacity-80"></div>
          </div>
          
          <div className="flex flex-col gap-4">
            {giocatori.map((g, index) => (
              <div key={g.id} className="bg-white p-4 sm:p-5 rounded-3xl shadow-xl hover:shadow-2xl hover:-translate-y-1 transition-all duration-300 flex justify-between items-center group border border-blue-50">
                <div className="flex items-center gap-3 sm:gap-4 flex-1 min-w-0">
                  <div className={`w-10 h-10 sm:w-12 sm:h-12 shrink-0 flex items-center justify-center rounded-2xl font-black text-lg sm:text-xl shadow-inner ${index === 0 ? 'bg-gradient-to-br from-yellow-300 to-yellow-500 text-blue-900 ring-4 ring-yellow-400/40' : index === 1 ? 'bg-gray-200 text-gray-600' : index === 2 ? 'bg-orange-200 text-orange-800' : 'bg-blue-50 text-blue-300'}`}>
                    {index + 1}
                  </div>
                  
                  {g.foto ? (
                    <img src={g.foto} className="w-14 h-14 sm:w-16 sm:h-16 rounded-full object-cover border-4 border-white shadow-md shrink-0" alt="Avatar" />
                  ) : (
                    <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-full bg-gradient-to-br from-blue-100 to-blue-200 flex items-center justify-center text-blue-400 font-black text-2xl border-4 border-white shadow-md shrink-0">?</div>
                  )}
                  
                  <div className="flex flex-col min-w-0 flex-1">
                    {editingId === g.id ? (
                      <div className="flex flex-col gap-2 p-2 bg-blue-50 rounded-2xl border border-blue-100 mr-2">
                        <input value={editNome} onChange={(e) => setEditNome(e.target.value)} className="p-2 rounded-xl font-bold text-sm uppercase outline-none text-blue-900 border border-blue-200 focus:border-blue-500" placeholder="Nome" />
                        <input type="file" accept="image/*" onChange={(e) => setEditFotoFile(e.target.files?.[0] || null)} className="text-[10px] text-blue-700 file:bg-blue-600 file:text-white file:border-none file:px-3 file:py-1 file:rounded-lg file:font-bold" />
                        <div className="flex gap-2 mt-1">
                          <button onClick={() => salvaModifica(g.id)} className="flex-1 bg-green-500 text-white text-xs py-2 rounded-xl font-black shadow-md">SALVA</button>
                          <button onClick={() => setEditingId(null)} className="flex-1 bg-gray-200 text-gray-600 text-xs py-2 rounded-xl font-black">ANNULLA</button>
                        </div>
                      </div>
                    ) : (
                      <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-2 flex-wrap">
                        <span className="font-extrabold text-base sm:text-xl uppercase text-blue-900 break-words tracking-tight">{g.Nome}</span>
                        {user && g.user_id === user.id && (
                          <button onClick={() => { setEditingId(g.id); setEditNome(g.Nome); }} className="text-[9px] bg-yellow-400 text-blue-900 px-3 py-1 rounded-full font-black uppercase shadow-sm hover:scale-105 transition-transform inline-flex items-center gap-1 w-max">
                            Tu ✏️
                          </button>
                        )}
                        
                        {/* NUOVE STATISTICHE SOTTO IL NOME */}
                        <div className="w-full flex gap-3 text-[11px] sm:text-xs font-bold mt-0.5">
                          <span className="text-blue-400/80">Match: {g.partite || 0}</span>
                          <span className="text-green-500/90">Vinte: {g.vinte || 0}</span>
                          <span className="text-red-400/80">Perse: {g.perse || 0}</span>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
                
                <div className="flex items-center gap-1 sm:gap-2 shrink-0">
                  <div className="bg-blue-600 p-2 sm:p-3 rounded-2xl min-w-[70px] sm:min-w-[80px] text-center shadow-lg transform group-hover:scale-105 transition-transform">
                    <span className="text-xl sm:text-2xl font-black text-white leading-none tracking-tight">{g.Punti}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* STORICO MATCH */}
        {partite.length > 0 && (
          <div className="mb-10">
             <div className="flex items-center gap-4 mb-6 px-2">
               <h2 className="text-xl font-black text-blue-100 tracking-tight uppercase drop-shadow-md">Ultime Sfide</h2>
               <div className="h-px flex-1 bg-white/30"></div>
             </div>
             
             <div className="flex flex-col gap-4">
               {partite.map(p => (
                 <div key={p.id} className="bg-white/15 backdrop-blur-md border border-white/20 p-5 rounded-3xl shadow-xl flex flex-col gap-3 hover:bg-white/20 transition-colors">
                   <div className="flex justify-between items-center text-sm font-black uppercase tracking-tight">
                     <div className="flex flex-col w-[42%]">
                       <span className="text-yellow-400 text-[10px] mb-1">Vincitori 🏆</span>
                       <span className="text-white break-words drop-shadow-md leading-tight">{p.vincitore}</span>
                     </div>
                     <div className="w-[16%] text-center">
                       <span className="bg-blue-900/80 text-blue-200 px-2 py-1.5 rounded-xl text-[10px] shadow-inner">VS</span>
                     </div>
                     <div className="flex flex-col w-[42%] text-right">
                       <span className="text-white/60 text-[10px] mb-1">Sconfitti</span>
                       <span className="text-blue-100 break-words drop-shadow-md leading-tight">{p.sconfitto}</span>
                     </div>
                   </div>
                   <div className="mt-2 text-center bg-blue-900/60 rounded-2xl py-2 font-black text-base text-yellow-400 border border-blue-800/50 shadow-inner backdrop-blur-sm">
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
