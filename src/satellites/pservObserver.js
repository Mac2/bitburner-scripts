import {
  getNsDataThroughFile as fetch,
  runCommand,
  formatNumber,formatRam,
  announce,
  getLSItem,
} from 'helpers.js'
import { networkMapFree } from 'network.js'
import { getBotRamInfo } from 'botnet.js'

// payoff within the hour
const min = 60, hour = min * 60

/**
 * @param {NS} ns
 **/
export async function main(ns) {
  // if there's already a buyer running, let it finish before starting another
  const homePS = await fetch(ns, `ns.ps('home')`, '/Temp/ps_home.txt')
  if ( homePS.some(proc => proc.filename === 'buyer.js') ) {
    return
  }

  const nmap = await networkMapFree(ns)
  const pservs = Object.values(nmap).filter(s => s.name != 'home' && s.data.purchasedByPlayer)
  const currRam = smallestCurrentServerSize(pservs)
  const nextRam = await nextRamSize(ns, currRam)

  if (nextRam == 0) {
    return
  }
  
  // force spawning new Resources
  let out_of_ram=Boolean(getLSItem("outofmemory") || false)
  const [total,free] = await getBotRamInfo(ns)
  // free Ram > 20%, ignore in early Stage (<256GB)
  if (free/total >= 0.2 && !out_of_ram && total > 256) {
    let msg = `skipping buyer.js because ${formatNumber(free*100/total)}% resources are still available`
    announce(ns, msg)
    ns.print(msg)
    return
  }
  
  let msg = `Running buyer.js to purchase ${formatRam(2**nextRam)} (currently: ${formatRam(currRam)})`
  announce(ns, msg)
  ns.tprint(msg)
  ns.tprint(` ns.spawn('buyer.js', 1, '--size', ${nextRam})`)
  await runCommand(ns, `for (let i = 0,pid = 0; pid == 0 && i < 10; i++) { ` +
    `pid = ns.spawn('buyer.js', 1, '--size', ${nextRam}) }`, '/Temp/spawnBuyer.js')
}

/**
 * @param {array} pservs
 **/
function smallestCurrentServerSize(pservs) {
  if (pservs.length == 0)
    return 0

  return pservs.reduce(((prev, cur) => prev.maxRam < cur.maxRam ? prev : cur)).maxRam
}

/**
 * @param {NS} ns
 * @param {integer} curRam
 * @param {array} pservs
 **/
async function nextRamSize(ns, currRam) {
  const limit = await fetch(ns, `ns.getPurchasedServerLimit()`,
    '/Temp/getPurchasedServerLimit.txt')
  const totIncomePerSecond = await fetch(ns, `ns.getScriptIncome()[0]`,
    '/Temp/getScriptIncome.txt')
  const maxServerSize = await fetch(ns, `ns.getPurchasedServerMaxRam()`,
    '/Temp/getPurchasedServerMaxRam.txt')
  const incomePerPayoffTime = totIncomePerSecond * 2*hour
  ns.print(`Total income: ${ns.nFormat(totIncomePerSecond, "$0,0")}`)
  ns.print(`Income per payoff time: ${ns.nFormat(incomePerPayoffTime, "$0,0")}`)
  if (incomePerPayoffTime == 0) return 0

  let cost, totalCost
  for (var i = 20; 2**i > currRam; i--) {
    // max server size can vary based on BN
    if ( 2**i > maxServerSize ) continue
    if (i < 0) { ns.tail(); throw `How is i less than 0? ${i}` }
    cost = await fetch(ns, `ns.getPurchasedServerCost(${2**i})`,
      `/Temp/getPurchasedServerCost.${i}.txt`)
    totalCost = cost * limit

    ns.print(`Total cost for ${2**i}GB ram: ${ns.nFormat(totalCost, "$0,0")}`)
    if ( totalCost < incomePerPayoffTime ) {
      ns.print(`(${2**i}) totalCost < incomePerPayoffTime`)
      ns.print(`Returning ${2**i}`)

      let maxRam=Number(getLSItem("pservMaxRam") || 0)
      let minRam=Number(getLSItem("pservMinRam") || 8)
      //ns.print(`allowed RAM Range: ${minRam} (i: ${Math.log2(minRam)}) - ${maxRam} (i: ${Math.log2(maxRam)})`)  
      if (maxRam > 0) {
        i=Math.min(i,Math.log2(maxRam))
      }
      i=Math.max(i,Math.log2(minRam))
      return i
    }
  }
  return 0
}
