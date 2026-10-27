const agent = process.env.npm_config_user_agent || '';
if (!/^pnpm\/9\./.test(agent)) {
  console.error('This project requires pnpm 9 (packageManager: pnpm@9.0.0). Use corepack pnpm install; do not use a global pnpm 11 shim.');
  process.exit(1);
}
