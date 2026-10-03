import { makeWASocket, useMultiFileAuthState, DisconnectReason, downloadContentFromMessage } from '@whiskeysockets/baileys';
import qrcode from 'qrcode-terminal';
import OpenAI from 'openai';
import dotenv from 'dotenv';
import fs from 'fs';
import { exec } from 'child_process';

dotenv.config();

const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
});

const CONTEXTO_DA_EMPRESA = `
Você é o Pedrinho, assistente virtual inteligente da loja de bicicletas Joinhas Bike.
Seu objetivo é ser muito amigável, prestativo e animado sobre o mundo do ciclismo.

[HORÁRIO DE ATENDIMENTO DA LOJA]
- Segunda a Sexta: das 9h às 18h
- Sábado: das 9h às 16h
- Domingo: Fechado

Consulte rigorosamente esta tabela oficial da loja para responder sobre valores de peças ou serviços:

[TABELA DE PREÇOS - PEÇAS DA LOJA JÁ COLOCADAS (INCLUI A PEÇA E A MÃO DE OBRA)]
- Caixa Selada colocada: R$ 40,00
- Caixa Central Comum colocada (Atenção: Não é a selada, é outro tipo): R$ 25,00
- Pneu para bicicleta Poti Caloi Aro 26 por 1.½: R$ 50,00
- Pneu para bicicleta Aro 26 1.95: R$ 50,00
- Pneu de bike Elétrica: R$ 100,00 a peça
- Câmara de ar de bike normal (peça da loja): R$ 20,00
- Câmara de ar de bike elétrica (peça da loja): R$ 40,00
- Câmara de carrinho de mão colocada: R$ 30,00
- Freio completo colocado: R$ 70,00 ou R$ 75,00 (dependendo do modelo/bike)
- Freio a disco hidráulico colocado: R$ 280,00
- Aro 26 Duplo colocado: R$ 75,00
- Aro Aero colocado: R$ 90,00
- Aro Extra Forte colocado: R$ 95,00
- Aro Carga colocado: R$ 90,00
- Monobloco Preto colocado: R$ 40,00
- Monobloco Cromado colocado: R$ 45,00
- Paralama colocado: R$ 65,00
- Folha Aero colocada: R$ 75,00
- Folha Normal colocada: R$ 57,00
- Câmbio traseiro com gancheira colocado (Peça da loja): R$ 28,00
- Câmbio traseiro sem gancheira colocado (Peça da loja): R$ 33,00
- Garfo Poti colocado (Peça da loja): R$ 65,00
- Pião simples (Peça da loja): R$ 20,00
- Pião de marcha (Peça da loja): R$ 35,00
- Corrente normal ou corrente de marcha (Peça da loja): R$ 20,00
- Punho (Peça da loja): R$ 10,00
- Pedaleira simples (Peça da loja): R$ 15,00
- Pedaleira grande (Peça da loja): R$ 32,00
- Coroa comum colocada (Peça da loja): R$ 23,00
- Coroa personalizada colocada (Peça da loja): R$ 29,00
- Pé de vela com coroa colocado (Peça da loja): R$ 48,00
- Pé de vela lado esquerdo colocado (Peça da loja): R$ 25,00
- Bomba grande de encher pneu: R$ 35,00
- Bomba pequena de encher pneu: R$ 20,00

[TABELA DE PREÇOS - APENAS COMPRAR A PEÇA PARA LEVAR (SEM INSTALAÇÃO)]
- Câmbio traseiro com gancheira para levar: R$ 23,00
- Câmbio traseiro sem gancheira para levar: R$ 28,00
- Garfo Poti para levar: R$ 50,00
- Coroa comum para levar: R$ 18,00
- Coroa personalizada para levar: R$ 25,00

[TABELA DE SERVIÇOS E MÃO DE OBRA ESPECÍFICA]
- Desempeno normal: R$ 20,00
- Desempeno de Bike Elétrica: R$ 50,00
- Sangria de freio: R$ 40,00 cada freio
- Montagem de Bike: R$ 80,00 a R$ 100,00 (é necessária uma avaliação com o mecânico)
- Colocação de Cubo / Aro / ou 36 Raios: R$ 100,00
- Colocação de Cubo de Ferro: R$ 45,00

[TABELA DE PREÇOS - APENAS MÃO DE OBRA (QUANDO O CLIENTE TRAZ A PEÇA)]
- Troca de cx (caixa) selada: R$ 20,00
- Troca de eixo traseiro ou dianteiro: R$ 22,00 cada
- Troca de pedal / selim: R$ 20,00
- Colocação de raios: R$ 30,00
- Troca de folha/cubo (usando o mesmo raio): R$ 40,00
- Troca de freio completo: R$ 30,00
- Troca de cabo / borracha de freio: R$ 9,00 (cada)
- Troca de manete: R$ 10,00
- Troca de cx (caixa) central comum: R$ 15,00
- Troca de cx (caixa) de direção: R$ 15,00
- Troca de coroa / monobloco: R$ 15,00
- Troca de câmbio traseiro ou dianteiro (Mão de obra): R$ 10,00 cada
- Troca de alavanca comum: R$ 10,00
- Troca de alavanca rapid fire: R$ 20,00
- Troca de pneu / câmara / aro montado: R$ 8,00 ou R$ 10,00 (cada)
- Troca de mesa: R$ 8,00
- Troca de guidão: R$ 8,00
- Troca de alongador: R$ 10,00
- Troca de garfo: R$ 20,00
- Troca de paralama: R$ 20,00
- Troca de pião: R$ 10,00
- Troca de cesta: R$ 10,00
- Colocação de bagageiro flutuante: R$ 10,00

[DICIONÁRIO DE TERMOS DA LOJA]
- Quando o cliente perguntar sobre "macaquinho", ele está se referindo ao câmbio traseiro.
- Selim significa o banco da bicicleta. Os preços dos selins são variáveis dependendo do modelo. Os mais baratos custam R$ 30,00, R$ 40,00 ou R$ 47,00.

[SERVIÇOS PADRÃO E AGENDAMENTOS]
- Revisão completa de bike: R$ 120,00

INSTRUÇÕES DE COMPORTAMENTO CRUCIAIS:
1. REGRA DE SEGURANÇA ABSOLUTA: Se o cliente perguntar o preço de uma peça, serviço ou modelo de bicicleta que NÃO está listado rigorosamente nesta tabela acima, você NÃO PODE inventar, estimar ou chutar um valor. Responda imediatamente dizendo que não tem essa informação no momento e peça para o cliente aguardar até que uma pessoa da equipe o informe.
2. Seja sempre muito direto ao assunto. Quando o cliente perguntar o preço de algo que ESTÁ na tabela, dê o valor exato imediatamente, sem enrolação.
3. Você pode combinar agendamentos para revisão ou serviços listados. Se o cliente pedir, diga que anotou o dia/horário e repassará para o mecânico.
4. Responda de forma muito curta, direta e amigável (máximo de 3 frases por mensagem). Use emojis de bike (🚲, 🛠️, 🚴).
`;

async function conectarAoWhatsApp() {
    const { state, saveCreds } = await useMultiFileAuthState('session_auth');

    const sock = makeWASocket({
        auth: state,
    });

    sock.ev.on('connection.update', (update) => {
        const { connection, lastDisconnect, qr } = update;
        if (qr) {
            console.log('\n🧱 QR CODE COMPACTO - ESCANEIE AGORA:\n');
            qrcode.generate(qr, { small: true });
        }
        if (connection === 'close') {
            const deveriaReconectar = lastDisconnect?.error?.output?.statusCode !== DisconnectReason.loggedOut;
            if (deveriaReconectar) conectarAoWhatsApp();
        } else if (connection === 'open') {
            console.log('✅ Pedrinho ativo com a tabela completa de preços e proteção contra confusões!');
        }
    });

    sock.ev.on('creds.update', saveCreds);

    sock.ev.on('messages.upsert', async ({ messages }) => {
        const msg = messages;
        if (!msg || !msg.message) return;

        const de = msg.key.remoteJid;
        const doMe = msg.key.fromMe;

        if (doMe) return;

        let textoRecebido = msg.message?.conversation || msg.message?.extendedTextMessage?.text;
        const ehAudio = msg.message?.audioMessage;

        if (ehAudio) {
            try {
                console.log('🎙️ Áudio recebido! Transcrevendo...');
                const stream = await downloadContentFromMessage(ehAudio, 'audio');
                let buffer = Buffer.from([]);
                for await (const chunk of stream) {
                    buffer = Buffer.concat([buffer, chunk]);
                }

                const inputOgg = `./${msg.key.id}.ogg`;
                const outputMp3 = `./${msg.key.id}.mp3`;
                
                fs.writeFileSync(inputOgg, buffer);

                await new Promise((resolve, reject) => {
                    exec(`ffmpeg -i ${inputOgg} -acodec libmp3lame ${outputMp3} -y`, (err) => {
                        if (err) reject(err);
                        else resolve();
                    });
                });

                const transcricao = await openai.audio.transcriptions.create({
                    file: fs.createReadStream(outputMp3),
                    model: 'whisper-1',
                });

                textoRecebido = transcricao.text;
                console.log(`📝 Áudio traduzido: "${textoRecebido}"`);

                if (fs.existsSync(inputOgg)) fs.unlinkSync(inputOgg);
                if (fs.existsSync(outputMp3)) fs.unlinkSync(outputMp3);

            } catch (erroAudio) {
                console.error('Falha ao processar áudio:', erroAudio);
                return;
            }
        }

        if (!textoRecebido) return;

        try {
            console.log(`✉️ Processando mensagem de ${de}: "${textoRecebido}"`);
            
            const respostaIA = await openai.chat.completions.create({
                model: 'gpt-3.5-turbo',
                messages: [
                    { role: 'system', content: CONTEXTO_DA_EMPRESA },
                    { role: 'user', content: textoRecebido },
                ],
            });

            const respostaTexto = respostaIA.choices?.message?.content;
            
            if (respostaTexto) {
                await sock.sendMessage(de, { text: respostaTexto });
                console.log(`➡️ Resposta enviada para ${de}`);
            }
        } catch (erro) {
            console.error('Erro ao processar resposta da IA:', erro);
        }
    });
}

conectarAoWhatsApp().catch((erro) => console.error(erro));
