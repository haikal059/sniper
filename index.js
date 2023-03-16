const chalk = require('chalk');
const ethers = require('ethers');
const fs = require('fs').promises;
const args = require('minimist')(process.argv.slice(2));

let ConsoleLog = console.log;

// main classes
const { msg, config, cache, network } = require('./classes/main.js');

console.clear();

msg.primary('Loading..');

// error handler
process.on('uncaughtException', (err, origin) => {

  msg.error(`[error] Exception: ${err}`);
  process.exit();

});

// main
(async () => {

  // load cache
  await cache.load('cache.json');

  // load config using our loaded cache
  await config.load('config.ini');

  // initialize our network using a config.
  await network.load();

  // prepare network for transactions
  await network.prepare();

  if (!network.isETH(config.cfg.contracts.input)) {
    msg.error(`[error].`);
    process.exit();
  }

  // print debug info
  console.clear();
  //balance check
  if (network.bnb_balance == 0) {
    msg.error(`[error] You don't have any Balance in your account. (used for gas fee)`);
    process.exit();
  }

  // check if has enough input balance
  if ((network.input_balance < config.cfg.transaction.amount_in_formatted)) {
    msg.error(`[error] You don't have enough input balance for this transaction.`);
    process.exit();
  }

  let dex = {
    'shadowswap': {
      'tokenName': 'Shdw',
      'token': '0xddBa66C1eBA873e26Ac0215Ca44892a07d83aDF5',
      'weth': '0x191E94fa59739e188dcE837F7f6978d84727AD01',
      'router': '0xCCED48E6fe655E5F28e8C4e56514276ba8b34C09',
      'factory': '0x326Ee96748E7DcC04BE1Ef8f4E4F6bdd54048932',
    },
    'archerswap': {
      'tokenName': 'BOW',
      'token': '0x1a639e150d2210a4be4a5f0857a9151b241e7ae4',
      'weth': '0x40375c92d9faf44d2f9db9bd9ba41a3317a2404f',
      'router': '0x74f56a7560ef0c72cf6d677e3f5f51c2d579ff15',
      'factory': '0xe0b8838e8d73ff1ca193e8cc2bc0ebf7cf86f620',
    },
    'lfgswap': {
      'tokenName': 'LFG',
      'token': '0xF7a0b80681eC935d6dd9f3Af9826E68B99897d6D',
      'weth': '0x40375C92d9FAf44d2f9db9Bd9ba41a3317a2404f',
      'router': '0x42a0F91973536f85B06B310fa9C70215784F35a1',
      'factory': '0xA1ADD165AED06D26fC1110b153ae17a5A5ae389e',
    }
  }
  // fetch pair
  let pair = await network.getPair(config.cfg.contracts.pair, config.cfg.contracts.output);

  msg.primary("Pair address: " + JSON.stringify(pair) + ".");

  // get liquidity
  let liquidity = await network.getLiquidity(pair);

  msg.primary(`Liquidity found: ${liquidity} ${cache.data.addresses[config.cfg.contracts.input].symbol}.\n`);

  // get starting tick
  let startingTick = Math.floor(new Date().getTime() / 1000);
  //purchase token [bnb -> token (through bnb)]
  let receipt = await network.transactToken(
    dex[config.cfg.contracts.dex].weth,
    config.cfg.contracts.output
  );

  if (receipt == null) {
    msg.error('[error] Could not retrieve receipt from buy tx.');
    process.exit();
  }

  console.log(chalk.hex('#2091F6').inverse('==================== [TX COMPLETED] ===================='));
  console.log(chalk.hex('#2091F6')('• ') + chalk.hex('#EBF0FA')(`From ${cache.data.addresses[config.cfg.contracts.input].symbol} (${config.cfg.transaction.amount_in} ${cache.data.addresses[config.cfg.contracts.input].symbol}) -> ${cache.data.addresses[config.cfg.contracts.output].symbol} (minimum ${network.amount_bought_unformatted} ${cache.data.addresses[config.cfg.contracts.output].symbol})`));
  console.log(chalk.hex('#2091F6')('• ') + chalk.hex('#EBF0FA')(`${network.chains[network.network.chainId].page}/tx/${receipt.logs[1].transactionHash}`));
  console.log(chalk.hex('#2091F6').inverse('========================================================\n'));

  // save cache just to be sure
  await cache.save();

  msg.success(`Finished in ${((Math.floor(new Date().getTime() / 1000)) - startingTick)} seconds.`);

  process.exit();

})();

setInterval(() => { }, 1 << 30);