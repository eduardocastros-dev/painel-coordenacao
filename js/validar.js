document.getElementById('btn-verificar').addEventListener('click', async function () {
    const codigoInput = document.getElementById('codigo-uuid').value.trim();
    const resultadoDiv = document.getElementById('resultado-validacao');

    if (!codigoInput) {
        resultadoDiv.className = 'alerta alerta-vermelho';
        resultadoDiv.innerText = 'Por favor, informe um código UUID para verificação.';
        return;
    }

    try {
        const response = await fetch(`http://localhost:8080/api/validar/${encodeURIComponent(codigoInput)}`, {
            method: 'GET'
        });

        if (response.status === 200) {
            const dados = await response.json();
            resultadoDiv.className = 'alerta alerta-verde';
            resultadoDiv.innerHTML = `
                <strong>Documento Autêntico</strong><br><br>
                <strong>Membro:</strong> ${dados.nomeMembro || dados.membro || 'Não informado'}<br>
                <strong>Carga Horária:</strong> ${dados.horas || 'Não informada'} horas<br>
                <strong>Período de Vigência:</strong> ${dados.periodo || 'Não informado'}<br>
                <strong>Código Validado:</strong> ${codigoInput}
            `;
        } else if (response.status === 404) {
            resultadoDiv.className = 'alerta alerta-vermelho';
            resultadoDiv.innerText = 'Documento Inválido ou Não Encontrado';
        } else {
            resultadoDiv.className = 'alerta alerta-vermelho';
            resultadoDiv.innerText = `Erro inesperado ao validar documento (Status: ${response.status}).`;
        }
    } catch (error) {
        console.error('Erro na requisição de validação:', error);
        resultadoDiv.className = 'alerta alerta-vermelho';
        resultadoDiv.innerText = 'Erro de conexão com o servidor. Verifique se o backend está rodando na porta 8080.';
    }
});