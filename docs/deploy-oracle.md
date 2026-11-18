# Deploy automático na Oracle Cloud

O workflow `.github/workflows/deploy-oracle.yml` é executado a cada `push` na
branch `main` — portanto, também após um merge aprovado nessa branch.

## Configuração dos Secrets

No repositório, acesse **Settings → Secrets and variables → Actions** e crie:

- `OCI_HOST`: IP ou hostname público da VM Oracle;
- `OCI_USER`: usuário SSH da VM;
- `OCI_SSH_PRIVATE_KEY`: chave privada SSH exclusiva para o deploy.

A chave pública correspondente deve estar no `~/.ssh/authorized_keys` do usuário
da VM. O diretório do projeto deve existir em `~/gestao-uep-vegetais`, com o
remote `origin` apontando para o repositório e o `.env` criado somente na VM.

O `.env` não é enviado pelo workflow nem versionado: ele continua protegido
pelo `.gitignore`.

## Operação do deploy

Na VM, o workflow executa, nesta ordem:

1. `git pull --ff-only origin main`;
2. `docker compose config --quiet`;
3. `docker compose up -d --build --remove-orphans`;
4. `docker compose ps`.

O `--ff-only` evita sobrescrever alterações locais. A validação interrompe o
deploy antes da recriação dos serviços se a configuração for inválida. O
`docker compose up` não remove volumes nomeados, preservando `pgdata`,
`caddy_data` e `caddy_config`.

## Verificação

Após o merge, acesse **Actions → Deploy to Oracle VM** e confira o status da
execução. Em caso de falha, abra o job para identificar a etapa interrompida;
o `script_stop: true` faz o workflow falhar quando qualquer comando remoto
retorna erro.

Na VM, o estado também pode ser conferido com:

```bash
cd ~/gestao-uep-vegetais
docker compose ps
docker compose logs --tail=100
```

Uma alteração controlada pode ser validada fazendo um novo merge na `main` e
confirmando no log do job as quatro etapas acima.
