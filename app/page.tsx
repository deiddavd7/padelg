'use client'
import { useEffect, useState, useRef } from 'react'
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
  const [mioNome, setMioNome] = useState<string>('')
  const [profiloAperto, setProfiloAperto] = useState<any>(null)

  const [isEditingProfilo, setIsEditingProfilo] = useState(false)
  const [editNome, setEditNome] = useState('')
  const [editFotoFile, setEditFotoFile] = useState<File | null>(null)
  const [editEta, setEditEta] = useState('')
  const [editLato, setEditLato] = useState('')
  const [editRacchetta, setEditRacchetta] = useState('')
  const [salvataggioInCorso, setSalvataggioInCorso] = useState(false)

  const [activeTab, setActiveTab] = useState<'RANKING' | 'CHAT' | 'PRENOTA'>('RANKING')
  const [messaggi, setMessaggi] = useState<any[]>([])
  const [nuovoMessaggio, setNuovoMessaggio] = useState('')
  const chatEndRef = useRef<HTMLDivElement>(null)

  // 🚀 STATI PRENOTAZIONI & INVITI
  const getOggiStr = () => {
    const d = new Date()
    return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`
  }
  const [prenotazioni, setPrenotazioni] = useState<any[]>([])
  const [giornoSelezionato, setGiornoSelezionato] = useState(getOggiStr())
  const [campoSelezionato, setCampoSelezionato] = useState('Campo 1')

  const [gestioneInviti, setGestioneInviti] = useState<any>(null)
  const [invitoG2, setInvitoG2] = useState('')
  const [invitoG3, setInvitoG3] = useState('')
  const [invitoG4, setInvitoG4] = useState('')

  const slotGiornalieri = [
    { inizio: '08:00', fine: '09:30' }, { inizio: '09:30', fine: '11:00' }, { inizio: '11:00', fine: '12:30' },
    { inizio: '12:30', fine: '14:00' }, { inizio: '14:00', fine: '15:30' }, { inizio: '15:30', fine: '17:00' },
    { inizio: '17:00', fine: '18:30' }, { inizio: '18:30', fine: '20:00' }, { inizio: '20:00', fine: '21:30' },
    { inizio: '21:30', fine: '23:00' }
  ];

  const prossimiGiorni = Array.from({length: 7}).map((_, i) => {
    const d = new Date(); d.setDate(d.getDate() + i)
    return { dataStr: `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`, label: d.toLocaleDateString('it-IT', { weekday: 'short', day: '2-digit', month: 'short' }) }
  })

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => setUser(session?.user ?? null))
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => setUser(session?.user ?? null))
    prendiGiocatori(); prendiPartite(); prendiMessaggi(); prendiPrenotazioni();

    const channelChat = supabase.channel('chat_spogliatoio').on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'messaggi' }, payload => { setMessaggi(c => [...c, payload.new]) }).subscribe()
    const channelPren = supabase.channel('prenotazioni_live').on('postgres_changes', { event: '*', schema: 'public', table: 'prenotazioni' }, () => { prendiPrenotazioni() }).subscribe()

    return () => { subscription.unsubscribe(); supabase.removeChannel(channelChat); supabase.removeChannel(channelPren) }
  }, [])

  useEffect(() => { if (activeTab === 'CHAT') chatEndRef.current?.scrollIntoView({ behavior: 'smooth' }) }, [messaggi, activeTab])

  useEffect(() => {
    if (user && giocatori.length > 0) {
      const io = giocatori.find(g => g.user_id === user.id)
      if (io) { setMioGiocatoreId(io.id.toString()); setMioNome(io.Nome) }
    } else { setMioGiocatoreId(null); setMioNome('') }
  }, [user, giocatori])

  const prendiGiocatori = async () => { const { data } = await supabase.from('giocatori').select('*').order('Punti', { ascending: false }); if (data) setGiocatori(data) }
  const prendiPartite = async () => { const { data } = await supabase.from('partite').select('*').order('created_at', { ascending: false }).limit(100); if (data) setPartite(data) }
  const prendiMessaggi = async () => { const { data } = await supabase.from('messaggi').select('*').order('created_at', { ascending: false }).limit(50); if (data) setMessaggi(data.reverse()) }
  const prendiPrenotazioni = async () => { const { data } = await supabase.from('prenotazioni').select('*').gte('data_slot', getOggiStr()); if (data) setPrenotazioni(data) }

  const prenotaSlot = async (slot: any) => {
    if (!user || !mioGiocatoreId) return alert("Devi fare l'accesso per prenotare!");
    if (!confirm(`Vuoi bloccare il ${campoSelezionato} per le ore ${slot.inizio}?`)) return;
    setInviando(true);
    const { error } = await supabase.from('prenotazioni').insert([{
      campo: campoSelezionato, data_slot: giornoSelezionato, ora_inizio: slot.inizio, ora_fine: slot.fine, creatore_id: mioGiocatoreId, creatore_nome: mioNome, stato: 'Prenotato'
    }]);
    if (!error) { prendiPrenotazioni(); alert("Campo bloccato! Ora invita i tuoi compagni."); } else alert("Errore: " + error.message);
    setInviando(false);
  }

  const eliminaPrenotazione = async (prenotazioneId: string) => {
    if (!confirm("Vuoi cancellare questa prenotazione? Il campo tornerà libero.")) return;
    await supabase.from('prenotazioni').delete().eq('id', prenotazioneId);
    prendiPrenotazioni();
  }

  const apriGestioneInviti = (prenotazione: any) => {
    setInvitoG2(prenotazione.g2_id || ''); setInvitoG3(prenotazione.g3_id || ''); setInvitoG4(prenotazione.g4_id || '');
    setGestioneInviti(prenotazione);
  }

  const salvaInviti = async () => {
    setInviando(true);
    const scelti = [invitoG2, invitoG3, invitoG4].filter(id => id !== '');
    if (new Set(scelti).size !== scelti.length || scelti.includes(mioGiocatoreId!)) {
      alert("Errore: Hai selezionato lo stesso giocatore più di una volta, oppure hai inserito te stesso tra gli invitati.");
      setInviando(false); return;
    }

    const { error } = await supabase.from('prenotazioni').update({
      g2_id: invitoG2 || null, g2_stato: invitoG2 ? (gestioneInviti.g2_id === invitoG2 ? gestioneInviti.g2_stato : 'In attesa') : null,
      g3_id: invitoG3 || null, g3_stato: invitoG3 ? (gestioneInviti.g3_id === invitoG3 ? gestioneInviti.g3_stato : 'In attesa') : null,
      g4_id: invitoG4 || null, g4_stato: invitoG4 ? (gestioneInviti.g4_id === invitoG4 ? gestioneInviti.g4_stato : 'In attesa') : null,
    }).eq('id', gestioneInviti.id);

    if (!error) { setGestioneInviti(null); prendiPrenotazioni(); } else alert("Errore invio: " + error.message);
    setInviando(false);
  }

  const rispondiInvito = async (prenotazione: any, colonnaStato: string, risposta: 'Accettato' | 'Rifiutato', colonnaId: string) => {
    setInviando(true);
    const payload = risposta === 'Rifiutato' ? { [colonnaStato]: null, [colonnaId]: null } : { [colonnaStato]: risposta };
    await supabase.from('prenotazioni').update(payload).eq('id', prenotazione.id);
    prendiPrenotazioni();
    setInviando(false);
  }

  const handleAuth = async (type: 'LOGIN' | 'SIGNUP') => {
    const { error } = type === 'LOGIN' ? await supabase.auth.signInWithPassword({ email, password }) : await supabase.auth.signUp({ email, password })
    if (error) alert(error.message); else setMostraLogin(false)
  }
  const uploadFotoHelper = async (file: File, bucket = 'foto_giocatori') => {
    const nomeFile = `${Date.now()}_${user?.id || 'guest'}_foto`; const { error } = await supabase.storage.from(bucket).upload(nomeFile, file)
    if (!error) { const { data } = supabase.storage.from(bucket).getPublicUrl(nomeFile); return data.publicUrl } return null
  }
  const creaProfiloGiocatore = async () => {
    if (!nuovoNome.trim() || !user) return; setInviando(true); let urlFoto = ""; if (fileFoto) { urlFoto = await uploadFotoHelper(fileFoto) || "" }
    const { error } = await supabase.from('giocatori').insert([{ Nome: nuovoNome, Punti: 0, user_id: user.id, foto: urlFoto, partite: 0, vinte: 0, perse: 0 }])
    if (!error) { setNuovoNome(''); setFileFoto(null); prendiGiocatori(); } setInviando(false)
  }
  const apriProfilo = (giocatore: any, index: number) => {
    setProfiloAperto({...giocatore, posizione: index + 1}); setEditNome(giocatore.Nome || ''); setEditEta(giocatore.eta ? giocatore.eta.toString() : ''); setEditLato(giocatore.lato || ''); setEditRacchetta(giocatore.racchetta || ''); setIsEditingProfilo(false)
  }
  const salvaSchedaTecnica = async () => {
    if (!profiloAperto) return; setSalvataggioInCorso(true); let updateData: any = { Nome: editNome, eta: editEta ? parseInt(editEta) : null, lato: editLato, racchetta: editRacchetta }
    if (editFotoFile) { updateData.foto = await uploadFotoHelper(editFotoFile) || "" }
    const { error } = await supabase.from('giocatori').update(updateData).eq('id', profiloAperto.id)
    if (!error) { await prendiGiocatori(); setProfiloAperto((prev: any) => ({...prev, ...updateData, foto: updateData.foto || prev.foto})); setIsEditingProfilo(false); setEditFotoFile(null) } setSalvataggioInCorso(false)
  }
  const salvaMatch = async () => {
    if (!vincitore1Id || !vincitore2Id || !sconfitto1Id || !sconfitto2Id || !risultatoMatch.trim()) return alert("Compila tutti i dati!")
    const setG = new Set([vincitore1Id, vincitore2Id, sconfitto1Id, sconfitto2Id]); if (setG.size !== 4) return alert("Hai selezionato lo stesso giocatore più volte!")
    setInviando(true); const v1 = giocatori.find(g => g.id.toString() === vincitore1Id); const v2 = giocatori.find(g => g.id.toString() === vincitore2Id); const s1 = giocatori.find(g => g.id.toString() === sconfitto1Id); const s2 = giocatori.find(g => g.id.toString() === sconfitto2Id);
    let urlFotoMatch = ""; if (fotoMatch) urlFotoMatch = await uploadFotoHelper(fotoMatch) || "";
    const { error } = await supabase.from('partite').insert([{ vincitore: `${v1.Nome} & ${v2.Nome}`, sconfitto: `${s1.Nome} & ${s2.Nome}`, risultato: risultatoMatch, v1_id: v1.id.toString(), v2_id: v2.id.toString(), s1_id: s1.id.toString(), s2_id: s2.id.toString(), campo: campoMatch, note: noteMatch, foto: urlFotoMatch, stato: 'In attesa' }])
    if (!error) { setVincitore1Id(''); setVincitore2Id(''); setSconfitto1Id(''); setSconfitto2Id(''); setRisultatoMatch(''); setCampoMatch(''); setNoteMatch(''); setFotoMatch(null); setMostraFormPartita(false); prendiPartite(); alert("Referto inviato!"); } setInviando(false)
  }
  const confermaMatch = async (match: any) => {
    if (!confirm("Confermi questo risultato? I punti verranno calcolati.")) return;
    await supabase.from('partite').update({ stato: 'Confermato' }).eq('id', match.id)
    const v1 = giocatori.find(g => g.id.toString() === match.v1_id); const v2 = giocatori.find(g => g.id.toString() === match.v2_id); const s1 = giocatori.find(g => g.id.toString() === match.s1_id); const s2 = giocatori.find(g => g.id.toString() === match.s2_id)
    const rv = ((v1?.Punti || 0) + (v2?.Punti || 0)) / 2; const rs = ((s1?.Punti || 0) + (s2?.Punti || 0)) / 2; const diff = rs - rv; const probVittoria = 1 / (1 + Math.pow(10, diff / 400));
    let puntiGuadagnati = Math.max(10, Math.round(60 * (1 - probVittoria))); let puntiPersi = Math.round(puntiGuadagnati / 2); 
    if(v1) await supabase.from('giocatori').update({ Punti: (v1.Punti || 0) + puntiGuadagnati, partite: (v1.partite||0)+1, vinte: (v1.vinte||0)+1 }).eq('id', v1.id); if(v2) await supabase.from('giocatori').update({ Punti: (v2.Punti || 0) + puntiGuadagnati, partite: (v2.partite||0)+1, vinte: (v2.vinte||0)+1 }).eq('id', v2.id)
    if(s1) await supabase.from('giocatori').update({ Punti: Math.max(0, (s1.Punti || 0) - puntiPersi), partite: (s1.partite||0)+1, perse: (s1.perse||0)+1 }).eq('id', s1.id); if(s2) await supabase.from('giocatori').update({ Punti: Math.max(0, (s2.Punti || 0) - puntiPersi), partite: (s2.partite||0)+1, perse: (s2.perse||0)+1 }).eq('id', s2.id)
    prendiGiocatori(); prendiPartite();
  }
  const contestaMatch = async (matchId: any) => { const m = prompt("Motivo:"); if (!m) return; await supabase.from('partite').update({ stato: `Contestato: ${m}` }).eq('id', matchId); prendiPartite() }
  const eliminaMatch = async (matchId: any) => { if (!confirm("Eliminare?")) return; await supabase.from('partite').delete().eq('id', matchId); prendiPartite(); }
  const inviaMessaggioChat = async (e: any) => { e.preventDefault(); if (!nuovoMessaggio.trim() || !mioGiocatoreId || !mioNome) return; const { error } = await supabase.from('messaggi').insert([{ mittente_id: mioGiocatoreId, mittente_nome: mioNome, testo: nuovoMessaggio }]); if (!error) setNuovoMessaggio(''); }
  const calcolaWinRate = (v: number, g: number) => { if (!g) return 0; return Math.round((v / g) * 100); }
  const WinRateDonut = ({ vinte, giocate }: { vinte: number, giocate: number }) => {
    const winRate = calcolaWinRate(vinte, giocate); const radius = 36; const circumference = 2 * Math.PI * radius; const strokeDashoffset = circumference - (winRate / 100) * circumference;
    return (
      <div className="relative flex items-center justify-center">
        <svg className="transform -rotate-90 w-28 h-28 drop-shadow-md">
          <circle cx="56" cy="56" r={radius} stroke="#fee2e2" strokeWidth="12" fill="transparent" />
          <circle cx="56" cy="56" r={radius} stroke="#22c55e" strokeWidth="12" fill="transparent" strokeDasharray={circumference} strokeDashoffset={strokeDashoffset} className="transition-all duration-1000 ease-out" strokeLinecap="round" />
        </svg>
        <div className="absolute flex flex-col items-center justify-center text-center">
          <span className="text-2xl font-black text-blue-900 leading-none">{winRate}%</span><span className="text-[8px] font-bold text-gray-400 uppercase tracking-widest mt-1">Win Rate</span>
        </div>
      </div>
    );
  };
  const calcolaStatisticheAvanzate = (giocatoreId: string) => {
    const p = partite.filter(x => x.stato === 'Confermato' && (x.v1_id === giocatoreId || x.v2_id === giocatoreId || x.s1_id === giocatoreId || x.s2_id === giocatoreId));
    const partnerCount: Record<string, { nome: string, insieme: number, vinteInsieme: number }> = {};
    p.forEach(x => { const haVinto = x.v1_id === giocatoreId || x.v2_id === giocatoreId; let partnerId = null; if (x.v1_id === giocatoreId) partnerId = x.v2_id; else if (x.v2_id === giocatoreId) partnerId = x.v1_id; else if (x.s1_id === giocatoreId) partnerId = x.s2_id; else if (x.s2_id === giocatoreId) partnerId = x.s1_id;
      if (partnerId) { const partner = giocatori.find(g => g.id.toString() === partnerId); if (partner) { if (!partnerCount[partnerId]) partnerCount[partnerId] = { nome: partner.Nome, insieme: 0, vinteInsieme: 0 }; partnerCount[partnerId].insieme += 1; if (haVinto) partnerCount[partnerId].vinteInsieme += 1; } }
    });
    return { partiteGiocatore: p, partnerPreferiti: Object.values(partnerCount).sort((a, b) => b.insieme - a.insieme).slice(0, 3) };
  }

  const invitiPendenti = prenotazioni.filter(p => 
    (p.g2_id === mioGiocatoreId && p.g2_stato === 'In attesa') ||
    (p.g3_id === mioGiocatoreId && p.g3_stato === 'In attesa') ||
    (p.g4_id === mioGiocatoreId && p.g4_stato === 'In attesa')
  );

  return (
    <main className="min-h-screen bg-[#005bb7] text-white p-4 sm:p-8 font-sans flex flex-col items-center overflow-x-hidden relative pb-36">
      <div className="fixed inset-0 pointer-events-none z-0 flex justify-center items-center overflow-hidden opacity-20">
        <div className="relative w-[200vw] h-[150vh] sm:w-[120vw] sm:h-[120vh] border-[6px] border-white -rotate-12 scale-110"><div className="absolute top-1/2 left-0 w-full h-[6px] bg-white -translate-y-1/2"></div><div className="absolute top-[25%] left-0 w-full h-[6px] bg-white"></div><div className="absolute top-[75%] left-0 w-full h-[6px] bg-white"></div><div className="absolute top-[25%] left-1/2 w-[6px] h-[50%] bg-white -translate-x-1/2"></div></div>
      </div>
      
      <div className="w-full max-w-lg relative z-10 flex flex-col min-h-full">
        <div className="flex justify-end mb-6 shrink-0">
          {user ? ( <button onClick={() => supabase.auth.signOut()} className="text-[11px] font-bold text-blue-200 hover:text-white transition-colors bg-blue-900/60 px-4 py-2 rounded-full backdrop-blur-sm border border-blue-800/50">LOGOUT ({user.email})</button> ) : ( <button onClick={() => setMostraLogin(!mostraLogin)} className="bg-yellow-400 text-blue-900 px-5 py-2.5 rounded-full text-xs font-black uppercase shadow-lg active:scale-95">{mostraLogin ? 'Annulla' : 'Entra in Campo'}</button> )}
        </div>

        <div className="text-center mb-10 shrink-0">
          <h1 className="text-6xl md:text-8xl font-black italic text-yellow-400 drop-shadow-[0_5px_5px_rgba(0,0,0,0.3)] tracking-tighter">padelg<span className="text-white text-4xl">.</span></h1>
          <p className="text-blue-100 text-sm md:text-base font-bold tracking-widest uppercase mt-2 opacity-90 drop-shadow-md">Official Ranking</p>
        </div>
        
        {/* ============================== */}
        {/* 🏆 TAB: RANKING */}
        {/* ============================== */}
        {activeTab === 'RANKING' && (
          <div className="animate-in fade-in duration-300 flex-1">
            {mostraLogin && !user && ( <div className="bg-white p-8 rounded-3xl text-black mb-10 shadow-2xl"><h2 className="text-2xl font-black text-blue-900 mb-6 text-center">Accedi / Registrati</h2><input type="email" placeholder="Email" value={email} onChange={e => setEmail(e.target.value)} className="w-full p-4 mb-3 bg-gray-50 rounded-2xl font-semibold outline-none border border-gray-200" /><input type="password" placeholder="Password" value={password} onChange={e => setPassword(e.target.value)} className="w-full p-4 mb-6 bg-gray-50 rounded-2xl font-semibold outline-none border border-gray-200" /><div className="flex flex-col gap-3"><button onClick={() => handleAuth('LOGIN')} className="w-full bg-blue-600 text-white p-4 rounded-2xl font-black uppercase text-sm">Accedi</button><button onClick={() => handleAuth('SIGNUP')} className="w-full bg-blue-50 text-blue-700 p-4 rounded-2xl font-black uppercase text-sm">Crea account</button></div></div> )}
            {user && !giocatori.some(g => g.user_id === user.id) && ( <div className="bg-gradient-to-br from-yellow-300 to-yellow-500 p-8 rounded-3xl text-blue-900 mb-10 shadow-2xl"><h2 className="text-xl font-black uppercase mb-4 text-center tracking-widest">Crea profilo</h2><input type="text" placeholder="Nome" value={nuovoNome} onChange={e => setNuovoNome(e.target.value)} className="w-full p-4 mb-4 rounded-2xl font-black outline-none shadow-inner" /><button onClick={creaProfiloGiocatore} disabled={inviando} className="w-full bg-blue-900 text-white p-4 rounded-2xl font-black uppercase shadow-xl">{inviando ? 'Creazione...' : 'Entra'}</button></div> )}
            
            <div className="mb-12">
              <div className="flex items-center gap-4 mb-6 px-2"><h2 className="text-2xl font-black italic text-yellow-400">Leaderboard</h2><div className="h-1 flex-1 bg-gradient-to-r from-yellow-400 to-transparent rounded-full opacity-80"></div></div>
              <div className="flex flex-col gap-4">
                {giocatori.map((g, index) => (
                  <div key={g.id} onClick={() => apriProfilo(g, index)} className="bg-white p-4 sm:p-5 rounded-3xl shadow-xl hover:-translate-y-1 transition-all duration-300 flex justify-between items-center group border border-blue-50 cursor-pointer">
                    <div className="flex items-center gap-3 sm:gap-4 flex-1 min-w-0">
                      <div className={`w-10 h-10 sm:w-12 sm:h-12 shrink-0 flex items-center justify-center rounded-2xl font-black text-lg sm:text-xl shadow-inner ${index === 0 ? 'bg-gradient-to-br from-yellow-300 to-yellow-500 text-blue-900 ring-4 ring-yellow-400/40' : index === 1 ? 'bg-gray-200 text-gray-600' : index === 2 ? 'bg-orange-200 text-orange-800' : 'bg-blue-50 text-blue-300'}`}>{index + 1}</div>
                      {g.foto ? ( <img src={g.foto} className="w-14 h-14 sm:w-16 sm:h-16 rounded-full object-cover border-4 border-white shadow-md shrink-0" /> ) : ( <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-full bg-gradient-to-br from-blue-100 to-blue-200 flex items-center justify-center text-blue-400 font-black text-2xl border-4 border-white shadow-md shrink-0">?</div> )}
                      <div className="flex flex-col min-w-0 flex-1">
                        <span className="font-extrabold text-base sm:text-xl uppercase text-blue-900 break-words tracking-tight">{g.Nome}</span>
                        <div className="w-full flex gap-3 text-[10px] sm:text-[11px] font-bold mt-0.5"><span className="text-gray-500">Match: {g.partite || 0}</span><span className="text-green-600">V: {g.vinte || 0}</span><span className="text-red-500">S: {g.perse || 0}</span></div>
                        <div className="w-full max-w-[120px] mt-1 flex items-center gap-2"><div className="w-full bg-red-100 rounded-full h-1.5"><div className="bg-green-500 h-1.5 rounded-full" style={{ width: `${calcolaWinRate(g.vinte, g.partite)}%` }}></div></div><span className="text-[9px] font-black text-gray-400">{calcolaWinRate(g.vinte, g.partite)}% WR</span></div>
                      </div>
                    </div>
                    <div className="flex items-center gap-1 sm:gap-2 shrink-0"><div className="bg-blue-600 p-2 sm:p-3 rounded-2xl min-w-[70px] sm:min-w-[80px] text-center shadow-lg"><span className="text-xl sm:text-2xl font-black text-white leading-none tracking-tight">{g.Punti}</span></div></div>
                  </div>
                ))}
              </div>
            </div>

            {user && giocatori.length > 3 && (
              <div className="mb-10">
                {!mostraFormPartita ? ( <button onClick={() => setMostraFormPartita(true)} className="w-full bg-yellow-400 text-blue-900 p-5 rounded-3xl font-black uppercase text-sm shadow-xl hover:-translate-y-1 transition-all flex justify-center items-center gap-3"><span className="text-2xl">🎾</span> Inserisci Referto</button> ) : (
                  <div className="bg-white p-6 sm:p-8 rounded-3xl text-black border border-gray-100 shadow-2xl">
                    <div className="flex justify-between items-center mb-6"><h3 className="font-black uppercase text-sm text-blue-900 tracking-widest">Referto Passato</h3><button onClick={() => setMostraFormPartita(false)} className="bg-gray-100 hover:bg-gray-200 text-gray-500 px-3 py-1 rounded-full font-bold text-xs">ANNULLA</button></div>
                    <div className="space-y-4 mb-6">
                      <div className="bg-blue-50 p-4 rounded-2xl border border-blue-100"><span className="text-xs font-black uppercase text-blue-800 mb-2 block">🏆 Vincenti</span><div className="flex gap-2"><select value={vincitore1Id} onChange={e => setVincitore1Id(e.target.value)} className="w-1/2 p-3 bg-white rounded-xl font-bold text-sm outline-none border border-blue-200 text-blue-900"><option value="">Gioc. 1</option>{giocatori.map(g => <option key={g.id} value={g.id}>{g.Nome}</option>)}</select><select value={vincitore2Id} onChange={e => setVincitore2Id(e.target.value)} className="w-1/2 p-3 bg-white rounded-xl font-bold text-sm outline-none border border-blue-200 text-blue-900"><option value="">Gioc. 2</option>{giocatori.map(g => <option key={g.id} value={g.id}>{g.Nome}</option>)}</select></div></div>
                      <div className="bg-gray-50 p-4 rounded-2xl border border-gray-200"><span className="text-xs font-black uppercase text-gray-500 mb-2 block">🥵 Sconfitti</span><div className="flex gap-2"><select value={sconfitto1Id} onChange={e => setSconfitto1Id(e.target.value)} className="w-1/2 p-3 bg-white rounded-xl font-bold text-sm outline-none border border-gray-200 text-gray-600"><option value="">Gioc. 1</option>{giocatori.map(g => <option key={g.id} value={g.id}>{g.Nome}</option>)}</select><select value={sconfitto2Id} onChange={e => setSconfitto2Id(e.target.value)} className="w-1/2 p-3 bg-white rounded-xl font-bold text-sm outline-none border border-gray-200 text-gray-600"><option value="">Gioc. 2</option>{giocatori.map(g => <option key={g.id} value={g.id}>{g.Nome}</option>)}</select></div></div>
                      <div className="grid grid-cols-2 gap-3"><input type="text" placeholder="Risultato Set" value={risultatoMatch} onChange={e => setRisultatoMatch(e.target.value)} className="col-span-2 p-4 bg-gray-50 rounded-2xl font-bold text-center border border-gray-200 outline-none" /><input type="text" placeholder="Campo" value={campoMatch} onChange={e => setCampoMatch(e.target.value)} className="p-4 bg-gray-50 rounded-2xl font-bold text-sm border border-gray-200 outline-none" /><input type="file" accept="image/*" onChange={e => setFotoMatch(e.target.files?.[0] || null)} className="p-3 bg-gray-50 rounded-2xl text-[10px] font-semibold border border-gray-200" /><textarea placeholder="Note..." value={noteMatch} onChange={e => setNoteMatch(e.target.value)} className="col-span-2 p-4 bg-gray-50 rounded-2xl font-medium text-sm border border-gray-200 min-h-[80px] outline-none" /></div>
                    </div>
                    <button onClick={salvaMatch} disabled={inviando} className="w-full bg-blue-600 text-white p-4 rounded-2xl font-black uppercase shadow-lg disabled:opacity-50">{inviando ? 'Invio...' : 'Invia Referto'}</button>
                  </div>
                )}
              </div>
            )}

            {partite.length > 0 && (
              <div className="mb-10">
                <div className="flex items-center gap-4 mb-6 px-2"><h2 className="text-xl font-black text-blue-100 tracking-tight uppercase">Ultime Sfide</h2><div className="h-px flex-1 bg-white/30"></div></div>
                <div className="flex flex-col gap-5">
                  {partite.map(p => {
                    const sonoCoinvolto = mioGiocatoreId && (p.s1_id === mioGiocatoreId || p.s2_id === mioGiocatoreId || p.v1_id === mioGiocatoreId || p.v2_id === mioGiocatoreId);
                    return (
                    <div key={p.id} className="bg-white/15 backdrop-blur-md border border-white/20 p-5 rounded-3xl shadow-xl flex flex-col gap-3">
                      <div className="flex justify-between items-center mb-2"><span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase shadow-inner ${p.stato === 'Confermato' ? 'bg-green-500 text-white' : p.stato?.includes('Contestato') ? 'bg-red-500 text-white' : 'bg-yellow-400 text-blue-900 animate-pulse'}`}>{p.stato || 'In attesa'}</span><span className="text-[10px] text-blue-200 font-bold">{new Date(p.created_at).toLocaleDateString('it-IT')}</span></div>
                      <div className="flex justify-between items-center text-sm font-black uppercase tracking-tight"><div className="flex flex-col w-[42%]"><span className="text-yellow-400 text-[10px] mb-1">Vincitori 🏆</span><span className="text-white leading-tight">{p.vincitore}</span></div><div className="w-[16%] text-center"><span className="bg-blue-900/80 text-blue-200 px-2 py-1.5 rounded-xl text-[10px] shadow-inner">VS</span></div><div className="flex flex-col w-[42%] text-right"><span className="text-white/60 text-[10px] mb-1">Sconfitti</span><span className="text-blue-100 leading-tight">{p.sconfitto}</span></div></div>
                      <div className="bg-blue-900/60 rounded-2xl p-3 border border-blue-800/50 mt-2 text-sm flex justify-between items-center shadow-inner"><span className="text-yellow-400 font-black text-lg">{p.risultato}</span>{p.campo && <span className="text-[10px] text-blue-100 uppercase font-bold bg-blue-800/80 px-2 py-1 rounded-lg border border-blue-700">📍 {p.campo}</span>}</div>
                      {sonoCoinvolto && p.stato === 'In attesa' && ( <div className="flex gap-3 mt-3 pt-4 border-t border-white/10"><button onClick={() => confermaMatch(p)} className="flex-1 bg-green-500 text-white py-3 rounded-xl text-xs font-black uppercase shadow-lg">✅ Conferma</button><button onClick={() => contestaMatch(p.id)} className="flex-1 bg-red-500/90 text-white py-3 rounded-xl text-xs font-black uppercase shadow-lg">❌ Contesta</button></div> )}
                      {sonoCoinvolto && p.stato?.includes('Contestato') && ( <div className="mt-3 pt-4 border-t border-white/10"><button onClick={() => eliminaMatch(p.id)} className="w-full bg-red-600 text-white py-3 rounded-xl text-xs font-black uppercase shadow-lg">🗑️ Elimina Referto</button></div> )}
                    </div>
                  )})}
                </div>
              </div>
            )}
            {/* SPAZIATORE EXTRA PER BARRA INFERIORE */}
            <div className="h-32 w-full shrink-0"></div>
          </div>
        )}

        {/* ============================== */}
        {/* 💬 TAB: SPOGLIATOIO */}
        {/* ============================== */}
        {activeTab === 'CHAT' && (
          <div className="animate-in fade-in slide-in-from-right-4 duration-300 flex flex-col h-[calc(100vh-160px)]">
            <div className="flex items-center gap-3 mb-4"><span className="text-3xl">💬</span><div><h2 className="text-2xl font-black italic text-yellow-400 leading-none">Spogliatoio</h2><p className="text-xs text-blue-200 font-bold uppercase">Chat Ufficiale</p></div></div>
            <div className="flex-1 bg-white/10 backdrop-blur-md rounded-3xl p-4 overflow-y-auto flex flex-col gap-3 border border-white/20 shadow-inner">
              {messaggi.length === 0 ? ( <div className="m-auto text-center text-blue-200 font-bold text-sm opacity-60">Nessun messaggio.</div> ) : (
                messaggi.map((msg, index) => {
                  const isMine = msg.mittente_id === mioGiocatoreId;
                  return (
                    <div key={msg.id || index} className={`flex flex-col w-3/4 max-w-[280px] ${isMine ? 'self-end items-end' : 'self-start items-start'}`}>
                      <span className="text-[10px] text-blue-200 font-bold mb-1 mx-1">{isMine ? 'Tu' : msg.mittente_nome}</span>
                      <div className={`p-3 rounded-2xl shadow-md ${isMine ? 'bg-yellow-400 text-blue-900 rounded-tr-sm' : 'bg-white text-blue-900 rounded-tl-sm'}`}><p className="text-sm font-bold leading-snug">{msg.testo}</p></div>
                      <span className="text-[8px] text-blue-200/60 mt-1 mx-1 font-bold">{new Date(msg.created_at).toLocaleTimeString('it-IT', {hour: '2-digit', minute:'2-digit'})}</span>
                    </div>
                  );
                })
              )}
              <div ref={chatEndRef} />
            </div>
            {user ? (
              <form onSubmit={inviaMessaggioChat} className="mt-4 flex gap-2">
                <input type="text" placeholder="Scrivi..." value={nuovoMessaggio} onChange={(e) => setNuovoMessaggio(e.target.value)} className="flex-1 p-4 bg-white rounded-2xl text-blue-900 font-bold outline-none shadow-lg focus:border-yellow-400" />
                <button type="submit" disabled={!nuovoMessaggio.trim()} className="bg-yellow-400 text-blue-900 p-4 rounded-2xl font-black uppercase shadow-lg disabled:opacity-50">Invia</button>
              </form>
            ) : ( <div className="mt-4 bg-blue-900/60 p-4 rounded-2xl text-center border border-blue-800/50"><p className="text-xs font-bold text-yellow-400 uppercase">Devi fare l'accesso</p></div> )}
            {/* SPAZIATORE EXTRA PER BARRA INFERIORE */}
            <div className="h-12 w-full shrink-0"></div>
          </div>
        )}

        {/* ============================== */}
        {/* 📅 TAB: PRENOTA CAMPI E INVITI */}
        {/* ============================== */}
        {activeTab === 'PRENOTA' && (
          <div className="animate-in fade-in slide-in-from-right-4 duration-300 flex-1">
            <div className="flex items-center gap-3 mb-6">
              <span className="text-3xl">📅</span>
              <div><h2 className="text-2xl font-black italic text-yellow-400 leading-none">Prenota Campo</h2><p className="text-xs text-blue-200 font-bold uppercase">Gestione e Inviti</p></div>
            </div>

            {/* 🚀 BOX INVITI PENDENTI 🚀 */}
            {invitiPendenti.length > 0 && (
              <div className="bg-gradient-to-r from-yellow-400 to-yellow-500 rounded-3xl p-5 shadow-2xl mb-8 border border-yellow-300 animate-pulse">
                <h3 className="text-blue-900 font-black uppercase text-sm mb-3">📬 Sei stato convocato!</h3>
                <div className="flex flex-col gap-3">
                  {invitiPendenti.map(invito => {
                    const miaColonnaStato = invito.g2_id === mioGiocatoreId ? 'g2_stato' : (invito.g3_id === mioGiocatoreId ? 'g3_stato' : 'g4_stato');
                    const miaColonnaId = invito.g2_id === mioGiocatoreId ? 'g2_id' : (invito.g3_id === mioGiocatoreId ? 'g3_id' : 'g4_id');
                    return (
                      <div key={invito.id} className="bg-white/40 p-3 rounded-2xl backdrop-blur-md border border-white/50">
                        <p className="text-blue-900 font-bold text-sm leading-tight mb-2">
                          <span className="font-black">{invito.creatore_nome}</span> ti ha invitato a giocare il <span className="font-black bg-white/50 px-1 rounded">{invito.data_slot.split('-').reverse().join('/')}</span> alle <span className="font-black bg-white/50 px-1 rounded">{invito.ora_inizio}</span> nel <span className="font-black">{invito.campo}</span>.
                        </p>
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

            {/* SELETTORE DATA */}
            <div className="flex gap-2 overflow-x-auto pb-4 mb-4 scrollbar-hide snap-x">
              {prossimiGiorni.map((g, index) => (
                <button key={index} onClick={() => setGiornoSelezionato(g.dataStr)} className={`snap-center shrink-0 p-3 rounded-2xl flex flex-col items-center justify-center min-w-[80px] border transition-all ${giornoSelezionato === g.dataStr ? 'bg-yellow-400 text-blue-900 border-yellow-300 shadow-lg scale-105' : 'bg-white/10 text-white border-white/20 hover:bg-white/20'}`}>
                  <span className="text-xs font-bold uppercase mb-1 opacity-80">{index === 0 ? 'Oggi' : index === 1 ? 'Domani' : g.label.split(' ')[0]}</span>
                  <span className="text-xl font-black">{g.dataStr.split('-')[2]}</span>
                </button>
              ))}
            </div>

            {/* SELETTORE CAMPO */}
            <div className="flex bg-blue-900/50 p-1 rounded-2xl backdrop-blur-md mb-6 border border-blue-800/50">
              <button onClick={() => setCampoSelezionato('Campo 1')} className={`flex-1 py-3 rounded-xl font-black uppercase text-sm transition-all ${campoSelezionato === 'Campo 1' ? 'bg-blue-600 text-white shadow-md' : 'text-blue-200 hover:text-white'}`}>Campo 1</button>
              <button onClick={() => setCampoSelezionato('Campo 2')} className={`flex-1 py-3 rounded-xl font-black uppercase text-sm transition-all ${campoSelezionato === 'Campo 2' ? 'bg-blue-600 text-white shadow-md' : 'text-blue-200 hover:text-white'}`}>Campo 2</button>
            </div>

            {/* LISTA SLOT E GESTIONE INVITI */}
            <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-3xl p-2 flex flex-col gap-2">
              {slotGiornalieri.map((slot, idx) => {
                const prenotazione = prenotazioni.find(p => p.campo === campoSelezionato && p.data_slot === giornoSelezionato && p.ora_inizio === slot.inizio);
                const occupato = !!prenotazione;
                const eLaMia = prenotazione && prenotazione.creatore_id === mioGiocatoreId;
                
                let confermati = 1;
                if (prenotazione?.g2_stato === 'Accettato') confermati++;
                if (prenotazione?.g3_stato === 'Accettato') confermati++;
                if (prenotazione?.g4_stato === 'Accettato') confermati++;

                return (
                  <div key={idx} className={`flex flex-col p-4 rounded-2xl ${occupato ? (eLaMia ? 'bg-blue-800 border border-blue-400/50' : 'bg-red-900/40 border border-red-500/20 opacity-70') : 'bg-white text-blue-900 shadow-sm'}`}>
                    
                    <div className="flex justify-between items-center w-full">
                      <div className="flex flex-col">
                        <span className={`text-lg font-black ${occupato ? 'text-white' : 'text-blue-900'}`}>{slot.inizio} - {slot.fine}</span>
                        {occupato && <span className="text-[10px] font-bold uppercase mt-1 text-gray-300">Da: {prenotazione.creatore_nome}</span>}
                      </div>
                      
                      {!occupato ? (
                        <button onClick={() => prenotaSlot(slot)} disabled={inviando} className="bg-yellow-400 hover:bg-yellow-300 text-blue-900 px-4 py-2 rounded-xl text-xs font-black uppercase shadow-md active:scale-95 transition-transform">Prenota</button>
                      ) : eLaMia ? (
                        <button onClick={() => eliminaPrenotazione(prenotazione.id)} className="bg-red-500 hover:bg-red-600 text-white px-3 py-1.5 rounded-lg text-[10px] font-black uppercase shadow-md">Cancella</button>
                      ) : (
                        <span className="text-xs font-bold uppercase text-red-300 bg-red-900/50 px-3 py-1.5 rounded-lg">Occupato</span>
                      )}
                    </div>

                    {occupato && eLaMia && (
                      <div className="mt-4 pt-3 border-t border-blue-700/50 flex flex-col gap-3">
                        <div className="flex items-center justify-between">
                          <span className="text-[10px] uppercase font-bold text-blue-200">Stato Campo: {confermati}/4</span>
                          <div className="flex gap-1">
                            {[1,2,3,4].map(n => <div key={n} className={`w-3 h-3 rounded-full ${n <= confermati ? 'bg-green-400' : 'bg-blue-900/50 border border-blue-400'}`}></div>)}
                          </div>
                        </div>

                        {gestioneInviti?.id === prenotazione.id ? (
                          <div className="bg-white p-3 rounded-xl flex flex-col gap-2 shadow-inner">
                            <span className="text-xs font-black text-blue-900 uppercase text-center mb-1">Seleziona i Compagni</span>
                            {[ {label: 'Giocatore 2', val: invitoG2, set: setInvitoG2, stato: prenotazione.g2_stato},
                               {label: 'Giocatore 3', val: invitoG3, set: setInvitoG3, stato: prenotazione.g3_stato},
                               {label: 'Giocatore 4', val: invitoG4, set: setInvitoG4, stato: prenotazione.g4_stato}
                             ].map((campo, i) => (
                              <div key={i} className="flex gap-2 items-center">
                                <select value={campo.val} onChange={e => campo.set(e.target.value)} disabled={campo.stato === 'Accettato'} className="flex-1 p-2 bg-gray-50 rounded-lg text-xs font-bold text-blue-900 border border-gray-200 outline-none disabled:opacity-60">
                                  <option value="">-- {campo.label} --</option>
                                  {giocatori.map(g => g.id.toString() !== mioGiocatoreId && (
                                    <option key={g.id} value={g.id}>{g.Nome}</option>
                                  ))}
                                </select>
                                {campo.stato && (
                                  <span className={`text-[9px] font-black uppercase px-2 py-1 rounded w-[60px] text-center ${campo.stato === 'Accettato' ? 'bg-green-100 text-green-700' : campo.stato === 'Rifiutato' ? 'bg-red-100 text-red-700' : 'bg-yellow-100 text-yellow-700'}`}>
                                    {campo.stato === 'In attesa' ? 'Attesa' : campo.stato}
                                  </span>
                                )}
                              </div>
                            ))}

                            <div className="flex gap-2 mt-2">
                              <button onClick={() => setGestioneInviti(null)} className="flex-1 bg-gray-200 text-gray-600 text-xs py-2 rounded-lg font-black uppercase">Annulla</button>
                              <button onClick={salvaInviti} disabled={inviando} className="flex-1 bg-blue-600 text-white text-xs py-2 rounded-lg font-black uppercase shadow-md">{inviando ? '...' : 'Invia Inviti'}</button>
                            </div>
                          </div>
                        ) : (
                          <button onClick={() => apriGestioneInviti(prenotazione)} className="w-full bg-blue-600 hover:bg-blue-500 text-white py-2 rounded-xl text-xs font-black uppercase shadow-md flex items-center justify-center gap-2 transition-colors">
                            ➕ Invita / Gestisci Giocatori
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
            
            {/* 🚀 SPAZIATORE EXTRA PER NON ESSERE COPERTI DALLA BARRA INFERIORE 🚀 */}
            <div className="h-32 w-full shrink-0"></div>

          </div>
        )}
      </div>

      <div className="fixed bottom-0 left-0 w-full bg-white/95 backdrop-blur-xl border-t border-gray-200 p-2 pb-6 sm:pb-2 z-40 flex justify-between items-center shadow-[0_-10px_40px_rgba(0,0,0,0.1)]">
        <button onClick={() => setActiveTab('RANKING')} className={`flex flex-col items-center gap-1 w-1/3 p-2 rounded-2xl transition-all ${activeTab === 'RANKING' ? 'text-blue-600 bg-blue-50' : 'text-gray-400 hover:text-blue-400'}`}>
          <span className="text-2xl drop-shadow-sm">🏆</span><span className="text-[10px] font-black uppercase tracking-widest">Ranking</span>
        </button>
        <button onClick={() => setActiveTab('PRENOTA')} className={`flex flex-col items-center gap-1 w-1/3 p-2 rounded-2xl transition-all ${activeTab === 'PRENOTA' ? 'text-blue-600 bg-blue-50' : 'text-gray-400 hover:text-blue-400'}`}>
          <span className="text-2xl drop-shadow-sm">📅</span><span className="text-[10px] font-black uppercase tracking-widest">Prenota</span>
        </button>
        <button onClick={() => setActiveTab('CHAT')} className={`flex flex-col items-center gap-1 w-1/3 p-2 rounded-2xl transition-all ${activeTab === 'CHAT' ? 'text-blue-600 bg-blue-50' : 'text-gray-400 hover:text-blue-400'}`}>
          <span className="text-2xl drop-shadow-sm">💬</span><span className="text-[10px] font-black uppercase tracking-widest">Chat</span>
        </button>
      </div>

      {/* MODALE PROFILO */}
      {profiloAperto && (
        <div className="fixed inset-0 z-50 bg-gray-50 overflow-y-auto flex justify-center animate-in fade-in">
          <div className="w-full max-w-2xl min-h-screen flex flex-col relative text-blue-900 pb-20"> 
            <div className="bg-blue-900 text-white p-6 sm:p-8 relative shadow-lg">
              <button onClick={() => setProfiloAperto(null)} className="absolute top-4 right-4 bg-white/20 hover:bg-white/40 p-2 rounded-full backdrop-blur-md z-10 transition-colors">✖️</button>
              {mioGiocatoreId === profiloAperto.id.toString() && !isEditingProfilo && ( <button onClick={() => setIsEditingProfilo(true)} className="absolute top-4 right-16 bg-yellow-400 hover:bg-yellow-300 text-blue-900 px-3 py-1.5 rounded-lg text-xs font-black uppercase shadow-lg transition-colors z-10 flex items-center gap-1">✏️ Modifica</button> )}
              <div className="flex items-center gap-5 mt-4">
                {profiloAperto.foto ? ( <img src={profiloAperto.foto} className="w-24 h-24 rounded-full border-4 border-yellow-400 object-cover shadow-2xl shrink-0" /> ) : ( <div className="w-24 h-24 rounded-full bg-blue-800 flex items-center justify-center text-3xl font-black border-4 border-yellow-400 shadow-2xl shrink-0">?</div> )}
                <div className="flex-1">
                  <h2 className="text-3xl font-black uppercase tracking-tight leading-none break-words">{profiloAperto.Nome}</h2>
                  <div className="flex flex-wrap gap-2 mt-2"><span className="bg-yellow-400 text-blue-900 px-3 py-1 rounded-lg text-xs font-black uppercase shadow-md">#{profiloAperto.posizione} Ranking</span><span className="bg-blue-800 border border-blue-700 px-3 py-1 rounded-lg text-xs font-black uppercase shadow-md">{profiloAperto.Punti} Pts</span></div>
                  {!isEditingProfilo && ( <div className="flex flex-wrap gap-2 mt-3">{profiloAperto.eta && <span className="bg-white/10 border border-white/20 px-2 py-1 rounded text-[10px] font-bold uppercase">🎂 {profiloAperto.eta} Anni</span>}{profiloAperto.lato && <span className="bg-white/10 border border-white/20 px-2 py-1 rounded text-[10px] font-bold uppercase">🎾 {profiloAperto.lato}</span>}{profiloAperto.racchetta && <span className="bg-white/10 border border-white/20 px-2 py-1 rounded text-[10px] font-bold uppercase">🏸 {profiloAperto.racchetta}</span>}</div> )}
                </div>
              </div>
            </div>
            <div className="p-6 space-y-8 flex-1 -mt-4 rounded-t-3xl bg-gray-50 relative z-20">
              {isEditingProfilo ? (
                <div className="bg-white p-6 rounded-3xl border border-gray-200 shadow-inner animate-in slide-in-from-top-4">
                  <h3 className="text-sm font-black uppercase text-blue-900 tracking-widest mb-4">Aggiorna Scheda</h3>
                  <div className="space-y-4">
                    <div><label className="text-[10px] font-bold text-gray-500 uppercase ml-1">Nome Ufficiale</label><input type="text" value={editNome} onChange={(e) => setEditNome(e.target.value)} className="w-full p-3 bg-gray-50 rounded-xl font-bold border border-gray-200 focus:border-blue-500 outline-none" /></div>
                    <div className="flex gap-3"><div className="w-1/3"><label className="text-[10px] font-bold text-gray-500 uppercase ml-1">Età</label><input type="number" value={editEta} onChange={(e) => setEditEta(e.target.value)} className="w-full p-3 bg-gray-50 rounded-xl font-bold border border-gray-200 focus:border-blue-500 outline-none" /></div><div className="w-2/3"><label className="text-[10px] font-bold text-gray-500 uppercase ml-1">Lato Preferito</label><select value={editLato} onChange={(e) => setEditLato(e.target.value)} className="w-full p-3 bg-gray-50 rounded-xl font-bold border border-gray-200 outline-none text-blue-900 cursor-pointer"><option value="">Seleziona...</option><option value="Sinistra">Sinistra</option><option value="Destra">Destra</option><option value="Entrambi">Entrambi</option></select></div></div>
                    <div><label className="text-[10px] font-bold text-gray-500 uppercase ml-1">Racchetta</label><input type="text" value={editRacchetta} onChange={(e) => setEditRacchetta(e.target.value)} className="w-full p-3 bg-gray-50 rounded-xl font-bold border border-gray-200 outline-none" /></div>
                    <div><label className="text-[10px] font-bold text-gray-500 uppercase ml-1">Cambia Foto Profilo</label><input type="file" accept="image/*" onChange={(e) => setEditFotoFile(e.target.files?.[0] || null)} className="w-full p-2 bg-gray-50 rounded-xl text-xs border border-gray-200 cursor-pointer" /></div>
                    <div className="flex gap-3 mt-6 pt-4 border-t border-gray-100"><button onClick={() => setIsEditingProfilo(false)} className="flex-1 bg-gray-200 text-gray-700 py-3 rounded-xl font-black uppercase text-xs">Annulla</button><button onClick={salvaSchedaTecnica} disabled={salvataggioInCorso} className="flex-1 bg-green-500 text-white py-3 rounded-xl font-black uppercase text-xs shadow-md">{salvataggioInCorso ? 'Salvataggio...' : 'Salva'}</button></div>
                  </div>
                </div>
              ) : (
                <>
                  <section className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100 flex flex-col sm:flex-row items-center gap-6">
                    <div className="shrink-0"><WinRateDonut vinte={profiloAperto.vinte} giocate={profiloAperto.partite} /></div>
                    <div className="flex-1 grid grid-cols-3 gap-2 w-full text-center"><div className="bg-gray-50 p-3 rounded-2xl"><span className="block text-2xl font-black text-blue-900">{profiloAperto.partite || 0}</span><span className="text-[9px] font-bold text-gray-500 uppercase">Match</span></div><div className="bg-green-50 p-3 rounded-2xl"><span className="block text-2xl font-black text-green-600">{profiloAperto.vinte || 0}</span><span className="text-[9px] font-bold text-green-700 uppercase">Vittorie</span></div><div className="bg-red-50 p-3 rounded-2xl"><span className="block text-2xl font-black text-red-600">{profiloAperto.perse || 0}</span><span className="text-[9px] font-bold text-red-700 uppercase">Sconfitte</span></div></div>
                  </section>
                  <section>
                    <h3 className="text-sm font-black uppercase text-gray-400 tracking-widest mb-3">Top Partner</h3>
                    <div className="bg-white rounded-3xl p-5 shadow-sm border border-gray-100 flex flex-col gap-4">
                      {(() => {
                        const { partnerPreferiti } = calcolaStatisticheAvanzate(profiloAperto.id.toString());
                        if (partnerPreferiti.length === 0) return <p className="text-sm text-gray-400 font-bold text-center py-4">Nessuna statistica.</p>;
                        return partnerPreferiti.map((partner, i) => {
                          const partnerWinRate = Math.round((partner.vinteInsieme / partner.insieme) * 100);
                          return ( <div key={i} className="flex flex-col gap-1"><div className="flex justify-between items-end"><span className="font-black text-blue-900 uppercase text-sm">{partner.nome}</span><span className="text-[10px] font-bold text-gray-500">{partner.insieme} Match</span></div><div className="w-full bg-gray-100 rounded-full h-3 flex items-center relative overflow-hidden"><div className={`h-full transition-all duration-1000 ${partnerWinRate >= 50 ? 'bg-green-500' : 'bg-orange-500'}`} style={{ width: `${partnerWinRate}%` }}></div></div><span className={`text-[10px] font-black mt-0.5 text-right ${partnerWinRate >= 50 ? 'text-green-600' : 'text-orange-600'}`}>{partnerWinRate}% Vittorie</span></div> );
                        });
                      })()}
                    </div>
                  </section>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </main>
  )
}
