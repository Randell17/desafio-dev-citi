#!/usr/bin/env bash
# Testes de caixa-preta da API Folhagem & Cia (parte 4 do enunciado).
# Uso:  bash testes.sh            (API em http://localhost:3001)
#       BASE=http://localhost:3002 bash testes.sh
# Requer: curl e node. Cria plantas de teste e apaga no final.

BASE="${BASE:-http://localhost:3001}"
TMP="$(mktemp)"
PASS=0
FAIL=0
export TMPF="$TMP"

# req METODO ROTA [JSON]  -> imprime o status HTTP e guarda o corpo em $TMP
req() {
  if [ -n "$3" ]; then
    curl -s -o "$TMP" -w "%{http_code}" -X "$1" -H "Content-Type: application/json" -d "$3" "$BASE$2"
  else
    curl -s -o "$TMP" -w "%{http_code}" -X "$1" "$BASE$2"
  fi
}

# campo EXPRESSAO_JS -> avalia sobre o último corpo (variável d)
campo() {
  node -p "(()=>{const d=JSON.parse(require('fs').readFileSync(process.env.TMPF,'utf8'));return ($1)})()" 2>/dev/null
}

# check DESCRICAO ESPERADO OBTIDO
check() {
  if [ "$2" = "$3" ]; then
    PASS=$((PASS+1)); echo "  OK    $1 -> $3"
  else
    FAIL=$((FAIL+1)); echo "  ERRO  $1 -> esperado $2, veio $3"
  fi
}

echo "API: $BASE"
if ! curl -s -o /dev/null "$BASE/"; then
  echo "Não consegui falar com a API. Ela está de pé? (docker compose up -d)"; exit 1
fi

echo; echo "== Cadastro =="
S=$(req POST /plantas '{"nome":"Costela-de-adão","especie":"Monstera deliciosa","preco":8990,"estoque":10,"luminosidade":"SOL_PLENO","petFriendly":true,"regaACadaDias":3}')
check "cadastro válido" 201 "$S"; A=$(campo "d.id")
S=$(req POST /plantas '{"nome":"Samambaia","especie":"Nephrolepis exaltata","preco":4500,"estoque":0,"luminosidade":"MEIA_SOMBRA","petFriendly":false,"regaACadaDias":2}')
check "cadastro com estoque 0 e petFriendly false" 201 "$S"; B=$(campo "d.id")
check "estoque 0 foi gravado" 0 "$(campo 'd.estoque')"
check "petFriendly false foi gravado" false "$(campo 'd.petFriendly')"
S=$(req POST /plantas '{"especie":"X","preco":100,"estoque":1,"luminosidade":"SOMBRA","petFriendly":true,"regaACadaDias":1}')
check "sem o campo nome" 400 "$S"
S=$(req POST /plantas '{"nome":"X","especie":"X","preco":0,"estoque":1,"luminosidade":"SOMBRA","petFriendly":true,"regaACadaDias":1}')
check "preco 0" 400 "$S"
S=$(req POST /plantas '{"nome":"X","especie":"X","preco":100,"estoque":-1,"luminosidade":"SOMBRA","petFriendly":true,"regaACadaDias":1}')
check "estoque -1" 400 "$S"
S=$(req POST /plantas '{"nome":"X","especie":"X","preco":"8990","estoque":1,"luminosidade":"SOMBRA","petFriendly":true,"regaACadaDias":1}')
check "preco como texto" 400 "$S"
S=$(req POST /plantas '{"nome":"X","especie":"X","preco":89.9,"estoque":1,"luminosidade":"SOMBRA","petFriendly":true,"regaACadaDias":1}')
check "preco decimal" 400 "$S"
S=$(req POST /plantas '{"nome":"X","especie":"X","preco":100,"estoque":1,"luminosidade":"LUA","petFriendly":true,"regaACadaDias":1}')
check "luminosidade LUA" 400 "$S"
S=$(req POST /plantas '{"nome":"X","especie":"X","preco":100,"estoque":1,"luminosidade":"SOMBRA","petFriendly":"sim","regaACadaDias":1}')
check "petFriendly como texto" 400 "$S"
S=$(req POST /plantas '{"nome":"X","especie":"X","preco":100,"estoque":1,"luminosidade":"SOMBRA","petFriendly":true,"regaACadaDias":0}')
check "regaACadaDias 0" 400 "$S"
S=$(curl -s -o "$TMP" -w "%{http_code}" -X POST "$BASE/plantas")
check "POST sem corpo" 400 "$S"

echo; echo "== Buscar por id =="
S=$(req GET "/plantas/$A"); check "id que existe" 200 "$S"
S=$(req GET /plantas/99999); check "id que não existe" 404 "$S"
S=$(req GET /plantas/abc); check "id abc" 400 "$S"
S=$(req GET /plantas/99999999999); check "id gigante" 400 "$S"
S=$(req GET /plantas/0); check "id 0" 400 "$S"

echo; echo "== Editar =="
S=$(req PATCH "/plantas/$A" '{"preco":9990}'); check "editar só o preço" 200 "$S"
check "preço mudou" 9990 "$(campo 'd.preco')"
check "nome não mudou" "Costela-de-adão" "$(campo 'd.nome')"
check "estoque não mudou" 10 "$(campo 'd.estoque')"
S=$(req PATCH "/plantas/$A" '{"preco":-5}'); check "valor inválido" 400 "$S"
S=$(req PATCH "/plantas/$A" '{"luminosidade":"LUA"}'); check "luminosidade inválida" 400 "$S"
S=$(req PATCH /plantas/99999 '{"preco":100}'); check "id inexistente" 404 "$S"
S=$(req PATCH "/plantas/$B" '{"estoque":0,"petFriendly":false}'); check "editar para estoque 0 e petFriendly false" 200 "$S"

echo; echo "== Filtros =="
S=$(req GET "/plantas?luminosidade=SOL_PLENO"); check "por luminosidade" 200 "$S"
check "só SOL_PLENO e contém a planta A" true "$(campo "d.every(p=>p.luminosidade==='SOL_PLENO') && d.some(p=>p.id===$A)")"
S=$(req GET "/plantas?petFriendly=false"); check "petFriendly=false" 200 "$S"
check "só não pet-friendly e contém a planta B" true "$(campo "d.every(p=>p.petFriendly===false) && d.some(p=>p.id===$B)")"
S=$(req GET "/plantas?petFriendly=true"); check "petFriendly=true" 200 "$S"
check "só pet-friendly" true "$(campo "d.every(p=>p.petFriendly===true)")"
S=$(req GET "/plantas?luminosidade=SOL_PLENO&petFriendly=true"); check "os dois filtros juntos" 200 "$S"
check "resultado combinado correto" true "$(campo "d.every(p=>p.luminosidade==='SOL_PLENO'&&p.petFriendly===true) && d.some(p=>p.id===$A)")"
S=$(req GET "/plantas?luminosidade=SOL_PLENO&petFriendly=false"); check "filtros sem resultado dão 200" 200 "$S"
check "e a lista é vazia ou não contém A" true "$(campo "!d.some(p=>p.id===$A)")"
S=$(req GET "/plantas?luminosidade=LUA"); check "luminosidade inválida" 400 "$S"
S=$(req GET "/plantas?petFriendly=talvez"); check "petFriendly inválido" 400 "$S"
S=$(req GET "/plantas"); check "sem filtros" 200 "$S"
check "sem filtros devolve A e B" true "$(campo "d.some(p=>p.id===$A)&&d.some(p=>p.id===$B)")"

echo; echo "== Venda =="
S=$(req POST "/plantas/$A/venda" '{"quantidade":2}'); check "vender o que tem" 200 "$S"
check "estoque 10 -> 8" 8 "$(campo 'd.estoque')"
S=$(req POST "/plantas/$A/venda" '{"quantidade":9999}'); check "vender mais do que tem" 400 "$S"
S=$(req GET "/plantas/$A"); check "estoque não mudou após venda recusada" 8 "$(campo 'd.estoque')"
S=$(req POST "/plantas/$A/venda" '{"quantidade":0}'); check "quantidade 0" 400 "$S"
S=$(req POST "/plantas/$A/venda" '{"quantidade":-1}'); check "quantidade negativa" 400 "$S"
S=$(req POST "/plantas/$A/venda" '{"quantidade":"2"}'); check "quantidade como texto" 400 "$S"
S=$(req POST "/plantas/$A/venda" '{"quantidade":1.5}'); check "quantidade decimal" 400 "$S"
S=$(req POST "/plantas/$A/venda"); check "venda sem corpo" 400 "$S"
S=$(req POST /plantas/99999/venda '{"quantidade":1}'); check "venda de planta inexistente" 404 "$S"
S=$(req POST "/plantas/$A/venda" '{"quantidade":8}'); check "vender o estoque inteiro" 200 "$S"
check "estoque zerou (e não ficou negativo)" 0 "$(campo 'd.estoque')"
S=$(req POST "/plantas/$A/venda" '{"quantidade":1}'); check "vender com estoque zerado" 400 "$S"

echo; echo "== Concorrência (10 compras simultâneas do último vaso) =="
req PATCH "/plantas/$A" '{"estoque":1}' > /dev/null
for i in 1 2 3 4 5 6 7 8 9 10; do
  curl -s -o /dev/null -w "%{http_code}\n" -X POST -H "Content-Type: application/json" -d '{"quantidade":1}' "$BASE/plantas/$A/venda" >> "$TMP.conc" &
done
wait
OKS=$(grep -c '^200$' "$TMP.conc"); rm -f "$TMP.conc"
check "só uma das 10 compras deu certo" 1 "$OKS"
req GET "/plantas/$A" > /dev/null
check "estoque final zero, nunca negativo" 0 "$(campo 'd.estoque')"

echo; echo "== Valor total =="
req PATCH "/plantas/$A" '{"estoque":3,"preco":1000}' > /dev/null
req PATCH "/plantas/$B" '{"estoque":4,"preco":500}' > /dev/null
S=$(req GET /plantas); TODAS="$(cat "$TMP")"
ESPERADO_VALOR=$(echo "$TODAS" | node -p "JSON.parse(require('fs').readFileSync(0,'utf8')).reduce((s,p)=>s+p.preco*p.estoque,0)")
ESPERADO_VASOS=$(echo "$TODAS" | node -p "JSON.parse(require('fs').readFileSync(0,'utf8')).reduce((s,p)=>s+p.estoque,0)")
S=$(req GET /plantas/estoque/valor-total); check "rota valor-total" 200 "$S"
check "valorTotalEmCentavos confere com a conta feita aqui" "$ESPERADO_VALOR" "$(campo 'd.valorTotalEmCentavos')"
check "totalDeVasos confere" "$ESPERADO_VASOS" "$(campo 'd.totalDeVasos')"

echo; echo "== Deletar =="
S=$(req DELETE "/plantas/$A"); check "deletar" 204 "$S"
S=$(req GET "/plantas/$A"); check "buscar a planta deletada" 404 "$S"
S=$(req DELETE "/plantas/$A"); check "deletar de novo" 404 "$S"
S=$(req DELETE /plantas/abc); check "deletar id abc" 400 "$S"
req DELETE "/plantas/$B" > /dev/null

rm -f "$TMP"
echo; echo "Resultado: $PASS ok, $FAIL com erro."
echo "Falta testar à mão: com a loja vazia, GET /plantas/estoque/valor-total deve dar 200 com zeros."
[ "$FAIL" -eq 0 ]