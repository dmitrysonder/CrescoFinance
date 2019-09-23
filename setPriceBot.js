const Cryptr = require('cryptr');
const Telegraf = require('telegraf')
const HDWalletProvider = require('truffle-hdwallet-provider')
const Web3 = require('web3');
const path = require('path');
const fs = require('fs');
const cryptr = new Cryptr("password");
const hashPath = path.resolve(__dirname, 'hash.txt');
const hash = fs.readFileSync(hashPath,'utf8');
const mn = cryptr.decrypt(hash).toString();
const provider = new HDWalletProvider(
     mn,
	"https://rinkeby.infura.io/v3/YOUR_KEY" //Key for ETH node (Infura)
);
const web3 = new Web3(provider);
const bot = new Telegraf("") //Telegram bot API key
const groupChat = ""; // Id of telegram chat
const managers = [1,2,3]; //Telegram ids of allowed Managers


bot.hears('Подтверждаю', (ctx) => updatePrice(ctx.message.reply_to_message.text,ctx.from.id))
bot.hears('Отмена', (ctx) => ctx.reply('Запись цены была отменена'))
bot.startPolling()
bot.catch((err) => {
    console.log('Ooops', err)
})



async function updatePrice(price,chatId) {
  console.log(chatId);   
  const tokenPrice = parseInt(price,10);
  let lastRecordPath = path.resolve(__dirname, 'lastRecord.txt');
  let lastDate = fs.readFileSync(lastRecordPath,'utf8');
  let date = new Date();
  date = date.toISOString().split("T")[0];
  
  if (!Number.isInteger(tokenPrice)){
      bot.telegram.sendMessage(groupChat,"Цена токена некорректна")
  }
  else if (lastDate == date){
      bot.telegram.sendMessage(groupChat,"Вы уже записывали цену сегодня")
  }
  else {
    if (managers.indexOf(chatId) > -1){
  //if (chatId == Masterkey){
    const abiPath = path.resolve(__dirname, 'ABI.txt');
    const contractAbi = JSON.parse(fs.readFileSync(abiPath, 'utf8'));
    const contractAddress = "0xc0809e31261edbfaf6b233b0342ba73d74a0b825"; //Address of contract
    
    const accounts = await web3.eth.getAccounts();
    let nonce = await web3.eth.getTransactionCount(accounts[0])+1;
    const contractInstance = new web3.eth.Contract(contractAbi,contractAddress);
    const transactionObject = {
        from: accounts[0],
        gas: '200000',
        gasPrice: '7000000000'
        //nonce: nonce
        };
    console.log(contractInstance);
    contractInstance.methods.setTokenPrice(tokenPrice).send(transactionObject).on('transactionHash', function(hash){
        bot.telegram.sendMessage(groupChat,"Транзакция для записи цены CFT "+tokenPrice+" wei сгенерирована\nhttps://rinkeby.etherscan.io/tx/"+hash);
    }).on('receipt', function(receipt){
        bot.telegram.sendMessage(groupChat,"Есть подтверждение! Цена успешно записана в смарт-контракт\nhttps://rinkeby.etherscan.io/address/"+contractAddress+"#readContract");
        //fs.writeFileSync(lastRecordPath,date,{encoding:'utf8',flag:'w'});
    }).on('error', function(error){
        bot.telegram.sendMessage(groupChat,"Произошла ошибка во время выполнения транзакции!\n"+error);
    });
    }
    else {
        bot.telegram.sendMessage(groupChat,"Попытка несанкционированной установки цены c Telegram ID: "+chatId);
    }
  }
}
