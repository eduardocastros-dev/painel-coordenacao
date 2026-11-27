const API_BASE_URL = 'http://localhost:8080/api';
let reuniaoAtualId = null;

// Recupera o token salvo pelo Integrante 4 no login.html
function getAuthHeaders() {
    const token = localStorage.getItem('authToken');
    return {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
    };
}

// 1. Visualização Dinâmica da Ata ao carregar a página
window.onload = async function () {
    const token = localStorage.getItem('authToken');

    // Redireciona para o login se não houver token armazenado
    if (!token) {
        alert('Sessão expirada ou usuário não autenticado. Faça login novamente.');
        window.location.href = 'login.html';
        return;
    }

    // Permite passar ?id=1 na URL ou busca a última reunião finalizada
    const urlParams = new URLSearchParams(window.location.search);
    const idParam = urlParams.get('id');

    try {
        const endpoint = idParam 
            ? `${API_BASE_URL}/reunioes/${idParam}` 
            : `${API_BASE_URL}/reunioes`;

        const response = await fetch(endpoint, {
            method: 'GET',
            headers: getAuthHeaders()
        });

        if (!response.ok) {
            throw new Error(`Erro HTTP: ${response.status}`);
        }

        const dados = await response.json();

        // Caso o endpoint /api/reunioes retorne uma lista, pega a última reunião finalizada
        const reuniao = Array.isArray(dados) 
            ? (dados.find(r => r.status === 'FINALIZADA') || dados[dados.length - 1]) 
            : dados;

        if (reuniao && reuniao.ataTexto) {
            reuniaoAtualId = reuniao.id;
            document.getElementById('conteudo-ata').innerText = reuniao.ataTexto;
        } else {
            document.getElementById('conteudo-ata').innerText = 'Nenhuma ata finalizada disponível no momento.';
            document.getElementById('btn-assinar').disabled = true;
        }
    } catch (error) {
        console.error('Erro ao carregar ata:', error);
        document.getElementById('conteudo-ata').innerText = 'Erro ao conectar com o servidor para carregar a ata.';
        document.getElementById('btn-assinar').disabled = true;
    }
};

// 2. Ação de Assinatura Eletrônica
document.getElementById('btn-assinar').onclick = async function () {
    if (!reuniaoAtualId) {
        alert('Nenhuma ata selecionada para assinatura.');
        return;
    }

    const btnAssinar = document.getElementById('btn-assinar');
    const statusDiv = document.getElementById('status-assinatura');

    btnAssinar.disabled = true;
    btnAssinar.innerText = 'Processando assinatura...';

    try {
        const response = await fetch(`${API_BASE_URL}/atas/${reuniaoAtualId}/assinar`, {
            method: 'POST',
            headers: getAuthHeaders()
        });

        if (response.ok) {
            // Atualização exigida na interface
            statusDiv.className = 'alerta alerta-verde';
            statusDiv.innerText = 'Ata Assinada com Sucesso';
            btnAssinar.innerText = 'Assinatura Registrada';
        } else {
            const erroTexto = await response.text();
            statusDiv.className = 'alerta alerta-vermelho';
            statusDiv.innerText = `Não foi possível assinar a ata: ${erroTexto || response.status}`;
            btnAssinar.disabled = false;
            btnAssinar.innerText = 'Assinar Ata';
        }
    } catch (error) {
        console.error('Erro na assinatura:', error);
        statusDiv.className = 'alerta alerta-vermelho';
        statusDiv.innerText = 'Falha de comunicação com o servidor ao assinar.';
        btnAssinar.disabled = false;
        btnAssinar.innerText = 'Assinar Ata';
    }
};

// 3. Emissão / Download de Declaração Semestral
document.getElementById('btn-baixar-declaracao').onclick = async function () {
    const boxDeclaracao = document.getElementById('box-declaracao');

    try {
        // Endpoint do módulo de declarações (Integrante 3)
        const response = await fetch(`${API_BASE_URL}/declaracoes/minha`, {
            method: 'GET',
            headers: getAuthHeaders()
        });

        if (!response.ok) {
            throw new Error('Declaração não disponível.');
        }

        const declaracao = await response.json();

        // Exibe os dados e gera um arquivo de texto/comprovante para download imediato
        boxDeclaracao.className = 'alerta alerta-verde';
        boxDeclaracao.innerHTML = `
            <strong>Declaração Emitida!</strong><br>
            Período: ${declaracao.periodo || 'Semestre Atual'} | Carga Horária: ${declaracao.horas || 'N/A'}h<br>
            Código de Validação (UUID): <code>${declaracao.codigoValidacao}</code>
        `;

        // Gera download automático do comprovante em .txt
        const conteudoArquivo = `DECLARAÇÃO DE PARTICIPAÇÃO EM COLEGIADO\n\n` +
            `Membro: ${declaracao.nomeMembro || 'Participante'}\n` +
            `Período: ${declaracao.periodo || 'Semestre Atual'}\n` +
            `Carga Horária: ${declaracao.horas || 'N/A'} horas\n` +
            `Código de Autenticidade (UUID): ${declaracao.codigoValidacao}\n` +
            `Valide este documento em: validar.html`;

        const blob = new Blob([conteudoArquivo], { type: 'text/plain;charset=utf-8' });
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.download = `declaracao-${declaracao.codigoValidacao}.txt`;
        link.click();
    } catch (error) {
        boxDeclaracao.className = 'alerta alerta-vermelho';
        boxDeclaracao.innerText = 'Não foi possível gerar a declaração no momento. Verifique se há participações registradas.';
    }
};

function logout() {
    localStorage.removeItem('authToken');
    window.location.href = 'login.html';
}