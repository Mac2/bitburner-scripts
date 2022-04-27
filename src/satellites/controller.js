import { tryRun, disableLogs } from 'helpers.js'

const sec = 1000
const min = 60 * sec

/**
 * how long to wait between running a satellite file
 * time in ms
 **/

// processes in early game with limited resources
const early_timers = [
  // these are sorted by frequency, except playerObserver which must run first
  { file: '/satellites/playerObserver.js',    freq: 20,        last: 0 },

  { file: '/satellites/serversObserver.js',   freq: 0,         last: 0 },
  { file: 'stats.js',                         freq: 1 * sec,   last: 0 },
  { file: '/satellites/programObserver.js',   freq: 5 * sec,   last: 0 },
  
  { file: 'nuker.js',                         freq: 7 * sec,   last: 0 },
  { file: 'botnet.js',                        freq: 8 * sec,   last: 0 },
  { file: '/satellites/activityObserver.js',  freq: min,       last: Date.now() }, 
  { file: '/satellites/pservObserver.js',     freq: min+100,   last: Date.now() },
  // FIXME: using some early_hack approach instead, if number of bots too low ? 
  { file: '/satellites/hackerObserver.js',    freq: min+200,   last: 0 },  
]

// mid/late game processes
// Home RAM > 64GB
const late_timers = [
  // these are sorted by frequency, except playerObserver which must run first
  { file: '/satellites/playerObserver.js',    freq: 20,        last: 0 },

  { file: '/satellites/serversObserver.js',   freq: 0,         last: 0 },
  { file: 'stats.js',                         freq: 1 * sec,   last: 0 },
//  { file: '/satellites/gangClashObserver.js', freq: 1.3*sec,   last: 0 },
  { file: '/satellites/programObserver.js',   freq: 5 * sec,   last: 0 },
//  { file: '/gang/equipment.js',               freq: 5.2*sec,   last: 0 },
//  { file: '/gang/recruitment.js',             freq: 5.3*sec,   last: 0 },
//  { file: '/satellites/gangMetaObserver.js',  freq: 5.4*sec,   last: 0 },
  { file: '/satellites/backdoorObserver.js',  freq: 6 * sec,   last: 0 },		// 66GB
  { file: 'nuker.js',                         freq: 7 * sec,   last: 0 },
  { file: 'botnet.js',                        freq: 8 * sec,   last: 0 },
//  { file: '/gang/ascend.js',                  freq: 8.1*sec,   last: 0 },
//  { file: '/gang/augments.js',                freq: 12 *sec,   last: 0 },
//  { file: '/gang/tasks.js',                   freq: 30 *sec,   last: 0 },
// BN10
//  { file: '/sleeves/metaObserver.js',         freq: 31 * sec,  last: Date.now() },
//  { file: '/sleeves/manager.js',              freq: 31.1*sec,  last: Date.now() },
  { file: '/satellites/activityObserver.js',  freq: min,       last: Date.now() },
  { file: '/satellites/pservObserver.js',     freq: min+100,   last: Date.now() },
  { file: '/satellites/hackerObserver.js',    freq: min+200,   last: 0 },
  { file: '/satellites/homeRamBuyer.js',      freq: min+300,   last: Date.now() },	// 25GB
  { file: '/satellites/contractsObserver.js', freq: 4 * min,   last: Date.now() },
]

/**
 * @param {NS} ns
 **/
export async function main(ns) {
  disableLogs(ns, ['sleep','run'])
  let first = true, proc

  while(true) {
    let loglist=[], timers=[]
    // early phase of game/bitnode with low ressources   
    const maxRam = await fetch(ns, `ns.getServerMaxRam("home")`, '/Temp/getHomeMaxRam.txt')
    const usedRam = await fetch(ns, `ns.getServerUsedRam("home")`, '/Temp/getHomeUsedRam.txt')
    if (maxRam >= 512) {
      setLSItem('reserveRam',256)
    } else if (maxRam >= 256) {
      setLSItem('reserveRam',128)
    } else if (maxRam >= 128) {
      setLSItem('reserveRam',64)
    }

    if (maxRam - usedRam < 58) {
      timers = early_timers
    } else {    
      timers = late_timers
    }
    for ( const timer of timers) {
      proc = ns.ps('home').find(p => p.filename == timer.file)
      if (!proc && Date.now() > timer.last + timer.freq ) {
        await tryRun(() => ns.run(timer.file, 1))
        // reduce log spam
        if (timer.file !== "/satellites/playerObserver.js" && timer.file !== "/satellites/serversObserver.js" && timer.file !== "stats.js") {
          loglist.push(timer.file.replace("/satellites","").replace("/",""))
        }
        timer.last = Date.now()
      }
      // spread out inits so player has time to propigate
      if ( first ) { await ns.sleep(50); first = false }
    }
    if (loglist.length > 0) {
      ns.print(`run: ${loglist.join(',')}`)
    }
    await ns.sleep(5)
  }
}
