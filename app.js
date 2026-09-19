import baileys from '@adiwajshing/baileys';
import qrcode from 'qrcode-terminal';
import OpenAI from 'openai';
import dotenv from 'dotenv';

const { default: makeWASocket, useMultiFileAuthState, DisconnectReason } = baileys;

dotenv.config();

const openai = new OpenAI({
	apiKey: process.env.OPENAI_API_KEY,
});

const CONTEXTO_DA_EMPRESA = `
Você é o Pedrinho, assistente virtual inteligente da loja de bicicletas Joinhas Bike.
Seu objetivo é ser muito amigável, prestativo e animado sobre o mundo do ciclismo.
Responda a dúvidas sobre nossos serviços com os preços exatos:
- Revisão completa de bike (R$ 120)
- Troca de câmara de bicicleta normal (R$ 10 + valor da peça)
- Troca de câmara de bicicleta elétrica (R$ 20 + valor da peça)
- Venda de mountain bikes e bikes urbanas novas e usadas.
Pergunte qual é o modelo da bicicleta do cliente (se é normal ou elétrica) e tente agendar uma visita na loja para a manutenção ou conserto.
Responda de forma curta e direta, usando no máximo 3 frases por mensagem. Use emojis de bicicletas (🚲, 🛠️, 🚴).
`;

async function conectarAoWhatsApp() {
	const { state, saveCreds } = await useMultiFileAuthState('session_auth');

	const sock = makeWASocket({
		auth: state,
	});

	sock.ev.on('connection.update', (update) => {
		const { connection, lastDisconnect, qr } = update;

		if (qr) {
			console.log('\n📌 QR CODE COMPACTO - ESCANEIE AGORA:\n');
			qrcode.generate(qr, { small: true });
		}

		if (connection === 'close') {
			const deveriaReconectar =
				lastDisconnect?.error?.output?.statusCode !== DisconnectReason.loggedOut;
			console.log('Conexão recusada pela rede. Tentando novamente...', deveriaReconectar);
			if (deveriaReconectar) conectarAoWhatsApp();
		} else if (connection === 'open') {
			console.log('✅ Robô do Pedrinho conectado com sucesso ao WhatsApp da Joinhas Bike!');
		}
	});

	sock.ev.on('creds.update', saveCreds);

	sock.ev.on('messages.upsert', async ({ messages }) => {
		const mensagem = messages[0];
		if (!mensagem?.message || mensagem.key.fromMe) return;

		const de = mensagem.key.remoteJid;
		const textoRecebido =
			mensagem.message.conversation || mensagem.message.extendedTextMessage?.text;
		if (!de || !textoRecebido) return;

		try {
			const respostaIA = await openai.chat.completions.create({
				model: 'gpt-3.5-turbo',
				messages: [
					{ role: 'system', content: CONTEXTO_DA_EMPRESA },
					{ role: 'user', content: textoRecebido },
				],
			});

			const respostaTexto = respostaIA.choices[0]?.message?.content?.trim();
			if (respostaTexto) await sock.sendMessage(de, { text: respostaTexto });
		} catch (erro) {
			console.error('Erro ao processar com a IA:', erro);
		}
	});
}

conectarAoWhatsApp().catch((erro) => {
	console.error('Erro ao conectar ao WhatsApp:', erro);
});



