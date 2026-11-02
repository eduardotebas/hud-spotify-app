// Configurações do Bluetooth BLE (ESP32)
/*const SERVICE_UUID = "4fafc201-1fb5-459e-8fcc-c5c9c331914b";
const CHARACTERISTIC_UUID = "beb5483e-36e1-4688-b7f5-ea07361b26a8";

let bleCharacteristic;
let deviceConnected = false;

// 1. Conectar ao ESP32 via Bluetooth BLE
document.getElementById('connectBtn').addEventListener('click', async () => {
    try {
        document.getElementById('status').innerText = "Buscando HUD...";
        const device = await navigator.bluetooth.requestDevice({
            filters: [{ name: 'HUD-Carro' }],
            optionalServices: [SERVICE_UUID]
        });

        const server = await device.gatt.connect();
        const service = await server.getPrimaryService(SERVICE_UUID);
        bleCharacteristic = await service.getCharacteristic(CHARACTERISTIC_UUID);

        deviceConnected = true;
        const statusDiv = document.getElementById('status');
        statusDiv.innerText = "Status: Conectado ao HUD!";
        statusDiv.className = "connected";

        enviarParaHUD("HUD Pronto!");
    } catch (error) {
        document.getElementById('status').innerText = "Erro no Bluetooth: " + error;
    }
});

// 2. Enviar texto da letra para o ESP32 via Bluetooth
async function enviarParaHUD(texto) {
    if (bleCharacteristic && deviceConnected) {
        try {
            let encoder = new TextEncoder('utf-8');
            await bleCharacteristic.writeValue(encoder.encode(texto));
        } catch (error) {
            console.error("Erro ao enviar dado via BLE:", error);
        }
    }
}

// ==========================================
// 3. CONFIGURAÇÃO DA API DO SPOTIFY (Definitiva)
// ==========================================
const CLIENT_ID = "a71bf171fc514af1ae2fbad876340f25";
const REDIRECT_URI = "http://127.0.0.1:5500/hud-spotify-app/index.html";
const SCOPES = "user-read-currently-playing user-read-playback-state";

document.getElementById('loginSpotify').addEventListener('click', () => {
    // Garante rigorosamente o uso de 'response_type=code' exigido pelo seu App do Spotify
    const authUrl = `https://accounts.spotify.com/authorize?client_id=${CLIENT_ID}&redirect_uri=${encodeURIComponent(REDIRECT_URI)}&scope=${encodeURIComponent(SCOPES)}&response_type=code&show_dialog=true`;
    window.location.href = authUrl;
});

// Inicialização e tratamento de retorno do Spotify
window.onload = function () {
    const urlParams = new URLSearchParams(window.location.search);
    let authCode = urlParams.get('code');
    let errorParam = urlParams.get('error');

    if (errorParam) {
        document.getElementById('songInfo').innerText = "Erro na autenticação do Spotify: " + errorParam;
        return;
    }

    if (authCode) {
        // Sucesso! O Spotify redirecionou de volta com o código de autorização
        document.getElementById('songInfo').innerText = "Spotify Autorizado com Sucesso! (Modo Ativo)";
        console.log("Código de Autorização capturado com sucesso:", authCode);

        // Limpa a URL para remover o ?code= da barra de endereços de forma limpa
        window.history.replaceState({}, document.title, window.location.pathname);

        // Dispara a simulação da música do Naritos para validar o ciclo visual e o HUD
        configurarModoSimulacao();
    } else {
        // Estado inicial (sem login ainda): exibe o estado padrão e aguarda a ação
        document.getElementById('songInfo').innerText = "Clique em Conectar para iniciar";
    }
};

// 4. Modo de Simulação Oficial ("Tudo Vai Dar Certo" - Naritos)
function configurarModoSimulacao() {
    const letraNaritos = [
        { tempo: 0, texto: "♪ Intro ♪" },
        { tempo: 4, texto: "Tudo vai dar certo..." },
        { tempo: 8, texto: "Fé em Deus e marcha" },
        { tempo: 12, texto: "O som tá batendo" },
        { tempo: 16, texto: "E a nave passa" }
    ];

    document.getElementById('songInfo').innerText = "Tocando: Tudo Vai Dar Certo - Naritos";

    let index = 0;
    // Dispara a troca de versos de forma contínua para testes perfeitos de bancada
    setInterval(() => {
        let item = letraNaritos[index];
        document.getElementById('lyricsBox').innerText = item.texto;
        enviarParaHUD(item.texto);
        index = (index + 1) % letraNaritos.length;
    }, 4000);
}*/

// ==========================================
// Ajustes gerais
// ==========================================
const SEM_ACENTOS = true;              // remove acentos antes de enviar ao HUD
const MAX_CHARS = 60;                  // tamanho máximo do verso enviado ao HUD
const ADIANTAMENTO_PADRAO_MS = 500;    // mostra o verso este tempo antes do cantor
const REACAO_MARCACAO_MS = 250;        // atraso humano ao marcar versos no modo sincronizar
const USAR_LETRA_ESTIMADA = true;      // se só houver letra sem tempo, espalha pela duração

// ==========================================
// Configurações do Bluetooth BLE (ESP32)
// ==========================================
const SERVICE_UUID = "4fafc201-1fb5-459e-8fcc-c5c9c331914b";
const CHARACTERISTIC_UUID = "beb5483e-36e1-4688-b7f5-ea07361b26a8";

let bleCharacteristic;
let deviceConnected = false;
let ultimoTextoHUD = null;
let filaBLE = Promise.resolve();

document.getElementById('connectBtn').addEventListener('click', async () => {
    const statusDiv = document.getElementById('status');
    try {
        statusDiv.innerText = "Buscando HUD...";
        const device = await navigator.bluetooth.requestDevice({
            filters: [{ name: 'HUD-Carro' }, { services: [SERVICE_UUID] }],
            optionalServices: [SERVICE_UUID]
        });

        device.addEventListener('gattserverdisconnected', () => {
            deviceConnected = false;
            bleCharacteristic = null;
            statusDiv.innerText = "Status: HUD desconectado";
            statusDiv.className = "disconnected";
        });

        const server = await device.gatt.connect();
        const service = await server.getPrimaryService(SERVICE_UUID);
        bleCharacteristic = await service.getCharacteristic(CHARACTERISTIC_UUID);

        deviceConnected = true;
        statusDiv.innerText = "Status: Conectado ao HUD!";
        statusDiv.className = "connected";

        ultimoTextoHUD = null;
        enviarParaHUD("HUD Pronto!");
    } catch (error) {
        statusDiv.innerText = "Erro no Bluetooth: " + error;
    }
});

function prepararTextoHUD(texto) {
    let t = texto || "";
    if (SEM_ACENTOS) {
        t = t.normalize("NFD").replace(/[\u0300-\u036f]/g, "");
    }
    t = t.replace(/\s+/g, " ").trim();
    if (t.length > MAX_CHARS) t = t.slice(0, MAX_CHARS - 1) + "…";
    return t;
}

function enviarParaHUD(texto) {
    const t = prepararTextoHUD(texto);
    if (!bleCharacteristic || !deviceConnected) return;
    if (t === ultimoTextoHUD) return;
    ultimoTextoHUD = t;

    filaBLE = filaBLE.then(async () => {
        try {
            await bleCharacteristic.writeValue(new TextEncoder().encode(t));
        } catch (error) {
            console.error("Erro ao enviar dado via BLE:", error);
        }
    });
}

// ==========================================
// Spotify: Authorization Code + PKCE (sem backend)
// ==========================================
const CLIENT_ID = "a71bf171fc514af1ae2fbad876340f25";
//const REDIRECT_URI = "http://127.0.0.1:5500/hud-spotify-app/index.html";
const REDIRECT_URI = window.location.origin + window.location.pathname;
const SCOPES = "user-read-currently-playing user-read-playback-state";

const TOKEN_URL = "https://accounts.spotify.com/api/token";
const AUTH_URL = "https://accounts.spotify.com/authorize";

function gerarStringAleatoria(tamanho) {
    const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-._~";
    const valores = crypto.getRandomValues(new Uint8Array(tamanho));
    return Array.from(valores, v => chars[v % chars.length]).join("");
}

async function gerarCodeChallenge(verifier) {
    const dados = new TextEncoder().encode(verifier);
    const hash = await crypto.subtle.digest("SHA-256", dados);
    return btoa(String.fromCharCode(...new Uint8Array(hash)))
        .replace(/=/g, "")
        .replace(/\+/g, "-")
        .replace(/\//g, "_");
}

document.getElementById('loginSpotify').addEventListener('click', async () => {
    const verifier = gerarStringAleatoria(64);
    const challenge = await gerarCodeChallenge(verifier);
    localStorage.setItem("pkce_verifier", verifier);

    const params = new URLSearchParams({
        client_id: CLIENT_ID,
        response_type: "code",
        redirect_uri: REDIRECT_URI,
        scope: SCOPES,
        code_challenge_method: "S256",
        code_challenge: challenge
    });
    window.location.href = `${AUTH_URL}?${params.toString()}`;
});

function salvarTokens(dados) {
    localStorage.setItem("sp_access_token", dados.access_token);
    localStorage.setItem("sp_expira_em", String(Date.now() + dados.expires_in * 1000 - 30000));
    if (dados.refresh_token) {
        localStorage.setItem("sp_refresh_token", dados.refresh_token);
    }
}

async function trocarCodePorToken(code) {
    const verifier = localStorage.getItem("pkce_verifier");
    const resp = await fetch(TOKEN_URL, {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: new URLSearchParams({
            client_id: CLIENT_ID,
            grant_type: "authorization_code",
            code: code,
            redirect_uri: REDIRECT_URI,
            code_verifier: verifier
        })
    });
    if (!resp.ok) throw new Error("Falha ao trocar code por token: " + resp.status);
    salvarTokens(await resp.json());
    localStorage.removeItem("pkce_verifier");
}

async function renovarToken() {
    const refresh = localStorage.getItem("sp_refresh_token");
    if (!refresh) throw new Error("Sem refresh token");
    const resp = await fetch(TOKEN_URL, {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: new URLSearchParams({
            client_id: CLIENT_ID,
            grant_type: "refresh_token",
            refresh_token: refresh
        })
    });
    if (!resp.ok) throw new Error("Falha ao renovar token: " + resp.status);
    salvarTokens(await resp.json());
}

async function obterToken() {
    const expira = Number(localStorage.getItem("sp_expira_em") || 0);
    if (Date.now() >= expira) await renovarToken();
    return localStorage.getItem("sp_access_token");
}

function marcarComoConectado() {
    const btn = document.getElementById('loginSpotify');
    btn.innerText = "✔ Spotify Conectado";
    btn.disabled = true;
    btn.style.opacity = "0.7";
    btn.style.cursor = "default";
}

window.onload = async function () {
    mostrarAdiantamento();

    const params = new URLSearchParams(window.location.search);
    const code = params.get('code');
    const erro = params.get('error');
    const songInfo = document.getElementById('songInfo');

    if (erro) {
        songInfo.innerText = "Erro na autenticação do Spotify: " + erro;
        return;
    }

    try {
        if (code) {
            songInfo.innerText = "Finalizando login...";
            await trocarCodePorToken(code);
            window.history.replaceState({}, document.title, window.location.pathname);
        }

        if (localStorage.getItem("sp_refresh_token")) {
            marcarComoConectado();
            iniciarMonitoramento();
        } else {
            songInfo.innerText = "Clique em Conectar para iniciar";
        }
    } catch (e) {
        console.error(e);
        songInfo.innerText = "Erro: " + e.message;
    }
};

// ==========================================
// Estado da música e adiantamento
// ==========================================
let faixaAtualId = null;
let faixaAtual = null;     // objeto completo da faixa do Spotify
let nomeFaixa = "";
let origemLetra = "";      // " (LRCLIB)", " (estimada)", " (manual)"
let linhasLetra = [];      // [{ tempo: segundos, texto }]
let progressoBase = 0;     // ms informados pelo Spotify
let instanteBase = 0;      // performance.now() quando recebemos o progresso
let tocando = false;
let ultimaLinhaIdx = -2;

const adiantamentoSalvo = localStorage.getItem("adiantamento_ms");
let adiantamentoMs = adiantamentoSalvo !== null ? Number(adiantamentoSalvo) : ADIANTAMENTO_PADRAO_MS;

function mostrarAdiantamento() {
    document.getElementById('valorAdiantamento').innerText = adiantamentoMs + " ms";
}

function mudarAdiantamento(delta) {
    adiantamentoMs = Math.max(0, Math.min(3000, adiantamentoMs + delta));
    localStorage.setItem("adiantamento_ms", String(adiantamentoMs));
    mostrarAdiantamento();
}

document.getElementById('btnMenos').addEventListener('click', () => mudarAdiantamento(-100));
document.getElementById('btnMais').addEventListener('click', () => mudarAdiantamento(+100));

function posicaoAtualMs() {
    return progressoBase + (tocando ? performance.now() - instanteBase : 0);
}

function atualizarTituloFaixa() {
    document.getElementById('songInfo').innerText = `Tocando: ${nomeFaixa}${origemLetra}`;
}

// ==========================================
// Monitoramento do Spotify
// ==========================================
function iniciarMonitoramento() {
    consultarSpotify();
    setInterval(consultarSpotify, 1500); // consulta o Spotify a cada 2s
    setInterval(atualizarLetra, 100);    // checa o verso a cada 100ms (relógio local)
}

async function consultarSpotify() {
    try {
        const token = await obterToken();
        const resp = await fetch("https://api.spotify.com/v1/me/player/currently-playing", {
            headers: { Authorization: "Bearer " + token }
        });

        if (resp.status === 204) { tocando = false; return; }
        if (resp.status === 401) { await renovarToken(); return; }
        if (resp.status === 429) { console.warn("Rate limit do Spotify"); return; }
        if (!resp.ok) throw new Error("Spotify respondeu " + resp.status);

        const dados = await resp.json();
        if (!dados.item) { tocando = false; return; } // anúncio ou podcast

        tocando = dados.is_playing;
        progressoBase = dados.progress_ms;
        instanteBase = performance.now();

        if (dados.item.id !== faixaAtualId) {
            faixaAtualId = dados.item.id;
            faixaAtual = dados.item;
            await carregarFaixa(dados.item);
        }
    } catch (e) {
        console.error("Erro ao consultar Spotify:", e);
    }
}

// ==========================================
// Busca de letra em cascata (LRCLIB)
// ==========================================
function limparTitulo(t) {
    return t
        .replace(/\s*[-–]\s*(ao vivo|live|remaster(ed)?.*|\d{4}.*|single version|acoustic.*)$/i, "")
        .replace(/\s*[\(\[][^\)\]]*(feat|with|part|ao vivo|live|remaster)[^\)\]]*[\)\]]/gi, "")
        .trim();
}

function escolherMelhor(lista, duracaoSeg, tolerancia) {
    return lista
        .filter(l => l.syncedLyrics)
        .map(l => ({ l, diff: Math.abs((l.duration || 0) - duracaoSeg) }))
        .filter(x => x.diff <= tolerancia)
        .sort((a, b) => a.diff - b.diff)[0]?.l || null;
}

async function pegarJson(url) {
    const r = await fetch(url);
    return r.ok ? await r.json() : null;
}

function salvarNoCache(chave, valor) {
    try {
        localStorage.setItem(chave, JSON.stringify(valor));
    } catch (e) {
        console.warn("Cache cheio, ignorando:", e.message);
    }
}

// Retorna { tipo: "sincronizada" | "simples", texto } ou null
async function buscarLetra(item) {
    const artista = item.artists[0].name;
    const todosArtistas = item.artists.map(a => a.name).join(" ");
    const titulo = item.name;
    const tituloLimpo = limparTitulo(titulo);
    const duracao = Math.round(item.duration_ms / 1000);
    const base = "https://lrclib.net/api";

    const chaveCache = "letra2_" + item.id;
    const emCache = localStorage.getItem(chaveCache);
    if (emCache) {
        try { return JSON.parse(emCache); } catch (e) { /* cache corrompido */ }
    }

    const consultas = [
        // 1. busca exata
        () => pegarJson(`${base}/get?` + new URLSearchParams({
            artist_name: artista, track_name: titulo,
            album_name: item.album.name, duration: duracao
        })),
        // 2. artista + título limpo
        () => pegarJson(`${base}/search?` + new URLSearchParams({
            artist_name: artista, track_name: tituloLimpo
        })),
        // 3. busca livre com todos os artistas
        () => pegarJson(`${base}/search?` + new URLSearchParams({
            q: `${todosArtistas} ${tituloLimpo}`
        })),
        // 4. só o título
        () => pegarJson(`${base}/search?` + new URLSearchParams({
            track_name: tituloLimpo
        }))
    ];

    const todos = [];
    for (const consultar of consultas) {
        try {
            const r = await consultar();
            const lista = Array.isArray(r) ? r : (r ? [r] : []);
            todos.push(...lista);

            const sync = escolherMelhor(lista, duracao, 6);
            if (sync) {
                const resultado = { tipo: "sincronizada", texto: sync.syncedLyrics };
                salvarNoCache(chaveCache, resultado);
                console.log("Letra sincronizada encontrada para:", titulo);
                return resultado;
            }
        } catch (e) { /* tenta a próxima */ }
    }

    // Sem versão sincronizada: tenta uma versão só com texto (tolerância maior)
    const simples = todos
        .filter(l => l.plainLyrics && Math.abs((l.duration || 0) - duracao) <= 15)
        .sort((a, b) => Math.abs(a.duration - duracao) - Math.abs(b.duration - duracao))[0];

    if (simples) {
        console.log("Só encontrei letra SEM tempo para:", titulo);
        return { tipo: "simples", texto: simples.plainLyrics };
    }

    console.warn("Nenhuma letra encontrada para:", titulo, "-", artista);
    return null;
}

async function carregarFaixa(item) {
    const artista = item.artists[0].name;
    const titulo = item.name;

    modoSync = false;
    linhasLetra = [];
    ultimaLinhaIdx = -2;
    origemLetra = "";
    nomeFaixa = `${titulo} - ${artista}`;
    atualizarTituloFaixa();
    preencherEditor("");
    mostrarMsg("");
    document.getElementById('lyricsBox').innerText = "Buscando letra...";

    // 1. Letra manual tem prioridade
    const manual = localStorage.getItem("letra_manual_" + item.id);
    if (manual) {
        linhasLetra = parsearLRC(manual);
        origemLetra = " (manual)";
        preencherEditor(manual);
        atualizarTituloFaixa();
        return;
    }

    // 2. LRCLIB
    const r = await buscarLetra(item);
    if (item.id !== faixaAtualId) return; // a música mudou enquanto buscava

    if (r && r.tipo === "sincronizada") {
        linhasLetra = parsearLRC(r.texto);
        origemLetra = " (LRCLIB)";
        preencherEditor(r.texto);
    } else if (r && r.tipo === "simples") {
        preencherEditor(r.texto);
        if (USAR_LETRA_ESTIMADA) {
            linhasLetra = estimarTempos(r.texto, item.duration_ms / 1000);
            origemLetra = " (estimada)";
            mostrarMsg("Letra sem tempo: estou estimando. Use Sincronizar para ficar exata.");
        } else {
            document.getElementById('lyricsBox').innerText = "Letra sem tempo (use Sincronizar)";
        }
    } else {
        document.getElementById('lyricsBox').innerText = "Letra indisponível";
        enviarParaHUD(titulo);
        mostrarMsg("Sem letra no LRCLIB. Cole a letra no editor e use Sincronizar.");
    }
    atualizarTituloFaixa();
}

// ==========================================
// Formato LRC e tempos
// ==========================================
// Converte "[01:23.45] texto" em { tempo: 83.45, texto }
function parsearLRC(lrc) {
    const resultado = [];
    for (const linha of lrc.split("\n")) {
        const m = linha.match(/^\[(\d+):(\d+(?:\.\d+)?)\]\s*(.*)$/);
        if (m) {
            resultado.push({
                tempo: parseInt(m[1]) * 60 + parseFloat(m[2]),
                texto: m[3].trim()
            });
        }
    }
    return resultado.sort((a, b) => a.tempo - b.tempo);
}

function formatarTempoLRC(seg) {
    const centis = Math.round(seg * 100);
    const m = Math.floor(centis / 6000);
    const s = (centis % 6000) / 100;
    return `[${String(m).padStart(2, "0")}:${s.toFixed(2).padStart(5, "0")}]`;
}

function formatarLRC(linhas) {
    return linhas.map(l => `${formatarTempoLRC(l.tempo)} ${l.texto}`).join("\n");
}

// Espalha os versos igualmente pela duração (aproximação)
function estimarTempos(textoSimples, duracaoSeg) {
    const linhas = textoSimples.split("\n")
        .map(l => l.trim())
        .filter(l => l && !/^\[[^\]]*\]$/.test(l));
    const inicio = duracaoSeg * 0.07;
    const fim = duracaoSeg * 0.93;
    const passo = (fim - inicio) / Math.max(linhas.length, 1);
    return linhas.map((texto, i) => ({ tempo: inicio + i * passo, texto }));
}

// ==========================================
// Exibição do verso (com adiantamento)
// ==========================================
function atualizarLetra() {
    if (modoSync || !tocando || linhasLetra.length === 0) return;

    // adiantamentoMs faz o verso aparecer antes do cantor
    const posSeg = (posicaoAtualMs() + adiantamentoMs) / 1000;

    let idx = -1;
    for (let i = 0; i < linhasLetra.length; i++) {
        if (linhasLetra[i].tempo <= posSeg) idx = i;
        else break;
    }
    if (idx === ultimaLinhaIdx) return;
    ultimaLinhaIdx = idx;

    const texto = idx >= 0 && linhasLetra[idx].texto ? linhasLetra[idx].texto : "♪";
    document.getElementById('lyricsBox').innerText = texto;
    enviarParaHUD(texto);
}

// ==========================================
// Editor de letra manual e sincronização
// ==========================================
const editor = document.getElementById('lyricsEditor');
let modoSync = false;
let syncLinhas = [];
let syncMarcas = [];

function preencherEditor(texto) { editor.value = texto || ""; }
function mostrarMsg(t) { document.getElementById('editorMsg').innerText = t; }

// Linhas do editor sem timestamps, sem linhas vazias e sem marcações como [Refrão]
function linhasDoEditor() {
    return editor.value.split("\n")
        .map(l => l.replace(/^\[\d+:\d+(?:\.\d+)?\]\s*/, "").trim())
        .filter(l => l && !/^\[[^\]]*\]$/.test(l));
}

function salvarLetraManual(lrc) {
    try {
        localStorage.setItem("letra_manual_" + faixaAtualId, lrc);
    } catch (e) {
        mostrarMsg("Não consegui salvar: " + e.message);
        return false;
    }
    linhasLetra = parsearLRC(lrc);
    ultimaLinhaIdx = -2;
    origemLetra = " (manual)";
    atualizarTituloFaixa();
    return true;
}

function precisaDeFaixa() {
    if (!faixaAtualId) {
        mostrarMsg("Toque uma música no Spotify primeiro.");
        return true;
    }
    return false;
}

// Salvar: o texto já tem tempos [mm:ss.xx]
document.getElementById('btnSalvarLetra').addEventListener('click', () => {
    if (precisaDeFaixa()) return;
    const linhas = parsearLRC(editor.value);
    if (linhas.length === 0) {
        mostrarMsg("Não achei tempos [mm:ss.xx]. Use Sincronizar ou Estimar.");
        return;
    }
    if (salvarLetraManual(formatarLRC(linhas))) mostrarMsg("Letra salva para esta música.");
});

// Estimar: espalha os versos pela duração e salva
document.getElementById('btnEstimar').addEventListener('click', () => {
    if (precisaDeFaixa()) return;
    const linhas = linhasDoEditor();
    if (linhas.length === 0) { mostrarMsg("Cole a letra no editor primeiro."); return; }
    const tempos = estimarTempos(linhas.join("\n"), faixaAtual.duration_ms / 1000);
    const lrc = formatarLRC(tempos);
    if (salvarLetraManual(lrc)) {
        preencherEditor(lrc);
        mostrarMsg("Letra estimada e salva. Use Sincronizar para deixá-la exata.");
    }
});

// Sincronizar: você marca o início de cada verso
document.getElementById('btnSincronizar').addEventListener('click', () => {
    if (precisaDeFaixa()) return;
    const linhas = linhasDoEditor();
    if (linhas.length === 0) { mostrarMsg("Cole a letra no editor primeiro."); return; }
    if (document.activeElement) document.activeElement.blur();

    modoSync = true;
    syncLinhas = linhas;
    syncMarcas = [];
    mostrarMsg("Reinicie a música. Marque (ESPAÇO ou botão) quando cada verso começar.");
    mostrarLinhaSync();
});

function mostrarLinhaSync() {
    const i = syncMarcas.length;
    document.getElementById('lyricsBox').innerText =
        `(${i + 1}/${syncLinhas.length}) ${syncLinhas[i]}`;
}

function marcarLinha() {
    if (!modoSync) return;
    if (!tocando) { mostrarMsg("A música está pausada."); return; }

    const t = Math.max(0, (posicaoAtualMs() - REACAO_MARCACAO_MS) / 1000);
    syncMarcas.push(t);

    if (syncMarcas.length >= syncLinhas.length) {
        const linhas = syncLinhas.map((texto, i) => ({ tempo: syncMarcas[i], texto }));
        const lrc = formatarLRC(linhas);
        modoSync = false;
        if (salvarLetraManual(lrc)) {
            preencherEditor(lrc);
            mostrarMsg("Sincronização concluída e salva!");
        }
    } else {
        mostrarLinhaSync();
    }
}

document.getElementById('btnMarcar').addEventListener('click', marcarLinha);

document.getElementById('btnDesfazer').addEventListener('click', () => {
    if (!modoSync || syncMarcas.length === 0) return;
    syncMarcas.pop();
    mostrarLinhaSync();
});

document.getElementById('btnCancelarSync').addEventListener('click', () => {
    if (!modoSync) return;
    modoSync = false;
    ultimaLinhaIdx = -2;
    mostrarMsg("Sincronização cancelada.");
});

document.addEventListener('keydown', (e) => {
    if (!modoSync || e.code !== 'Space') return;
    const ativo = document.activeElement ? document.activeElement.tagName : "";
    if (ativo === 'TEXTAREA' || ativo === 'BUTTON') return;
    e.preventDefault();
    marcarLinha();
});

// Copiar LRC (para guardar em arquivo ou publicar no LRCLIB)
document.getElementById('btnCopiarLRC').addEventListener('click', async () => {
    const lrc = (faixaAtualId && localStorage.getItem("letra_manual_" + faixaAtualId)) || editor.value;
    if (!lrc.trim()) { mostrarMsg("Nada para copiar."); return; }
    try {
        await navigator.clipboard.writeText(lrc);
        mostrarMsg("LRC copiado. Guarde num arquivo .lrc como backup.");
    } catch (e) {
        mostrarMsg("Não consegui copiar: " + e.message);
    }
});

// Apagar a letra manual e voltar à busca automática
document.getElementById('btnApagarManual').addEventListener('click', async () => {
    if (precisaDeFaixa()) return;
    localStorage.removeItem("letra_manual_" + faixaAtualId);
    localStorage.removeItem("letra2_" + faixaAtualId);
    mostrarMsg("Letra manual apagada.");
    await carregarFaixa(faixaAtual);
});
// ==========================================
// Busca manual no LRCLIB, deslocamento e pendências
// ==========================================

// ---- Pendências (músicas sem letra exata) ----
function lerPendencias() {
    try { return JSON.parse(localStorage.getItem("pendencias_letra") || "{}"); }
    catch (e) { return {}; }
}

function atualizarPendencias() {
    const n = Object.keys(lerPendencias()).length;
    document.getElementById('pendencias').innerText =
        n ? `${n} música(s) sem letra exata` : "";
}

function gravarPendencias(p) {
    try { localStorage.setItem("pendencias_letra", JSON.stringify(p)); } catch (e) { /* ignora */ }
    atualizarPendencias();
}

document.getElementById('btnCopiarPendencias').addEventListener('click', async () => {
    const lista = Object.values(lerPendencias()).join("\n");
    if (!lista) { mostrarMsg("Nenhuma pendência."); return; }
    try {
        await navigator.clipboard.writeText(lista);
        mostrarMsg("Lista de pendências copiada.");
    } catch (e) {
        mostrarMsg("Não consegui copiar: " + e.message);
    }
});

// Envolve carregarFaixa: preenche a busca e registra pendências
const _carregarFaixa = carregarFaixa;
carregarFaixa = async function (item) {
    document.getElementById('buscaLetra').value =
        `${limparTitulo(item.name)} ${item.artists[0].name}`;
    document.getElementById('resultadosBusca').replaceChildren();

    await _carregarFaixa(item);
    if (item.id !== faixaAtualId) return;

    const p = lerPendencias();
    if (linhasLetra.length === 0 || origemLetra === " (estimada)") {
        p[item.id] = `${item.name} - ${item.artists[0].name}`;
    } else {
        delete p[item.id];
    }
    gravarPendencias(p);
};

// Envolve salvarLetraManual: ao salvar, a música sai das pendências
const _salvarLetraManual = salvarLetraManual;
salvarLetraManual = function (lrc) {
    const ok = _salvarLetraManual(lrc);
    if (ok && faixaAtualId) {
        const p = lerPendencias();
        delete p[faixaAtualId];
        gravarPendencias(p);
    }
    return ok;
};

// ---- Busca manual ----
async function buscarManualmente() {
    const area = document.getElementById('resultadosBusca');
    area.replaceChildren();

    const q = document.getElementById('buscaLetra').value.trim();
    if (!q) { mostrarMsg("Digite título e artista para buscar."); return; }

    mostrarMsg("Buscando no LRCLIB...");
    let lista = [];
    try {
        lista = await pegarJson("https://lrclib.net/api/search?" + new URLSearchParams({ q })) || [];
    } catch (e) {
        mostrarMsg("Erro na busca: " + e.message);
        return;
    }

    const duracaoSpotify = faixaAtual ? faixaAtual.duration_ms / 1000 : null;
    let mostrados = 0;

    for (const r of lista.slice(0, 15)) {
        const tipo = r.syncedLyrics ? "sincronizada" : (r.plainLyrics ? "sem tempo" : null);
        if (!tipo) continue;

        const dif = duracaoSpotify !== null ? Math.round((r.duration || 0) - duracaoSpotify) : null;
        const b = document.createElement('button');
        b.className = 'mini secundario resultado';
        b.textContent = `${r.artistName} - ${r.trackName} · ${tipo}` +
            (dif !== null ? ` · ${dif > 0 ? "+" : ""}${dif}s` : "");
        b.addEventListener('click', () => usarResultado(r));
        area.appendChild(b);
        mostrados++;
    }

    mostrarMsg(mostrados
        ? `${mostrados} resultado(s). Prefira "sincronizada" com diferença de poucos segundos.`
        : "Nada encontrado. Tente só o título, ou cole a letra e use Sincronizar.");
}

function usarResultado(r) {
    if (precisaDeFaixa()) return;

    if (r.syncedLyrics) {
        const lrc = formatarLRC(parsearLRC(r.syncedLyrics));
        if (salvarLetraManual(lrc)) {
            preencherEditor(lrc);
            mostrarMsg("Letra aplicada. Se estiver deslocada, use os botões de mais cedo/mais tarde.");
        }
    } else {
        preencherEditor(r.plainLyrics);
        mostrarMsg("Letra sem tempo carregada no editor. Clique em Sincronizar.");
    }
}

document.getElementById('btnBuscar').addEventListener('click', buscarManualmente);
document.getElementById('buscaLetra').addEventListener('keydown', (e) => {
    if (e.key === 'Enter') buscarManualmente();
});

// ---- Deslocar todos os versos ----
function deslocarLetra(deltaSeg) {
    if (precisaDeFaixa()) return;
    const linhas = parsearLRC(editor.value);
    if (linhas.length === 0) {
        mostrarMsg("O editor precisa ter uma letra com tempos [mm:ss.xx].");
        return;
    }
    const novas = linhas.map(l => ({ tempo: Math.max(0, l.tempo + deltaSeg), texto: l.texto }));
    const lrc = formatarLRC(novas);
    if (salvarLetraManual(lrc)) {
        preencherEditor(lrc);
        mostrarMsg(`Letra deslocada ${deltaSeg > 0 ? "+" : ""}${deltaSeg} s e salva.`);
    }
}

document.getElementById('btnMaisCedo').addEventListener('click', () => deslocarLetra(-0.5));
document.getElementById('btnMaisTarde').addEventListener('click', () => deslocarLetra(+0.5));

atualizarPendencias();

// ---- Exportar / importar letras manuais ----
document.getElementById('btnExportar').addEventListener('click', () => {
    const prefixo = "letra_manual_";
    const letras = {};
    for (let i = 0; i < localStorage.length; i++) {
        const k = localStorage.key(i);
        if (k.startsWith(prefixo)) letras[k.slice(prefixo.length)] = localStorage.getItem(k);
    }
    const n = Object.keys(letras).length;
    if (!n) { mostrarMsg("Nenhuma letra manual para exportar."); return; }

    const blob = new Blob([JSON.stringify({ versao: 1, letras }, null, 2)], { type: "application/json" });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = "letras-hud-backup.json";
    a.click();
    setTimeout(() => URL.revokeObjectURL(a.href), 1000);
    mostrarMsg(`${n} letra(s) exportada(s).`);
});

document.getElementById('btnImportar').addEventListener('click', () => {
    document.getElementById('arquivoImportar').click();
});

document.getElementById('arquivoImportar').addEventListener('change', async (e) => {
    const arquivo = e.target.files[0];
    if (!arquivo) return;
    try {
        const dados = JSON.parse(await arquivo.text());
        let n = 0;
        for (const [id, lrc] of Object.entries(dados.letras || {})) {
            if (typeof lrc === "string" && parsearLRC(lrc).length > 0) {
                localStorage.setItem("letra_manual_" + id, lrc);
                n++;
            }
        }
        mostrarMsg(`${n} letra(s) importada(s). Troque de música e volte para aplicar.`);
    } catch (err) {
        mostrarMsg("Arquivo inválido: " + err.message);
    }
    e.target.value = "";
});