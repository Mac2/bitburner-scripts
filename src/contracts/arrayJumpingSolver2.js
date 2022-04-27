/**
Array Jumping Game II

You are given the following array of integers:

1,3,7,0,5,2,1,1,5,2,5,4,3,3,3,1,2,1,2,2

Each element in the array represents your MAXIMUM jump length at that position. This means that if you are at position i and your maximum jump length is n, you can jump to any position from i to i+n.

Assuming you are initially positioned at the start of the array, determine the minimum number of jumps to reach the end of the array.

If it's impossible to reach the end, then the answer should be 0.
 **/

import { CodingContractWrapper } from '/contracts/CodingContractWrapper.js'

/** @param {NS} ns **/
export async function main(ns) {
  const codingContractor = new CodingContractWrapper(ns)
  const answer = solve(await codingContractor.extractData())
  await codingContractor.sendSolution(answer)
}

// solution from https://github.com/alainbryden/bitburner-scripts/blob/main/Tasks/contractor.js.solver.js
function solve(data) {
  const n = data.length;
  let reach = 0;
  let jumps = 0;
  let lastJump = -1;
  while (reach < n - 1) {
    let jumpedFrom = -1;
    for (let i = reach; i > lastJump; i--) {
        if (i + data[i] > reach) {
          reach = i + data[i];
          jumpedFrom = i;
        }
    }
    if (jumpedFrom === -1) {
        jumps = 0;
        break;
    }
    lastJump = jumpedFrom;
    jumps++;
  }
  return jumps;
}
