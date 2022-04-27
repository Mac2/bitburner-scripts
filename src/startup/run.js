import {
        disableLogs,
        getNsDataThroughFile as fetch,
        setLSItem,clearLSItem,
        haveSourceFile,
      } from 'helpers.js'

const staleLocalStorageKeys = [
  'nmap',
  'reserve',
  'reserveRam',
  'player',
  'decommissioned',
  'hackpercent',
  'clashtime',
  'gangmeta',
  'sleevemeta',
  'pservMinRam',
  'pservMaxRam',
  'outofmemory',
]

/**
 * @param {NS} ns
 **/
export async function main(ns) {
  disableLogs(ns, ["sleep"])

  staleLocalStorageKeys.map((value) => clearLSItem(value))
  await ns.sleep(5)
  ns.tprint(`Cleaned up localStorage.`)

  ns.tprint(`Fetching source file information`)
  const sf = await fetch(ns, `ns.getOwnedSourceFiles()`, '/Temp/getOwnedSourceFiles.txt')
  setLSItem('sourceFiles', sf)
  await ns.sleep(200)
  
  ns.tprint(`Initialize player information`)
  ns.run('/satellites/playerObserver.js')
  await ns.sleep(200)
  
  if (haveSourceFile(5)) {
    ns.tprint(`Fetching bitnode multipliers`)
    const bn = await fetch(ns, `ns.getBitNodeMultipliers()`, '/Temp/bitnode.txt')
    setLSItem('bitnode', bn)
    await ns.sleep(200)
  }

  ns.tprint(`Running QoL scripts`)
  ns.run('/qol/add-tab-control-to-editor.js')
  await ns.sleep(200)

  // setup initial HOME environment
  const maxRam = await fetch(ns, `ns.getServerMaxRam("home")`, '/Temp/getHomeMaxRam.txt')
  if (maxRam >= 512) {
    setLSItem('reserveRam',256)
  } else if (maxRam >= 256) {
    setLSItem('reserveRam',128)
  } else if (maxRam >= 128) {
    setLSItem('reserveRam',64)
  }

  // FIXME: depending on available Target and already available HOME resources
  // Bounderies for pserveObserver
  setLSItem('pservMinRam',maxRam/2)  
  setLSItem('pservMaxRam',1024*16)
    
  ns.tprint(`Starting satellites/controller.js`)
  ns.run('/satellites/controller.js')
  await ns.sleep(200)

  ns.tprint(`Startup completed. May your pillow always be cool.`)
}
