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
  const [campoMatch, setCampoMatch] = useState('')
  const [noteMatch, setNoteMatch] = useState('')
  const [fotoMatch, setFotoMatch] = useState<File | null>(null)

  const [mioGiocatoreId, setMioGiocatoreId] = useState<string | null>(null)
  const [profiloAperto, setProfiloAperto] = useState<any>(null)

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => setUser(session?.user ?? null))
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => setUser(session?.user ?? null))
    prendiGiocatori()
    prendiPartite()
    return () => subscription.unsubscribe()
  }, [])

  useEffect(() => {
    if (user && giocatori.length > 0) {
      const io = giocatori.find(g => g.user_id === user.id)
      if (io) setMioGiocatoreId(io.id.toString())
    } else {
      setMioGiocatoreId(null)
    }
  }, [user, giocatori])

  const prendiGiocatori = async () => {
    const { data } = await supabase.from('giocatori').select('*').order('Punti', { ascending: false })
    if (data) setGiocatori(data)
  }

  const prendiPartite = async () => {
    const { data } = await supabase.from('partite').select('*').order('created_at', { ascending: false }).limit(100)
    if (data) setPartite(data)
  }

  const handleAuth = async (type: 'LOGIN' | 'SIGNUP') => {
    const { error } = type === 'LOGIN' 
      ? await supabase.auth.signInWithPassword({ email, password })
      : await supabase.auth.signUp({ email, password })
    if (error) alert(error.message)
    else setMostraLogin(false)
  }

  const uploadFotoHelper = async (file: File, bucket = 'foto_giocatori') => {
    const nomeFile = `${Date.now()}_${user?.id || 'guest'}_foto`
    const { error: upErr } = await supabase.storage.from(bucket).upload(nomeFile, file)
    if (!upErr) {
      const { data: pub } = supabase.storage.from(bucket).getPublicUrl(nomeFile)
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
      Nome: nuovoNome, Punti: 0, user_id: user.id, foto: urlFoto, partite: 0, vinte: 0, perse: 0 
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
      return alert("Compila tutti i giocatori e il risultato del set!")
    }
    
    const giocatoriSelezionati = new Set([vincitore1Id, vincitore2Id, sconfitto1Id, sconfitto2Id])
    if (giocatoriSelezionati.size !== 4) return alert("Hai selezionato lo stesso giocatore più di una volta!")
    
    setInviando(true)
    const v1 = giocatori.find(g => g.id.toString() === vincitore1Id)
    const v2 = giocatori.find(g => g.id.toString() === vincitore2Id)
    const s1 = giocatori.find(g => g.id.toString() === sconfitto1Id)
    const s2 = giocatori.find(g => g.id.toString() === sconfitto2Id)

    const nomeVincitori = `${v1.Nome} & ${v2.Nome}`
    const nomeSconfitti = `${s1.Nome} & ${s2.Nome}`

    let urlFotoMatch = ""
    if (fotoMatch) {
      const url = await uploadFotoHelper(fotoMatch)
      if (url) urlFotoMatch = url
    }

    const { error } = await supabase.from('partite').insert([{
      vincitore: nomeVincitori,
      sconfitto: nomeSconfitti,
      risultato: risultatoMatch,
      v1_id: v1.id.toString(), v2_id: v2.id.toString(),
      s1_id: s1.id.toString(), s2_id: s2.id.toString(),
      campo: campoMatch, note: noteMatch, foto: urlFotoMatch,
      stato: 'In attesa'
    }])

    if (!error) {
      setVincitore1Id(''); setVincitore2Id(''); setSconfitto1Id(''); setSconfitto2Id('');
      setRisultatoMatch(''); setCampoMatch(''); setNoteMatch(''); setFotoMatch(null);
      setMostraFormPartita(false); prendiPartite();
      alert("Referto inviato! In attesa di conferma dagli altri giocatori.")
    } else alert("Errore salvataggio: " + error.message)
    setInviando(false)
  }

  const confermaMatch = async (match: any) => {
    if (!confirm("Confermi questo risultato? I punti verranno assegnati ufficialmente.")) return;
    await supabase.from('partite').update({ stato: 'Confermato' }).eq('id', match.id)

    const v1 = giocatori.find(g => g.id.toString() === match.v1_id)
    const v2 = giocatori.find(g => g.id.toString() === match.v2_id)
    const s1 = giocatori.find(g => g.id.toString() === match.s1_id)
    const s2 = giocatori.find(g => g.id.toString() === match.s2_id)

    if(v1) await supabase.from('giocatori').update({ Punti: v1.Punti + 50, partite: (v1.partite||0)+1, vinte: (v1.vinte||0)+1 }).eq('id', v1.id)
    if(v2) await supabase.from('giocatori').update({ Punti: v2.Punti + 50, partite: (v2.partite||0)+1, vinte: (v2.vinte||0)+1 }).eq('id', v2.id)
    if(s1) await supabase.from('giocatori').update({ partite: (s1.partite||0)+1, perse: (s1.perse||0)+1 }).eq('id', s1.id)
    if(s2) await supabase.from('giocatori').update({ partite: (s2.partite||0)+1, perse: (s2.perse||0)+1 }).eq('id', s2.id)

    prendiGiocatori(); prendiPartite();
  }

  const contestaMatch = async (matchId: any) => {
    const motivo = prompt("Scrivi il motivo della contestazione:")
    if (!motivo) return;
    await supabase.from('partite').update({ stato: `Contestato: ${motivo}` }).eq('id', matchId)
    prendiPartite()
  }

  // NUOVA FUNZIONE: ELIMINA MATCH CONTESTATO
  const eliminaMatch = async (matchId: any) => {
    if (!confirm("Sei sicuro di voler eliminare definitivamente questo referto contestato? L'azione è irreversibile.")) return;
    const { error } = await supabase.from('partite').delete().eq('id', matchId)
    if (!error) {
      prendiPartite();
    } else {
      alert("Errore durante l'eliminazione: " + error.message)
    }
  }

  const calcolaWinRate = (vinte: number, giocate: number) => {
    if (!giocate || giocate === 0) return 0;
    return Math.round((vinte / giocate) * 100);
  }

  const calcolaStatisticheAvanzate = (giocatoreId: string) => {
    const partiteGiocatore = partite.filter(p => 
      p.stato === 'Confermato' && 
      (p.v1_id === giocatoreId || p.v2_id === giocatoreId || p.s1_id === giocatoreId || p.s2_id === giocatoreId)
    );

    const partnerCount: Record<string, { nome: string, insieme: number, vinteInsieme: number }> = {};

    partiteGiocatore.forEach(p => {
      const haVinto = p.v1_id === giocatoreId || p.v2_id === giocatoreId;
      let partnerId = null;
      if (p.v1_id === giocatoreId) partnerId = p.v2_id;
      else if (p.v2_id === giocatoreId) partnerId = p.v1_id;
      else if (p.s1_id === giocatoreId) partnerId = p.s2_id;
      else if (p.s2_id === giocatoreId) partnerId = p.s1_id;

      if (partnerId) {
        const partner = giocatori.find(g => g.id.toString() === partnerId);
        if (partner) {
          if (!partnerCount[partnerId]) partnerCount[partnerId] = { nome: partner.Nome, insieme: 0, vinteInsieme: 0 };
          partnerCount[partnerId].insieme += 1;
          if (haVinto) partnerCount[partnerId].vinteInsieme += 1;
        }
      }
    });

    const partnerPreferiti = Object.values(partnerCount).sort((a, b) => b.insieme - a.insieme).slice(0, 3);
    return { partiteGiocatore, partnerPreferiti };
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
        
        {/* HEADER & LOGIN */}
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

        {/* BOX LOGIN & REGISTRAZIONE */}
        {mostraLogin && !user && (
          <div className="bg-white p-8 rounded-3xl text-black mb-10 shadow-2xl">
            <h2 className="text-2xl font-black text-blue-900 mb-6 text-center">Accedi o Registrati</h2>
            <input type="email" placeholder="La tua Email" value={email} onChange={e => setEmail(e.target.value)} className="w-full p-4 mb-3 bg-gray-50 rounded-2xl font-semibold outline-none border border-gray-200" />
            <input type="password" placeholder="Password (min. 6 caratteri)" value={password} onChange={e => setPassword(e.target.value)} className="w-full p-4 mb-6 bg-gray-50 rounded-2xl font-semibold outline-none border border-gray-200" />
            <div className="flex flex-col gap-3">
              <button onClick={() => handleAuth('LOGIN')} className="w-full bg-blue-600 text-white p-4 rounded-2xl font-black uppercase text-sm shadow-lg">Accedi</button>
              <button onClick={() => handleAuth('SIGNUP')} className="w-full bg-blue-50 text-blue-700 p-4 rounded-2xl font-black uppercase text-sm">Crea un nuovo account</button>
            </div>
          </div>
        )}

        {user && !giocatori.some(g => g.user_id === user.id) && (
          <div className="bg-gradient-to-br from-yellow-300 to-yellow-500 p-8 rounded-3xl text-blue-900 mb-10 shadow-2xl">
            <h2 className="text-xl font-black uppercase mb-4 text-center tracking-widest">Crea il tuo profilo</h2>
            <input type="text" placeholder="Nome e Cognome" value={nuovoNome} onChange={e => setNuovoNome(e.target.value)} className="w-full p-4 mb-4 rounded-2xl font-black outline-none shadow-inner" />
            <button onClick={creaProfiloGiocatore} disabled={inviando} className="w-full bg-blue-900 text-white p-4 rounded-2xl font-black uppercase text-sm shadow-xl hover:shadow-2xl disabled:opacity-50">
              {inviando ? 'Creazione in corso...' : 'Scendi in Campo'}
            </button>
          </div>
        )}

        {/* FORM NUOVO MATCH AVANZATO */}
        {user && giocatori.length > 3 && (
          <div className="mb-10">
            {!mostraFormPartita ? (
              <button onClick={() => setMostraFormPartita(true)} className="w-full bg-yellow-400 text-blue-900 p-5 rounded-3xl font-black uppercase text-sm shadow-xl hover:-translate-y-1 hover:shadow-2xl transition-all flex justify-center items-center gap-3">
                <span className="text-2xl">🎾</span> Registra Match
              </button>
            ) : (
              <div className="bg-white p-6 sm:p-8 rounded-3xl text-black border border-gray-100 shadow-2xl">
                <div className="flex justify-between items-center mb-6">
                  <h3 className="font-black uppercase text-sm text-blue-900 tracking-widest">Referto Ufficiale</h3>
                  <button onClick={() => setMostraFormPartita(false)} className="bg-gray-100 hover:bg-gray-200 text-gray-500 px-3 py-1 rounded-full font-bold text-xs">ANNULLA</button>
                </div>
                
                <div className="space-y-4 mb-6">
                  <div className="bg-blue-50 p-4 rounded-2xl border border-blue-100">
                    <span className="text-xs font-black uppercase text-blue-800 mb-2 block">🏆 Squadra Vincente</span>
                    <div className="flex gap-2">
                      <select value={vincitore1Id} onChange={e => setVincitore1Id(e.target.value)} className="w-1/2 p-3 bg-white rounded-xl font-bold text-sm outline-none border border-blue-200 text-blue-900 cursor-pointer">
                        <option value="">Gioc. 1</option>
                        {giocatori.map(g => <option key={g.id} value={g.id}>{g.Nome}</option>)}
                      </select>
                      <select value={vincitore2Id} onChange={e => setVincitore2Id(e.target.value)} className="w-1/2 p-3 bg-white rounded-xl font-bold text-sm outline-none border border-blue-200 text-blue-900 cursor-pointer">
                        <option value="">Gioc. 2</option>
                        {giocatori.map(g => <option key={g.id} value={g.id}>{g.Nome}</option>)}
                      </select>
                    </div>
                  </div>

                  <div className="bg-gray-50 p-4 rounded-2xl border border-gray-200">
                    <span className="text-xs font-black uppercase text-gray-500 mb-2 block">🥵 Squadra Sconfitta</span>
                    <div className="flex gap-2">
                      <select value={sconfitto1Id} onChange={e => setSconfitto1Id(e.target.value)} className="w-1/2 p-3 bg-white rounded-xl font-bold text-sm outline-none border border-gray-200 text-gray-600 cursor-pointer">
                        <option value="">Gioc. 1</option>
                        {giocatori.map(g => <option key={g.id} value={g.id}>{g.Nome}</option>)}
                      </select>
                      <select value={sconfitto2Id} onChange={e => setSconfitto2Id(e.target.value)} className="w-1/2 p-3 bg-white rounded-xl font-bold text-sm outline-none border border-gray-200 text-gray-600 cursor-pointer">
                        <option value="">Gioc. 2</option>
                        {giocatori.map(g => <option key={g.id} value={g.id}>{g.Nome}</option>)}
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <input type="text" placeholder="Risultato Set (es. 6-4, 7-5)" value={risultatoMatch} onChange={e => setRisultatoMatch(e.target.value)} className="col-span-2 p-4 bg-gray-50 rounded-2xl font-bold outline-none text-center border border-gray-200" />
                    <input type="text" placeholder="Circolo / Campo" value={campoMatch} onChange={e => setCampoMatch(e.target.value)} className="p-4 bg-gray-50 rounded-2xl font-bold text-sm outline-none border border-gray-200" />
                    <input type="file" accept="image/*" onChange={e => setFotoMatch(e.target.files?.[0] || null)} className="p-3 bg-gray-50 rounded-2xl text-[10px] font-semibold file:bg-blue-600 file:text-white file:border-none file:px-3 file:py-1.5 file:rounded-lg border border-gray-200 cursor-pointer" title="Foto referto" />
                    <textarea placeholder="Note o commenti..." value={noteMatch} onChange={e => setNoteMatch(e.target.value)} className="col-span-2 p-4 bg-gray-50 rounded-2xl font-medium text-sm outline-none border border-gray-200 min-h-[80px]" />
                  </div>
                </div>
                
                <button onClick={salvaMatch} disabled={inviando} className="w-full bg-blue-600 text-white p-4 rounded-2xl font-black uppercase shadow-lg disabled:opacity-50 flex items-center justify-center gap-2">
                  {inviando ? 'Invio in corso...' : 'Invia per Conferma'}
                </button>
              </div>
            )}
          </div>
        )}

        {/* RANKING ATLETI */}
        <div className="mb-12">
          <div className="flex items-center gap-4 mb-6 px-2">
            <h2 className="text-2xl font-black italic text-yellow-400">Leaderboard</h2>
            <div className="h-1 flex-1 bg-gradient-to-r from-yellow-400 to-transparent rounded-full opacity-80"></div>
          </div>
          
          <div className="flex flex-col gap-4">
            {giocatori.map((g, index) => (
              <div key={g.id} onClick={() => setProfiloAperto({...g, posizione: index + 1})} className="bg-white p-4 sm:p-5 rounded-3xl shadow-xl hover:shadow-2xl hover:-translate-y-1 transition-all duration-300 flex justify-between items-center group border border-blue-50 cursor-pointer">
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
                    <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-2 flex-wrap">
                      <span className="font-extrabold text-base sm:text-xl uppercase text-blue-900 break-words tracking-tight">{g.Nome}</span>
                      <div className="w-full flex gap-3 text-[11px] sm:text-xs font-bold mt-0.5">
                        <span className="text-blue-400/80">WR: {calcolaWinRate(g.vinte, g.partite)}%</span>
                        <span className="text-green-500/90">V: {g.vinte || 0}</span>
                      </div>
                    </div>
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

        {/* FEED STORICO MATCH */}
        {partite.length > 0 && (
          <div className="mb-10">
             <div className="flex items-center gap-4 mb-6 px-2">
               <h2 className="text-xl font-black text-blue-100 tracking-tight uppercase">Ultime Sfide</h2>
               <div className="h-px flex-1 bg-white/30"></div>
             </div>
             
             <div className="flex flex-col gap-5">
               {partite.map(p => {
                 const sonoCoinvolto = mioGiocatoreId && (p.s1_id === mioGiocatoreId || p.s2_id === mioGiocatoreId || p.v1_id === mioGiocatoreId || p.v2_id === mioGiocatoreId);
                 const inAttesa = p.stato === 'In attesa';
                 const contestato = p.stato?.includes('Contestato');

                 return (
                 <div key={p.id} className="bg-white/15 backdrop-blur-md border border-white/20 p-5 rounded-3xl shadow-xl flex flex-col gap-3">
                   
                   <div className="flex justify-between items-center mb-2">
                      <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase shadow-inner ${p.stato === 'Confermato' ? 'bg-green-500 text-white' : p.stato?.includes('Contestato') ? 'bg-red-500 text-white' : 'bg-yellow-400 text-blue-900 animate-pulse'}`}>
                        {p.stato || 'In attesa'}
                      </span>
                      <span className="text-[10px] text-blue-200 font-bold">{new Date(p.created_at).toLocaleDateString('it-IT')}</span>
                   </div>

                   <div className="flex justify-between items-center text-sm font-black uppercase tracking-tight">
                     <div className="flex flex-col w-[42%]">
                       <span className="text-yellow-400 text-[10px] mb-1">Vincitori 🏆</span>
                       <span className="text-white leading-tight">{p.vincitore}</span>
                     </div>
                     <div className="w-[16%] text-center"><span className="bg-blue-900/80 text-blue-200 px-2 py-1.5 rounded-xl text-[10px] shadow-inner">VS</span></div>
                     <div className="flex flex-col w-[42%] text-right">
                       <span className="text-white/60 text-[10px] mb-1">Sconfitti</span>
                       <span className="text-blue-100 leading-tight">{p.sconfitto}</span>
                     </div>
                   </div>
                   
                   <div className="bg-blue-900/60 rounded-2xl p-3 border border-blue-800/50 mt-2 text-sm flex justify-between items-center shadow-inner">
                     <span className="text-yellow-400 font-black text-lg">{p.risultato}</span>
                     {p.campo && <span className="text-[10px] text-blue-100 uppercase font-bold bg-blue-800/80 px-2 py-1 rounded-lg border border-blue-700">📍 {p.campo}</span>}
                   </div>

                   {/* BOTTONI VALIDAZIONE (In attesa) */}
                   {sonoCoinvolto && inAttesa && (
                     <div className="flex gap-3 mt-3 pt-4 border-t border-white/10">
                        <button onClick={() => confermaMatch(p)} className="flex-1 bg-green-500 hover:bg-green-600 text-white py-3 rounded-xl text-xs font-black uppercase shadow-lg">✅ Conferma</button>
                        <button onClick={() => contestaMatch(p.id)} className="flex-1 bg-red-500/90 hover:bg-red-600 text-white py-3 rounded-xl text-xs font-black uppercase shadow-lg">❌ Contesta</button>
                     </div>
                   )}

                   {/* BOTTONE ELIMINAZIONE (Se contestato) */}
                   {sonoCoinvolto && contestato && (
                     <div className="mt-3 pt-4 border-t border-white/10">
                        <button onClick={() => eliminaMatch(p.id)} className="w-full bg-red-600 hover:bg-red-700 text-white py-3 rounded-xl text-xs font-black uppercase shadow-lg transition-transform active:scale-95">
                          🗑️ Elimina Referto Annullato
                        </button>
                     </div>
                   )}
                 </div>
               )})}
             </div>
          </div>
        )}
      </div>

      {/* MODALE PROFILO GIOCATORE (Rimasta invariata) */}
      {profiloAperto && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-md overflow-y-auto flex justify-center animate-in fade-in">
          <div className="bg-gray-50 w-full max-w-2xl min-h-screen sm:min-h-[90vh] sm:mt-10 sm:rounded-t-3xl sm:mb-10 flex flex-col relative text-blue-900">
            <div className="bg-blue-900 text-white p-6 sm:p-8 sm:rounded-t-3xl relative">
              <button onClick={() => setProfiloAperto(null)} className="absolute top-4 right-4 bg-white/20 hover:bg-white/40 p-2 rounded-full backdrop-blur-md">✖️</button>
              <div className="flex items-center gap-5">
                {profiloAperto.foto ? (
                  <img src={profiloAperto.foto} className="w-24 h-24 rounded-full border-4 border-yellow-400 object-cover shadow-2xl" />
                ) : (
                  <div className="w-24 h-24 rounded-full bg-blue-800 flex items-center justify-center text-3xl font-black border-4 border-yellow-400 shadow-2xl">?</div>
                )}
                <div>
                  <h2 className="text-3xl font-black uppercase tracking-tight leading-none">{profiloAperto.Nome}</h2>
                  <div className="flex gap-2 mt-2">
                    <span className="bg-yellow-400 text-blue-900 px-3 py-1 rounded-lg text-xs font-black uppercase shadow-md">#{profiloAperto.posizione} Ranking</span>
                    <span className="bg-blue-800 border border-blue-700 px-3 py-1 rounded-lg text-xs font-black uppercase shadow-md">{profiloAperto.Punti} Pts</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="p-6 space-y-8">
              <section>
                <h3 className="text-sm font-black uppercase text-gray-400 tracking-widest mb-3">Statistiche Stagionali</h3>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <div className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100 flex flex-col items-center">
                    <span className="text-3xl font-black text-blue-900">{profiloAperto.partite || 0}</span>
                    <span className="text-[10px] font-bold text-gray-500 uppercase mt-1">Match Giocati</span>
                  </div>
                  <div className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100 flex flex-col items-center">
                    <span className="text-3xl font-black text-green-500">{profiloAperto.vinte || 0}</span>
                    <span className="text-[10px] font-bold text-gray-500 uppercase mt-1">Vittorie</span>
                  </div>
                  <div className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100 flex flex-col items-center">
                    <span className="text-3xl font-black text-red-500">{profiloAperto.perse || 0}</span>
                    <span className="text-[10px] font-bold text-gray-500 uppercase mt-1">Sconfitte</span>
                  </div>
                  <div className="bg-gradient-to-br from-yellow-300 to-yellow-500 p-4 rounded-2xl shadow-md flex flex-col items-center justify-center">
                    <span className="text-3xl font-black text-blue-900">{calcolaWinRate(profiloAperto.vinte, profiloAperto.partite)}%</span>
                    <span className="text-[10px] font-bold text-blue-900/80 uppercase mt-1">Win Rate</span>
                  </div>
                </div>
              </section>

              <section>
                <h3 className="text-sm font-black uppercase text-gray-400 tracking-widest mb-3">Top Partner</h3>
                <div className="bg-white rounded-3xl p-5 shadow-sm border border-gray-100">
                  {(() => {
                    const { partnerPreferiti } = calcolaStatisticheAvanzate(profiloAperto.id.toString());
                    if (partnerPreferiti.length === 0) return <p className="text-sm text-gray-400 font-bold">Ancora nessun dato sui partner.</p>;
                    
                    return partnerPreferiti.map((partner, i) => (
                      <div key={i} className="flex justify-between items-center py-3 border-b border-gray-50 last:border-0">
                        <span className="font-black text-blue-900 uppercase text-sm">{partner.nome}</span>
                        <div className="text-right">
                          <span className="block text-xs font-bold text-gray-500">{partner.insieme} match insieme</span>
                          <span className="block text-[10px] font-black text-green-500">{Math.round((partner.vinteInsieme / partner.insieme) * 100)}% Win Rate di coppia</span>
                        </div>
                      </div>
                    ));
                  })()}
                </div>
              </section>

              <section className="pb-10">
                <h3 className="text-sm font-black uppercase text-gray-400 tracking-widest mb-3">Storico Match Personale</h3>
                <div className="space-y-3">
                  {(() => {
                    const { partiteGiocatore } = calcolaStatisticheAvanzate(profiloAperto.id.toString());
                    if (partiteGiocatore.length === 0) return <p className="text-sm text-gray-400 font-bold">Nessun match registrato.</p>;
                    
                    return partiteGiocatore.map(p => {
                      const haVinto = p.v1_id === profiloAperto.id.toString() || p.v2_id === profiloAperto.id.toString();
                      return (
                        <div key={p.id} className={`p-4 rounded-2xl border-l-8 ${haVinto ? 'border-l-green-500 bg-green-50' : 'border-l-red-500 bg-red-50'} shadow-sm`}>
                           <div className="flex justify-between items-center mb-2">
                             <span className={`text-[10px] font-black uppercase px-2 py-1 rounded ${haVinto ? 'bg-green-200 text-green-800' : 'bg-red-200 text-red-800'}`}>
                               {haVinto ? 'VITTORIA' : 'SCONFITTA'}
                             </span>
                             <span className="text-[10px] text-gray-500 font-bold">{new Date(p.created_at).toLocaleDateString('it-IT')}</span>
                           </div>
                           <p className="text-xs font-black text-blue-900 mt-2">{p.vincitore} <span className="text-gray-400 mx-1">VS</span> {p.sconfitto}</p>
                           <p className="text-lg font-black text-gray-800 mt-1">{p.risultato}</p>
                           {p.campo && <p className="text-[10px] text-gray-500 font-bold mt-1">📍 {p.campo}</p>}
                        </div>
                      );
                    });
                  })()}
                </div>
              </section>
            </div>
          </div>
        </div>
      )}
    </main>
  )
}
