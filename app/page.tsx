'use client'
import { useEffect, useState, useRef } from 'react'
import { supabase } from '../lib/supabase'

export default function Home() {
  // ==========================================
  // 1. STATI GLOBALI
  // ==========================================
  const [giocatori, setGiocatori] = useState<any[]>([])
  const [partite, setPartite] = useState<any[]>([])
  const [user, setUser] = useState<any>(null)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [nuovoNome, setNuovoNome] = useState('')
  const [fileFoto, setFileFoto] = useState<File | null>(null)
  const [inviando, setInviando] = useState(false)
  const [mostraLogin, setMostraLogin] = useState(false)

  const [mioGiocatoreId, setMioGiocatoreId] = useState<string | null>(null)
  const [mioNome, setMioNome] = useState<string>('')

  // ==========================================
  // 2. STATI RISULTATO MATCH
  // ==========================================
  const [mostraFormPartita, setMostraFormPartita] = useState(false)
  const [vincitore1Id, setVincitore1Id] = useState('')
  const [vincitore2Id, setVincitore2Id] = useState('')
  const [sconfitto1Id, setSconfitto1Id] = useState('')
  const [sconfitto2Id, setSconfitto2Id] = useState('')
  const [risultatoMatch, setRisultatoMatch] = useState('')
  const [campoMatch, setCampoMatch] = useState('')
  const [noteMatch, setNoteMatch] = useState('')
  const [fotoMatch, setFotoMatch] = useState<File | null>(null)

  // ==========================================
  // 3. STATI PROFILO GIOCATORE (Modale)
  // ==========================================
  const [profiloAperto, setProfiloAperto] = useState<any>(null)
  const [isEditingProfilo, setIsEditingProfilo] = useState(false)
  const [editNome, setEditNome] = useState('')
  const [editFotoFile, setEditFotoFile] = useState<File | null>(null)
  const [editEta, setEditEta] = useState('')
  const [editLato, setEditLato] = useState('')
  const [editRacchetta, setEditRacchetta] = useState('')
  const [salvataggioInCorso, setSalvataggioInCorso] = useState(false)

  // ==========================================
  // 4. STATI NAVIGAZIONE E CHAT
  // ==========================================
  const [activeTab, setActiveTab] = useState<'RANKING' | 'CHAT' | 'PRENOTA' | 'EVENTI'>('RANKING')
  const [messaggi, setMessaggi] = useState<any[]>([])
  const [nuovoMessaggio, setNuovoMessaggio] = useState('')
  const chatEndRef = useRef<HTMLDivElement>(null)

  // ==========================================
  // 5. STATI PRENOTAZIONI CAMPI E INVITI
  // ==========================================
  const getOggiStr = () => { const d = new Date(); return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}` }
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
  const prossimiGiorni = Array.from({length: 7}).map((_, i) => { const d = new Date(); d.setDate(d.getDate() + i); return { dataStr: `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`, label: d.toLocaleDateString('it-IT', { weekday: 'short', day: '2-digit', month: 'short' }) } })

  // ==========================================
  // 6. STATI EVENTI & DASHBOARD
  // ==========================================
  const [eventi, setEventi] = useState<any[]>([])
  const [mostraFormEvento, setMostraFormEvento] = useState(false)
  const [nuovoEventoTitolo, setNuovoEventoTitolo] = useState('')
  const [nuovoEventoTipo, setNuovoEventoTipo] = useState('Americana')
  const [nuovoEventoData, setNuovoEventoData] = useState(getOggiStr())
  const [nuovoEventoMax, setNuovoEventoMax] = useState(5)

  const [dashboardEvento, setDashboardEvento] = useState<any>(null)
  const [evSqA1, setEvSqA1] = useState('')
  const [evSqA2, setEvSqA2] = useState('')
  const [evSqB1, setEvSqB1] = useState('')
  const [evSqB2, setEvSqB2] = useState('')
  const [evGameA, setEvGameA] = useState<number | ''>('')
  const [evGameB, setEvGameB] = useState<number | ''>('')
  // 👇 Nuovo stato per gestire il tabellone a fasi del Torneo
  const [evFase, setEvFase] = useState('Semifinale')

  // ==========================================
  // EFFECTS
  // ==========================================
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => setUser(session?.user ?? null))
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => setUser(session?.user ?? null))
    
    prendiGiocatori(); prendiPartite(); prendiMessaggi(); prendiPrenotazioni(); prendiEventi();

    const channelChat = supabase.channel('chat_spogliatoio').on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'messaggi' }, payload => { setMessaggi(c => [...c, payload.new]) }).subscribe()
    const channelPren = supabase.channel('prenotazioni_live').on('postgres_changes', { event: '*', schema: 'public', table: 'prenotazioni' }, () => { prendiPrenotazioni() }).subscribe()
    const channelEventi = supabase.channel('eventi_live').on('postgres_changes', { event: '*', schema: 'public', table: 'eventi' }, () => { prendiEventi(); if (dashboardEvento) ricaricaDashboard(dashboardEvento.id); }).subscribe()

    return () => { subscription.unsubscribe(); supabase.removeChannel(channelChat); supabase.removeChannel(channelPren); supabase.removeChannel(channelEventi); }
  }, [dashboardEvento])

  useEffect(() => { if (activeTab === 'CHAT') chatEndRef.current?.scrollIntoView({ behavior: 'smooth' }) }, [messaggi, activeTab])

  useEffect(() => {
    if (user && giocatori.length > 0) { const io = giocatori.find(g => g.user_id === user.id); if (io) { setMioGiocatoreId(io.id.toString()); setMioNome(io.Nome) } } 
    else { setMioGiocatoreId(null); setMioNome('') }
  }, [user, giocatori])

  // ==========================================
  // FETCH FUNZIONI
  // ==========================================
  const prendiGiocatori = async () => { const { data } = await supabase.from('giocatori').select('*').order('Punti', { ascending: false }); if (data) setGiocatori(data) }
  const prendiPartite = async () => { const { data } = await supabase.from('partite').select('*').order('created_at', { ascending: false }).limit(100); if (data) setPartite(data) }
  const prendiMessaggi = async () => { const { data } = await supabase.from('messaggi').select('*').order('created_at', { ascending: false }).limit(50); if (data) setMessaggi(data.reverse()) }
  const prendiPrenotazioni = async () => { const { data } = await supabase.from('prenotazioni').select('*').gte('data_slot', getOggiStr()); if (data) setPrenotazioni(data) }
  const prendiEventi = async () => { const { data } = await supabase.from('eventi').select('*').order('created_at', { ascending: false }); if (data) setEventi(data) }

  // ==========================================
  // AUTH E PROFILO
  // ==========================================
  const handleAuth = async (type: 'LOGIN'|'SIGNUP') => { const {error} = type==='LOGIN'?await supabase.auth.signInWithPassword({email,password}):await supabase.auth.signUp({email,password}); if(error)alert(error.message);else setMostraLogin(false) }
  const uploadFotoHelper = async (file:File, bucket='foto_giocatori') => { const nomeFile = `${Date.now()}_${user?.id||'guest'}_foto`; const {error} = await supabase.storage.from(bucket).upload(nomeFile,file); if(!error){const {data}=supabase.storage.from(bucket).getPublicUrl(nomeFile); return data.publicUrl} return null }
  const creaProfiloGiocatore = async () => { if(!nuovoNome.trim()||!user)return; setInviando(true); let urlFoto=""; if(fileFoto)urlFoto=await uploadFotoHelper(fileFoto)||""; const {error} = await supabase.from('giocatori').insert([{Nome:nuovoNome,Punti:0,user_id:user.id,foto:urlFoto,partite:0,vinte:0,perse:0}]); if(!error){setNuovoNome('');setFileFoto(null);prendiGiocatori();} setInviando(false) }
  
  const apriProfilo = (giocatore: any, index: number) => {
    setProfiloAperto({...giocatore, posizione: index + 1})
    setEditNome(giocatore.Nome || '')
    setEditEta(giocatore.eta ? giocatore.eta.toString() : '')
    setEditLato(giocatore.lato || '')
    setEditRacchetta(giocatore.racchetta || '')
    setIsEditingProfilo(false)
  }

  const salvaSchedaTecnica = async () => {
    if (!profiloAperto) return
    setSalvataggioInCorso(true)
    let updateData: any = { Nome: editNome, eta: editEta ? parseInt(editEta) : null, lato: editLato, racchetta: editRacchetta }
    if (editFotoFile) { const url = await uploadFotoHelper(editFotoFile); if (url) updateData.foto = url }
    const { error } = await supabase.from('giocatori').update(updateData).eq('id', profiloAperto.id)
    if (!error) { await prendiGiocatori(); setProfiloAperto((prev: any) => ({...prev, ...updateData, foto: updateData.foto || prev.foto})); setIsEditingProfilo(false); setEditFotoFile(null) } 
    else alert("Errore salvataggio: " + error.message)
    setSalvataggioInCorso(false)
  }

  // ==========================================
  // MATCH E ALGORITMO ELO
  // ==========================================
  const salvaMatch = async () => {
    if (!vincitore1Id||!vincitore2Id||!sconfitto1Id||!sconfitto2Id||!risultatoMatch.trim()) return alert("Dati mancanti!"); const setG = new Set([vincitore1Id,vincitore2Id,sconfitto1Id,sconfitto2Id]); if(setG.size!==4) return alert("Duplicati!"); 
    setInviando(true); const v1 = giocatori.find(g=>g.id.toString()===vincitore1Id); const v2 = giocatori.find(g=>g.id.toString()===vincitore2Id); const s1 = giocatori.find(g=>g.id.toString()===sconfitto1Id); const s2 = giocatori.find(g=>g.id.toString()===sconfitto2Id); 
    let u=""; if(fotoMatch)u=await uploadFotoHelper(fotoMatch)||""; 
    const {error}=await supabase.from('partite').insert([{vincitore:`${v1.Nome} & ${v2.Nome}`,sconfitto:`${s1.Nome} & ${s2.Nome}`,risultato:risultatoMatch,v1_id:v1.id.toString(),v2_id:v2.id.toString(),s1_id:s1.id.toString(),s2_id:s2.id.toString(),campo:campoMatch,note:noteMatch,foto:u,stato:'In attesa'}]); 
    if(!error){setVincitore1Id('');setVincitore2Id('');setSconfitto1Id('');setSconfitto2Id('');setRisultatoMatch('');setCampoMatch('');setNoteMatch('');setFotoMatch(null);setMostraFormPartita(false);prendiPartite();alert("Inviato!");} setInviando(false) 
  }

  const confermaMatch = async (match:any) => { 
    if(!confirm("Confermi? I punti verranno calcolati con l'algoritmo Elo."))return; 
    await supabase.from('partite').update({stato:'Confermato'}).eq('id',match.id); 
    const v1=giocatori.find(g=>g.id.toString()===match.v1_id); const v2=giocatori.find(g=>g.id.toString()===match.v2_id); const s1=giocatori.find(g=>g.id.toString()===match.s1_id); const s2=giocatori.find(g=>g.id.toString()===match.s2_id); 
    
    const rv=((v1?.Punti||0)+(v2?.Punti||0))/2; const rs=((s1?.Punti||0)+(s2?.Punti||0))/2; const diff=rs-rv; const pV=1/(1+Math.pow(10,diff/400)); 
    let pG=Math.max(10,Math.round(60*(1-pV))); let pP=Math.round(pG/2); 
    
    if(v1)await supabase.from('giocatori').update({Punti:(v1.Punti||0)+pG,partite:(v1.partite||0)+1,vinte:(v1.vinte||0)+1}).eq('id',v1.id); 
    if(v2)await supabase.from('giocatori').update({Punti:(v2.Punti||0)+pG,partite:(v2.partite||0)+1,vinte:(v2.vinte||0)+1}).eq('id',v2.id); 
    if(s1)await supabase.from('giocatori').update({Punti:Math.max(0,(s1.Punti||0)-pP),partite:(s1.partite||0)+1,perse:(s1.perse||0)+1}).eq('id',s1.id); 
    if(s2)await supabase.from('giocatori').update({Punti:Math.max(0,(s2.Punti||0)-pP),partite:(s2.partite||0)+1,perse:(s2.perse||0)+1}).eq('id',s2.id); 
    prendiGiocatori(); prendiPartite(); 
  }
  const contestaMatch = async (id:any)=>{const m=prompt("Motivo:"); if(!m)return; await supabase.from('partite').update({stato:`Contestato: ${m}`}).eq('id',id); prendiPartite()}; 
  const eliminaMatch = async (id:any)=>{if(!confirm("Eliminare?"))return; await supabase.from('partite').delete().eq('id',id); prendiPartite();}; 

  // ==========================================
  // CHAT SPOGLIATOIO
  // ==========================================
  const inviaMessaggioChat = async (e:any)=>{e.preventDefault(); if(!nuovoMessaggio.trim()||!mioGiocatoreId||!mioNome)return; await supabase.from('messaggi').insert([{mittente_id:mioGiocatoreId,mittente_nome:mioNome,testo:nuovoMessaggio}]); setNuovoMessaggio('');}
  
  // ==========================================
  // 🏅 GAMIFICATION: LIVELLI E BADGE
  // ==========================================
  const getLivello = (punti: number) => {
    if(punti < 200) return { nome: 'Principiante', icona: '🌱', bg: 'bg-green-100', text: 'text-green-700' };
    if(punti < 500) return { nome: 'Bandeja di Bronzo', icona: '🥉', bg: 'bg-orange-100', text: 'text-orange-800' };
    if(punti < 800) return { nome: 'Vibora d\'Argento', icona: '🥈', bg: 'bg-gray-200', text: 'text-gray-800' };
    return { nome: 'Por Tres d\'Oro', icona: '🥇', bg: 'bg-yellow-200', text: 'text-yellow-800' };
  }

  const calcolaWinRate = (v:number,g:number) => {if(!g)return 0;return Math.round((v/g)*100);}
  
  const getBadges = (g: any) => {
    const badges = [];
    if (g.partite >= 1) badges.push({ icon: '🎾', desc: 'Battesimo' });
    if (g.partite >= 10) badges.push({ icon: '🛡️', desc: 'Veterano' });
    if (g.partite >= 5 && calcolaWinRate(g.vinte, g.partite) >= 60) badges.push({ icon: '🔥', desc: 'Cecchino' });
    if (g.Punti >= 800) badges.push({ icon: '👑', desc: 'Top Player' });
    return badges;
  }

  const WinRateDonut = ({ vinte, giocate }: { vinte: number, giocate: number }) => {
    const winRate = calcolaWinRate(vinte, giocate); const radius = 36; const circumference = 2 * Math.PI * radius; const strokeDashoffset = circumference - (winRate / 100) * circumference;
    return (
      <div className="relative flex items-center justify-center">
        <svg className="transform -rotate-90 w-28 h-28 drop-shadow-md">
          <circle cx="56" cy="56" r={radius} stroke="#fee2e2" strokeWidth="12" fill="transparent" />
          <circle cx="56" cy="56" r={radius} stroke="#22c55e" strokeWidth="12" fill="transparent" strokeDasharray={circumference} strokeDashoffset={strokeDashoffset} className="transition-all duration-1000 ease-out" strokeLinecap="round" />
        </svg>
        <div className="absolute flex flex-col items-center justify-center text-center"><span className="text-2xl font-black text-blue-900 leading-none">{winRate}%</span><span className="text-[8px] font-bold text-gray-400 uppercase tracking-widest mt-1">Win Rate</span></div>
      </div>
    );
  };

  const calcolaStatisticheAvanzate = (giocatoreId: string) => {
    const p = partite.filter(x => x.stato === 'Confermato' && (x.v1_id === giocatoreId || x.v2_id === giocatoreId || x.s1_id === giocatoreId || x.s2_id === giocatoreId));
    const partnerCount: Record<string, { nome: string, insieme: number, vinteInsieme: number }> = {};
    p.forEach(x => { 
      const haVinto = x.v1_id === giocatoreId || x.v2_id === giocatoreId; let partnerId = null; 
      if (x.v1_id === giocatoreId) partnerId = x.v2_id; else if (x.v2_id === giocatoreId) partnerId = x.v1_id; else if (x.s1_id === giocatoreId) partnerId = x.s2_id; else if (x.s2_id === giocatoreId) partnerId = x.s1_id;
      if (partnerId) { const partner = giocatori.find(g => g.id.toString() === partnerId); if (partner) { if (!partnerCount[partnerId]) partnerCount[partnerId] = { nome: partner.Nome, insieme: 0, vinteInsieme: 0 }; partnerCount[partnerId].insieme += 1; if (haVinto) partnerCount[partnerId].vinteInsieme += 1; } }
    });
    return { partiteGiocatore: p, partnerPreferiti: Object.values(partnerCount).sort((a, b) => b.insieme - a.insieme).slice(0, 3) };
  }

  // ⚔️ CALCOLO TESTA A TESTA (Nemesi)
  const calcolaTestaATesta = (idAvversario: string) => {
    if (!mioGiocatoreId || idAvversario === mioGiocatoreId) return null;
    let giocateContro = 0; let vinteIo = 0; let vinteLui = 0;
    partite.forEach(p => {
      if (p.stato !== 'Confermato') return;
      const ioVincitore = p.v1_id === mioGiocatoreId || p.v2_id === mioGiocatoreId;
      const luiSconfitto = p.s1_id === idAvversario || p.s2_id === idAvversario;
      const luiVincitore = p.v1_id === idAvversario || p.v2_id === idAvversario;
      const ioSconfitto = p.s1_id === mioGiocatoreId || p.s2_id === mioGiocatoreId;

      if (ioVincitore && luiSconfitto) { giocateContro++; vinteIo++; }
      else if (luiVincitore && ioSconfitto) { giocateContro++; vinteLui++; }
    });
    if (giocateContro === 0) return null;
    return { giocateContro, vinteIo, vinteLui };
  }

  // ==========================================
  // PRENOTAZIONI E INVITI
  // ==========================================
  const prenotaSlot = async (slot:any) => { if(!mioGiocatoreId)return alert("Devi essere loggato!"); if(!confirm(`Bloccare ${slot.inizio}?`))return; setInviando(true); const {error}=await supabase.from('prenotazioni').insert([{campo:campoSelezionato,data_slot:giornoSelezionato,ora_inizio:slot.inizio,ora_fine:slot.fine,creatore_id:mioGiocatoreId,creatore_nome:mioNome,stato:'Prenotato'}]); if(!error)prendiPrenotazioni();else alert(error.message); setInviando(false); }
  const eliminaPrenotazione = async (id:any) => { if(!confirm("Cancellare?"))return; await supabase.from('prenotazioni').delete().eq('id',id); prendiPrenotazioni(); }
  const apriGestioneInviti = (p:any) => { setInvitoG2(p.g2_id||''); setInvitoG3(p.g3_id||''); setInvitoG4(p.g4_id||''); setGestioneInviti(p); }
  const salvaInviti = async () => { setInviando(true); const scelti=[invitoG2,invitoG3,invitoG4].filter(id=>id!==''); if(new Set(scelti).size!==scelti.length||scelti.includes(mioGiocatoreId!)){alert("Duplicati selezionati.");setInviando(false);return;} const {error}=await supabase.from('prenotazioni').update({g2_id:invitoG2||null,g2_stato:invitoG2?(gestioneInviti.g2_id===invitoG2?gestioneInviti.g2_stato:'In attesa'):null,g3_id:invitoG3||null,g3_stato:invitoG3?(gestioneInviti.g3_id===invitoG3?gestioneInviti.g3_stato:'In attesa'):null,g4_id:invitoG4||null,g4_stato:invitoG4?(gestioneInviti.g4_id===invitoG4?gestioneInviti.g4_stato:'In attesa'):null}).eq('id',gestioneInviti.id); if(!error){setGestioneInviti(null);prendiPrenotazioni();} setInviando(false); }
  const rispondiInvito = async (p:any, cS:string, r:'Accettato'|'Rifiutato', cI:string) => { setInviando(true); await supabase.from('prenotazioni').update(r==='Rifiutato'?{[cS]:null,[cI]:null}:{[cS]:r}).eq('id',p.id); prendiPrenotazioni(); setInviando(false); }
  const invitiPendenti = prenotazioni.filter(p=>(p.g2_id===mioGiocatoreId&&p.g2_stato==='In attesa')||(p.g3_id===mioGiocatoreId&&p.g3_stato==='In attesa')||(p.g4_id===mioGiocatoreId&&p.g4_stato==='In attesa'));

  // ==========================================
  // EVENTI, AMERICANE E TORNEI
  // ==========================================
  const creaEvento = async () => { if (!nuovoEventoTitolo.trim() || !mioGiocatoreId) return alert("Completa!"); setInviando(true); const { error } = await supabase.from('eventi').insert([{ titolo: nuovoEventoTitolo, tipo: nuovoEventoTipo, data_evento: nuovoEventoData, max_iscritti: nuovoEventoMax, creatore_id: mioGiocatoreId, iscritti: [mioGiocatoreId], stato: 'Aperto', partite_evento: [] }]); if (!error) { setMostraFormEvento(false); setNuovoEventoTitolo(''); prendiEventi(); alert("Creato!"); } setInviando(false); }
  const iscrivitiEvento = async (evento: any) => { if (!mioGiocatoreId) return; const is = evento.iscritti || []; if (is.length >= evento.max_iscritti) return alert("Pieno!"); if (is.includes(mioGiocatoreId)) return; await supabase.from('eventi').update({ iscritti: [...is, mioGiocatoreId] }).eq('id', evento.id); prendiEventi(); }
  const disiscrivitiEvento = async (evento: any) => { if (!mioGiocatoreId) return; await supabase.from('eventi').update({ iscritti: (evento.iscritti || []).filter((id:string)=>id!==mioGiocatoreId) }).eq('id', evento.id); prendiEventi(); }
  const eliminaEvento = async (eventoId: string) => { if (!confirm("Annullare?")) return; await supabase.from('eventi').delete().eq('id', eventoId); prendiEventi(); }

  const ricaricaDashboard = async (id: string) => { const { data } = await supabase.from('eventi').select('*').eq('id', id).single(); if (data) setDashboardEvento(data); }
  const avviaEvento = async (evento: any) => { if (!confirm("Chiudere le iscrizioni?")) return; await supabase.from('eventi').update({ stato: 'In Corso' }).eq('id', evento.id); prendiEventi(); }
  
  const aggiungiPartitaEvento = async () => {
    if (!evSqA1 || !evSqA2 || !evSqB1 || !evSqB2 || evGameA === '' || evGameB === '') return alert("Compila i risultati!");
    if (new Set([evSqA1, evSqA2, evSqB1, evSqB2]).size !== 4) return alert("Giocatore duplicato!");
    setInviando(true);
    
    // 👇 Modifica: Aggiungiamo la "fase" se è un Torneo
    const faseMatch = dashboardEvento.tipo === 'Torneo' ? evFase : 'Girone';
    const nuovaPartita = { id: Date.now().toString(), sqA: [evSqA1, evSqA2], sqB: [evSqB1, evSqB2], gameA: Number(evGameA), gameB: Number(evGameB), fase: faseMatch };
    
    const { error } = await supabase.from('eventi').update({ partite_evento: [...(dashboardEvento.partite_evento || []), nuovaPartita] }).eq('id', dashboardEvento.id);
    if (!error) { setEvSqA1(''); setEvSqA2(''); setEvSqB1(''); setEvSqB2(''); setEvGameA(''); setEvGameB(''); await ricaricaDashboard(dashboardEvento.id); } else alert(error.message);
    setInviando(false);
  }

  const calcolaClassificaAmericana = () => {
    if (!dashboardEvento) return [];
    let stats: Record<string, { nome: string, giocate: number, gameFatti: number, gameSubiti: number, vinte: number }> = {};
    (dashboardEvento.iscritti || []).forEach((id: string) => { const g = giocatori.find(x => x.id.toString() === id); stats[id] = { nome: g?.Nome || 'Sconosciuto', giocate: 0, gameFatti: 0, gameSubiti: 0, vinte: 0 }; });
    (dashboardEvento.partite_evento || []).forEach((p: any) => {
      p.sqA.forEach((id: string) => { if(stats[id]) { stats[id].giocate++; stats[id].gameFatti += p.gameA; stats[id].gameSubiti += p.gameB; if(p.gameA > p.gameB) stats[id].vinte++; } });
      p.sqB.forEach((id: string) => { if(stats[id]) { stats[id].giocate++; stats[id].gameFatti += p.gameB; stats[id].gameSubiti += p.gameA; if(p.gameB > p.gameA) stats[id].vinte++; } });
    });
    return Object.values(stats).sort((a, b) => b.gameFatti - a.gameFatti || (b.gameFatti - b.gameSubiti) - (a.gameFatti - a.gameSubiti));
  }

  // ==========================================
  // UI RENDER
  // ==========================================
  return (
    <main className="min-h-screen bg-[#005bb7] text-white p-4 sm:p-8 font-sans flex flex-col items-center overflow-x-hidden relative pb-36">
      
      {/* Sfondo Grafico */}
      <div className="fixed inset-0 pointer-events-none z-0 flex justify-center items-center overflow-hidden opacity-20">
        <div className="relative w-[200vw] h-[150vh] sm:w-[120vw] sm:h-[120vh] border-[6px] border-white -rotate-12 scale-110"><div className="absolute top-1/2 left-0 w-full h-[6px] bg-white -translate-y-1/2"></div><div className="absolute top-[25%] left-0 w-full h-[6px] bg-white"></div><div className="absolute top-[75%] left-0 w-full h-[6px] bg-white"></div><div className="absolute top-[25%] left-1/2 w-[6px] h-[50%] bg-white -translate-x-1/2"></div></div>
      </div>
      
      <div className="w-full max-w-lg relative z-10 flex flex-col min-h-full">
        
        {/* HEADER */}
        <div className="flex justify-end mb-6 shrink-0">
          {user ? ( <button onClick={() => supabase.auth.signOut()} className="text-[11px] font-bold text-blue-200 hover:text-white transition-colors bg-blue-900/60 px-4 py-2 rounded-full border border-blue-800/50">LOGOUT ({user.email})</button> ) : ( <button onClick={() => setMostraLogin(!mostraLogin)} className="bg-yellow-400 text-blue-900 px-5 py-2.5 rounded-full text-xs font-black uppercase shadow-lg active:scale-95">{mostraLogin ? 'Annulla' : 'Entra in Campo'}</button> )}
        </div>
        <div className="text-center mb-10 shrink-0">
          <h1 className="text-6xl md:text-8xl font-black italic text-yellow-400 drop-shadow-[0_5px_5px_rgba(0,0,0,0.3)] tracking-tighter">padelg<span className="text-white text-4xl">.</span></h1>
          <p className="text-blue-100 text-sm md:text-base font-bold tracking-widest uppercase mt-2 opacity-90 drop-shadow-md">Official Ranking</p>
        </div>
        
        {/* ============================== */}
        {/* 🏆 TAB 1: RANKING */}
        {/* ============================== */}
        {activeTab === 'RANKING' && (
          <div className="animate-in fade-in duration-300 flex-1">
            
            {mostraLogin && !user && ( <div className="bg-white p-8 rounded-3xl text-black mb-10 shadow-2xl"><h2 className="text-2xl font-black text-blue-900 mb-6 text-center">Accedi / Registrati</h2><input type="email" placeholder="Email" value={email} onChange={e=>setEmail(e.target.value)} className="w-full p-4 mb-3 bg-gray-50 rounded-2xl font-semibold outline-none border" /><input type="password" placeholder="Password" value={password} onChange={e=>setPassword(e.target.value)} className="w-full p-4 mb-6 bg-gray-50 rounded-2xl font-semibold outline-none border" /><div className="flex flex-col gap-3"><button onClick={()=>handleAuth('LOGIN')} className="w-full bg-blue-600 text-white p-4 rounded-2xl font-black uppercase text-sm">Accedi</button><button onClick={()=>handleAuth('SIGNUP')} className="w-full bg-blue-50 text-blue-700 p-4 rounded-2xl font-black uppercase text-sm">Crea account</button></div></div> )}
            {user && !giocatori.some(g=>g.user_id===user.id) && ( <div className="bg-gradient-to-br from-yellow-300 to-yellow-500 p-8 rounded-3xl text-blue-900 mb-10 shadow-2xl"><h2 className="text-xl font-black uppercase mb-4 text-center tracking-widest">Crea profilo</h2><input type="text" placeholder="Nome" value={nuovoNome} onChange={e=>setNuovoNome(e.target.value)} className="w-full p-4 mb-4 rounded-2xl font-black outline-none shadow-inner" /><button onClick={creaProfiloGiocatore} disabled={inviando} className="w-full bg-blue-900 text-white p-4 rounded-2xl font-black uppercase shadow-xl">{inviando?'Creazione...':'Entra'}</button></div> )}
            
            <div className="mb-12">
              <div className="flex items-center gap-4 mb-6 px-2"><h2 className="text-2xl font-black italic text-yellow-400">Leaderboard</h2><div className="h-1 flex-1 bg-gradient-to-r from-yellow-400 to-transparent rounded-full opacity-80"></div></div>
              <div className="flex flex-col gap-4">
                {giocatori.map((g, i) => {
                  const livello = getLivello(g.Punti || 0);
                  return (
                  <div key={g.id} onClick={()=>apriProfilo(g,i)} className="bg-white p-4 sm:p-5 rounded-3xl shadow-xl hover:-translate-y-1 transition-all duration-300 flex justify-between items-center group border border-blue-50 cursor-pointer">
                    <div className="flex items-center gap-3 sm:gap-4 flex-1 min-w-0">
                      <div className={`w-10 h-10 sm:w-12 sm:h-12 shrink-0 flex items-center justify-center rounded-2xl font-black text-lg sm:text-xl shadow-inner ${i===0?'bg-gradient-to-br from-yellow-300 to-yellow-500 text-blue-900 ring-4 ring-yellow-400/40':i===1?'bg-gray-200 text-gray-600':i===2?'bg-orange-200 text-orange-800':'bg-blue-50 text-blue-300'}`}>{i+1}</div>
                      {g.foto?(<img src={g.foto} className="w-14 h-14 sm:w-16 sm:h-16 rounded-full object-cover border-4 border-white shadow-md shrink-0"/>):(<div className="w-14 h-14 sm:w-16 sm:h-16 rounded-full bg-gradient-to-br from-blue-100 to-blue-200 flex items-center justify-center text-blue-400 font-black text-2xl border-4 border-white shadow-md shrink-0">?</div>)}
                      <div className="flex flex-col min-w-0 flex-1">
                        <span className="font-extrabold text-base sm:text-xl uppercase text-blue-900 break-words tracking-tight">{g.Nome}</span>
                        {/* 🏅 Badge Livello nella List */}
                        <span className={`text-[9px] font-black uppercase px-2 py-0.5 rounded-md inline-block w-max mt-0.5 ${livello.bg} ${livello.text}`}>{livello.icona} {livello.nome}</span>
                        <div className="w-full flex gap-3 text-[10px] sm:text-[11px] font-bold mt-1"><span className="text-gray-500">Match: {g.partite||0}</span><span className="text-green-600">V: {g.vinte||0}</span><span className="text-red-500">S: {g.perse||0}</span></div>
                      </div>
                    </div>
                    <div className="bg-blue-600 p-2 sm:p-3 rounded-2xl min-w-[70px] text-center shadow-lg"><span className="text-xl sm:text-2xl font-black text-white leading-none tracking-tight">{g.Punti}</span></div>
                  </div>
                )})}
              </div>
            </div>

            {user && giocatori.length > 3 && (
              <div className="mb-10">
                {!mostraFormPartita ? ( <button onClick={()=>setMostraFormPartita(true)} className="w-full bg-yellow-400 text-blue-900 p-5 rounded-3xl font-black uppercase text-sm shadow-xl hover:-translate-y-1 transition-all flex justify-center items-center gap-3"><span className="text-2xl">🎾</span> Inserisci Risultato</button> ) : (
                  <div className="bg-white p-6 sm:p-8 rounded-3xl text-black border border-gray-100 shadow-2xl">
                    <div className="flex justify-between items-center mb-6"><h3 className="font-black uppercase text-sm text-blue-900 tracking-widest">Risultato Passato</h3><button onClick={()=>setMostraFormPartita(false)} className="bg-gray-100 hover:bg-gray-200 text-gray-500 px-3 py-1 rounded-full font-bold text-xs">ANNULLA</button></div>
                    <div className="space-y-4 mb-6">
                      <div className="bg-blue-50 p-4 rounded-2xl border border-blue-100"><span className="text-xs font-black uppercase text-blue-800 mb-2 block">🏆 Vincenti</span><div className="flex gap-2"><select value={vincitore1Id} onChange={e=>setVincitore1Id(e.target.value)} className="w-1/2 p-3 bg-white rounded-xl font-bold text-sm outline-none border"><option value="">Gioc. 1</option>{giocatori.map(g=><option key={g.id} value={g.id}>{g.Nome}</option>)}</select><select value={vincitore2Id} onChange={e=>setVincitore2Id(e.target.value)} className="w-1/2 p-3 bg-white rounded-xl font-bold text-sm outline-none border"><option value="">Gioc. 2</option>{giocatori.map(g=><option key={g.id} value={g.id}>{g.Nome}</option>)}</select></div></div>
                      <div className="bg-gray-50 p-4 rounded-2xl border border-gray-200"><span className="text-xs font-black uppercase text-gray-500 mb-2 block">🥵 Sconfitti</span><div className="flex gap-2"><select value={sconfitto1Id} onChange={e=>setSconfitto1Id(e.target.value)} className="w-1/2 p-3 bg-white rounded-xl font-bold text-sm outline-none border"><option value="">Gioc. 1</option>{giocatori.map(g=><option key={g.id} value={g.id}>{g.Nome}</option>)}</select><select value={sconfitto2Id} onChange={e=>setSconfitto2Id(e.target.value)} className="w-1/2 p-3 bg-white rounded-xl font-bold text-sm outline-none border"><option value="">Gioc. 2</option>{giocatori.map(g=><option key={g.id} value={g.id}>{g.Nome}</option>)}</select></div></div>
                      <div className="grid grid-cols-2 gap-3"><input type="text" placeholder="Risultato Set" value={risultatoMatch} onChange={e=>setRisultatoMatch(e.target.value)} className="col-span-2 p-4 bg-gray-50 rounded-2xl font-bold text-center border border-gray-200 outline-none" /><input type="text" placeholder="Campo" value={campoMatch} onChange={e=>setCampoMatch(e.target.value)} className="p-4 bg-gray-50 rounded-2xl font-bold text-sm border border-gray-200 outline-none" /></div>
                    </div>
                    <button onClick={salvaMatch} disabled={inviando} className="w-full bg-blue-600 text-white p-4 rounded-2xl font-black uppercase shadow-lg disabled:opacity-50">{inviando?'Invio...':'Invia Risultato'}</button>
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
                      {sonoCoinvolto && p.stato?.includes('Contestato') && ( <div className="mt-3 pt-4 border-t border-white/10"><button onClick={() => eliminaMatch(p.id)} className="w-full bg-red-600 text-white py-3 rounded-xl text-xs font-black uppercase shadow-lg">🗑️ Elimina Risultato</button></div> )}
                    </div>
                  )})}
                </div>
              </div>
            )}
            <div className="h-32 w-full shrink-0"></div>
          </div>
        )}

        {/* ============================== */}
        {/* 📅 TAB 2: PRENOTA E INVITI */}
        {/* ============================== */}
        {activeTab === 'PRENOTA' && (
          <div className="animate-in fade-in slide-in-from-right-4 duration-300 flex-1">
             <div className="flex items-center gap-3 mb-6"><span className="text-3xl">📅</span><div><h2 className="text-2xl font-black italic text-yellow-400 leading-none">Prenota Campo</h2><p className="text-xs text-blue-200 font-bold uppercase">Gestione e Inviti</p></div></div>
             
             {/* INVITI PENDENTI */}
             {invitiPendenti.length > 0 && (
              <div className="bg-gradient-to-r from-yellow-400 to-yellow-500 rounded-3xl p-5 shadow-2xl mb-8 border border-yellow-300 animate-pulse">
                <h3 className="text-blue-900 font-black uppercase text-sm mb-3">📬 Sei stato convocato!</h3>
                <div className="flex flex-col gap-3">
                  {invitiPendenti.map(invito => {
                    const miaColonnaStato = invito.g2_id === mioGiocatoreId ? 'g2_stato' : (invito.g3_id === mioGiocatoreId ? 'g3_stato' : 'g4_stato');
                    const miaColonnaId = invito.g2_id === mioGiocatoreId ? 'g2_id' : (invito.g3_id === mioGiocatoreId ? 'g3_id' : 'g4_id');
                    return (
                      <div key={invito.id} className="bg-white/40 p-3 rounded-2xl backdrop-blur-md border border-white/50">
                        <p className="text-blue-900 font-bold text-sm leading-tight mb-2"><span className="font-black">{invito.creatore_nome}</span> ti ha invitato a giocare il <span className="font-black bg-white/50 px-1 rounded">{invito.data_slot.split('-').reverse().join('/')}</span> alle <span className="font-black bg-white/50 px-1 rounded">{invito.ora_inizio}</span> nel <span className="font-black">{invito.campo}</span>.</p>
                        <div className="flex gap-2"><button onClick={() => rispondiInvito(invito, miaColonnaStato, 'Accettato', miaColonnaId)} disabled={inviando} className="flex-1 bg-blue-600 text-white font-black text-xs py-2 rounded-xl uppercase shadow-md hover:bg-blue-700">Accetta</button><button onClick={() => rispondiInvito(invito, miaColonnaStato, 'Rifiutato', miaColonnaId)} disabled={inviando} className="flex-1 bg-red-500 text-white font-black text-xs py-2 rounded-xl uppercase shadow-md hover:bg-red-600">Rifiuta</button></div>
                      </div>
                    )
                  })}
                </div>
              </div>
            )}
             
             {/* SELETTORE DATA E CAMPO */}
             <div className="flex gap-2 overflow-x-auto pb-4 mb-4 scrollbar-hide snap-x">{prossimiGiorni.map((g, i) => ( <button key={i} onClick={()=>setGiornoSelezionato(g.dataStr)} className={`snap-center shrink-0 p-3 rounded-2xl flex flex-col items-center justify-center min-w-[80px] border transition-all ${giornoSelezionato===g.dataStr?'bg-yellow-400 text-blue-900 border-yellow-300 scale-105':'bg-white/10 text-white border-white/20 hover:bg-white/20'}`}><span className="text-xs font-bold uppercase mb-1 opacity-80">{i===0?'Oggi':i===1?'Domani':g.label.split(' ')[0]}</span><span className="text-xl font-black">{g.dataStr.split('-')[2]}</span></button> ))}</div>
             <div className="flex bg-blue-900/50 p-1 rounded-2xl backdrop-blur-md mb-6 border border-blue-800/50"><button onClick={()=>setCampoSelezionato('Campo 1')} className={`flex-1 py-3 rounded-xl font-black uppercase text-sm ${campoSelezionato==='Campo 1'?'bg-blue-600 text-white':'text-blue-200'}`}>Campo 1</button><button onClick={()=>setCampoSelezionato('Campo 2')} className={`flex-1 py-3 rounded-xl font-black uppercase text-sm ${campoSelezionato==='Campo 2'?'bg-blue-600 text-white':'text-blue-200'}`}>Campo 2</button></div>
             
             {/* LISTA SLOT */}
             <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-3xl p-2 flex flex-col gap-2">
                {slotGiornalieri.map((slot, idx) => {
                  const p = prenotazioni.find(x => x.campo === campoSelezionato && x.data_slot === giornoSelezionato && x.ora_inizio === slot.inizio);
                  const occ = !!p; const eMio = p && p.creatore_id === mioGiocatoreId;
                  let conf = 1; if(p?.g2_stato==='Accettato')conf++; if(p?.g3_stato==='Accettato')conf++; if(p?.g4_stato==='Accettato')conf++;
                  return (
                    <div key={idx} className={`flex flex-col p-4 rounded-2xl ${occ?(eMio?'bg-blue-800 border-blue-400/50':'bg-red-900/40 border-red-500/20 opacity-70'):'bg-white text-blue-900 shadow-sm'}`}>
                      <div className="flex justify-between items-center w-full"><div className="flex flex-col"><span className={`text-lg font-black ${occ?'text-white':'text-blue-900'}`}>{slot.inizio} - {slot.fine}</span>{occ && <span className="text-[10px] font-bold uppercase mt-1 text-gray-300">Da: {p.creatore_nome}</span>}</div>{!occ?<button onClick={()=>prenotaSlot(slot)} className="bg-yellow-400 text-blue-900 px-4 py-2 rounded-xl text-xs font-black uppercase">Prenota</button>:eMio?<button onClick={()=>eliminaPrenotazione(p.id)} className="bg-red-500 text-white px-3 py-1.5 rounded-lg text-[10px] font-black uppercase">Cancella</button>:<span className="text-xs font-bold uppercase text-red-300 bg-red-900/50 px-3 py-1.5 rounded-lg">Occupato</span>}</div>
                      {occ && eMio && (
                        <div className="mt-4 pt-3 border-t border-blue-700/50 flex flex-col gap-3">
                          <div className="flex items-center justify-between"><span className="text-[10px] uppercase font-bold text-blue-200">Stato Campo: {conf}/4</span><div className="flex gap-1">{[1,2,3,4].map(n => <div key={n} className={`w-3 h-3 rounded-full ${n<=conf?'bg-green-400':'bg-blue-900/50 border border-blue-400'}`}></div>)}</div></div>
                          {gestioneInviti?.id===p.id ? (
                            <div className="bg-white p-3 rounded-xl flex flex-col gap-2"><span className="text-xs font-black text-blue-900 uppercase text-center mb-1">Seleziona Compagni</span>{[ {label:'Gioc. 2',val:invitoG2,set:setInvitoG2,stato:p.g2_stato}, {label:'Gioc. 3',val:invitoG3,set:setInvitoG3,stato:p.g3_stato}, {label:'Gioc. 4',val:invitoG4,set:setInvitoG4,stato:p.g4_stato} ].map((c,i)=>( <div key={i} className="flex gap-2 items-center"><select value={c.val} onChange={e=>c.set(e.target.value)} disabled={c.stato==='Accettato'} className="flex-1 p-2 bg-gray-50 rounded-lg text-xs font-bold text-blue-900 border outline-none"><option value="">-- {c.label} --</option>{giocatori.map(g=>g.id.toString()!==mioGiocatoreId&&(<option key={g.id} value={g.id}>{g.Nome}</option>))}</select>{c.stato&&(<span className={`text-[9px] font-black uppercase px-2 py-1 rounded w-[60px] text-center ${c.stato==='Accettato'?'bg-green-100 text-green-700':c.stato==='Rifiutato'?'bg-red-100 text-red-700':'bg-yellow-100 text-yellow-700'}`}>{c.stato==='In attesa'?'Attesa':c.stato}</span>)}</div> ))} <div className="flex gap-2 mt-2"><button onClick={()=>setGestioneInviti(null)} className="flex-1 bg-gray-200 text-gray-600 text-xs py-2 rounded-lg font-black uppercase">Annulla</button><button onClick={salvaInviti} className="flex-1 bg-blue-600 text-white text-xs py-2 rounded-lg font-black uppercase">Invia Inviti</button></div></div>
                          ) : ( <button onClick={()=>apriGestioneInviti(p)} className="w-full bg-blue-600 text-white py-2 rounded-xl text-xs font-black uppercase">➕ Gestisci Giocatori</button> )}
                        </div>
                      )}
                    </div>
                  )
                })}
             </div>
             <div className="h-32 w-full shrink-0"></div>
          </div>
        )}

        {/* ============================== */}
        {/* 🏅 TAB 3: EVENTI E TORNEI */}
        {/* ============================== */}
        {activeTab === 'EVENTI' && (
          <div className="animate-in fade-in slide-in-from-right-4 duration-300 flex-1">
            <div className="flex items-center gap-3 mb-6"><span className="text-3xl">🏅</span><div><h2 className="text-2xl font-black italic text-yellow-400 leading-none">Bacheca Eventi</h2><p className="text-xs text-blue-200 font-bold uppercase">Tornei & Americane</p></div></div>

            {user && (
              <div className="mb-8">
                {!mostraFormEvento ? (
                  <button onClick={()=>setMostraFormEvento(true)} className="w-full bg-gradient-to-r from-yellow-400 to-yellow-500 text-blue-900 p-4 rounded-3xl font-black uppercase text-sm shadow-xl flex justify-center items-center gap-2 border border-yellow-300">➕ Organizza Evento</button>
                ) : (
                  <div className="bg-white p-6 rounded-3xl text-blue-900 shadow-2xl">
                    <div className="flex justify-between items-center mb-6"><h3 className="font-black uppercase text-sm tracking-widest">Nuova Locandina</h3><button onClick={()=>setMostraFormEvento(false)} className="bg-gray-100 text-gray-500 px-3 py-1 rounded-full font-bold text-xs">ANNULLA</button></div>
                    <div className="space-y-4 mb-6">
                      <div><label className="text-[10px] font-bold text-gray-500 uppercase ml-1">Nome Evento</label><input type="text" value={nuovoEventoTitolo} onChange={e=>setNuovoEventoTitolo(e.target.value)} className="w-full p-3 bg-gray-50 rounded-xl font-bold outline-none border border-gray-200" /></div>
                      <div className="flex gap-3">
                        <div className="w-1/2"><label className="text-[10px] font-bold text-gray-500 uppercase ml-1">Tipo</label><select value={nuovoEventoTipo} onChange={e=>setNuovoEventoTipo(e.target.value)} className="w-full p-3 bg-gray-50 rounded-xl font-bold outline-none border border-gray-200"><option value="Americana">Americana</option><option value="Torneo">Torneo</option></select></div>
                        <div className="w-1/2"><label className="text-[10px] font-bold text-gray-500 uppercase ml-1">Max Giocatori (min 5)</label><input type="number" min="5" value={nuovoEventoMax} onChange={e=>setNuovoEventoMax(Number(e.target.value))} className="w-full p-3 bg-gray-50 rounded-xl font-bold outline-none border border-gray-200" /></div>
                      </div>
                      <div><label className="text-[10px] font-bold text-gray-500 uppercase ml-1">Data</label><input type="date" value={nuovoEventoData} onChange={e=>setNuovoEventoData(e.target.value)} className="w-full p-3 bg-gray-50 rounded-xl font-bold outline-none border border-gray-200" /></div>
                    </div>
                    <button onClick={creaEvento} disabled={inviando} className="w-full bg-blue-600 text-white p-4 rounded-xl font-black uppercase shadow-lg">{inviando?'Creazione...':'Lancia Evento'}</button>
                  </div>
                )}
              </div>
            )}

            <div className="flex flex-col gap-5">
              {eventi.map(ev => {
                const iscritti = ev.iscritti || []; const isIscritto = iscritti.includes(mioGiocatoreId); const isPieno = iscritti.length >= ev.max_iscritti; const eMio = ev.creatore_id === mioGiocatoreId;
                return (
                  <div key={ev.id} className={`bg-white rounded-3xl overflow-hidden shadow-2xl flex flex-col relative border-2 ${ev.stato==='In Corso' ? 'border-yellow-400' : 'border-gray-100'}`}>
                    <div className="absolute top-4 right-4 flex gap-2">
                      {eMio && ev.stato === 'Aperto' && <button onClick={() => eliminaEvento(ev.id)} className="bg-red-500/90 hover:bg-red-600 text-white w-6 h-6 rounded-full flex items-center justify-center text-xs font-black shadow-md">✖</button>}
                      <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase shadow-md ${ev.stato === 'In Corso' ? 'bg-yellow-400 text-blue-900 animate-pulse' : 'bg-blue-900/90 text-yellow-400'}`}>{ev.stato === 'Aperto' ? ev.tipo : ev.stato}</span>
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
                            {iscritti.map((idIscritto: string) => { const gioc = giocatori.find(g => g.id.toString() === idIscritto); return gioc ? <span key={idIscritto} className="bg-gray-100 border border-gray-200 text-blue-900 px-2 py-1 rounded-lg text-[10px] font-bold shadow-sm">{gioc.Nome}</span> : null; })}
                          </div>
                        </div>
                      )}
                    </div>
                    <div className="bg-gray-50 p-4 flex flex-col gap-3 border-t border-gray-100">
                      {ev.stato === 'Aperto' && (
                        <>
                          {!user ? <button disabled className="w-full bg-gray-300 text-white py-3 rounded-xl text-xs font-black uppercase">Fai Log in</button> : isIscritto ? <button onClick={()=>disiscrivitiEvento(ev)} className="w-full bg-red-100 text-red-600 py-3 rounded-xl text-xs font-black uppercase">Ritirati</button> : isPieno ? <button disabled className="w-full bg-gray-300 text-white py-3 rounded-xl text-xs font-black uppercase">Posti Esauriti</button> : <button onClick={()=>iscrivitiEvento(ev)} className="w-full bg-green-500 text-white py-3 rounded-xl text-xs font-black uppercase shadow-md">✅ Iscriviti</button>}
                          {eMio && <button onClick={()=>avviaEvento(ev)} className="w-full mt-2 border-2 border-yellow-400 text-yellow-600 hover:bg-yellow-50 py-3 rounded-xl text-xs font-black uppercase">🚀 Avvia Evento</button>}
                        </>
                      )}
                      {ev.stato === 'In Corso' && ( <button onClick={()=>ricaricaDashboard(ev.id)} className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3 rounded-xl text-xs font-black uppercase shadow-md flex justify-center items-center gap-2">🎾 Apri Tabellone & Risultati</button> )}
                    </div>
                  </div>
                )
              })}
            </div>
            <div className="h-32 w-full shrink-0"></div>
          </div>
        )}

        {/* ============================== */}
        {/* 💬 TAB 4: CHAT SPOGLIATOIO */}
        {/* ============================== */}
        {activeTab === 'CHAT' && (
          <div className="animate-in fade-in slide-in-from-right-4 duration-300 flex flex-col h-[calc(100vh-160px)]">
            <div className="flex items-center gap-3 mb-4"><span className="text-3xl">💬</span><div><h2 className="text-2xl font-black italic text-yellow-400 leading-none">Spogliatoio</h2><p className="text-xs text-blue-200 font-bold uppercase">Chat Ufficiale</p></div></div>
            <div className="flex-1 bg-white/10 backdrop-blur-md rounded-3xl p-4 overflow-y-auto flex flex-col gap-3 border border-white/20 shadow-inner">
              {messaggi.length===0?(<div className="m-auto text-center text-blue-200 font-bold text-sm opacity-60">Nessun messaggio.</div>):messaggi.map((msg,i)=>{ const isMine=msg.mittente_id===mioGiocatoreId; return(<div key={msg.id||i} className={`flex flex-col w-3/4 max-w-[280px] ${isMine?'self-end items-end':'self-start items-start'}`}><span className="text-[10px] text-blue-200 font-bold mb-1 mx-1">{isMine?'Tu':msg.mittente_nome}</span><div className={`p-3 rounded-2xl shadow-md ${isMine?'bg-yellow-400 text-blue-900 rounded-tr-sm':'bg-white text-blue-900 rounded-tl-sm'}`}><p className="text-sm font-bold leading-snug">{msg.testo}</p></div><span className="text-[8px] text-blue-200/60 mt-1 mx-1 font-bold">{new Date(msg.created_at).toLocaleTimeString('it-IT',{hour:'2-digit',minute:'2-digit'})}</span></div>)})} <div ref={chatEndRef}/>
            </div>
            <div className="mt-4 mb-24 shrink-0"> 
              {user ? ( <form onSubmit={inviaMessaggioChat} className="flex gap-2"><input type="text" placeholder="Scrivi..." value={nuovoMessaggio} onChange={e=>setNuovoMessaggio(e.target.value)} className="flex-1 p-4 bg-white rounded-2xl text-blue-900 font-bold outline-none shadow-lg focus:border-yellow-400" /><button type="submit" disabled={!nuovoMessaggio.trim()} className="bg-yellow-400 text-blue-900 p-4 rounded-2xl font-black uppercase shadow-lg disabled:opacity-50">Invia</button></form> ) : ( <div className="bg-blue-900/60 p-4 rounded-2xl text-center border border-blue-800/50"><p className="text-xs font-bold text-yellow-400 uppercase">Devi fare l'accesso</p></div> )}
            </div>
          </div>
        )}

      </div>

      {/* ========================================= */}
      {/* 📱 BOTTOM NAVIGATION BAR A 4 PULSANTI */}
      {/* ========================================= */}
      <div className="fixed bottom-0 left-0 w-full bg-white/95 backdrop-blur-xl border-t border-gray-200 p-2 pb-6 sm:pb-2 z-40 flex justify-between items-center shadow-[0_-10px_40px_rgba(0,0,0,0.1)]">
        <button onClick={() => setActiveTab('RANKING')} className={`flex flex-col items-center gap-1 w-1/4 p-2 rounded-2xl transition-all ${activeTab === 'RANKING' ? 'text-blue-600 bg-blue-50' : 'text-gray-400 hover:text-blue-400'}`}><span className="text-2xl drop-shadow-sm">🏆</span><span className="text-[9px] font-black uppercase tracking-widest">Rank</span></button>
        <button onClick={() => setActiveTab('PRENOTA')} className={`flex flex-col items-center gap-1 w-1/4 p-2 rounded-2xl transition-all ${activeTab === 'PRENOTA' ? 'text-blue-600 bg-blue-50' : 'text-gray-400 hover:text-blue-400'}`}><span className="text-2xl drop-shadow-sm">📅</span><span className="text-[9px] font-black uppercase tracking-widest">Prenota</span></button>
        <button onClick={() => setActiveTab('EVENTI')} className={`flex flex-col items-center gap-1 w-1/4 p-2 rounded-2xl transition-all ${activeTab === 'EVENTI' ? 'text-blue-600 bg-blue-50' : 'text-gray-400 hover:text-blue-400'}`}><span className="text-2xl drop-shadow-sm">🏅</span><span className="text-[9px] font-black uppercase tracking-widest">Eventi</span></button>
        <button onClick={() => setActiveTab('CHAT')} className={`flex flex-col items-center gap-1 w-1/4 p-2 rounded-2xl transition-all ${activeTab === 'CHAT' ? 'text-blue-600 bg-blue-50' : 'text-gray-400 hover:text-blue-400'}`}><span className="text-2xl drop-shadow-sm">💬</span><span className="text-[9px] font-black uppercase tracking-widest">Chat</span></button>
      </div>

      {/* ========================================= */}
      {/* 🚀 MODALE: SCHEDA ATLETA (Con Gamification & Testa a Testa) */}
      {/* ========================================= */}
      {profiloAperto && (
        <div className="fixed inset-0 z-[70] bg-gray-50 overflow-y-auto flex justify-center animate-in fade-in">
          <div className="w-full max-w-2xl min-h-screen flex flex-col relative text-blue-900 pb-20"> 
            
            <div className="bg-blue-900 text-white p-6 sm:p-8 relative shadow-lg">
              <button onClick={() => setProfiloAperto(null)} className="absolute top-4 right-4 bg-white/20 hover:bg-white/40 p-2 rounded-full backdrop-blur-md z-10 transition-colors">✖️</button>
              
              {mioGiocatoreId === profiloAperto.id.toString() && !isEditingProfilo && (
                <button onClick={() => setIsEditingProfilo(true)} className="absolute top-4 right-16 bg-yellow-400 hover:bg-yellow-300 text-blue-900 px-3 py-1.5 rounded-lg text-xs font-black uppercase shadow-lg transition-colors z-10 flex items-center gap-1">✏️ Modifica</button>
              )}

              <div className="flex items-center gap-5 mt-4">
                {profiloAperto.foto ? ( <img src={profiloAperto.foto} className="w-24 h-24 rounded-full border-4 border-yellow-400 object-cover shadow-2xl shrink-0" /> ) : ( <div className="w-24 h-24 rounded-full bg-blue-800 flex items-center justify-center text-3xl font-black border-4 border-yellow-400 shadow-2xl shrink-0">?</div> )}
                
                <div className="flex-1">
                  <h2 className="text-3xl font-black uppercase tracking-tight leading-none break-words">{profiloAperto.Nome}</h2>
                  
                  {/* 🏅 GAMIFICATION: LIVELLO */}
                  {!isEditingProfilo && (
                    <div className="mt-1">
                      <span className={`text-[10px] font-black uppercase px-2 py-0.5 rounded-md inline-block ${getLivello(profiloAperto.Punti || 0).bg} ${getLivello(profiloAperto.Punti || 0).text}`}>
                        {getLivello(profiloAperto.Punti || 0).icona} {getLivello(profiloAperto.Punti || 0).nome}
                      </span>
                    </div>
                  )}

                  <div className="flex flex-wrap gap-2 mt-2">
                    <span className="bg-yellow-400 text-blue-900 px-3 py-1 rounded-lg text-xs font-black uppercase shadow-md">#{profiloAperto.posizione} Ranking</span>
                    <span className="bg-blue-800 border border-blue-700 px-3 py-1 rounded-lg text-xs font-black uppercase shadow-md">{profiloAperto.Punti} Pts</span>
                  </div>
                  
                  {!isEditingProfilo && (
                    <div className="flex flex-wrap gap-2 mt-3">
                      {profiloAperto.eta && <span className="bg-white/10 border border-white/20 px-2 py-1 rounded text-[10px] font-bold uppercase">🎂 {profiloAperto.eta} Anni</span>}
                      {profiloAperto.lato && <span className="bg-white/10 border border-white/20 px-2 py-1 rounded text-[10px] font-bold uppercase">🎾 {profiloAperto.lato}</span>}
                      {profiloAperto.racchetta && <span className="bg-white/10 border border-white/20 px-2 py-1 rounded text-[10px] font-bold uppercase">🏸 {profiloAperto.racchetta}</span>}
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className="p-6 space-y-8 flex-1 -mt-4 rounded-t-3xl bg-gray-50 relative z-20">
              
              {isEditingProfilo ? (
                <div className="bg-white p-6 rounded-3xl border border-gray-200 shadow-inner animate-in slide-in-from-top-4">
                  <h3 className="text-sm font-black uppercase text-blue-900 tracking-widest mb-4">Aggiorna Scheda Tecnica</h3>
                  <div className="space-y-4">
                    <div><label className="text-[10px] font-bold text-gray-500 uppercase ml-1">Nome Ufficiale</label><input type="text" value={editNome} onChange={(e) => setEditNome(e.target.value)} className="w-full p-3 bg-gray-50 rounded-xl font-bold border border-gray-200 outline-none" /></div>
                    <div className="flex gap-3"><div className="w-1/3"><label className="text-[10px] font-bold text-gray-500 uppercase ml-1">Età</label><input type="number" value={editEta} onChange={(e) => setEditEta(e.target.value)} className="w-full p-3 bg-gray-50 rounded-xl font-bold border border-gray-200 outline-none" /></div><div className="w-2/3"><label className="text-[10px] font-bold text-gray-500 uppercase ml-1">Lato Preferito</label><select value={editLato} onChange={(e) => setEditLato(e.target.value)} className="w-full p-3 bg-gray-50 rounded-xl font-bold border border-gray-200 outline-none text-blue-900 cursor-pointer"><option value="">Seleziona...</option><option value="Sinistra">Sinistra</option><option value="Destra">Destra</option><option value="Entrambi">Entrambi</option></select></div></div>
                    <div><label className="text-[10px] font-bold text-gray-500 uppercase ml-1">Racchetta Utilizzata</label><input type="text" value={editRacchetta} onChange={(e) => setEditRacchetta(e.target.value)} className="w-full p-3 bg-gray-50 rounded-xl font-bold border border-gray-200 outline-none" /></div>
                    <div><label className="text-[10px] font-bold text-gray-500 uppercase ml-1">Cambia Foto Profilo</label><input type="file" accept="image/*" onChange={(e) => setEditFotoFile(e.target.files?.[0] || null)} className="w-full p-2 bg-gray-50 rounded-xl text-xs border border-gray-200 cursor-pointer" /></div>
                    <div className="flex gap-3 mt-6 pt-4 border-t border-gray-100"><button onClick={() => setIsEditingProfilo(false)} className="flex-1 bg-gray-200 text-gray-700 py-3 rounded-xl font-black uppercase text-xs">Annulla</button><button onClick={salvaSchedaTecnica} disabled={salvataggioInCorso} className="flex-1 bg-green-500 text-white py-3 rounded-xl font-black uppercase text-xs shadow-md disabled:opacity-50">{salvataggioInCorso ? 'Salvataggio...' : 'Salva Profilo'}</button></div>
                  </div>
                </div>
              ) : (
                <>
                  {/* 🎖️ GAMIFICATION: I BADGES */}
                  {getBadges(profiloAperto).length > 0 && (
                    <section>
                      <h3 className="text-xs font-black uppercase text-gray-400 tracking-widest mb-3">Medagliere</h3>
                      <div className="flex flex-wrap gap-2">
                        {getBadges(profiloAperto).map((badge, i) => (
                          <div key={i} className="bg-white border border-gray-100 px-3 py-2 rounded-xl shadow-sm flex items-center gap-2">
                            <span className="text-xl">{badge.icon}</span>
                            <span className="text-[10px] font-black uppercase text-blue-900">{badge.desc}</span>
                          </div>
                        ))}
                      </div>
                    </section>
                  )}

                  {/* ⚔️ TESTA A TESTA (NEMESI) */}
                  {calcolaTestaATesta(profiloAperto.id.toString()) && (
                    <section>
                      <h3 className="text-xs font-black uppercase text-gray-400 tracking-widest mb-3">⚔️ Testa a Testa (vs Te)</h3>
                      <div className="bg-gradient-to-br from-blue-900 to-blue-800 rounded-3xl p-5 shadow-lg flex items-center justify-between border border-blue-700">
                        <div className="flex flex-col items-center">
                          <span className="text-[10px] font-bold text-blue-300 uppercase mb-1">Hai Vinto</span>
                          <span className="text-3xl font-black text-green-400 leading-none">{calcolaTestaATesta(profiloAperto.id.toString())?.vinteIo}</span>
                        </div>
                        <div className="flex flex-col items-center text-center">
                          <span className="text-[10px] font-bold text-gray-400 uppercase bg-blue-950 px-2 py-1 rounded-md">Tot: {calcolaTestaATesta(profiloAperto.id.toString())?.giocateContro} Match</span>
                        </div>
                        <div className="flex flex-col items-center">
                          <span className="text-[10px] font-bold text-blue-300 uppercase mb-1">Ha Vinto</span>
                          <span className="text-3xl font-black text-red-400 leading-none">{calcolaTestaATesta(profiloAperto.id.toString())?.vinteLui}</span>
                        </div>
                      </div>
                    </section>
                  )}

                  <section className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100 flex flex-col sm:flex-row items-center gap-6">
                    <div className="shrink-0"><WinRateDonut vinte={profiloAperto.vinte} giocate={profiloAperto.partite} /></div>
                    <div className="flex-1 grid grid-cols-3 gap-2 w-full text-center">
                      <div className="bg-gray-50 p-3 rounded-2xl"><span className="block text-2xl font-black text-blue-900">{profiloAperto.partite || 0}</span><span className="text-[9px] font-bold text-gray-500 uppercase">Match</span></div>
                      <div className="bg-green-50 p-3 rounded-2xl"><span className="block text-2xl font-black text-green-600">{profiloAperto.vinte || 0}</span><span className="text-[9px] font-bold text-green-700 uppercase">Vittorie</span></div>
                      <div className="bg-red-50 p-3 rounded-2xl"><span className="block text-2xl font-black text-red-600">{profiloAperto.perse || 0}</span><span className="text-[9px] font-bold text-red-700 uppercase">Sconfitte</span></div>
                    </div>
                  </section>

                  <section>
                    <h3 className="text-sm font-black uppercase text-gray-400 tracking-widest mb-3">Top Partner</h3>
                    <div className="bg-white rounded-3xl p-5 shadow-sm border border-gray-100 flex flex-col gap-4">
                      {(() => {
                        const { partnerPreferiti } = calcolaStatisticheAvanzate(profiloAperto.id.toString());
                        if (partnerPreferiti.length === 0) return <p className="text-sm text-gray-400 font-bold text-center py-4">Nessun dato.</p>;
                        return partnerPreferiti.map((partner, i) => {
                          const partnerWinRate = Math.round((partner.vinteInsieme / partner.insieme) * 100);
                          return (
                            <div key={i} className="flex flex-col gap-1">
                              <div className="flex justify-between items-end">
                                <span className="font-black text-blue-900 uppercase text-sm">{partner.nome}</span>
                                <span className="text-[10px] font-bold text-gray-500">{partner.insieme} Match giocati</span>
                              </div>
                              <div className="w-full bg-gray-100 rounded-full h-3 flex items-center relative overflow-hidden">
                                <div className={`h-full transition-all duration-1000 ${partnerWinRate >= 50 ? 'bg-green-500' : 'bg-orange-500'}`} style={{ width: `${partnerWinRate}%` }}></div>
                              </div>
                              <span className={`text-[10px] font-black mt-0.5 text-right ${partnerWinRate >= 50 ? 'text-green-600' : 'text-orange-600'}`}>{partnerWinRate}% Vinte insieme</span>
                            </div>
                          );
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

      {/* ========================================= */}
      {/* 🚀 MODALE: DASHBOARD EVENTO E TABELLONE */}
      {/* ========================================= */}
      {dashboardEvento && (
        <div className="fixed inset-0 z-[60] bg-gray-50 overflow-y-auto flex flex-col relative text-blue-900 animate-in slide-in-from-bottom-full">
          <div className="bg-blue-900 text-white p-6 relative shadow-lg shrink-0">
            <button onClick={() => setDashboardEvento(null)} className="absolute top-4 right-4 bg-white/20 hover:bg-white/40 p-2 rounded-full backdrop-blur-md">✖️</button>
            <h2 className="text-2xl font-black uppercase tracking-tight pr-10">{dashboardEvento.titolo}</h2>
            <span className="bg-yellow-400 text-blue-900 px-2 py-1 rounded-md text-[10px] font-black uppercase mt-2 inline-block">LIVE TABELLONE ({dashboardEvento.tipo})</span>
          </div>

          <div className="p-4 flex-1 flex flex-col gap-6 pb-24">
            
            {/* 👇 BIVIO: SE AMERICANA MOSTRA LA CLASSIFICA, SE TORNEO MOSTRA I TURNI 👇 */}
            {dashboardEvento.tipo === 'Americana' ? (
              <div className="bg-white rounded-3xl p-4 shadow-xl border border-gray-200">
                <h3 className="text-xs font-black uppercase text-gray-500 mb-3 text-center">Classifica Live (Game Fatti)</h3>
                <div className="flex flex-col gap-2">
                  {calcolaClassificaAmericana().map((stat, i) => (
                    <div key={i} className="flex items-center justify-between bg-gray-50 p-3 rounded-2xl border border-gray-100">
                      <div className="flex items-center gap-3">
                        <div className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-black ${i===0?'bg-yellow-400 text-blue-900':i===1?'bg-gray-300 text-gray-700':'bg-blue-100 text-blue-800'}`}>{i+1}</div>
                        <span className="font-bold text-sm uppercase text-blue-900">{stat.nome}</span>
                      </div>
                      <div className="flex items-center gap-3 text-right">
                        <div className="flex flex-col"><span className="text-[10px] font-bold text-gray-400 leading-none">Vinte</span><span className="text-xs font-black text-green-600">{stat.vinte}</span></div>
                        <div className="w-px h-6 bg-gray-200"></div>
                        <div className="flex flex-col"><span className="text-[10px] font-bold text-gray-400 leading-none">Game</span><span className="text-lg font-black text-blue-600 leading-none">{stat.gameFatti}</span></div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="bg-white rounded-3xl p-4 shadow-xl border border-gray-200">
                <h3 className="text-xs font-black uppercase text-gray-500 mb-3 text-center">Tabellone Torneo</h3>
                {['Finale', 'Semifinale', 'Quarti', 'Ottavi'].map(fase => {
                  const matchFase = (dashboardEvento.partite_evento || []).filter((p:any) => p.fase === fase);
                  if (matchFase.length === 0) return null;
                  
                  return (
                    <div key={fase} className="mb-4">
                      <h4 className="text-center font-black text-blue-800 bg-blue-100 rounded-md text-[10px] py-1 mb-2 uppercase">{fase}</h4>
                      <div className="flex flex-col gap-2">
                        {matchFase.map((p:any, i:number) => {
                          const nA1=giocatori.find(g=>g.id.toString()===p.sqA[0])?.Nome; const nA2=giocatori.find(g=>g.id.toString()===p.sqA[1])?.Nome;
                          const nB1=giocatori.find(g=>g.id.toString()===p.sqB[0])?.Nome; const nB2=giocatori.find(g=>g.id.toString()===p.sqB[1])?.Nome;
                          const vA = p.gameA > p.gameB; const vB = p.gameB > p.gameA;
                          return (
                            <div key={i} className="flex justify-between items-center bg-gray-50 p-3 rounded-2xl text-[10px] font-bold uppercase border border-gray-200">
                              <div className={`flex flex-col w-[40%] leading-tight ${vA?'text-green-700 font-black':'text-gray-400'}`}><span>{nA1}</span><span>{nA2}</span></div>
                              <div className="bg-white px-2 py-1 rounded shadow-sm border font-black text-lg w-[20%] text-center"><span className={vA?'text-green-600':'text-gray-500'}>{p.gameA}</span> - <span className={vB?'text-green-600':'text-gray-500'}>{p.gameB}</span></div>
                              <div className={`flex flex-col w-[40%] text-right leading-tight ${vB?'text-green-700 font-black':'text-gray-400'}`}><span>{nB1}</span><span>{nB2}</span></div>
                            </div>
                          )
                        })}
                      </div>
                    </div>
                  )
                })}
                {(dashboardEvento.partite_evento?.length === 0) && <p className="text-center text-[10px] font-bold text-gray-400">Nessuna partita registrata.</p>}
              </div>
            )}

            {/* INSERISCI RISULTATO (Sia Creatore che Iscritti) */}
            {(dashboardEvento.creatore_id === mioGiocatoreId || (dashboardEvento.iscritti || []).includes(mioGiocatoreId)) && (
              <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-3xl p-5 shadow-inner border border-blue-200">
                <h3 className="text-xs font-black uppercase text-blue-800 mb-4 text-center">Inserisci Risultato Match</h3>
                
                <div className="flex flex-col gap-4">
                  {/* 👇 SELETTORE FASE SOLO PER I TORNEI 👇 */}
                  {dashboardEvento.tipo === 'Torneo' && (
                    <div className="bg-white p-3 rounded-2xl shadow-sm border border-blue-100">
                      <span className="text-[10px] font-black uppercase text-blue-500 mb-1 block">Fase del Torneo</span>
                      <select value={evFase} onChange={e=>setEvFase(e.target.value)} className="w-full p-2 bg-gray-50 rounded-lg text-sm font-black text-blue-900 outline-none border cursor-pointer">
                        <option value="Ottavi">Ottavi di Finale</option>
                        <option value="Quarti">Quarti di Finale</option>
                        <option value="Semifinale">Semifinale</option>
                        <option value="Finale">Finale</option>
                      </select>
                    </div>
                  )}

                  <div className="bg-white p-3 rounded-2xl shadow-sm border border-blue-100">
                    <span className="text-[10px] font-black uppercase text-blue-500 mb-2 block">Squadra A</span>
                    <div className="flex gap-2">
                      <select value={evSqA1} onChange={e=>setEvSqA1(e.target.value)} className="w-1/2 p-2 bg-gray-50 rounded-lg text-xs font-bold outline-none border"><option value="">Gioc. 1</option>{(dashboardEvento.iscritti||[]).map((id:string)=>{const g=giocatori.find(x=>x.id.toString()===id); return g&&<option key={id} value={id}>{g.Nome}</option>})}</select>
                      <select value={evSqA2} onChange={e=>setEvSqA2(e.target.value)} className="w-1/2 p-2 bg-gray-50 rounded-lg text-xs font-bold outline-none border"><option value="">Gioc. 2</option>{(dashboardEvento.iscritti||[]).map((id:string)=>{const g=giocatori.find(x=>x.id.toString()===id); return g&&<option key={id} value={id}>{g.Nome}</option>})}</select>
                    </div>
                    <input type="number" placeholder="Game Vinti da Sq. A" value={evGameA} onChange={e=>setEvGameA(Number(e.target.value))} className="w-full mt-2 p-3 bg-gray-50 rounded-xl font-black text-center text-blue-900 border border-blue-200" />
                  </div>
                  <div className="bg-white p-3 rounded-2xl shadow-sm border border-orange-100">
                    <span className="text-[10px] font-black uppercase text-orange-500 mb-2 block">Squadra B</span>
                    <div className="flex gap-2">
                      <select value={evSqB1} onChange={e=>setEvSqB1(e.target.value)} className="w-1/2 p-2 bg-gray-50 rounded-lg text-xs font-bold outline-none border"><option value="">Gioc. 1</option>{(dashboardEvento.iscritti||[]).map((id:string)=>{const g=giocatori.find(x=>x.id.toString()===id); return g&&<option key={id} value={id}>{g.Nome}</option>})}</select>
                      <select value={evSqB2} onChange={e=>setEvSqB2(e.target.value)} className="w-1/2 p-2 bg-gray-50 rounded-lg text-xs font-bold outline-none border"><option value="">Gioc. 2</option>{(dashboardEvento.iscritti||[]).map((id:string)=>{const g=giocatori.find(x=>x.id.toString()===id); return g&&<option key={id} value={id}>{g.Nome}</option>})}</select>
                    </div>
                    <input type="number" placeholder="Game Vinti da Sq. B" value={evGameB} onChange={e=>setEvGameB(Number(e.target.value))} className="w-full mt-2 p-3 bg-gray-50 rounded-xl font-black text-center text-orange-900 border border-orange-200" />
                  </div>
                  <button onClick={aggiungiPartitaEvento} disabled={inviando} className="bg-blue-600 text-white p-4 rounded-xl font-black uppercase shadow-lg disabled:opacity-50">{inviando ? 'Salvataggio...' : '➕ Registra Risultato'}</button>
                </div>
              </div>
            )}

            {/* STORICO MATCH DELL'EVENTO (Solo se è Americana, nel torneo usiamo il tabellone sopra) */}
            {dashboardEvento.tipo === 'Americana' && dashboardEvento.partite_evento?.length > 0 && (
              <div className="bg-white rounded-3xl p-4 shadow-xl border border-gray-200 mt-2">
                <h3 className="text-xs font-black uppercase text-gray-500 mb-3 text-center">Tutte le partite giocate</h3>
                <div className="flex flex-col gap-2">
                  {(dashboardEvento.partite_evento||[]).map((p:any, i:number) => {
                    const nA1=giocatori.find(g=>g.id.toString()===p.sqA[0])?.Nome; const nA2=giocatori.find(g=>g.id.toString()===p.sqA[1])?.Nome;
                    const nB1=giocatori.find(g=>g.id.toString()===p.sqB[0])?.Nome; const nB2=giocatori.find(g=>g.id.toString()===p.sqB[1])?.Nome;
                    return (
                      <div key={i} className="flex justify-between items-center bg-gray-50 p-3 rounded-2xl text-[10px] font-bold uppercase border border-gray-100">
                        <div className="flex flex-col w-[40%] text-blue-900 leading-tight"><span>{nA1}</span><span>{nA2}</span></div>
                        <div className="bg-white px-2 py-1 rounded shadow-sm border font-black text-lg w-[20%] text-center"><span className="text-blue-600">{p.gameA}</span> - <span className="text-orange-600">{p.gameB}</span></div>
                        <div className="flex flex-col w-[40%] text-right text-orange-900 leading-tight"><span>{nB1}</span><span>{nB2}</span></div>
                      </div>
                    )
                  }).reverse()}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

    </main>
  )
}

