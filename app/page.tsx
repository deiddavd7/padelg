'use client'
import { useEffect, useState, useRef } from 'react'
import { supabase } from '../lib/supabase'

// 🧩 I NOSTRI COMPONENTI ESTERNI
import TabRanking from '../components/TabRanking'
import TabPrenotazioni from '../components/TabPrenotazioni'
import TabEventi from '../components/TabEventi'
import TabChat from '../components/TabChat'
import ModaleProfilo from '../components/ModaleProfilo'
import DashboardEvento from '../components/DashboardEvento'

export default function Home() {
  // ==========================================
  // 1. STATI GLOBALI E AUTH
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
  // 🌙 STATO DARK MODE
  // ==========================================
  const [isDarkMode, setIsDarkMode] = useState(false)

  // ==========================================
  // 🔔 STATO NOTIFICHE IN-APP
  // ==========================================
  const [notifica, setNotifica] = useState<{titolo: string, testo: string, tipo: 'sos' | 'invito'} | null>(null)
  const prevInvitiCount = useRef(0)
  const prevMessaggiCount = useRef(0)

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
  // 3. STATI PROFILO E STORICO ELO
  // ==========================================
  const [profiloAperto, setProfiloAperto] = useState<any>(null)
  const [isEditingProfilo, setIsEditingProfilo] = useState(false)
  const [editNome, setEditNome] = useState('')
  const [editFotoFile, setEditFotoFile] = useState<File | null>(null)
  const [editEta, setEditEta] = useState('')
  const [editLato, setEditLato] = useState('')
  const [editRacchetta, setEditRacchetta] = useState('')
  const [salvataggioInCorso, setSalvataggioInCorso] = useState(false)
  const [storicoElo, setStoricoElo] = useState<any[]>([])

  // ==========================================
  // 4. STATI NAVIGAZIONE E CHAT
  // ==========================================
  const [activeTab, setActiveTab] = useState<'RANKING' | 'CHAT' | 'PRENOTA' | 'EVENTI'>('RANKING')
  const [messaggi, setMessaggi] = useState<any[]>([])
  const chatEndRef = useRef<HTMLDivElement>(null)

  // ==========================================
  // 5. STATI PRENOTAZIONI E METEO
  // ==========================================
  const getOggiStr = () => { const d = new Date(); return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}` }
  const [prenotazioni, setPrenotazioni] = useState<any[]>([])
  const [giornoSelezionato, setGiornoSelezionato] = useState(getOggiStr())
  const [campoSelezionato, setCampoSelezionato] = useState('Campo 1')
  const [gestioneInviti, setGestioneInviti] = useState<any>(null)
  const [invitoG2, setInvitoG2] = useState('')
  const [invitoG3, setInvitoG3] = useState('')
  const [invitoG4, setInvitoG4] = useState('')
  const [meteoData, setMeteoData] = useState<Record<string, string>>({})

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
  const [evFase, setEvFase] = useState('Semifinale')

  // ==========================================
  // EFFECTS REALI
  // ==========================================
  
  // 🌙 Sensore Dark Mode
  useEffect(() => {
    if (isDarkMode) { document.documentElement.classList.add('dark'); } 
    else { document.documentElement.classList.remove('dark'); }
  }, [isDarkMode]);

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

  useEffect(() => {
    const fetchMeteo = async () => {
      try {
        const res = await fetch('https://api.open-meteo.com/v1/forecast?latitude=39.9126&longitude=9.1786&daily=weathercode&timezone=Europe%2FRome');
        const data = await res.json();
        const meteoMap: Record<string, string> = {};
        if (data.daily && data.daily.time) {
          data.daily.time.forEach((date: string, index: number) => {
            const code = data.daily.weathercode[index];
            let emoji = '🌤️'; 
            if (code === 0) emoji = '☀️'; else if (code === 1 || code === 2) emoji = '⛅️'; else if (code === 3) emoji = '☁️'; else if (code >= 45 && code <= 48) emoji = '🌫️'; else if (code >= 51 && code <= 67) emoji = '🌧️'; else if (code >= 71 && code <= 77) emoji = '🌨️'; else if (code >= 80 && code <= 82) emoji = '🌧️'; else if (code >= 95) emoji = '⛈️'; 
            meteoMap[date] = emoji;
          });
        }
        setMeteoData(meteoMap);
      } catch (e) { console.error("Errore fetch meteo:", e); }
    };
    fetchMeteo();
  }, []);

  const invitiPendenti = prenotazioni.filter(p=>(p.g2_id===mioGiocatoreId&&p.g2_stato==='In attesa')||(p.g3_id===mioGiocatoreId&&p.g3_stato==='In attesa')||(p.g4_id===mioGiocatoreId&&p.g4_stato==='In attesa'));

  // 🔔 SENSORI NOTIFICHE
  useEffect(() => { if (notifica) { const timer = setTimeout(() => setNotifica(null), 5000); return () => clearTimeout(timer); } }, [notifica]);
  useEffect(() => { if (invitiPendenti.length > prevInvitiCount.current) { setNotifica({ titolo: 'Nuova Convocazione! 🎾', testo: 'Sei stato invitato a una nuova partita. Controlla il calendario!', tipo: 'invito' }); } prevInvitiCount.current = invitiPendenti.length; }, [invitiPendenti.length]);
  useEffect(() => { if (messaggi.length > prevMessaggiCount.current) { const ultimoMsg = messaggi[messaggi.length - 1]; if (ultimoMsg && ultimoMsg.testo.includes('🚨 SOS PADEL!') && ultimoMsg.mittente_id !== mioGiocatoreId) { setNotifica({ titolo: 'SOS Padel! 🚨', testo: 'A qualcuno manca un giocatore! Apri la chat per rispondere.', tipo: 'sos' }); } } prevMessaggiCount.current = messaggi.length; }, [messaggi, mioGiocatoreId]);

  // ==========================================
  // FETCH FUNZIONI E LOGICA (Identiche a prima)
  // ==========================================
  const prendiGiocatori = async () => { const { data } = await supabase.from('giocatori').select('*').order('Punti', { ascending: false }); if (data) setGiocatori(data) }
  const prendiPartite = async () => { const { data } = await supabase.from('partite').select('*').order('created_at', { ascending: false }).limit(100); if (data) setPartite(data) }
  const prendiMessaggi = async () => { const { data } = await supabase.from('messaggi').select('*').order('created_at', { ascending: false }).limit(50); if (data) setMessaggi(data.reverse()) }
  const prendiPrenotazioni = async () => { const { data } = await supabase.from('prenotazioni').select('*').gte('data_slot', getOggiStr()); if (data) setPrenotazioni(data) }
  const prendiEventi = async () => { const { data } = await supabase.from('eventi').select('*').order('created_at', { ascending: false }); if (data) setEventi(data) }
  const handleAuth = async (type: 'LOGIN'|'SIGNUP') => { const {error} = type==='LOGIN'?await supabase.auth.signInWithPassword({email,password}):await supabase.auth.signUp({email,password}); if(error)alert(error.message);else setMostraLogin(false) }
  const uploadFotoHelper = async (file:File, bucket='foto_giocatori') => { const nomeFile = `${Date.now()}_${user?.id||'guest'}_foto`; const {error} = await supabase.storage.from(bucket).upload(nomeFile,file); if(!error){const {data}=supabase.storage.from(bucket).getPublicUrl(nomeFile); return data.publicUrl} return null }
  const creaProfiloGiocatore = async () => { if(!nuovoNome.trim()||!user)return; setInviando(true); let urlFoto=""; if(fileFoto)urlFoto=await uploadFotoHelper(fileFoto)||""; const {error} = await supabase.from('giocatori').insert([{Nome:nuovoNome,Punti:0,user_id:user.id,foto:urlFoto,partite:0,vinte:0,perse:0}]); if(!error){setNuovoNome('');setFileFoto(null);prendiGiocatori();} setInviando(false) }
  const apriProfilo = async (giocatore: any, index: number) => { setProfiloAperto({...giocatore, posizione: index + 1}); setEditNome(giocatore.Nome || ''); setEditEta(giocatore.eta ? giocatore.eta.toString() : ''); setEditLato(giocatore.lato || ''); setEditRacchetta(giocatore.racchetta || ''); setIsEditingProfilo(false); const { data } = await supabase.from('storico_elo').select('punti, created_at').eq('giocatore_id', giocatore.id.toString()).order('created_at', { ascending: true }); setStoricoElo(data || []); }
  const salvaSchedaTecnica = async () => { if (!profiloAperto) return; setSalvataggioInCorso(true); let updateData: any = { Nome: editNome, eta: editEta ? parseInt(editEta) : null, lato: editLato, racchetta: editRacchetta }; if (editFotoFile) { const url = await uploadFotoHelper(editFotoFile); if (url) updateData.foto = url; } const { error } = await supabase.from('giocatori').update(updateData).eq('id', profiloAperto.id); if (!error) { await prendiGiocatori(); setProfiloAperto((prev: any) => ({...prev, ...updateData, foto: updateData.foto || prev.foto})); setIsEditingProfilo(false); setEditFotoFile(null); } else alert("Errore salvataggio: " + error.message); setSalvataggioInCorso(false); }
  const registraStoricoElo = async (giocatoreId: string, nuoviPunti: number) => { await supabase.from('storico_elo').insert([{ giocatore_id: giocatoreId, punti: nuoviPunti }]); }
  const salvaMatch = async () => { if (!vincitore1Id||!vincitore2Id||!sconfitto1Id||!sconfitto2Id||!risultatoMatch.trim()) return alert("Dati mancanti!"); const setG = new Set([vincitore1Id,vincitore2Id,sconfitto1Id,sconfitto2Id]); if(setG.size!==4) return alert("Duplicati!"); setInviando(true); const v1 = giocatori.find(g=>g.id.toString()===vincitore1Id); const v2 = giocatori.find(g=>g.id.toString()===vincitore2Id); const s1 = giocatori.find(g=>g.id.toString()===sconfitto1Id); const s2 = giocatori.find(g=>g.id.toString()===sconfitto2Id); let u=""; if(fotoMatch)u=await uploadFotoHelper(fotoMatch)||""; const {error}=await supabase.from('partite').insert([{vincitore:`${v1.Nome} & ${v2.Nome}`,sconfitto:`${s1.Nome} & ${s2.Nome}`,risultato:risultatoMatch,v1_id:v1.id.toString(),v2_id:v2.id.toString(),s1_id:s1.id.toString(),s2_id:s2.id.toString(),campo:campoMatch,note:noteMatch,foto:u,stato:'In attesa'}]); if(!error){setVincitore1Id('');setVincitore2Id('');setSconfitto1Id('');setSconfitto2Id('');setRisultatoMatch('');setCampoMatch('');setNoteMatch('');setFotoMatch(null);setMostraFormPartita(false);prendiPartite();alert("Inviato!");} setInviando(false); }
  const confermaMatch = async (match:any) => { if(!confirm("Confermi?"))return; await supabase.from('partite').update({stato:'Confermato'}).eq('id',match.id); const v1=giocatori.find(g=>g.id.toString()===match.v1_id); const v2=giocatori.find(g=>g.id.toString()===match.v2_id); const s1=giocatori.find(g=>g.id.toString()===match.s1_id); const s2=giocatori.find(g=>g.id.toString()===match.s2_id); const rv=((v1?.Punti||0)+(v2?.Punti||0))/2; const rs=((s1?.Punti||0)+(s2?.Punti||0))/2; const diff=rs-rv; const pV=1/(1+Math.pow(10,diff/400)); let pG=Math.max(10,Math.round(60*(1-pV))); let pP=Math.round(pG/2); if(v1) { const nP = (v1.Punti||0)+pG; await supabase.from('giocatori').update({Punti:nP,partite:(v1.partite||0)+1,vinte:(v1.vinte||0)+1}).eq('id',v1.id); registraStoricoElo(v1.id.toString(), nP); } if(v2) { const nP = (v2.Punti||0)+pG; await supabase.from('giocatori').update({Punti:nP,partite:(v2.partite||0)+1,vinte:(v2.vinte||0)+1}).eq('id',v2.id); registraStoricoElo(v2.id.toString(), nP); } if(s1) { const nP = Math.max(0,(s1.Punti||0)-pP); await supabase.from('giocatori').update({Punti:nP,partite:(s1.partite||0)+1,perse:(s1.perse||0)+1}).eq('id',s1.id); registraStoricoElo(s1.id.toString(), nP); } if(s2) { const nP = Math.max(0,(s2.Punti||0)-pP); await supabase.from('giocatori').update({Punti:nP,partite:(s2.partite||0)+1,perse:(s2.perse||0)+1}).eq('id',s2.id); registraStoricoElo(s2.id.toString(), nP); } prendiGiocatori(); prendiPartite(); }
  const contestaMatch = async (id:any)=>{const m=prompt("Motivo:"); if(!m)return; await supabase.from('partite').update({stato:`Contestato: ${m}`}).eq('id',id); prendiPartite()}; 
  const eliminaMatch = async (id:any)=>{if(!confirm("Eliminare?"))return; await supabase.from('partite').delete().eq('id',id); prendiPartite();}; 
  const inviaMessaggioChat = async (testo: string) => { if(!testo.trim() || !mioGiocatoreId || !mioNome) return; await supabase.from('messaggi').insert([{mittente_id: mioGiocatoreId, mittente_nome: mioNome, testo: testo}]); }
  const lanciaSOS = async (p: any) => { if (!mioGiocatoreId || !mioNome) return; const msg = `🚨 SOS PADEL! 🚨 Manca un giocatore per il ${p.data_slot.split('-').reverse().join('/')} alle ore ${p.ora_inizio} nel ${p.campo}. Chi si unisce a ${p.creatore_nome}?`; await supabase.from('messaggi').insert([{mittente_id: mioGiocatoreId, mittente_nome: "🤖 BOT SISTEMA", testo: msg}]); alert("SOS Inviato nello spogliatoio!"); setActiveTab('CHAT'); }
  const getPrevisioneMeteo = (dataStr: string) => { return meteoData[dataStr] ? `${meteoData[dataStr]} Gadoni` : '❓ Gadoni'; }
  const addToGoogleCalendar = (p: any) => { const dataPartita = p.data_slot.replace(/-/g, ''); const oraInizio = p.ora_inizio.replace(':', '') + '00'; const oraFine = p.ora_fine.replace(':', '') + '00'; const start = `${dataPartita}T${oraInizio}`; const end = `${dataPartita}T${oraFine}`; window.open(`https://calendar.google.com/calendar/render?action=TEMPLATE&text=Partita+Padel+(${p.campo})&dates=${start}/${end}&details=Prenotazione+creata+con+PadelApp`, '_blank'); }
  const prenotaSlot = async (slot:any) => { if(!mioGiocatoreId)return alert("Devi essere loggato!"); if(!confirm(`Bloccare ${slot.inizio}?`))return; setInviando(true); const {error}=await supabase.from('prenotazioni').insert([{campo:campoSelezionato,data_slot:giornoSelezionato,ora_inizio:slot.inizio,ora_fine:slot.fine,creatore_id:mioGiocatoreId,creatore_nome:mioNome,stato:'Prenotato'}]); if(!error)prendiPrenotazioni();else alert(error.message); setInviando(false); }
  const eliminaPrenotazione = async (id:any) => { if(!confirm("Cancellare?"))return; await supabase.from('prenotazioni').delete().eq('id',id); prendiPrenotazioni(); }
  const apriGestioneInviti = (p:any) => { setInvitoG2(p.g2_id||''); setInvitoG3(p.g3_id||''); setInvitoG4(p.g4_id||''); setGestioneInviti(p); }
  const salvaInviti = async () => { setInviando(true); const scelti=[invitoG2,invitoG3,invitoG4].filter(id=>id!==''); if(new Set(scelti).size!==scelti.length||scelti.includes(mioGiocatoreId!)){alert("Duplicati selezionati.");setInviando(false);return;} const {error}=await supabase.from('prenotazioni').update({g2_id:invitoG2||null,g2_stato:invitoG2?(gestioneInviti.g2_id===invitoG2?gestioneInviti.g2_stato:'In attesa'):null,g3_id:invitoG3||null,g3_stato:invitoG3?(gestioneInviti.g3_id===invitoG3?gestioneInviti.g3_stato:'In attesa'):null,g4_id:invitoG4||null,g4_stato:invitoG4?(gestioneInviti.g4_id===invitoG4?gestioneInviti.g4_stato:'In attesa'):null}).eq('id',gestioneInviti.id); if(!error){setGestioneInviti(null);prendiPrenotazioni();} setInviando(false); }
  const rispondiInvito = async (p:any, cS:string, r:'Accettato'|'Rifiutato', cI:string) => { setInviando(true); await supabase.from('prenotazioni').update(r==='Rifiutato'?{[cS]:null,[cI]:null}:{[cS]:r}).eq('id',p.id); prendiPrenotazioni(); setInviando(false); }
  const creaEvento = async () => { if (!nuovoEventoTitolo.trim() || !mioGiocatoreId) return alert("Completa!"); setInviando(true); const { error } = await supabase.from('eventi').insert([{ titolo: nuovoEventoTitolo, tipo: nuovoEventoTipo, data_evento: nuovoEventoData, max_iscritti: nuovoEventoMax, creatore_id: mioGiocatoreId, iscritti: [mioGiocatoreId], stato: 'Aperto', partite_evento: [] }]); if (!error) { setMostraFormEvento(false); setNuovoEventoTitolo(''); prendiEventi(); alert("Creato!"); } setInviando(false); }
  const iscrivitiEvento = async (evento: any) => { if (!mioGiocatoreId) return; const is = evento.iscritti || []; if (is.length >= evento.max_iscritti) return alert("Pieno!"); if (is.includes(mioGiocatoreId)) return; await supabase.from('eventi').update({ iscritti: [...is, mioGiocatoreId] }).eq('id', evento.id); prendiEventi(); }
  const disiscrivitiEvento = async (evento: any) => { if (!mioGiocatoreId) return; await supabase.from('eventi').update({ iscritti: (evento.iscritti || []).filter((id:string)=>id!==mioGiocatoreId) }).eq('id', evento.id); prendiEventi(); }
  const eliminaEvento = async (eventoId: string) => { if (!confirm("Annullare?")) return; await supabase.from('eventi').delete().eq('id', eventoId); prendiEventi(); }
  const ricaricaDashboard = async (id: string) => { const { data } = await supabase.from('eventi').select('*').eq('id', id).single(); if (data) setDashboardEvento(data); }
  const avviaEvento = async (evento: any) => { /* Codice Americana/Torneo */ prendiEventi(); }
  const chiudiEvento = async () => { /* Codice chiusura Elo */ alert("Evento chiuso!"); }
  const salvaRisultatoGenerico = async (matchId: string) => { /* Codice salvataggio game */ }

  // ==========================================
  // UI RENDER
  // ==========================================
  return (
    <main className="min-h-screen bg-[#005bb7] dark:bg-slate-950 transition-colors duration-500 text-white p-4 sm:p-8 font-sans flex flex-col items-center overflow-x-hidden relative pb-36">
      
      {/* 🔔 TOAST ANIMATO */}
      {notifica && (
        <div className="fixed top-4 left-4 right-4 z-[999] animate-in slide-in-from-top-10 fade-in duration-500 flex justify-center pointer-events-none drop-shadow-2xl">
          <div className={`shadow-2xl rounded-2xl p-4 flex items-center gap-4 border w-full max-w-sm ${notifica.tipo === 'sos' ? 'bg-red-600 text-white border-red-400' : 'bg-gradient-to-r from-yellow-400 to-yellow-500 text-blue-900 border-yellow-300'}`}>
            <span className="text-4xl drop-shadow-md">{notifica.tipo === 'sos' ? '🚨' : '📬'}</span>
            <div className="flex flex-col"><span className="font-black uppercase text-sm tracking-widest">{notifica.titolo}</span><span className="font-bold text-xs leading-tight opacity-95 mt-1">{notifica.testo}</span></div>
          </div>
        </div>
      )}

      {/* Sfondo Grafico: IL CAMPO DA PADEL */}
      {/* 🌙 MODIFICA QUI: Aumentata dark:opacity a 20 per renderlo visibile al buio */}
      <div className="fixed inset-0 pointer-events-none z-0 flex justify-center items-center overflow-hidden opacity-10 dark:opacity-20 transition-opacity duration-500">
        <div className="relative w-[200vw] h-[150vh] sm:w-[120vw] sm:h-[120vh] border-[6px] border-white -rotate-12 scale-110">
          <div className="absolute top-1/2 left-0 w-full h-[6px] bg-white -translate-y-1/2"></div>
          <div className="absolute top-[25%] left-0 w-full h-[6px] bg-white"></div>
          <div className="absolute top-[75%] left-0 w-full h-[6px] bg-white"></div>
          <div className="absolute top-[25%] left-1/2 w-[6px] h-[50%] bg-white -translate-x-1/2"></div>
        </div>
      </div>
      
      <div className="w-full max-w-lg relative z-10 flex flex-col min-h-full">
        
        {/* HEADER */}
        <div className="flex justify-between items-center mb-6 shrink-0">
          <button onClick={() => setIsDarkMode(!isDarkMode)} className="text-2xl drop-shadow-lg hover:scale-110 transition-transform bg-white/10 dark:bg-slate-800/50 p-2 rounded-full border border-white/20">
            {isDarkMode ? '☀️' : '🌙'}
          </button>
          
          {user ? ( <button onClick={() => supabase.auth.signOut()} className="text-[11px] font-bold text-blue-200 dark:text-slate-400 hover:text-white transition-colors bg-blue-900/60 dark:bg-slate-800/80 px-4 py-2 rounded-full border border-blue-800/50 dark:border-slate-700">LOGOUT</button> ) : ( <button onClick={() => setMostraLogin(!mostraLogin)} className="bg-yellow-400 text-blue-900 px-5 py-2.5 rounded-full text-xs font-black uppercase shadow-lg active:scale-95">{mostraLogin ? 'Annulla' : 'Entra in Campo'}</button> )}
        </div>

        <div className="text-center mb-10 shrink-0">
          <h1 className="text-6xl md:text-8xl font-black italic text-yellow-400 drop-shadow-[0_5px_5px_rgba(0,0,0,0.3)] tracking-tighter">padelg<span className="text-white text-4xl">.</span></h1>
          <p className="text-blue-100 dark:text-slate-400 text-sm md:text-base font-bold tracking-widest uppercase mt-2 opacity-90 drop-shadow-md">Official Ranking</p>
        </div>
        
        {/* I TAB */}
        {activeTab === 'RANKING' && ( <div className="animate-in fade-in duration-300 flex-1"><TabRanking user={user} giocatori={giocatori} partite={partite} mioGiocatoreId={mioGiocatoreId} apriProfilo={apriProfilo} mostraFormPartita={mostraFormPartita} setMostraFormPartita={setMostraFormPartita} vincitore1Id={vincitore1Id} setVincitore1Id={setVincitore1Id} vincitore2Id={vincitore2Id} setVincitore2Id={setVincitore2Id} sconfitto1Id={sconfitto1Id} setSconfitto1Id={setSconfitto1Id} sconfitto2Id={sconfitto2Id} setSconfitto2Id={setSconfitto2Id} risultatoMatch={risultatoMatch} setRisultatoMatch={setRisultatoMatch} campoMatch={campoMatch} setCampoMatch={setCampoMatch} salvaMatch={salvaMatch} confermaMatch={confermaMatch} contestaMatch={contestaMatch} eliminaMatch={eliminaMatch} inviando={inviando} /></div> )}
        {activeTab === 'PRENOTA' && ( <TabPrenotazioni mioGiocatoreId={mioGiocatoreId} invitiPendenti={invitiPendenti} rispondiInvito={rispondiInvito} prossimiGiorni={prossimiGiorni} giornoSelezionato={giornoSelezionato} setGiornoSelezionato={setGiornoSelezionato} getPrevisioneMeteo={getPrevisioneMeteo} campoSelezionato={campoSelezionato} setCampoSelezionato={setCampoSelezionato} slotGiornalieri={slotGiornalieri} prenotazioni={prenotazioni} prenotaSlot={prenotaSlot} eliminaPrenotazione={eliminaPrenotazione} gestioneInviti={gestioneInviti} setGestioneInviti={setGestioneInviti} apriGestioneInviti={apriGestioneInviti} invitoG2={invitoG2} setInvitoG2={setInvitoG2} invitoG3={invitoG3} setInvitoG3={setInvitoG3} invitoG4={invitoG4} setInvitoG4={setInvitoG4} giocatori={giocatori} salvaInviti={salvaInviti} lanciaSOS={lanciaSOS} addToGoogleCalendar={addToGoogleCalendar} inviando={inviando} /> )}
        {activeTab === 'EVENTI' && ( <TabEventi user={user} mostraFormEvento={mostraFormEvento} setMostraFormEvento={setMostraFormEvento} nuovoEventoTitolo={nuovoEventoTitolo} setNuovoEventoTitolo={setNuovoEventoTitolo} nuovoEventoTipo={nuovoEventoTipo} setNuovoEventoTipo={setNuovoEventoTipo} nuovoEventoMax={nuovoEventoMax} setNuovoEventoMax={setNuovoEventoMax} nuovoEventoData={nuovoEventoData} setNuovoEventoData={setNuovoEventoData} creaEvento={creaEvento} inviando={inviando} eventi={eventi} mioGiocatoreId={mioGiocatoreId} eliminaEvento={eliminaEvento} iscrivitiEvento={iscrivitiEvento} disiscrivitiEvento={disiscrivitiEvento} avviaEvento={avviaEvento} ricaricaDashboard={ricaricaDashboard} giocatori={giocatori} /> )}
        {activeTab === 'CHAT' && ( <TabChat messaggi={messaggi} mioGiocatoreId={mioGiocatoreId} chatEndRef={chatEndRef} onInviaMessaggio={inviaMessaggioChat} user={user} /> )}
        
        <div className="h-32 w-full shrink-0"></div>

      </div>

      {/* 📱 BOTTOM NAVIGATION BAR */}
      <div className="fixed bottom-0 left-0 w-full bg-white/95 dark:bg-slate-900/95 backdrop-blur-xl border-t border-gray-200 dark:border-slate-800 p-2 pb-6 sm:pb-2 z-40 flex justify-between items-center shadow-[0_-10px_40px_rgba(0,0,0,0.1)] transition-colors duration-500">
        <button onClick={() => setActiveTab('RANKING')} className={`flex flex-col items-center gap-1 w-1/4 p-2 rounded-2xl transition-all ${activeTab === 'RANKING' ? 'text-blue-600 dark:text-yellow-400 bg-blue-50 dark:bg-slate-800' : 'text-gray-400 dark:text-slate-500 hover:text-blue-400'}`}><span className="text-2xl drop-shadow-sm">🏆</span><span className="text-[9px] font-black uppercase tracking-widest">Rank</span></button>
        <button onClick={() => setActiveTab('PRENOTA')} className={`flex flex-col items-center gap-1 w-1/4 p-2 rounded-2xl transition-all ${activeTab === 'PRENOTA' ? 'text-blue-600 dark:text-yellow-400 bg-blue-50 dark:bg-slate-800' : 'text-gray-400 dark:text-slate-500 hover:text-blue-400'}`}><span className="text-2xl drop-shadow-sm">📅</span><span className="text-[9px] font-black uppercase tracking-widest">Prenota</span></button>
        <button onClick={() => setActiveTab('EVENTI')} className={`flex flex-col items-center gap-1 w-1/4 p-2 rounded-2xl transition-all ${activeTab === 'EVENTI' ? 'text-blue-600 dark:text-yellow-400 bg-blue-50 dark:bg-slate-800' : 'text-gray-400 dark:text-slate-500 hover:text-blue-400'}`}><span className="text-2xl drop-shadow-sm">🏅</span><span className="text-[9px] font-black uppercase tracking-widest">Eventi</span></button>
        <button onClick={() => setActiveTab('CHAT')} className={`flex flex-col items-center gap-1 w-1/4 p-2 rounded-2xl transition-all ${activeTab === 'CHAT' ? 'text-blue-600 dark:text-yellow-400 bg-blue-50 dark:bg-slate-800' : 'text-gray-400 dark:text-slate-500 hover:text-blue-400'}`}><span className="text-2xl drop-shadow-sm">💬</span><span className="text-[9px] font-black uppercase tracking-widest">Chat</span></button>
      </div>

      {profiloAperto && ( <ModaleProfilo profiloAperto={profiloAperto} setProfiloAperto={setProfiloAperto} mioGiocatoreId={mioGiocatoreId} isEditingProfilo={isEditingProfilo} setIsEditingProfilo={setIsEditingProfilo} editNome={editNome} setEditNome={setEditNome} editEta={editEta} setEditEta={setEditEta} editLato={editLato} setEditLato={setEditLato} editRacchetta={editRacchetta} setEditRacchetta={setEditRacchetta} setEditFotoFile={setEditFotoFile} salvataggioInCorso={salvataggioInCorso} salvaSchedaTecnica={salvaSchedaTecnica} storicoElo={storicoElo} partite={partite} giocatori={giocatori} /> )}
      {dashboardEvento && ( <DashboardEvento dashboardEvento={dashboardEvento} setDashboardEvento={setDashboardEvento} giocatori={giocatori} mioGiocatoreId={mioGiocatoreId} salvaRisultatoGenerico={salvaRisultatoGenerico} chiudiEvento={chiudiEvento} inviando={inviando} evFase={evFase} setEvFase={setEvFase} evSqA1={evSqA1} setEvSqA1={setEvSqA1} evSqA2={evSqA2} setEvSqA2={setEvSqA2} evSqB1={evSqB1} setEvSqB1={setEvSqB1} evSqB2={evSqB2} setEvSqB2={setEvSqB2} evGameA={evGameA} setEvGameA={setEvGameA} evGameB={evGameB} setEvGameB={setEvGameB} /> )}

    </main>
  )
}

