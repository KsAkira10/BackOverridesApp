#!/usr/bin/env bash
set -e

DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT_DIR="$(cd "$DIR/../.." && pwd)"

echo "=========================================================="
echo "⚡ Iniciando Demonstração: Single-SPA Portal + Fake BFF"
echo "=========================================================="

# 1. Iniciar Fake Remote Cloud BFF (Porta 9001)
node "$DIR/remote-cloud-bff.js" &
REMOTE_PID=$!

# 2. Iniciar Fake Local Dev BFF (Porta 8080)
node "$DIR/local-dev-bff.js" &
LOCAL_PID=$!

# Garantir cleanup ao encerrar
cleanup() {
  echo -e "\n🧹 Encerrando servidores de teste..."
  kill $REMOTE_PID 2>/dev/null || true
  kill $LOCAL_PID 2>/dev/null || true
  kill $PROXY_PID 2>/dev/null || true
}
trap cleanup EXIT

sleep 1

# 3. Iniciar BackOverrides Proxy (Porta 8889)
node "$ROOT_DIR/packages/cli/dist/cli.js" -c "$DIR/back-overrides.json" &
PROXY_PID=$!

sleep 1.5

echo -e "\n----------------------------------------------------------"
echo "🧪 [1] Teste: GET /bff/core/v1/session"
echo "    -> Deve ir para a NUVEM REMOTA (Porta 9001)"
echo "----------------------------------------------------------"
curl -s "http://localhost:8889/bff/core/v1/session" \
  -H "Origin: http://localhost:5173" | grep -q "Cloud Production Cluster" && echo "✅ SUCESSO: Sessão mantida no cluster de nuvem!"

echo -e "\n----------------------------------------------------------"
echo "🧪 [2] Teste: GET /bff/core/v1/catalog"
echo "    -> Deve ir para a NUVEM REMOTA (Porta 9001)"
echo "----------------------------------------------------------"
curl -s "http://localhost:8889/bff/core/v1/catalog" \
  -H "Origin: http://localhost:5173" | grep -q "Cloud DB" && echo "✅ SUCESSO: Catálogo carregado da nuvem oficial!"

echo -e "\n----------------------------------------------------------"
echo "🧪 [3] Teste: POST /bff/core/v1/orders"
echo "    -> Deve ser INTERCEPTADO para o BFF LOCAL (Porta 8080)"
echo "----------------------------------------------------------"
curl -s -X POST "http://localhost:8889/bff/core/v1/orders" \
  -H "Content-Type: application/json" \
  -H "Origin: http://localhost:5173" \
  -d '{"item": "srv-101", "qty": 1}' | grep -q "Local Dev BFF" && echo "✅ SUCESSO: Pedido interceptado para o BFF local com o novo motor v2!"

echo -e "\n----------------------------------------------------------"
echo "🧪 [4] Teste: GET /bff/core/v1/oauth2/authorize"
echo "    -> Deve redirecionar para o novo IdP do BFF LOCAL"
echo "----------------------------------------------------------"
curl -s -i "http://localhost:8889/bff/core/v1/oauth2/authorize" \
  -H "Origin: http://localhost:5173" | grep -q "new-sso.idp.example.io" && echo "✅ SUCESSO: Authorize redirecionado para o IdP local!"

echo -e "\n=========================================================="
echo "🎉 Todos os testes do cenário Single-SPA + Fake BFF passaram!"
echo "💡 Para abrir a interface gráfica do Single-SPA no navegador:"
echo "   Abra o arquivo: $DIR/index.html"
echo "=========================================================="
