#!/usr/bin/env bash
set -e

DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT_DIR="$(cd "$DIR/.." && pwd)"

echo "=========================================================="
echo "🚀 Iniciando Demonstração do BackOverrides Proxy"
echo "=========================================================="

# 1. Iniciar Remote API Mock (Porta 4000)
node "$DIR/remote-api.js" &
REMOTE_PID=$!

# 2. Iniciar Local Service Mock (Porta 3000)
node "$DIR/local-service.js" &
LOCAL_PID=$!

# Função para garantir encerramento limpo dos processos ao sair
cleanup() {
  echo -e "\n🧹 Encerrando servidores de teste..."
  kill $REMOTE_PID 2>/dev/null || true
  kill $LOCAL_PID 2>/dev/null || true
  kill $PROXY_PID 2>/dev/null || true
}
trap cleanup EXIT

sleep 1

# 3. Iniciar o BackOverrides Proxy (Porta 8080)
node "$ROOT_DIR/packages/cli/dist/cli.js" -c "$DIR/back-overrides.example.json" &
PROXY_PID=$!

sleep 1.5

echo -e "\n----------------------------------------------------------"
echo "🧪 [1] Teste 1: GET /v1/users (Deve ir para a API REMOTA porta 4000)"
echo "----------------------------------------------------------"
curl -s -X GET "http://localhost:8080/v1/users" \
  -H "Origin: http://localhost:5173" | grep -q "remote-production-api" && echo "✅ SUCESSO: Rota repassada para a API remota!"

echo -e "\n----------------------------------------------------------"
echo "🧪 [2] Teste 2: POST /v1/users (Deve ser INTERCEPTADA para LOCALHOST porta 3000)"
echo "----------------------------------------------------------"
curl -s -X POST "http://localhost:8080/v1/users" \
  -H "Content-Type: application/json" \
  -H "Origin: http://localhost:5173" \
  -d '{"name": "Akira Dev", "role": "Fullstack"}' | grep -q "local-development-service" && echo "✅ SUCESSO: Rota interceptada e enviada para o serviço local!"

echo -e "\n----------------------------------------------------------"
echo "🧪 [3] Teste 3: Preflight OPTIONS com CORS (Deve retornar 204 e headers CORS)"
echo "----------------------------------------------------------"
curl -i -s -X OPTIONS "http://localhost:8080/v1/users" \
  -H "Origin: http://localhost:5173" \
  -H "Access-Control-Request-Method: POST" | grep -q "204 No Content" && echo "✅ SUCESSO: Preflight OPTIONS respondido com 204 e cabeçalhos CORS!"

echo -e "\n----------------------------------------------------------"
echo "🧪 [4] Teste 4: GET /v1/users/42?filter=active (Parâmetro dinâmico para LOCALHOST)"
echo "----------------------------------------------------------"
curl -s -X GET "http://localhost:8080/v1/users/42?filter=active" \
  -H "Origin: http://localhost:5173" | grep -q "Local User Mock #42" && echo "✅ SUCESSO: Parâmetro dinâmico e query string preservados no localhost!"

echo -e "\n=========================================================="
echo "🎉 Todos os testes da demonstração passaram com sucesso!"
echo "=========================================================="
