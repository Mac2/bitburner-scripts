import { networkMapFree } from 'network.js'
import {
          runCommandAndWait,
          disableLogs,
          announce,formatRam,
        } from 'helpers.js'
// magic number (Ram required to run breadwinner.js)
const hackingScriptSize = 1.7
const scripts = ['hack.js', 'grow.js', 'weaken.js']

/**
 * @param {NS} ns
 **/
export async function main(ns) {
  disableLogs(ns, ['sleep'])

  let servers = Object.values(await networkMapFree())
    .filter(s => s.data.hasAdminRights &&
                s.name != 'home' &&
                s.maxRam - s.data.ramUsed >= hackingScriptSize &&
                (
                  !s.files.includes(scripts[0]) ||
                  !s.files.includes(scripts[1]) ||
                  !s.files.includes(scripts[2])
                )
    )

  // early return, if there are no servers no need to do anything else
  if ( servers.length == 0 ) {
    return
  }

  ns.tprint("Zombifying " + servers.length + " servers")
  for (let server of servers) {
    await zombify(ns, server.name)
    await ns.sleep(200)
  }
  let msg = `Zombified servers: ${servers.map(s => s.name).join(', ')}`
  announce(ns, msg)
  ns.tprint(msg)
}

async function zombify(ns, server) {
  for (const script of scripts) {
    await runCommandAndWait(ns, `ns.scp('${script}', "home", '${server}')`,
      `/Temp/scp-${script}.js`)
  }
  ns.print(`Copied ${scripts} to ${server}`)
}

export async function searchAvailableZombies(ns) {
  // collect all potential bots, incl HOME
  let servers = Object.values(await networkMapFree())
    .filter(s => s.data.hasAdminRights &&
                (
                  s.files.includes(scripts[0]) &&
                  s.files.includes(scripts[1]) &&
                  s.files.includes(scripts[2])
                )
    )
    return servers
}

/**
 * @param {NS} ns
 **/
export async function getBotRamInfo(ns) {
  let servers = await searchAvailableZombies(ns)  
  let totalRam=0, availRam=0

  for (let server of servers) {
    totalRam += server.maxRam
    availRam += server.maxRam - server.data.ramUsed
  }
  ns.print(`totalBots: ${servers.length}: total BotRam: ${formatRam(totalRam)} free BotRam: ${formatRam(availRam)} ${availRam*100/totalRam}%`)
  return [totalRam,availRam]
}
